import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { ALL_DEVICES, DEFAULT_MAIN_FILE } from "../utils/pd";

export interface PdLogEntry {
	id: number;
	timestamp: number;
	severity: "info" | "success" | "error";
	text: string;
}

interface PdState {
	outputId: string;
	/** File Dump device ID of the client, ALL_DEVICES for every client. */
	deviceId: number;
	/** Arrives last and makes the client reload the patch. */
	mainFile: string;
	log: PdLogEntry[];
	setOutputId: (outputId: string) => void;
	setDeviceId: (deviceId: number) => void;
	addLog: (severity: PdLogEntry["severity"], text: string) => void;
	clearLog: () => void;
}

const MAX_LOG = 200;
let logId = 0;

export const usePdStore = create<PdState>()(
	devtools(
		persist(
			(set) => ({
				outputId: "",
				deviceId: ALL_DEVICES,
				mainFile: DEFAULT_MAIN_FILE,
				log: [],
				setOutputId: (outputId) => set({ outputId }),
				setDeviceId: (deviceId) =>
					set({ deviceId: Math.max(0, Math.min(ALL_DEVICES, deviceId)) }),
				addLog: (severity, text) =>
					set((s) => ({
						log: [
							...s.log,
							{ id: ++logId, timestamp: Date.now(), severity, text },
						].slice(-MAX_LOG),
					})),
				clearLog: () => set({ log: [] }),
			}),
			{
				name: "pd-storage",
				partialize: (s) => ({ outputId: s.outputId, deviceId: s.deviceId }),
			},
		),
		{ name: "PdStore" },
	),
);
