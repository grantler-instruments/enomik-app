import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ESPLoader, Transport } from "esptool-js";

type LogType = "send" | "receive" | "error" | "system";

interface LogEntry {
  message: string;
  type: LogType;
  timestamp: Date;
}

interface FlashProgress {
  written: number;
  total: number;
  percentage: number;
}

interface SerialState {
  port: SerialPort | null;
  reader: ReadableStreamDefaultReader<string> | null;
  writer: WritableStreamDefaultWriter<string> | null;

  isConnected: boolean;
  isSuspended: boolean;

  log: LogEntry[];

  // Firmware flashing state
  isFlashing: boolean;
  flashProgress: FlashProgress | null;
  chipInfo: string;
  espLoader: any | null;
  transport: any | null;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  suspendIO(): Promise<void>;
  resumeIO(): Promise<void>;

  send(data: string): Promise<void>;
  clearLog(): void;

  /** for esptool-js */
  getRawPort(): SerialPort | null;

  // Firmware flashing methods
  connectForFlashing(): Promise<void>;
  disconnectFlashing(): Promise<void>;
  flashFirmware(file: File, address?: number): Promise<void>;
}

const terminal = {
  clean: () => console.clear(),
  writeLine: (t: string) => console.log(t),
  write: (t: string) => console.log(t),
};

export const useSerialStore = create<SerialState>()(
  devtools((set, get) => {
    let readLoopActive = false;
    let decoderController: AbortController | null = null;
    let encoderController: AbortController | null = null;

    const addLog = (message: string, type: LogType) => {
      set((state) => ({
        log: [...state.log, { message, type, timestamp: new Date() }],
      }));
    };

    const startReadLoop = async (
      reader: ReadableStreamDefaultReader<string>
    ) => {
      readLoopActive = true;

      try {
        while (readLoopActive) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) addLog(value, "receive");
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          addLog(`Read error: ${err.message}`, "error");
        }
      }
    };

    const setupTextIO = async (port: SerialPort) => {
      decoderController = new AbortController();
      encoderController = new AbortController();

      const decoder = new TextDecoderStream();
      (port.readable as ReadableStream<BufferSource>).pipeTo(
        decoder.writable as WritableStream<BufferSource>,
        { signal: decoderController.signal }
      );

      const reader = decoder.readable.getReader();

      const encoder = new TextEncoderStream();
      encoder.readable.pipeTo(port.writable!, {
        signal: encoderController.signal,
      });

      const writer = encoder.writable.getWriter();

      set({ reader, writer, isSuspended: false });
      startReadLoop(reader);
    };

    const teardownTextIO = async () => {
      const { reader, writer } = get();

      readLoopActive = false;

      if (reader) {
        try {
          await reader.cancel();
          reader.releaseLock();
        } catch {}
      }

      if (writer) {
        try {
          await writer.close();
        } catch {}
      }

      if (decoderController) decoderController.abort();
      if (encoderController) encoderController.abort();

      decoderController = null;
      encoderController = null;

      set({ reader: null, writer: null });
    };

    const cleanupFlashing = async () => {
      const { transport } = get();
      
      try {
        if (transport) {
          await transport.disconnect();
        }
      } catch {}

      set({
        transport: null,
        espLoader: null,
        chipInfo: "",
        isFlashing: false,
        flashProgress: null,
      });
    };

    return {
      port: null,
      reader: null,
      writer: null,

      isConnected: false,
      isSuspended: false,

      log: [],

      // Firmware state
      isFlashing: false,
      flashProgress: null,
      chipInfo: "",
      espLoader: null,
      transport: null,

      connect: async () => {
        if (get().isConnected) return;

        try {
          const port = await navigator.serial.requestPort();
          await port.open({ baudRate: 115200 });

          set({ port, isConnected: true });
          addLog("Serial port opened", "system");

          await setupTextIO(port);
        } catch (err: any) {
          addLog(`Connection error: ${err.message}`, "error");
        }
      },

      disconnect: async () => {
        const { port } = get();

        try {
          await teardownTextIO();

          if (port) {
            await new Promise((r) => setTimeout(r, 100));
            
            // Force close if port is open
            try {
              if (port.readable || port.writable) {
                await port.close();
              }
            } catch (err: any) {
              // Port might already be closed, ignore error
              console.warn("Port close warning:", err.message);
            }
          }

          addLog("Disconnected", "system");
        } catch (err: any) {
          addLog(`Disconnect error: ${err.message}`, "error");
        } finally {
          set({
            port: null,
            isConnected: false,
            isSuspended: false,
          });
        }
      },

      suspendIO: async () => {
        if (get().isSuspended) return;

        await teardownTextIO();
        set({ isSuspended: true });
        addLog("Serial I/O suspended", "system");
      },

      resumeIO: async () => {
        const { port, isSuspended } = get();
        if (!port || !isSuspended) return;

        await setupTextIO(port);
        addLog("Serial I/O resumed", "system");
      },

      send: async (data: string) => {
        const { writer, isConnected, isSuspended } = get();
        if (!writer || !isConnected || isSuspended) return;
        if (!data.trim()) return;

        try {
          await writer.write(data + "\n");
          addLog(data, "send");
        } catch (err: any) {
          addLog(`Send error: ${err.message}`, "error");
        }
      },

      clearLog: () => set({ log: [] }),

      getRawPort: () => get().port,

      // Firmware flashing methods
      connectForFlashing: async () => {
        try {
          addLog("Preparing for firmware flash...", "system");

          const { port: existingPort, isConnected: wasConnected } = get();

          let port: SerialPort;

          // If port is already open for monitoring, just suspend I/O and reuse it
          if (wasConnected && existingPort) {
            addLog("Using existing serial connection", "system");
            await get().suspendIO();
            port = existingPort;
          } else {
            // Request a new port
            port = await navigator.serial.requestPort();
            
            // Check if the port is somehow still open from a previous session
            const isPortOpen = port.readable !== null || port.writable !== null;
            
            if (isPortOpen) {
              addLog("Port already open, closing and reopening...", "system");
              try {
                await port.close();
                await new Promise((r) => setTimeout(r, 200));
              } catch (err: any) {
                console.warn("Error closing port:", err.message);
              }
            }
            
            // Now open the port
            await port.open({ baudRate: 115200 });
            addLog("Serial port opened for flashing", "system");
            
            set({ port, isConnected: true, isSuspended: true });
          }

          const transport = new Transport(port, false);
          
          const loader = new ESPLoader({
            transport,
            baudrate: 921600,
            romBaudrate: 115200,
            terminal,
          });

          addLog("Connecting to chip (hold BOOT if required)...", "system");
          await loader.main();

          const chipName = "TODO: chipname"//await loader.chipName();
          
          set({ 
            transport, 
            espLoader: loader,
            chipInfo: chipName 
          });

          addLog(`Connected to ${chipName}. Ready to flash.`, "system");
        } catch (err: any) {
          addLog(`Flash connection error: ${err.message}`, "error");
          await cleanupFlashing();
          throw err;
        }
      },

      disconnectFlashing: async () => {
        await cleanupFlashing();
        await get().resumeIO();
        addLog("Flash mode disconnected", "system");
      },

      flashFirmware: async (file: File, address: number = 0x10000) => {
        const { espLoader, transport } = get();
        
        if (!espLoader || !transport) {
          throw new Error("Not connected for flashing. Call connectForFlashing first.");
        }

        try {
          set({ isFlashing: true, flashProgress: { written: 0, total: 0, percentage: 0 } });
          addLog(`Starting flash: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, "system");

          const buffer = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (let i = 0; i < buffer.length; i++) {
            binary += String.fromCharCode(buffer[i]);
          }

          await espLoader.writeFlash({
            fileArray: [{ data: binary, address }],
            flashSize: "keep",
            eraseAll: false,
            compress: true,
            reportProgress: (_: number, written: number, total: number) => {
              set({
                flashProgress: {
                  written,
                  total,
                  percentage: (written / total) * 100,
                },
              });
            },
          });

          addLog("Flash complete. Resetting device...", "system");

          // Reset the device
          await transport.setDTR(false);
          await transport.setRTS(true);
          await new Promise((r) => setTimeout(r, 100));
          await transport.setRTS(false);

          addLog("Device reset complete.", "system");
          
          set({ isFlashing: false });
        } catch (err: any) {
          addLog(`Flash error: ${err.message}`, "error");
          set({ isFlashing: false, flashProgress: null });
          throw err;
        }
      },
    };
  })
);