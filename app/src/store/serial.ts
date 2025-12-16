import { create } from "zustand";
import { devtools } from "zustand/middleware";

type LogType = "send" | "receive" | "error" | "system";

interface LogEntry {
  message: string;
  type: LogType;
  timestamp: Date;
}

interface SerialState {
  port: SerialPort | null;
  reader: ReadableStreamDefaultReader<string> | null;
  writer: WritableStreamDefaultWriter<string> | null;
  isConnected: boolean;
  log: LogEntry[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (data: string) => Promise<void>;
  clearLog: () => void;
}

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
          if (value) {
            addLog(value, "receive");
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          addLog(`Read error: ${error.message}`, "error");
        }
      }
    };

    return {
      port: null,
      reader: null,
      writer: null,
      isConnected: false,
      log: [],

      connect: async () => {
        if (get().isConnected) return;

        try {
          const port = await navigator.serial.requestPort();
          await port.open({ baudRate: 115200 });

          // Create abort controllers for cleanup
          decoderController = new AbortController();
          encoderController = new AbortController();

          // Set up decoder (for reading)
          const decoder = new TextDecoderStream();
          const decoderPipeline = (port.readable as ReadableStream<Uint8Array>)
            .pipeTo(decoder.writable as WritableStream<Uint8Array>, {
              signal: decoderController.signal,
            })
            .catch((err) => {
              if (err.name !== "AbortError") {
                addLog(`Readable pipeline error: ${err}`, "error");
              }
            });

          const reader = decoder.readable.getReader();

          // Set up encoder (for writing)
          const encoder = new TextEncoderStream();
          const encoderPipeline = encoder.readable
            .pipeTo(port.writable as WritableStream<Uint8Array>, {
              signal: encoderController.signal,
            })
            .catch((err) => {
              if (err.name !== "AbortError") {
                addLog(`Writable pipeline error: ${err}`, "error");
              }
            });

          const writer = encoder.writable.getWriter();

          set({
            port,
            reader,
            writer,
            isConnected: true,
          });

          addLog("Connected to serial device", "system");
          startReadLoop(reader);
        } catch (error) {
          addLog(`Connection error: ${(error as Error).message}`, "error");
        }
      },

      disconnect: async () => {
        const { reader, writer, port } = get();

        try {
          // Stop the read loop
          readLoopActive = false;

          // Cancel and release the reader
          if (reader) {
            try {
              await reader.cancel();
              reader.releaseLock();
            } catch (err) {
              console.error("Reader cleanup error:", err);
            }
          }

          // Close and release the writer
          if (writer) {
            try {
              await writer.close();
            } catch (err) {
              console.error("Writer cleanup error:", err);
            }
          }

          // Abort the stream pipelines
          if (decoderController) {
            decoderController.abort();
            decoderController = null;
          }

          if (encoderController) {
            encoderController.abort();
            encoderController = null;
          }

          // Small delay to let streams settle
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Close the port
          if (port) {
            try {
              await port.close();
            } catch (err) {
              console.error("Port close error:", err);
            }
          }

          addLog("Disconnected", "system");
        } catch (error) {
          addLog(`Disconnect error: ${(error as Error).message}`, "error");
        } finally {
          set({
            port: null,
            reader: null,
            writer: null,
            isConnected: false,
          });
        }
      },

      send: async (data: string) => {
        const { writer, isConnected } = get();
        if (!writer || !isConnected || !data.trim()) return;

        try {
          await writer.write(data + "\n");
          addLog(data, "send");
        } catch (error) {
          addLog(`Send error: ${(error as Error).message}`, "error");
        }
      },

      clearLog: () => {
        set({ log: [] });
      },
    };
  })
);