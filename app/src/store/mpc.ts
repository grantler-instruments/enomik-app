import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { PAD_COUNT } from "../utils/mpc";
import type { MidiMapping } from "./grantulator";

export type { MidiMapping };

/** Pads to play, with velocity 0..1. */
export type Hits = { pad: number; velocity: number }[];

/**
 * What MIDI learn can map: a pad's trigger (a note or a control change), a
 * pad's volume or the master volume (control changes: a note has no value).
 */
export type LearnTarget =
	| { kind: "trigger"; pad: number }
	| { kind: "volume"; pad: number }
	| { kind: "master" };

export interface MpcState {
	/** What triggers each pad, by pad index. */
	mappings: (MidiMapping | null)[];
	/** Each pad's volume, 0..1. */
	padVolumes: number[];
	/** What moves each pad's volume. */
	volumeMappings: (MidiMapping | null)[];
	/** Master volume, 0..1. */
	volume: number;
	masterMapping: MidiMapping | null;
	/** Waiting for the next note or control change to map it. */
	learning: LearnTarget | null;
	setMapping: (target: LearnTarget, mapping: MidiMapping | null) => void;
	setLearning: (target: LearnTarget | null) => void;
	setVolume: (volume: number) => void;
	setPadVolume: (pad: number, volume: number) => void;
	/** Learns the note, or gives the pads it triggers. */
	handleNoteOn: (channel: number, note: number, velocity: number) => Hits;
	/**
	 * Learns the control change, moves the volumes it's mapped to, and gives
	 * the pads it triggers: touch pads send a value above 0 when touched.
	 */
	handleControlChange: (
		channel: number,
		controller: number,
		value: number,
	) => Hits;
	reset: () => void;
}

/** Notes 36 to 51 on channel 1, the usual drum pad range. */
export const defaultMappings = (): MidiMapping[] =>
	Array.from({ length: PAD_COUNT }, (_, i) => ({ channel: 1, note: 36 + i }));

const defaults = () => ({
	mappings: defaultMappings() as (MidiMapping | null)[],
	padVolumes: Array<number>(PAD_COUNT).fill(1),
	volumeMappings: Array<MidiMapping | null>(PAD_COUNT).fill(null),
	volume: 0.8,
	masterMapping: null,
	learning: null,
});

const sameMapping = (a: MidiMapping | null, b: MidiMapping) =>
	!!a &&
	a.channel === b.channel &&
	("note" in a
		? "note" in b && a.note === b.note
		: "controller" in b && a.controller === b.controller);

export const sameTarget = (a: LearnTarget | null, b: LearnTarget) =>
	!!a &&
	a.kind === b.kind &&
	(a.kind === "master" || (b.kind !== "master" && a.pad === b.pad));

export const useMpcStore = create<MpcState>()(
	devtools(
		persist(
			(set, get) => {
				/** Maps what waits for it; true if something was learning. */
				const learn = (mapping: MidiMapping) => {
					const { learning, setMapping } = get();
					if (!learning) return false;
					setMapping(learning, mapping);
					set({ learning: null });
					return true;
				};
				const triggered = (mapping: MidiMapping, velocity: number): Hits =>
					get().mappings.flatMap((m, pad) =>
						sameMapping(m, mapping) ? [{ pad, velocity }] : [],
					);
				return {
					...defaults(),
					// One note or control change drives one thing: learning it
					// again moves it over.
					setMapping: (target, mapping) =>
						set((state) => {
							const free = (m: MidiMapping | null) =>
								mapping && sameMapping(m, mapping) ? null : m;
							const mappings = state.mappings.map(free);
							const volumeMappings = state.volumeMappings.map(free);
							let masterMapping = free(state.masterMapping);
							if (target.kind === "trigger") mappings[target.pad] = mapping;
							else if (target.kind === "volume")
								volumeMappings[target.pad] = mapping;
							else masterMapping = mapping;
							return { mappings, volumeMappings, masterMapping };
						}),
					setLearning: (target) => set({ learning: target }),
					setVolume: (volume) => set({ volume }),
					setPadVolume: (pad, volume) =>
						set((state) => ({
							padVolumes: state.padVolumes.map((v, i) =>
								i === pad ? volume : v,
							),
						})),
					handleNoteOn: (channel, note, velocity) => {
						const mapping = { channel, note };
						const { learning } = get();
						// Volumes need a control change: a note has no position.
						if (learning && learning.kind !== "trigger") return [];
						if (learn(mapping)) return [];
						return triggered(mapping, velocity / 127);
					},
					handleControlChange: (channel, controller, value) => {
						const mapping = { channel, controller };
						const { learning } = get();
						// A release doesn't learn a trigger.
						if (learning && (learning.kind !== "trigger" || value > 0)) {
							learn(mapping);
							return [];
						}
						const { volumeMappings, masterMapping, setPadVolume, setVolume } =
							get();
						volumeMappings.forEach((m, pad) => {
							if (sameMapping(m, mapping)) setPadVolume(pad, value / 127);
						});
						if (sameMapping(masterMapping, mapping)) setVolume(value / 127);
						return value > 0 ? triggered(mapping, value / 127) : [];
					},
					reset: () => set(defaults()),
				};
			},
			{
				name: "mpc-storage",
				partialize: (state) => ({
					mappings: state.mappings,
					padVolumes: state.padVolumes,
					volumeMappings: state.volumeMappings,
					volume: state.volume,
					masterMapping: state.masterMapping,
				}),
			},
		),
		{ name: "MpcStore" },
	),
);
