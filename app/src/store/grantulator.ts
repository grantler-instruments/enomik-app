import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { IntervalSetId } from "../utils/grantulator";

export type GrantulatorParamId =
	| "position"
	| "spread"
	| "drift"
	| "driftRate"
	| "size"
	| "pitch"
	| "intervalChance"
	| "grains"
	| "jitter"
	| "detune"
	| "width"
	| "gain"
	| "delayTime"
	| "delayFeedback"
	| "delayTone"
	| "delayMix"
	| "reverbDecay"
	| "reverbSize"
	| "reverbDamping"
	| "reverbMix"
	| "volume";

export type GrantulatorGroup = "grains" | "delay" | "reverb" | "master";

/** On/off switches: the effects, and muting the output. */
export type SwitchId = "delayEnabled" | "reverbEnabled" | "muted";

/** What a control change can drive: a parameter or a switch. */
export type MappingTarget = GrantulatorParamId | SwitchId;

export interface GrantulatorParam {
	id: GrantulatorParamId;
	group: GrantulatorGroup;
	label: string;
	min: number;
	max: number;
	step: number;
	unit?: string;
	defaultValue: number;
}

export const GRANTULATOR_PARAMS: GrantulatorParam[] = [
	{
		id: "position",
		group: "grains",
		label: "Position",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.5,
	},
	{
		id: "spread",
		group: "grains",
		label: "Spread",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.1,
	},
	{
		id: "drift",
		group: "grains",
		label: "Drift",
		min: 0,
		max: 0.5,
		step: 0.001,
		defaultValue: 0.05,
	},
	{
		id: "driftRate",
		group: "grains",
		label: "Drift rate",
		min: 0.01,
		max: 1,
		step: 0.001,
		unit: "Hz",
		defaultValue: 0.05,
	},
	{
		id: "size",
		group: "grains",
		label: "Grain size",
		min: 10,
		max: 2000,
		step: 1,
		unit: "ms",
		defaultValue: 120,
	},
	{
		id: "pitch",
		group: "grains",
		label: "Pitch",
		min: -24,
		max: 24,
		step: 0.01,
		unit: "st",
		defaultValue: 0,
	},
	{
		id: "intervalChance",
		group: "grains",
		label: "Interval chance",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.2,
	},
	{
		id: "grains",
		group: "grains",
		label: "Grains",
		min: 1,
		max: 64,
		step: 1,
		defaultValue: 32,
	},
	{
		id: "jitter",
		group: "grains",
		label: "Jitter",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.5,
	},
	{
		id: "detune",
		group: "grains",
		label: "Detune",
		min: 0,
		max: 12,
		step: 0.01,
		unit: "st",
		defaultValue: 0.3,
	},
	{
		id: "width",
		group: "grains",
		label: "Width",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.8,
	},
	{
		id: "gain",
		group: "grains",
		label: "Gain",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.7,
	},
	{
		id: "delayTime",
		group: "delay",
		label: "Time",
		min: 1,
		max: 2000,
		step: 1,
		unit: "ms",
		defaultValue: 350,
	},
	{
		id: "delayFeedback",
		group: "delay",
		label: "Feedback",
		min: 0,
		max: 0.95,
		step: 0.001,
		defaultValue: 0.4,
	},
	{
		id: "delayTone",
		group: "delay",
		label: "Tone",
		min: 200,
		max: 18000,
		step: 1,
		unit: "Hz",
		defaultValue: 4000,
	},
	{
		id: "delayMix",
		group: "delay",
		label: "Mix",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.35,
	},
	{
		id: "reverbDecay",
		group: "reverb",
		label: "Decay",
		min: 0.5,
		max: 30,
		step: 0.1,
		unit: "s",
		defaultValue: 8,
	},
	{
		id: "reverbSize",
		group: "reverb",
		label: "Size",
		min: 0.3,
		max: 2,
		step: 0.01,
		defaultValue: 1,
	},
	{
		id: "reverbDamping",
		group: "reverb",
		label: "Damping",
		min: 500,
		max: 16000,
		step: 1,
		unit: "Hz",
		defaultValue: 4000,
	},
	{
		id: "reverbMix",
		group: "reverb",
		label: "Mix",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.4,
	},
	{
		id: "volume",
		group: "master",
		label: "Volume",
		min: 0,
		max: 1,
		step: 0.001,
		defaultValue: 0.8,
	},
];

/**
 * What drives a target, from any input: a control change, or for switches
 * also a note. Channels are 1-indexed, like MidiMessage.channel.
 */
export type MidiMapping =
	| { channel: number; controller: number }
	| { channel: number; note: number };

type ParamValues = Record<GrantulatorParamId, number>;

export interface GrantulatorState {
	values: ParamValues;
	delayEnabled: boolean;
	reverbEnabled: boolean;
	/** Silences the output; the patch keeps running. */
	muted: boolean;
	intervalSet: IntervalSetId;
	mappings: Partial<Record<MappingTarget, MidiMapping>>;
	/** Parameter waiting for the next control change to map it. */
	learning: MappingTarget | null;
	setValue: (id: GrantulatorParamId, value: number) => void;
	setSwitch: (id: SwitchId, on: boolean) => void;
	setIntervalSet: (id: IntervalSetId) => void;
	setMapping: (id: MappingTarget, mapping: MidiMapping) => void;
	clearMapping: (id: MappingTarget) => void;
	setLearning: (id: MappingTarget | null) => void;
	/** Learn or apply an incoming control change. */
	handleControlChange: (
		channel: number,
		controller: number,
		value: number,
	) => void;
	/** Learn or apply an incoming note on: toggles the switches it drives. */
	handleNoteOn: (channel: number, note: number) => void;
	reset: () => void;
}

const defaultValues = () =>
	Object.fromEntries(
		GRANTULATOR_PARAMS.map((p) => [p.id, p.defaultValue]),
	) as ParamValues;

const SWITCHES: SwitchId[] = ["delayEnabled", "reverbEnabled", "muted"];

const defaults = () => ({
	values: defaultValues(),
	delayEnabled: false,
	reverbEnabled: true,
	muted: false,
	intervalSet: "fifths" as IntervalSetId,
});

const sameMapping = (a: MidiMapping, b: MidiMapping) =>
	a.channel === b.channel &&
	("note" in a
		? "note" in b && a.note === b.note
		: "controller" in b && a.controller === b.controller);

const isSwitch = (id: MappingTarget): id is SwitchId =>
	(SWITCHES as MappingTarget[]).includes(id);

export const useGrantulatorStore = create<GrantulatorState>()(
	devtools(
		persist(
			(set, get) => ({
				...defaults(),
				mappings: {},
				learning: null,
				setValue: (id, value) =>
					set((state) => ({ values: { ...state.values, [id]: value } })),
				setSwitch: (id, on) => set({ [id]: on }),
				setIntervalSet: (id) => set({ intervalSet: id }),
				// One control change drives one parameter: learning it again
				// moves it over.
				setMapping: (id, mapping) =>
					set((state) => {
						const mappings = Object.fromEntries(
							Object.entries(state.mappings).filter(
								([, m]) => m && !sameMapping(m, mapping),
							),
						);
						return { mappings: { ...mappings, [id]: mapping } };
					}),
				clearMapping: (id) =>
					set((state) => {
						const { [id]: _, ...mappings } = state.mappings;
						return { mappings };
					}),
				setLearning: (id) => set({ learning: id }),
				handleControlChange: (channel, controller, value) => {
					const { learning, mappings, setMapping, setValue, setSwitch } = get();
					if (learning) {
						setMapping(learning, { channel, controller });
						set({ learning: null });
						return;
					}
					for (const param of GRANTULATOR_PARAMS) {
						const mapping = mappings[param.id];
						if (!mapping || !sameMapping(mapping, { channel, controller }))
							continue;
						setValue(
							param.id,
							param.min + (value / 127) * (param.max - param.min),
						);
					}
					// Like a sustain pedal: 64 and up is on.
					for (const id of SWITCHES) {
						const mapping = mappings[id];
						if (mapping && sameMapping(mapping, { channel, controller })) {
							setSwitch(id, value >= 64);
						}
					}
				},
				handleNoteOn: (channel, note) => {
					const { learning, mappings, setMapping, setSwitch } = get();
					// Sliders need a control change: a note has no position.
					if (learning) {
						if (!isSwitch(learning)) return;
						setMapping(learning, { channel, note });
						set({ learning: null });
						return;
					}
					// Like a pad: every press flips the switch.
					for (const id of SWITCHES) {
						const mapping = mappings[id];
						if (mapping && sameMapping(mapping, { channel, note })) {
							setSwitch(id, !get()[id]);
						}
					}
				},
				reset: () => set({ ...defaults(), mappings: {}, learning: null }),
			}),
			{
				name: "grantulator-storage",
				// Not `muted`: a page that comes back silent looks broken.
				partialize: (state) => ({
					values: state.values,
					delayEnabled: state.delayEnabled,
					reverbEnabled: state.reverbEnabled,
					intervalSet: state.intervalSet,
					mappings: state.mappings,
				}),
				// Parameters added since the last visit keep their defaults.
				merge: (persisted, current) => {
					const saved = persisted as Partial<GrantulatorState> | undefined;
					return {
						...current,
						...saved,
						values: { ...current.values, ...saved?.values },
					};
				},
			},
		),
		{ name: "GrantulatorStore" },
	),
);
