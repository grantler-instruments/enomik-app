import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
	type DeviceKind,
	supportsGlobals,
	supportsLiveValues,
	type ThresholdUnit,
	thresholdUnit,
	useDeviceStore,
} from "./device";
import {
	beginSysexErrorCollection,
	beginWaitForResetAck,
	type MidiMessage,
	type SysexErrorEvent,
	takeSysexErrors,
	useMIDIStore,
} from "./midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_ADD_PEER,
	ENOMIK_COMMAND_RESET,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK,
	ENOMIK_COMMAND_SET_NAME,
	ENOMIK_COMMAND_SET_PIN_CONFIG,
	ENOMIK_COMMAND_SET_POWER_SAVE,
	MIDI_CONTROL_CHANGE,
	type MIDI_NOTE_OFF,
	type MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
	type MIDI_POLY_AFTERTOUCH,
	type MIDI_PROGRAM_CHANGE,
	sanitizeClientName,
	type sysexPinModeAnalogIn,
	type sysexPinModeDigitalIn,
	type sysexPinModeDigitalInPullup,
	type sysexPinModeDigitalOut,
	type sysexPinModePWMOut,
	sysexPinModeTouch,
} from "./midi.config";

export type MidiType =
	| typeof MIDI_NOTE_ON
	| typeof MIDI_NOTE_OFF
	| typeof MIDI_CONTROL_CHANGE
	| typeof MIDI_PROGRAM_CHANGE
	| typeof MIDI_PITCH_BEND
	| typeof MIDI_POLY_AFTERTOUCH;

export type PinMode =
	| typeof sysexPinModeDigitalIn
	| typeof sysexPinModeAnalogIn
	| typeof sysexPinModeAnalogIn
	| typeof sysexPinModeDigitalInPullup
	| typeof sysexPinModePWMOut
	| typeof sysexPinModeTouch;
export type OutputPinMode =
	| typeof sysexPinModeDigitalOut
	| typeof sysexPinModePWMOut;

export interface InputPinConfig {
	uuid: string;
	pin: number;
	mode: PinMode;
	channel: number;
	midiType: MidiType;
	midiMin: number;
	midiMax: number;
	pinMin: number;
	pinMax: number;
	controller?: number;
	note?: number;
	threshold?: number;
	thresholdUnit?: ThresholdUnit;
}

export interface OutputPinConfig {
	uuid: string;
	pin: number;
	mode: OutputPinMode;
	midiType: MidiType;
	midiMin: number;
	midiMax: number;
	pinMin: number;
	pinMax: number;
	channel: number;
	controller?: number;
	note?: number;
	velocitySensitive?: boolean;
	threshold?: number;
}

export interface PeerConfig {
	uuid: string;
	macAddress: string;
}

interface IOState {
	inputs: InputPinConfig[];
	outputs: OutputPinConfig[];
	peers: PeerConfig[];
	midiLoopback: boolean;
	powerSave: boolean;
	/** Client name override; empty = keep the name the firmware sets. */
	name: string;

	addInput: (input: Omit<InputPinConfig, "uuid">) => void;
	updateInput: (uuid: string, patch: Partial<InputPinConfig>) => void;
	removeInput: (uuid: string) => void;
	duplicateInput: (uuid: string) => void;

	addOutput: (output: Omit<OutputPinConfig, "uuid">) => void;
	updateOutput: (uuid: string, patch: Partial<OutputPinConfig>) => void;
	removeOutput: (uuid: string) => void;
	duplicateOutput: (uuid: string) => void;

	addPeer: (peer: Omit<PeerConfig, "uuid">) => void;
	updatePeer: (uuid: string, patch: Partial<PeerConfig>) => void;
	removePeer: (uuid: string) => void;

	setMidiLoopback: (enabled: boolean) => void;
	setPowerSave: (enabled: boolean) => void;
	setName: (name: string) => void;

	saveToFile: () => void;
	loadFromFile: (json: {
		/** Written by saveToFile since client and dongle configs are separate. */
		kind?: DeviceKind;
		inputs?: Array<Omit<InputPinConfig, "uuid"> & { uuid?: string }>;
		outputs?: Array<Omit<OutputPinConfig, "uuid"> & { uuid?: string }>;
		peers?: Array<Omit<PeerConfig, "uuid"> & { uuid?: string }>;
		midiLoopback?: boolean;
		powerSave?: boolean;
		name?: string;
	}) => void;

	/** A dongle only takes peers: RESET, then ADD_PEER per peer. */
	deploy: (
		deviceId: string,
		kind?: DeviceKind,
	) => Promise<{
		resetAck: boolean;
		sysexErrors: SysexErrorEvent[];
		nameSkipped: boolean;
		globalsSkipped: boolean;
	}>;
}

/** Nonzero thresholds cannot be silently reinterpreted across firmware generations. */
export function thresholdsNeedReview(
	inputs: Pick<InputPinConfig, "mode" | "threshold" | "thresholdUnit">[],
	unit?: ThresholdUnit,
) {
	return inputs.some(
		(input) =>
			input.mode === sysexPinModeTouch &&
			!!input.threshold &&
			(!unit || input.thresholdUnit !== unit),
	);
}

/**
 * Pin numbers used by more than one config, inputs and outputs together.
 * The firmware keeps one config per pin, so a second row would overwrite the first.
 */
export const findDuplicatePins = (
	inputs: { pin: number }[],
	outputs: { pin: number }[],
): Set<number> => {
	const seen = new Set<number>();
	const duplicates = new Set<number>();
	for (const { pin } of [...inputs, ...outputs]) {
		if (seen.has(pin)) duplicates.add(pin);
		seen.add(pin);
	}
	return duplicates;
};

/** Lowest pin >= `from` that no input or output uses yet. */
export const nextFreePin = (
	inputs: { pin: number }[],
	outputs: { pin: number }[],
	from = 0,
): number => {
	const used = new Set([...inputs, ...outputs].map((c) => c.pin));
	let pin = Math.max(0, from);
	while (used.has(pin)) pin++;
	return pin;
};

/** Pin numbers used more than once (see findDuplicatePins). */
export const useConflictingPins = (): Set<number> => {
	const inputs = useIOStore((s) => s.inputs);
	const outputs = useIOStore((s) => s.outputs);
	return findDuplicatePins(inputs, outputs);
};

const createIOStore = (name: string, kind: DeviceKind) =>
	create<IOState>()(
		devtools(
			persist(
				(set, get) => ({
					inputs: [],
					outputs: [],
					peers: [],
					midiLoopback: false,
					powerSave: false,
					name: "",

					addInput: (input) =>
						set((state) => ({
							inputs: [...state.inputs, { ...input, uuid: uuidv4() }],
						})),

					updateInput: (uuid, patch) =>
						set((state) => ({
							inputs: state.inputs.map((i) =>
								i.uuid === uuid ? { ...i, ...patch } : i,
							),
						})),

					removeInput: (uuid) =>
						set((state) => ({
							inputs: state.inputs.filter((i) => i.uuid !== uuid),
						})),
					duplicateInput: (uuid) =>
						set((state) => {
							const input = state.inputs.find((i) => i.uuid === uuid);
							if (!input) return state;

							const newInput = {
								...input,
								uuid: uuidv4(),
								pin: nextFreePin(state.inputs, state.outputs, input.pin + 1),
							};
							return {
								inputs: [...state.inputs, newInput],
							};
						}),

					// ---------- OUTPUTS ----------
					addOutput: (output) =>
						set((state) => ({
							outputs: [...state.outputs, { ...output, uuid: uuidv4() }],
						})),

					updateOutput: (uuid, patch) => {
						set((state) => ({
							outputs: state.outputs.map((o) =>
								o.uuid === uuid ? { ...o, ...patch } : o,
							),
						}));
					},

					removeOutput: (uuid) =>
						set((state) => ({
							outputs: state.outputs.filter((o) => o.uuid !== uuid),
						})),
					duplicateOutput: (uuid) =>
						set((state) => {
							const output = state.outputs.find((o) => o.uuid === uuid);
							if (!output) return state;

							const newOutput = {
								...output,
								uuid: uuidv4(),
								pin: nextFreePin(state.inputs, state.outputs, output.pin + 1),
							};
							return {
								outputs: [...state.outputs, newOutput],
							};
						}),

					// ---------- FILE SAVE ----------
					saveToFile: () =>
						set((state) => {
							// A dongle only has peers
							const data =
								kind === "dongle"
									? { kind, peers: state.peers }
									: {
											kind,
											inputs: state.inputs,
											outputs: state.outputs,
											peers: state.peers,
											midiLoopback: state.midiLoopback,
											powerSave: state.powerSave,
											name: state.name,
										};
							const dataStr = JSON.stringify(data, null, 2);

							const blob = new Blob([dataStr], { type: "application/json" });
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");

							a.href = url;
							a.download = `io-config-${kind}.json`;
							a.click();

							URL.revokeObjectURL(url);
							return state;
						}),

					// ---------- FILE LOAD ----------
					loadFromFile: (json) => {
						const inputs = (json.inputs || []).map((i) => ({
							...i,
							uuid: i.uuid || uuidv4(),
						}));

						const outputs = (json.outputs || []).map((o) => ({
							...o,
							uuid: o.uuid || uuidv4(),
						}));

						const peers = (json.peers || []).map((p) => ({
							...p,
							uuid: p.uuid || uuidv4(),
						}));

						set(() => ({
							inputs,
							outputs,
							peers,
							midiLoopback: json.midiLoopback ?? false,
							powerSave: json.powerSave ?? false,
							name: sanitizeClientName(json.name ?? ""),
						}));
					},

					addPeer: (peer) =>
						set((state) => ({
							peers: [...state.peers, { ...peer, uuid: uuidv4() }],
						})),

					updatePeer: (uuid: string, patch: Partial<PeerConfig>) =>
						set((state) => ({
							peers: state.peers.map((p) =>
								p.uuid === uuid ? { ...p, ...patch } : p,
							),
						})),

					removePeer: (uuid: string) =>
						set((state) => ({
							peers: state.peers.filter((p) => p.uuid !== uuid),
						})),

					setMidiLoopback: (enabled: boolean) =>
						set(() => ({ midiLoopback: enabled })),

					setPowerSave: (enabled: boolean) =>
						set(() => ({ powerSave: enabled })),

					setName: (name: string) =>
						set(() => ({ name: sanitizeClientName(name) })),

					deploy: async (deviceId: string, kind: DeviceKind = "client") => {
						const isDongle = kind === "dongle";
						const outputId = !deviceId || deviceId === "" ? "-1" : deviceId;
						const info = useDeviceStore.getState().devices[outputId];
						if (info?.status === "incompatible")
							throw new Error("compat_incompatible");
						if (
							!isDongle &&
							thresholdsNeedReview(
								get().inputs,
								info?.status === "ready"
									? thresholdUnit(info.version)
									: undefined,
							)
						)
							throw new Error("compat_threshold_review");
						beginSysexErrorCollection(outputId);

						// Register before sending: USB devices can acknowledge synchronously.
						const resetWait =
							outputId !== "-1"
								? beginWaitForResetAck(outputId, 5000)
								: Promise.resolve(true);
						// first reset — firmware sends RESET_RESPONSE (0x49) when done
						const resetMessage: MidiMessage = {
							id: uuidv4(),
							timestamp: Date.now(),
							type: 240,
							data: buildEnomikSysex(ENOMIK_COMMAND_RESET),
						};
						useMIDIStore.getState().sendMessage(resetMessage, outputId);

						const resetAck = await resetWait;

						const mapPitchBendTo7Bit = (value: number) => {
							// Clamp value to valid pitch bend range
							const clamped = Math.max(-8192, Math.min(8191, value));
							// Map -8192 to +8191 → 0 to 127
							return Math.round(((clamped + 8192) / 16383) * 127);
						};

						// set inputs
						(isDongle ? [] : get().inputs).forEach((input) => {
							const msg: MidiMessage = {
								id: uuidv4(),
								timestamp: Date.now(),
								type: 240,
								data: buildEnomikSysex(ENOMIK_COMMAND_SET_PIN_CONFIG, [
									input.pin,
									input.mode,
									// SysEx data byte; touch threshold is % (0–127) since firmware 0.19
									Math.max(0, Math.min(127, input.threshold || 0)),
									input.channel || 1,
									input.midiType / 2,
									input.midiType === MIDI_CONTROL_CHANGE
										? (input.controller ?? 0)
										: (input.note ?? 0),
									input.midiType === MIDI_PITCH_BEND
										? mapPitchBendTo7Bit(input.midiMin)
										: input.midiMin,
									input.midiType === MIDI_PITCH_BEND
										? mapPitchBendTo7Bit(input.midiMax)
										: input.midiMax,
								]),
							};
							useMIDIStore.getState().sendMessage(msg, outputId);
						});

						// set outputs
						(isDongle ? [] : get().outputs).forEach((output) => {
							const noteOrCC =
								output.midiType === MIDI_CONTROL_CHANGE
									? (output.controller ?? 0)
									: (output.note ?? 0);

							const msg: MidiMessage = {
								id: uuidv4(),
								timestamp: Date.now(),
								type: 240,
								data: buildEnomikSysex(ENOMIK_COMMAND_SET_PIN_CONFIG, [
									output.pin,
									output.mode,
									output.threshold || 0,
									output.channel || 1,
									output.midiType / 2,
									noteOrCC,
									output.midiType === MIDI_PITCH_BEND
										? mapPitchBendTo7Bit(output.midiMin)
										: output.midiMin,
									output.midiType === MIDI_PITCH_BEND
										? mapPitchBendTo7Bit(output.midiMax)
										: output.midiMax,
								]),
							};
							useMIDIStore.getState().sendMessage(msg, outputId);
						});

						// set peers
						get().peers.forEach((peer) => {
							const macParts = peer.macAddress
								.replace(/:/g, "") // Remove colons: "ABCDEF123456"
								.split("") // Split into chars: ['A','B','C','D','E','F','1','2','3','4','5','6']
								.map((digit) => parseInt(digit, 16)); // This converts strings to numbers!

							const msg: MidiMessage = {
								id: uuidv4(),
								timestamp: Date.now(),
								type: 240,
								data: buildEnomikSysex(ENOMIK_COMMAND_ADD_PEER, macParts),
							};
							useMIDIStore.getState().sendMessage(msg, outputId);
						});

						// Only send global settings when the selected firmware supports them.
						const globalsSkipped =
							!isDongle &&
							info?.status === "ready" &&
							!supportsGlobals(info.version);
						// MIDI loopback (RESET clears it on device — must re-apply)
						if (!isDongle && !globalsSkipped) {
							const msg: MidiMessage = {
								id: uuidv4(),
								timestamp: Date.now(),
								type: 240,
								data: buildEnomikSysex(ENOMIK_COMMAND_SET_MIDI_LOOPBACK, [
									get().midiLoopback ? 1 : 0,
								]),
							};
							useMIDIStore.getState().sendMessage(msg, outputId);
						}

						// Power save (RESET clears it on device — must re-apply)
						if (!isDongle && !globalsSkipped) {
							const msg: MidiMessage = {
								id: uuidv4(),
								timestamp: Date.now(),
								type: 240,
								data: buildEnomikSysex(ENOMIK_COMMAND_SET_POWER_SAVE, [
									get().powerSave ? 1 : 0,
								]),
							};
							useMIDIStore.getState().sendMessage(msg, outputId);
						}

						// Client name requires confirmed firmware support.
						const nameSkipped =
							!isDongle &&
							!!get().name &&
							!(info?.status === "ready" && supportsLiveValues(info.version));
						if (!isDongle && get().name && !nameSkipped) {
							const msg: MidiMessage = {
								id: uuidv4(),
								timestamp: Date.now(),
								type: 240,
								data: buildEnomikSysex(
									ENOMIK_COMMAND_SET_NAME,
									Array.from(get().name, (c) => c.charCodeAt(0)),
								),
							};
							useMIDIStore.getState().sendMessage(msg, outputId);
						}

						// Allow async 0x7F replies (e.g. unknown_command on older firmware)
						await new Promise((resolve) => setTimeout(resolve, 400));
						const sysexErrors = takeSysexErrors();
						return { resetAck, sysexErrors, nameSkipped, globalsSkipped };
					},
				}),
				{ name },
			),
		),
	);

/** Client config: pins, globals, name and peers. */
export const useIOStore = createIOStore("IOStore", "client");
/** Dongle config, kept apart from the client's: only its peers are used. */
export const useDongleIOStore = createIOStore("DongleIOStore", "dongle");
export type IOStore = typeof useIOStore;
