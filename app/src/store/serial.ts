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
    const addLog = (message: string, type: LogType) => {
      set((state) => ({
        log: [...state.log, { message, type, timestamp: new Date() }],
      }));
    };

    const startReadLoop = async (
      reader: ReadableStreamDefaultReader<string>
    ) => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            addLog(value, "receive");
          }
        }
      } catch (error) {
        addLog(`Read error: ${(error as Error).message}`, "error");
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

          const decoder = new TextDecoderStream();
          (port.readable as ReadableStream<Uint8Array>)
            .pipeTo(decoder.writable as WritableStream<Uint8Array>)
            .catch((err) => addLog(`Readable pipeline error: ${err}`, "error"));

          const reader = decoder.readable.getReader();

          const encoder = new TextEncoderStream();
          encoder.readable
            .pipeTo(port.writable as WritableStream<Uint8Array>)
            .catch((err) => addLog(`Writable pipeline error: ${err}`, "error"));

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
          if (reader) {
            await reader.cancel();
          }

          if (writer) {
            await writer.close();
          }

          if (port) {
            await port.close();
          }
        } catch (error) {
          addLog(`Disconnect error: ${(error as Error).message}`, "error");
        } finally {
          set({
            port: null,
            reader: null,
            writer: null,
            isConnected: false,
          });

          addLog("Disconnected", "system");
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
