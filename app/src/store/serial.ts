import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ESPLoader, Transport } from "esptool-js";
import CryptoJS from "crypto-js";
// import axios from "axios";

// https://github.com/adafruit/Adafruit_WebSerial_ESPTool/blob/main/js/script.js

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
  readerAbortController: AbortController | null;
  writerAbortController: AbortController | null;

  isConnected: boolean;
  isMonitoring: boolean;
  isFlashing: boolean;

  log: LogEntry[];
  flashProgress: FlashProgress | null;
  chipInfo: string;
  availableFirmware: any[];

  init: () => void;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;

  send(data: string): Promise<void>;
  clearLog(): void;

  flashFirmware(
    file: File,
    manualBootloaderRequired: boolean,
    address?: number
  ): Promise<void>;
}

/* ---------------------------- Helpers ---------------------------- */

function uint8ArrayToBinaryString(arr: Uint8Array): string {
  const chunkSize = 0x8000;
  let result = "";
  for (let i = 0; i < arr.length; i += chunkSize) {
    result += String.fromCharCode(...arr.subarray(i, i + chunkSize));
  }
  return result;
}

const terminal = {
  clean() {},
  writeLine(t: string) {
    console.log("[esptool]", t);
  },
  write(t: string) {
    console.log("[esptool]", t);
  },
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
      } catch {}
    };

    const startMonitoring = async () => {
      const { port, isFlashing } = get();
      if (!port || isFlashing) return;

      const decoder = new TextDecoderStream();
      const encoder = new TextEncoderStream();

      // Store abort controllers to cancel pipes later
      const readerAbortController = new AbortController();
      const writerAbortController = new AbortController();

      // Catch abort errors from pipes (they're expected when we disconnect)
      port
        .readable!.pipeTo(decoder.writable as WritableStream<Uint8Array>, {
          signal: readerAbortController.signal,
        })
        .catch(() => {
          // Expected abort error when disconnecting, ignore
        });

      encoder.readable
        .pipeTo(port.writable!, {
          signal: writerAbortController.signal,
        })
        .catch(() => {
          // Expected abort error when disconnecting, ignore
        });

      const reader = decoder.readable.getReader();
      const writer = encoder.writable.getWriter();

      set({
        reader,
        writer,
        isMonitoring: true,
        readerAbortController,
        writerAbortController,
      });
      startReadLoop(reader);
    };

    const stopMonitoring = async () => {
      readLoopActive = false;
      const { reader, writer, readerAbortController, writerAbortController } =
        get();

      // Abort the pipes first (this will throw AbortErrors, which is expected)
      try {
        readerAbortController?.abort();
      } catch (e) {
        // Expected abort error, ignore
      }

      try {
        writerAbortController?.abort();
      } catch (e) {
        // Expected abort error, ignore
      }

      // Then release locks
      try {
        if (reader) {
          reader.releaseLock();
        }
      } catch (e) {
        console.error("Error releasing reader:", e);
      }

      try {
        if (writer) {
          writer.releaseLock();
        }
      } catch (e) {
        console.error("Error releasing writer:", e);
      }

      // Small delay to ensure streams are fully released
      await new Promise((resolve) => setTimeout(resolve, 100));

      set({
        reader: null,
        writer: null,
        isMonitoring: false,
        readerAbortController: null,
        writerAbortController: null,
      });
    };

    /* ------------------------- Public API ------------------------- */

    return {
      port: null,
      reader: null,
      writer: null,
      readerAbortController: null,
      writerAbortController: null,

      isConnected: false,
      isMonitoring: false,
      isFlashing: false,

      log: [],
      flashProgress: null,
      chipInfo: "",
      availableFirmware: [
        {
          label: "Dongle",
          path: "/enomik-app/firmware/0-10-5/lolin_s2_mini_dongle_dongle.ino.bin",
          version: "0.10.5",
          description: "interface to MIDI host",
          board: "LOLIN S2 Mini",
        },
        {
          label: "Client",
          path: "/enomik-app/firmware/0-10-5/lolin_s2_mini_client_client.ino.bin",
          version: "0.10.5",
          description: "board to connect sensors and actuators",
          board: "LOLIN S2 Mini",
        },
        // { label: "Client - Buttons", path: "/firmware/0-10-3/lolin_s2_mini_client_buttons_client_buttons.ino.bin" },
        // { label: "Client - Clocked", path: "/firmware/0-10-3/lolin_s2_mini_client_clocked_client_clocked.ino.bin" },
        // ... add all your firmware files
        {
          label: "Print MAC",
          path: "/enomik-app//firmware/0-10-5/lolin_s2_mini_print_mac_print_mac.ino.bin",
          version: "0.10.5",
          description:
            "prints the MAC address to serial (use this if you are not using a dongle with display)",
          board: "LOLIN S2 Mini",
        },
      ],

      init: () => {
        // axios.get("https://api.github.com/repos/grantler-instruments/esp-now-midi/releases/latest")
        //   .then((response) => {
        //     const { tag_name, assets } = response.data;
        //     console.log("Latest firmware version:", tag_name);
        //     const firmwareAssets = assets.filter((asset: any) =>
        //       asset.name.endsWith(".bin") || asset.name.endsWith(".bin.gz")
        //     )
        //     .filter((asset: any) => !(asset.name.includes("merged") || asset.name.includes("partition") || asset.name.includes("bootloader")));
        //     console.log("Available firmware assets:", firmwareAssets);
        //     set({ availableFirmware: firmwareAssets });
        //   })
        //   .catch((error) => {
        //     console.error("Error fetching firmware info:", error);
        //   });
      },

      connect: async () => {
        if (get().isConnected || get().isFlashing) return;

        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        set({ port, isConnected: true });
        addLog("Serial port opened", "system");
        await startMonitoring();
      },

      disconnect: async () => {
        if (!get().port) return;
        await stopMonitoring();
        await get().port!.close();
        set({ port: null, isConnected: false });
        addLog("Disconnected", "system");
      },

      startMonitoring,
      stopMonitoring,

      send: async (data: string) => {
        if (!get().writer) return;
        await get().writer!.write(data + "\n");
        addLog(data, "send");
      },

      clearLog: () => set({ log: [] }),

      /* ------------------------- Flashing ------------------------- */

      flashFirmware: async (
        file: File,
        manualBootloaderRequired,
        address = 0x10000
      ) => {
        if (get().isFlashing) return;

        let port: SerialPort | null = null;
        let transport: Transport | null = null;

        try {
          addLog("Preparing for flashing…", "system");

          if (get().isMonitoring) await stopMonitoring();
          if (get().port) await get().port!.close();

          set({
            port: null,
            isConnected: false,
            isFlashing: true,
          });

          // Always request a *fresh, unopened* port
          port = await navigator.serial.requestPort();

          // macOS needs time to bind the AppleUSBCDC driver to the
          // newly-enumerated bootloader device before Chrome can open it.
          await new Promise((r) => setTimeout(r, 1500));

          const resetMode = manualBootloaderRequired
            ? "no_reset"
            : "default_reset";

          let chip: string | undefined;
          const maxAttempts = 3;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              transport = new Transport(port!, false);
              const loader = new ESPLoader({
                transport,
                baudrate: 115200,
                romBaudrate: 115200,
                terminal,
                debugLogging: false,
              });

              chip = await loader.main(resetMode);
              set({ chipInfo: chip });
              addLog(`Connected to ${chip}`, "system");

              const data = uint8ArrayToBinaryString(
                new Uint8Array(await file.arrayBuffer())
              );

              await loader.writeFlash({
                fileArray: [{ data, address }],
                flashSize: "keep",
                eraseAll: false,
                flashMode: "keep",
                flashFreq: "keep",
                reportProgress: (_, written, total) => {
                  set({
                    flashProgress: {
                      written,
                      total,
                      percentage: Math.floor((written / total) * 100),
                    },
                  });
                },
                compress: true,
                calculateMD5Hash: (i: string) =>
                  CryptoJS.MD5(CryptoJS.enc.Latin1.parse(i)).toString(),
              });

              addLog("✓ Flash complete", "system");
              if (manualBootloaderRequired) {
                addLog(
                  "Please press the reset button manually - sorry, was not yet able to automate this",
                  "system"
                );
              }
              break;
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);

              // "Failed to open serial port" means the OS is blocking us —
              // retrying will never help, so bail out immediately with guidance.
              if (msg.includes("Failed to open serial port")) {
                addLog("Error: Could not open the serial port.", "error");
                addLog(
                  "→ Close any other app that may have it open (Arduino IDE, PlatformIO, screen, minicom…)",
                  "error"
                );
                addLog(
                  "→ On macOS, run in Terminal:  sudo kextunload -b com.apple.driver.AppleUSBCDCACMData",
                  "error"
                );
                addLog(
                  "→ Make sure the device is in bootloader mode (hold BOOT, press RESET, release both)",
                  "error"
                );
                throw err;
              }

              if (attempt >= maxAttempts) throw err;

              const waitMs = attempt * 1500;
              addLog(
                `Attempt ${attempt} failed (${msg}), retrying in ${waitMs / 1000} s…`,
                "system"
              );
              try {
                await transport?.disconnect();
              } catch {}
              try {
                await port!.close();
              } catch {}
              await new Promise((r) => setTimeout(r, waitMs));
            }
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : String(err);
          // Only log a generic fallback if guidance wasn't already logged above.
          if (!message.includes("Failed to open serial port")) {
            addLog(`Error: ${message}`, "error");
          }
          throw err;
        } finally {
          try {
            await transport?.disconnect();
            await transport?.waitForUnlock(1500);
          } catch {}
          try {
            await port?.close();
          } catch {}
          set({ isFlashing: false });
          addLog("Flash session closed.", "system");
        }
      },
    };
  })
);
