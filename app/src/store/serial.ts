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

    /* --------------------------- Flashing ------------------------ */

    const hardReset = async (transport: Transport) => {
      try {
        await transport.setDTR(false);
        await transport.setRTS(true);
        await new Promise((r) => setTimeout(r, 100));
        await transport.setRTS(false);
        await new Promise((r) => setTimeout(r, 50));
      } catch {}
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
  let { port, isMonitoring } = get();
  addLog("Preparing for firmware flash...", "system");

  // Stop monitoring if active
  if (isMonitoring) {
    console.log("Stopping monitoring for flashing...");
    await stopMonitoring();
    await new Promise((r) => setTimeout(r, 500));
  }

  // Close and clear any existing port
  if (port) {
    try {
      await port.close();
    } catch {}
    set({ port: null, isConnected: false });
    port = null;
  }

  await new Promise((r) => setTimeout(r, 500));

  // Try to forget all existing ports to force a fresh connection
  addLog("Checking for existing port references...", "system");
  try {
    const existingPorts = await navigator.serial.getPorts();
    addLog(`Found ${existingPorts.length} existing port(s)`, "system");
    
    for (const p of existingPorts) {
      try {
        // Try to close it first
        if ((p as any).connected) {
          addLog("Closing stale port...", "system");
          await p.close();
          addLog("✓ Closed", "system");
        }
      } catch (e: any) {
        addLog(`Close attempt: ${e.message}`, "system");
      }
      
      // Then forget it if the API is available
      if (typeof (p as any).forget === 'function') {
        try {
          addLog("Forgetting port reference...", "system");
          await (p as any).forget();
          addLog("✓ Cleared stale port reference", "system");
        } catch (e: any) {
          addLog(`Forget attempt: ${e.message}`, "system");
        }
      }
    }
    
    addLog("Waiting for port to release...", "system");
    await new Promise((r) => setTimeout(r, 2000));
    addLog("✓ Wait complete", "system");
  } catch (e: any) {
    addLog(`Port cleanup: ${e.message}`, "system");
  }

  // Request port - this should now be truly fresh
  addLog("Please select your device in the popup...", "system");
  addLog("⚠️ If this fails, unplug and replug your device", "system");
  port = await navigator.serial.requestPort();
  
  console.log("Port state after requestPort():", {
    connected: (port as any).connected,
    readable: port.readable,
    writable: port.writable
  });
  
  // Store the port
  set({ port, isConnected: false });

  addLog("Opening port manually...", "system");
  
  // Open the port ourselves with explicit settings
  try {
    await port.open({
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1, 
      parity: "none",
      bufferSize: 255,
      flowControl: "hardware" // Try hardware flow control
    });
    addLog("✓ Port opened", "system");
  } catch (err: any) {
    addLog(`❌ Cannot open port: ${err.message}`, "error");
    addLog("💡 Make sure no other program is using the port", "system");
    addLog("💡 Try unplugging and replugging the device", "system");
    throw err;
  }

  addLog("Connecting to chip (hold BOOT if needed)...", "system");

  try {
    // Create Transport with already-open port (pass false)
    const transport = new Transport(port, false);
    const loader = new ESPLoader({
      transport,
      baudrate: 115200,
      romBaudrate: 115200,
      terminal,
      enableTracing: true,
    });
    addLog("✓ Transport created", "system");

    await loader.connect();
    addLog("✓ loader connected", "system");
    
    await hardReset(transport);
    addLog("✓ Hard reset performed", "system");
    await new Promise((r) => setTimeout(r, 500));
    addLog("✓ Connected to bootloader", "system");

    try {
      await loader.sync();
      addLog("✓ Synced with chip", "system");
    } catch {
      addLog("ℹ Sync failed, retrying...", "system");
      await new Promise((r) => setTimeout(r, 500));
      await loader.sync();
      addLog("✓ Synced with chip", "system");
    }

    const chipName = await loader.main();
    addLog(`✓ Connected to ${chipName}`, "system");

    try {
      await loader.flashId();
    } catch {
      addLog("ℹ Could not read flash ID", "system");
    }

    set({
      isConnected: true,
      isFlashing: true,
      chipInfo: chipName || "Unknown",
    });

    (get() as any)._transport = transport;
    (get() as any)._loader = loader;

    addLog("✓ Ready to flash!", "system");
  } catch (err: any) {
    addLog(`❌ Failed: ${err.message}`, "error");
    addLog(
      "💡 TIP: Hold BOOT, press RESET, release BOOT, then retry",
      "system"
    );

    if (port) {
      try {
        await port.close();
      } catch {}
    }

    set({
      port: null,
      isConnected: false,
      isFlashing: false,
    });

    throw err;
  }
},
      disconnectFlashing: async () => {
        const transport = (get() as any)._transport as Transport;
        const { port } = get();

        addLog("Disconnecting from flashing mode...", "system");

        // Disconnect transport if exists
        if (transport) {
          try {
            await transport.disconnect();
          } catch (err: any) {
            addLog(`Transport disconnect warning: ${err.message}`, "system");
          }
        }

        // Close port
        if (port) {
          try {
            await port.close();
          } catch (err: any) {
            addLog(`Port close warning: ${err.message}`, "system");
          }
        }

        // Clean up state
        set({
          port: null,
          isConnected: false,
          isFlashing: false,
          chipInfo: "",
          flashProgress: null,
        });

        // Clean up internal references
        delete (get() as any)._transport;
        delete (get() as any)._loader;

        addLog("Disconnected from flashing mode", "system");
      },

      flashFirmware: async (file: File, address = 0x10000) => {
        const transport = (get() as any)._transport as Transport;
        const loader = (get() as any)._loader as ESPLoader;

        if (!transport || !loader) {
          throw new Error("Not connected for flashing");
        }

        const buffer = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let i = 0; i < buffer.length; i++) {
          binary += String.fromCharCode(buffer[i]);
        }

        const total = binary.length;
        set({ flashProgress: { written: 0, total, percentage: 0 } });

        await loader.writeFlash({
          fileArray: [{ data: binary, address }],
          flashSize: "keep",
          flashMode: "keep",
          flashFreq: "keep",
          eraseAll: false,
          compress: true,
          reportProgress: (_, written, total) => {
            set({
              flashProgress: {
                written,
                total,
                percentage: (written / total) * 100,
              },
            });
          },
        });

        await hardReset(transport);
        await transport.disconnect();

        // Port must be closed after flashing
        await get().port!.close();

        set({
          port: null,
          isConnected: false,
          isFlashing: false,
          flashProgress: null,
        });

        addLog("Flashing complete. Reconnect to monitor.", "system");
      },
    };
  })
);
