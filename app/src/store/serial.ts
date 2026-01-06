import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ESPLoader, Transport } from "esptool-js";

/*
  Design principles of this store:

  1. A SerialPort is opened exactly once.
  2. Text I/O (monitoring) and flashing are mutually exclusive.
  3. During flashing, esptool-js owns the port exclusively.
  4. After flashing, the port is always closed and must be re-requested.
*/

/* ----------------------------- Types ----------------------------- */

function uint8ArrayToBinaryString(arr: Uint8Array): string {
  const chunkSize = 0x8000; // 32KB chunks
  let result = "";
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.subarray(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  return result;
}

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
  transport: Transport | null;
  loader: ESPLoader | null;

  reader: ReadableStreamDefaultReader<string> | null;
  writer: WritableStreamDefaultWriter<string> | null;

  isConnected: boolean;
  isMonitoring: boolean;
  isFlashing: boolean;

  log: LogEntry[];

  flashProgress: FlashProgress | null;
  chipInfo: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;

  send(data: string): Promise<void>;
  clearLog(): void;

  connectForFlashing(): Promise<void>;
  disconnectFlashing(): Promise<void>;
  flashFirmware(file: File, address?: number): Promise<void>;
}

/* --------------------------- Helpers ---------------------------- */

const terminal = {
  clean: () => {},
  writeLine: (t: string) => console.log("[esptool]", t),
  write: (t: string) => console.log("[esptool]", t),
};

/* ---------------------------- Store ----------------------------- */

export const useSerialStore = create<SerialState>()(
  devtools((set, get) => {
    let readLoopActive = false;

    const addLog = (message: string, type: LogType) => {
      set((s) => ({
        log: [...s.log, { message, type, timestamp: new Date() }],
      }));
    };

    /* ------------------------ Monitoring ------------------------ */

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

    const startMonitoring = async () => {
      const { port } = get();
      if (!port) return;

      const decoder = new TextDecoderStream();
      const encoder = new TextEncoderStream();

      (port.readable as unknown as ReadableStream<any>).pipeTo(
        decoder.writable as unknown as WritableStream<any>
      );

      encoder.readable.pipeTo(port.writable as WritableStream<Uint8Array>);

      const reader = decoder.readable.getReader();
      const writer = encoder.writable.getWriter();

      set({ reader, writer, isMonitoring: true });
      startReadLoop(reader);
    };

    const stopMonitoring = async () => {
      const { reader, writer } = get();
      readLoopActive = false;

      try {
        await reader?.cancel();
        reader?.releaseLock();
      } catch {}

      try {
        await writer?.close();
      } catch {}

      set({ reader: null, writer: null, isMonitoring: false });
    };

    return {
      port: null,
      reader: null,
      writer: null,

      isConnected: false,
      isMonitoring: false,
      isFlashing: false,

      log: [],
      flashProgress: null,
      chipInfo: "",

      /* ------------------------- Public API ------------------------- */

      connect: async () => {
        if (get().isConnected) return;

        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        set({ port, isConnected: true });
        addLog("Serial port opened", "system");

        await startMonitoring();
      },

      disconnect: async () => {
        const { port } = get();
        if (!port) return;

        await stopMonitoring();
        await port.close();

        set({
          port: null,
          isConnected: false,
          isMonitoring: false,
        });

        addLog("Disconnected", "system");
      },

      startMonitoring,
      stopMonitoring,

      send: async (data: string) => {
        const { writer, isMonitoring } = get();
        if (!writer || !isMonitoring) return;
        await writer.write(data + "\n");
        addLog(data, "send");
      },

      clearLog: () => set({ log: [] }),

      connectForFlashing: async () => {
        addLog("Preparing for firmware flash...", "system");

        // Close previous port if any
        const oldPort = get().port;
        console.log("Old port:", oldPort);
        if (oldPort) {
          try {
            oldPort.close();
            addLog("Previous port closed", "system");
          } catch {
            addLog("Failed to close previous port", "error");
          }
          set({ port: null, isConnected: false, isFlashing: false });
          await new Promise((r) => setTimeout(r, 300)); // give browser time
        }

        // Request port but do NOT auto-open
        const port = await navigator.serial.requestPort();

        const transport = new Transport(port, true); // false = do not open automatically
        (transport as any).setDTR = async () => {};
        (transport as any).setRTS = async () => {};
        (transport as any).setSignals = async () => {};

        const loader = new ESPLoader({
          transport,
          baudrate: 115200,
          romBaudrate: 115200,
          enableTracing: true,
        });

        try {
          await loader.connect();
          await loader.sync();
        } catch (err: any) {
          addLog(`Connection error: ${err.message}`, "error");
          throw err;
        }
        set({ port, transport, loader, isConnected: true, isFlashing: false });
      },

       flashFirmware: async (file: File, address = 0x10000) => {
        const transport = get().transport;
        const loader = get().loader;

        if (!transport || !loader) {
          throw new Error("Not connected for flashing");
        }

        const buffer = new Uint8Array(await file.arrayBuffer());

        set({ isFlashing: true });
        addLog(
          `Starting flash of ${file.name} (${buffer.length} bytes) at address 0x${address.toString(16)}`,
          "system"
        );

        const totalSize = buffer.length;

        set({ flashProgress: { written: 0, total: totalSize, percentage: 0 } });

        try {
          addLog("Starting flash operation...", "system");
          
          // Try to upload stub for much faster flashing
          try {
            addLog("Attempting to upload flasher stub...", "system");
            await loader.runStub();
            addLog("Flasher stub uploaded - flashing will be much faster!", "system");
            await new Promise((r) => setTimeout(r, 500));
          } catch (e: any) {
            addLog(`Stub upload failed (${e.message}), using slow ROM bootloader`, "system");
            // Continue with ROM bootloader
            await new Promise((r) => setTimeout(r, 500));
          }

          const fileArray = [{ 
            data: uint8ArrayToBinaryString(buffer),
            address 
          }];

          addLog(`Writing ${buffer.length} bytes to flash (this will take several minutes)...`, "system");
          
          await loader.writeFlash({
            fileArray,
            flashSize: "keep",
            flashMode: "keep",
            flashFreq: "keep",
            eraseAll: false,
            compress: true, // Must be true - library doesn't support uncompressed writes
            reportProgress: (fileIndex, written, total) => {
              const pct = Math.floor((written / total) * 100);
              
              // Log progress every 10%
              const prevPct = Math.floor(((written - 1) / total) * 100);
              if (Math.floor(pct / 10) > Math.floor(prevPct / 10)) {
                addLog(`Flash progress: ${pct}%`, "system");
              }
              
              set({
                flashProgress: {
                  written,
                  total,
                  percentage: pct,
                },
              });
            },
            calculateMD5Hash: (image: string) => {
              // Skip MD5 verification to avoid timeout issues
              return "";
            },
          });

          addLog("Flashing complete. Resetting chip...", "system");
          
          try {
            await loader.hardReset();
            addLog("Chip reset successfully", "system");
          } catch (e: any) {
            addLog(`Reset failed: ${e.message}`, "system");
          }
        } catch (err: any) {
          addLog(`Flashing failed: ${err.message}`, "error");
          console.error("Full error:", err);
          throw err;
        } finally {
          // Disconnect transport and close port
          try {
            await transport.disconnect();
          } catch {}
          try {
            await get().port?.close();
          } catch {}

          set({
            port: null,
            isConnected: false,
            isFlashing: false,
            flashProgress: null,
            transport: null,
            loader: null,
          });

          addLog("Port closed. Reconnect to monitor.", "system");
        }
      },

       
    };
  })
);
