import CryptoJS from "crypto-js";
import { ESPLoader, Transport } from "esptool-js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// import axios from "axios";

// https://github.com/adafruit/Adafruit_WebSerial_ESPTool/blob/main/js/script.js

/* ----------------------------- Types ----------------------------- */

type LogType = "send" | "receive" | "error" | "system";

interface LogEntry {
	id: string;
	message: string;
	type: LogType;
	timestamp: Date;
}

interface FlashProgress {
	written: number;
	total: number;
	percentage: number;
}

export type BoardResetMode = "no_reset" | "default_reset" | "usb_reset";

export interface BoardDefinition {
	id: string;
	label: string;
	/** S2 Mini needs BOOT+RESET; S3 Mini can enter download mode over USB. */
	requiresManualBootloader: boolean;
	/** esptool-js connect / main() reset strategy */
	resetMode: BoardResetMode;
	/** Call loader.after("hard_reset") after a successful flash */
	hardResetAfterFlash: boolean;
}

export interface FlashFirmwareResult {
	hardReset: boolean;
}

export interface FirmwareRole {
	label: string;
	sketch: string;
	description: string;
}

export interface FirmwareManifest {
	boards: BoardDefinition[];
	roles: FirmwareRole[];
}

export interface FirmwarePreset {
	label: string;
	path: string;
	version: string;
	description: string;
	board: string;
	boardId: string;
	requiresManualBootloader: boolean;
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
	availableFirmware: FirmwarePreset[];
	boards: BoardDefinition[];
	roles: FirmwareRole[];
	selectedBoardId: string;
	/** Path segment e.g. "0-13-0" */
	selectedVersion: string;
	latestVersion: string;
	versions: string[];

	init: () => void;
	setSelectedBoard: (boardId: string) => void;
	setSelectedVersion: (versionPathSegment: string) => Promise<void>;

	connect(): Promise<void>;
	disconnect(): Promise<void>;

	startMonitoring(): Promise<void>;
	stopMonitoring(): Promise<void>;

	send(data: string): Promise<void>;
	clearLog(): void;

	flashFirmware(
		file: File,
		manualBootloaderRequired: boolean,
		address?: number,
		clearNvs?: boolean,
	): Promise<FlashFirmwareResult | undefined>;
}

/* ------------------------ Board / firmware ------------------------ */

const DEFAULT_BOARD_ID = "lolin_s2_mini";

/** Arduino-ESP32 default partition table NVS region */
const NVS_ADDRESS = 0x9000;
const NVS_SIZE = 0x6000;

function versionDisplayFromPath(versionPathSegment: string): string {
	return versionPathSegment.replace(/-/g, ".");
}

function buildFirmwareList(
	board: BoardDefinition,
	roles: FirmwareRole[],
	versionPathSegment: string,
	versionDisplay: string,
): FirmwarePreset[] {
	return roles.map((role) => ({
		label: role.label,
		path: `/enomik-app/firmware/${versionPathSegment}/${board.id}_${role.sketch}_${role.sketch}.ino.bin`,
		version: versionDisplay,
		description: role.description,
		board: board.label,
		boardId: board.id,
		requiresManualBootloader: board.requiresManualBootloader,
	}));
}

function boardById(
	boards: BoardDefinition[],
	boardId: string,
): BoardDefinition | undefined {
	return boards.find((b) => b.id === boardId) ?? boards[0];
}

function resolveSelectedBoardId(
	boards: BoardDefinition[],
	preferredId?: string,
): string {
	if (preferredId && boards.some((b) => b.id === preferredId))
		return preferredId;
	if (boards.some((b) => b.id === DEFAULT_BOARD_ID)) return DEFAULT_BOARD_ID;
	return boards[0]?.id ?? "";
}

const RESET_MODES: BoardResetMode[] = [
	"no_reset",
	"default_reset",
	"usb_reset",
];

type RawBoardDefinition = Omit<
	BoardDefinition,
	"resetMode" | "hardResetAfterFlash" | "requiresManualBootloader"
> & {
	requiresManualBootloader?: boolean;
	resetMode?: string;
	hardResetAfterFlash?: boolean;
};

function normalizeBoard(board: RawBoardDefinition): BoardDefinition {
	const requiresManualBootloader = Boolean(board.requiresManualBootloader);
	const resetMode = RESET_MODES.includes(board.resetMode as BoardResetMode)
		? (board.resetMode as BoardResetMode)
		: requiresManualBootloader
			? "no_reset"
			: "default_reset";
	const hardResetAfterFlash =
		typeof board.hardResetAfterFlash === "boolean"
			? board.hardResetAfterFlash
			: !requiresManualBootloader;

	return {
		id: board.id,
		label: board.label,
		requiresManualBootloader,
		resetMode,
		hardResetAfterFlash,
	};
}

function normalizeManifest(manifest: {
	boards?: RawBoardDefinition[];
	roles?: FirmwareRole[];
}): FirmwareManifest {
	return {
		boards: (manifest.boards ?? []).map(normalizeBoard),
		roles: manifest.roles ?? [],
	};
}

async function fetchManifest(
	versionPathSegment: string,
): Promise<FirmwareManifest> {
	const manifestRes = await fetch(
		`/enomik-app/firmware/${versionPathSegment}/manifest.json`,
	);
	if (!manifestRes.ok) {
		throw new Error(`manifest.json fetch failed: ${manifestRes.status}`);
	}
	return normalizeManifest(await manifestRes.json());
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

/* ---------------------------- Store ----------------------------- */

export const useSerialStore = create<SerialState>()(
	devtools((set, get) => {
		let readLoopActive = false;
		let terminalBuffer = "";

		const addLog = (message: string, type: LogType) => {
			set((s) => ({
				log: [
					...s.log,
					{
						id: crypto.randomUUID(),
						message,
						type,
						timestamp: new Date(),
					},
				],
			}));
		};

		const flushTerminalLine = (line: string) => {
			const trimmed = line.replace(/\r/g, "").trimEnd();
			if (!trimmed) return;
			// Per-block flash progress is already shown via flashProgress UI.
			if (/^Writing at 0x/i.test(trimmed)) return;
			addLog(trimmed, "system");
		};

		const terminal = {
			clean() {
				terminalBuffer = "";
			},
			writeLine(t: string) {
				flushTerminalLine(terminalBuffer + t);
				terminalBuffer = "";
			},
			write(t: string) {
				terminalBuffer += t;
				const parts = terminalBuffer.split(/\r?\n/);
				terminalBuffer = parts.pop() ?? "";
				for (const part of parts) {
					flushTerminalLine(part);
				}
			},
		};

		/* ------------------------ Monitoring ------------------------ */

		const startReadLoop = async (
			reader: ReadableStreamDefaultReader<string>,
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
			} catch {
				// Expected abort error, ignore
			}

			try {
				writerAbortController?.abort();
			} catch {
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
			availableFirmware: [],
			boards: [],
			roles: [],
			selectedBoardId: DEFAULT_BOARD_ID,
			selectedVersion: "",
			latestVersion: "",
			versions: [],

			init: () => {
				(async () => {
					try {
						const res = await fetch("/enomik-app/firmware/versions.json");
						if (!res.ok)
							throw new Error(`versions.json fetch failed: ${res.status}`);
						const data = await res.json();
						const versions: string[] = data.versions ?? [];
						const selectedVersion = versions[0] ?? "";
						const latestVersion = versionDisplayFromPath(selectedVersion);

						if (!selectedVersion) {
							set({
								latestVersion,
								versions,
								selectedVersion: "",
								boards: [],
								roles: [],
								availableFirmware: [],
							});
							return;
						}

						const manifest = await fetchManifest(selectedVersion);
						const boards = manifest.boards ?? [];
						const roles = manifest.roles ?? [];
						const selectedBoardId = resolveSelectedBoardId(boards);
						const board = boardById(boards, selectedBoardId);

						set({
							latestVersion,
							versions,
							selectedVersion,
							boards,
							roles,
							selectedBoardId,
							availableFirmware: board
								? buildFirmwareList(
										board,
										roles,
										selectedVersion,
										latestVersion,
									)
								: [],
						});
					} catch (err) {
						console.error("Failed to fetch firmware versions:", err);
					}
				})();
			},

			setSelectedBoard: (boardId: string) => {
				const { boards, roles, selectedVersion } = get();
				const board = boardById(boards, boardId);

				if (!board || !selectedVersion) return;

				set({
					selectedBoardId: board.id,
					availableFirmware: buildFirmwareList(
						board,
						roles,
						selectedVersion,
						versionDisplayFromPath(selectedVersion),
					),
				});
			},

			setSelectedVersion: async (versionPathSegment: string) => {
				if (
					!versionPathSegment ||
					versionPathSegment === get().selectedVersion
				) {
					return;
				}

				try {
					const manifest = await fetchManifest(versionPathSegment);
					const boards = manifest.boards ?? [];
					const roles = manifest.roles ?? [];
					const selectedBoardId = resolveSelectedBoardId(
						boards,
						get().selectedBoardId,
					);
					const board = boardById(boards, selectedBoardId);
					const versionDisplay = versionDisplayFromPath(versionPathSegment);

					set({
						selectedVersion: versionPathSegment,
						boards,
						roles,
						selectedBoardId,
						availableFirmware: board
							? buildFirmwareList(
									board,
									roles,
									versionPathSegment,
									versionDisplay,
								)
							: [],
					});
				} catch (err) {
					console.error("Failed to load firmware manifest:", err);
				}
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
				address = 0x10000,
				clearNvs = false,
			): Promise<FlashFirmwareResult | undefined> => {
				if (get().isFlashing) return;

				let port: SerialPort | null = null;
				let transport: Transport | null = null;
				let result: FlashFirmwareResult | undefined;

				const board = boardById(get().boards, get().selectedBoardId);
				const resetMode: BoardResetMode = manualBootloaderRequired
					? "no_reset"
					: (board?.resetMode ?? "default_reset");
				const shouldHardReset =
					!manualBootloaderRequired && Boolean(board?.hardResetAfterFlash);

				try {
					addLog("Preparing for flashing…", "system");

					if (get().isMonitoring) await stopMonitoring();
					if (get().port) await get().port!.close();

					set({
						port: null,
						isConnected: false,
						isFlashing: true,
						flashProgress: null,
						chipInfo: "",
					});

					// Always request a *fresh, unopened* port
					port = await navigator.serial.requestPort();

					// macOS needs time to bind the AppleUSBCDC driver to the
					// newly-enumerated bootloader device before Chrome can open it.
					await new Promise((r) => setTimeout(r, 1500));

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
								new Uint8Array(await file.arrayBuffer()),
							);

							const fileArray: { data: string; address: number }[] = [];
							if (clearNvs) {
								const erasedNvs = uint8ArrayToBinaryString(
									new Uint8Array(NVS_SIZE).fill(0xff),
								);
								fileArray.push({ data: erasedNvs, address: NVS_ADDRESS });
								addLog(
									`Clearing NVS at 0x${NVS_ADDRESS.toString(16)} (${NVS_SIZE} bytes)…`,
									"system",
								);
							}
							fileArray.push({ data, address });

							await loader.writeFlash({
								fileArray,
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

							if (shouldHardReset) {
								await loader.after("hard_reset");
								addLog("Board hard-reset after flash.", "system");
								result = { hardReset: true };
							} else {
								addLog("Please press the reset button manually.", "system");
								result = { hardReset: false };
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
									"error",
								);
								addLog(
									"→ On macOS, run in Terminal:  sudo kextunload -b com.apple.driver.AppleUSBCDCACMData",
									"error",
								);
								addLog(
									"→ Make sure the device is in bootloader mode (hold BOOT, press RESET, release both)",
									"error",
								);
								throw err;
							}

							if (attempt >= maxAttempts) throw err;

							const waitMs = attempt * 1500;
							addLog(
								`Attempt ${attempt} failed (${msg}), retrying in ${waitMs / 1000} s…`,
								"system",
							);
							try {
								await transport?.disconnect();
							} catch {}
							try {
								await port!.close();
							} catch {}
							set({ flashProgress: null, chipInfo: "" });
							await new Promise((r) => setTimeout(r, waitMs));
						}
					}

					return result;
				} catch (err: unknown) {
					set({ flashProgress: null, chipInfo: "" });
					const message = err instanceof Error ? err.message : String(err);
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
	}),
);
