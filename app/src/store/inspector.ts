import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { InputPinConfig, OutputPinConfig } from "./io";

interface InspectorState {
	peers: string[];
	inputPinConfigs: InputPinConfig[];
	outputPinConfigs: OutputPinConfig[];
	midiLoopback: boolean;
	powerSave: boolean;
	macAddress: string | null;
	protocolVersion: string | null;
	name: string | null;
	clear: () => void;
	setPeers: (newPeers: string[]) => void;
	addPeer: (mac: string) => void;
	addInputPinConfig: (config: any) => void;
	addOutputPinConfig: (config: any) => void;
	setMidiLoopback: (enabled: boolean) => void;
	setPowerSave: (enabled: boolean) => void;
	setMacAddress: (mac: string) => void;
	setProtocolVersion: (version: string) => void;
	setName: (name: string) => void;
}

export const useInspectorStore = create<InspectorState>()(
	devtools(
		persist(
			(set) => ({
				peers: [],
				inputPinConfigs: [],
				outputPinConfigs: [],
				midiLoopback: false,
				powerSave: false,
				macAddress: null,
				protocolVersion: null,
				name: null,
				setPeers: (newPeers: string[]) =>
					set(() => ({
						peers: newPeers,
					})),

				addPeer: (mac: string) =>
					set((state) => {
						const normalized = mac.toUpperCase();
						if (state.peers.includes(normalized)) return state;
						return { peers: [...state.peers, normalized] };
					}),

				addInputPinConfig: (config: InputPinConfig) =>
					set((state) => ({
						inputPinConfigs: [
							...state.inputPinConfigs.filter((c) => c.pin !== config.pin),
							config,
						],
					})),

				addOutputPinConfig: (config: OutputPinConfig) =>
					set((state) => ({
						outputPinConfigs: [
							...state.outputPinConfigs.filter((c) => c.pin !== config.pin),
							config,
						],
					})),

				setMidiLoopback: (enabled: boolean) =>
					set(() => ({ midiLoopback: enabled })),

				setPowerSave: (enabled: boolean) => set(() => ({ powerSave: enabled })),

				setMacAddress: (mac: string) =>
					set(() => ({ macAddress: mac.toUpperCase() })),

				setProtocolVersion: (version: string) =>
					set(() => ({ protocolVersion: version })),

				setName: (name: string) => set(() => ({ name })),

				clear: () => {
					set({
						peers: [],
						inputPinConfigs: [],
						outputPinConfigs: [],
						midiLoopback: false,
						powerSave: false,
						macAddress: null,
						protocolVersion: null,
						name: null,
					});
				},
			}),
			{
				name: "InspectorStore",
			},
		),
	),
);
