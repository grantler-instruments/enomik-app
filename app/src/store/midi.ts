import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { MIDI_STATUS } from "../utils/midi";
import {
	type DeviceKind,
	isCompatibleFirmware,
	pairedInputId,
	thresholdUnit,
	useDeviceStore,
} from "./device";
import { useInspectorStore } from "./inspector";
import {
	buildEnomikSysex,
	decodeSeptets32,
	ENOMIK_COMMAND_ADD_PEER_RESPONSE,
	ENOMIK_COMMAND_ERROR_RESPONSE,
	ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE,
	ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS_RESPONSE,
	ENOMIK_COMMAND_GET_CONFIG,
	ENOMIK_COMMAND_GET_CONFIG_RESPONSE,
	ENOMIK_COMMAND_GET_MAC,
	ENOMIK_COMMAND_GET_MAC_RESPONSE,
	ENOMIK_COMMAND_GET_MIDI_LOOPBACK_RESPONSE,
	ENOMIK_COMMAND_GET_NAME_RESPONSE,
	ENOMIK_COMMAND_GET_PEER_RESPONSE,
	ENOMIK_COMMAND_GET_PIN_CONFIG_RESPONSE,
	ENOMIK_COMMAND_GET_POWER_SAVE_RESPONSE,
	ENOMIK_COMMAND_GET_VERSION,
	ENOMIK_COMMAND_GET_VERSION_RESPONSE,
	ENOMIK_COMMAND_RAW_VALUE,
	ENOMIK_COMMAND_RESET_RESPONSE,
	ENOMIK_COMMAND_SET_NAME_RESPONSE,
	ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE,
	ENOMIK_COMMAND_SET_RAW_STREAM,
	ENOMIK_COMMAND_SET_RAW_STREAM_RESPONSE,
	ENOMIK_ERROR_NAMES,
	ENOMIK_ERROR_NOT_READY,
	ENOMIK_PEER_ENTRY_PAYLOAD_SIZE,
	ENOMIK_PIN_CONFIG_PAYLOAD_SIZE,
	ENOMIK_RAW_VALUE_PAYLOAD_SIZE,
	ESP_NOW_VERSION_MAJOR,
	isOutputPinMode,
	nibblesToMacString,
	sysexManufacturerId,
} from "./midi.config";
import { useRawStreamStore } from "./rawStream";

export interface MidiMessage {
	id: string;
	timestamp: number;
	type: number;
	note?: number;
	controller?: number;
	value?: number;
	pitchBendValue?: number;
	velocity?: number;
	channel?: number;
	data?: number[];
}

export interface MidiMessageWithDirectionAndDevice extends MidiMessage {
	incoming: boolean;
	deviceId: string;
}

interface MonitorState {
	initialized: boolean;
	messages: MidiMessageWithDirectionAndDevice[];
	inputs: any[];
	outputs: any[];
	activeInputs: string[];
	selectedConfiguratorOutputDevice?: string;
	selectedInspectorOutputDevice?: string;
	selectedComposerOutputDevice?: string;
	// MIDI Composer (persists across route/tab changes)
	composerChannel: number;
	composerType: number;
	composerNoteOrCc: number;
	composerVelocityOrValue: number;
	composerPitchBendValue: number;
	composerSysexData: string;
	composerManufacturerId: string;
	init: () => void;
	addIncomingMessage: (message: MidiMessage, deviceId: string) => void;
	addOutgoingMessage: (message: MidiMessage, deviceId: string) => void;
	clear: () => void;
	sendMessage: (message: MidiMessage, outputId?: string) => boolean;
	setSelectedConfiguratorOutputDevice: (deviceId: string) => void;
	setSelectedInspectorOutputDevice: (deviceId: string) => void;
	setSelectedComposerOutputDevice: (deviceId: string) => void;
	setComposerChannel: (value: number) => void;
	setComposerType: (value: number) => void;
	setComposerNoteOrCc: (value: number) => void;
	setComposerVelocityOrValue: (value: number) => void;
	setComposerPitchBendValue: (value: number) => void;
	setComposerSysexData: (value: string) => void;
	setComposerManufacturerId: (value: string) => void;
}

/** Max rows kept in the MIDI monitor; oldest dropped first (FIFO at the tail). */
export const MIDI_MONITOR_MAX_MESSAGES = 500;

let midiAccess: MIDIAccess | null = null;

export const isEnomikPortName = (name: string | null | undefined) =>
	typeof name === "string" && /enomik/i.test(name);

const findEnomikOutputId = (outputs: { id: string; name?: string | null }[]) =>
	outputs.find((out) => isEnomikPortName(out.name))?.id;

/** Input/output pairing is deliberately conservative when multiple boards share names. */
export function deviceInputId(outputId: string): string | undefined {
	const state = useMIDIStore.getState();
	return pairedInputId(outputId, state.inputs, state.outputs);
}

const versionRequests = new Map<string, ReturnType<typeof setTimeout>>();
const sessionInputs = new Map<string, string>();
export function inspectDeviceVersion(outputId: string, retry = false) {
	if (!outputId || outputId === "-1" || !midiAccess) return;
	const store = useDeviceStore.getState();
	if (
		!retry &&
		store.devices[outputId] &&
		store.devices[outputId].status !== "unpaired"
	)
		return;
	const previous = versionRequests.get(outputId);
	if (previous) clearTimeout(previous);
	const inputId = deviceInputId(outputId);
	if (!inputId) {
		store.setDevice(outputId, { status: "unpaired" });
		return;
	}
	sessionInputs.set(outputId, inputId);
	store.setDevice(outputId, { status: "checking" });
	versionRequests.set(
		outputId,
		setTimeout(() => {
			// Before 0.13 GET_VERSION may not be wired up. GET_MAC is read-only,
			// and its response header contains the same major/minor version.
			versionRequests.set(
				outputId,
				setTimeout(() => {
					versionRequests.delete(outputId);
					store.setDevice(outputId, { status: "timeout" });
				}, 1500),
			);
			useMIDIStore.getState().sendMessage(
				{
					id: uuidv4(),
					timestamp: Date.now(),
					type: 240,
					data: buildEnomikSysex(ENOMIK_COMMAND_GET_MAC),
				},
				outputId,
			);
		}, 1500),
	);
	useMIDIStore.getState().sendMessage(
		{
			id: uuidv4(),
			timestamp: Date.now(),
			type: 240,
			data: buildEnomikSysex(ENOMIK_COMMAND_GET_VERSION),
		},
		outputId,
	);
}

function clearDeviceSession(outputId: string) {
	sessionInputs.delete(outputId);
	clearTimeout(versionRequests.get(outputId));
	versionRequests.delete(outputId);
	useDeviceStore.getState().removeDevice(outputId);
	if (useRawStreamStore.getState().deviceId === outputId) {
		useRawStreamStore.getState().setActive(false);
		useRawStreamStore.getState().clear();
	}
	if (useInspectorStore.getState().deviceId === outputId)
		useInspectorStore.getState().clear();
	if (pendingConfigLoad?.outputId === outputId) resolveConfigLoad(null);
	if (pendingResetAck?.outputId === outputId) pendingResetAck.finish(false);
}

/** Batch rapid MIDI events to one React update per frame (e.g. clock spam). */
let monitorMessageBatch: MidiMessageWithDirectionAndDevice[] = [];
let monitorFlushRaf: number | null = null;

function flushMonitorBatch(
	set: (fn: (state: MonitorState) => Partial<MonitorState>) => void,
) {
	monitorFlushRaf = null;
	const batch = monitorMessageBatch;
	monitorMessageBatch = [];
	if (batch.length === 0) return;
	set((state) => ({
		messages: [...batch.reverse(), ...state.messages].slice(
			0,
			MIDI_MONITOR_MAX_MESSAGES,
		),
	}));
}

function queueMonitorMessage(
	set: (fn: (state: MonitorState) => Partial<MonitorState>) => void,
	entry: MidiMessageWithDirectionAndDevice,
) {
	monitorMessageBatch.push(entry);
	if (monitorFlushRaf === null) {
		monitorFlushRaf = requestAnimationFrame(() => flushMonitorBatch(set));
	}
}

/** Resolves when matching RESET_RESPONSE (0x49) SysEx arrives on an input with the same name as the output. */
type PendingResetAck = {
	outputId: string;
	inputId: string;
	finish: (ok: boolean) => void;
	timeoutId: ReturnType<typeof setTimeout>;
};

let pendingResetAck: PendingResetAck | null = null;

export function beginWaitForResetAck(
	outputId: string,
	timeoutMs: number,
): Promise<boolean> {
	return new Promise((resolve) => {
		if (!midiAccess || outputId === "-1") {
			resolve(true);
			return;
		}
		const out = Array.from(midiAccess.outputs.values()).find(
			(o) => o.id === outputId,
		);
		if (!out) {
			resolve(false);
			return;
		}
		if (pendingResetAck) {
			clearTimeout(pendingResetAck.timeoutId);
			pendingResetAck.finish(false);
		}
		const inputId = deviceInputId(outputId);
		if (!inputId) {
			resolve(false);
			return;
		}
		const timeoutId = setTimeout(() => {
			if (pendingResetAck?.outputId === outputId) {
				pendingResetAck = null;
				resolve(false);
			}
		}, timeoutMs);
		pendingResetAck = {
			outputId,
			inputId,
			finish: (ok) => {
				clearTimeout(timeoutId);
				if (pendingResetAck?.outputId === outputId) {
					pendingResetAck = null;
					resolve(ok);
				}
			},
			timeoutId,
		};
	});
}

/** Board snapshot accumulated from a GET_CONFIG (0x0C) response stream. */
export type LoadedDeviceConfig = {
	inputs: Array<{
		pin: number;
		mode: number;
		threshold?: number;
		thresholdUnit?: "raw" | "percent";
		channel: number;
		midiType: number;
		controller?: number;
		note?: number;
		midiMin: number;
		midiMax: number;
		pinMin: number;
		pinMax: number;
	}>;
	outputs: Array<{
		pin: number;
		mode: number;
		threshold?: number;
		thresholdUnit?: "raw" | "percent";
		channel: number;
		midiType: number;
		controller?: number;
		note?: number;
		midiMin: number;
		midiMax: number;
		pinMin: number;
		pinMax: number;
	}>;
	peers: Array<{ macAddress: string }>;
	midiLoopback: boolean | null;
	powerSave: boolean | null;
	/** Effective client name; null if the firmware predates GET_NAME. */
	name: string | null;
	/**
	 * Set by a GET_CONFIG load: a client streams its config, a dongle answers
	 * NOT_READY (it has no config handler). Unset for a peers-only load.
	 */
	firmware?: DeviceKind;
};

/** Which stream end finishes a load: GET_CONFIG (client) or GET_ALL_PEERS (dongle). */
export type ConfigLoadEnd = "config" | "peers";

type PendingConfigLoad = {
	outputId: string;
	inputId: string;
	until: ConfigLoadEnd;
	inputs: LoadedDeviceConfig["inputs"];
	outputs: LoadedDeviceConfig["outputs"];
	peers: string[];
	midiLoopback: boolean | null;
	powerSave: boolean | null;
	name: string | null;
	finish: (result: LoadedDeviceConfig | null) => void;
	timeoutId: ReturnType<typeof setTimeout>;
};

let pendingConfigLoad: PendingConfigLoad | null = null;

function resolveConfigLoad(result: LoadedDeviceConfig | null) {
	if (!pendingConfigLoad) return;
	const pending = pendingConfigLoad;
	pendingConfigLoad = null;
	clearTimeout(pending.timeoutId);
	pending.finish(result);
}

function finishConfigLoad(pending: PendingConfigLoad, firmware?: DeviceKind) {
	resolveConfigLoad({
		firmware,
		inputs: pending.inputs,
		outputs: pending.outputs,
		peers: pending.peers.map((macAddress) => ({ macAddress })),
		midiLoopback: pending.midiLoopback,
		powerSave: pending.powerSave,
		name: pending.name,
	});
}

export type SysexErrorEvent = {
	failedRequest: number;
	errorCode: number;
	major: number;
	minor: number;
	context?: number;
};

let sysexErrorCollection: SysexErrorEvent[] | null = null;
let sysexErrorOutputId: string | undefined;

/** Start collecting SysEx 0x7F errors (clears any prior buffer). */
export function beginSysexErrorCollection(outputId?: string) {
	sysexErrorOutputId = outputId;
	sysexErrorCollection = [];
}

/** Return collected errors and stop collecting. */
export function takeSysexErrors(): SysexErrorEvent[] {
	const errors = sysexErrorCollection ?? [];
	sysexErrorCollection = null;
	return errors;
}

/**
 * Resolves when the matching device ends the stream: empty GET_CONFIG_RESPONSE
 * (0x4C), or empty GET_ALL_PEERS_RESPONSE (0x48) with `until = "peers"`.
 */
export function beginWaitForConfigLoad(
	outputId: string,
	timeoutMs: number,
	until: ConfigLoadEnd = "config",
): Promise<LoadedDeviceConfig | null> {
	return new Promise((resolve) => {
		if (!midiAccess || outputId === "-1") {
			resolve(null);
			return;
		}
		const out = Array.from(midiAccess.outputs.values()).find(
			(o) => o.id === outputId,
		);
		if (!out) {
			resolve(null);
			return;
		}
		if (pendingConfigLoad) {
			resolveConfigLoad(null);
		}
		const inputId = deviceInputId(outputId);
		if (!inputId) {
			resolve(null);
			return;
		}
		const timeoutId = setTimeout(() => {
			if (pendingConfigLoad?.outputId === outputId) {
				pendingConfigLoad = null;
				resolve(null);
			}
		}, timeoutMs);
		pendingConfigLoad = {
			outputId,
			inputId,
			until,
			inputs: [],
			outputs: [],
			peers: [],
			midiLoopback: null,
			powerSave: null,
			name: null,
			finish: (result) => resolve(result),
			timeoutId,
		};
	});
}

function matchesPendingDevice(inputId: string): boolean {
	return !!pendingConfigLoad && pendingConfigLoad.inputId === inputId;
}

const setupInputHandler = (input: MIDIInput, get: () => MonitorState) => {
	input.onmidimessage = (event) => {
		if (!event.data || event.data.length === 0) return;

		const [status, data1, data2] = event.data;
		const channel = (status & 0x0f) + 1; // Convert to 1-indexed
		const messageType = status & 0xf0;

		const message = {
			id: uuidv4(),
			timestamp: event.timeStamp,
			type: messageType,
			channel,
		};

		switch (messageType) {
			case MIDI_STATUS.CONTROL_CHANGE:
				get().addIncomingMessage(
					{
						...message,
						controller: data1,
						value: data2,
					},
					input.id,
				);
				break;

			case MIDI_STATUS.NOTE_ON:
				if (data2 > 0) {
					// Velocity > 0 means note on
					get().addIncomingMessage(
						{
							...message,
							note: data1,
							velocity: data2,
						},
						input.id,
					);
				} else {
					// Velocity = 0 is sometimes used as note off
					get().addIncomingMessage(
						{
							...message,
							note: data1,
							velocity: data2,
						},
						input.id,
					);
				}
				break;

			case MIDI_STATUS.NOTE_OFF:
				get().addIncomingMessage(
					{
						...message,
						note: data1,
						velocity: data2,
					},
					input.id,
				);
				break;

			case MIDI_STATUS.PROGRAM_CHANGE:
				get().addIncomingMessage(
					{
						...message,
						controller: data1,
					},
					input.id,
				);
				break;

			case MIDI_STATUS.START:
			case MIDI_STATUS.STOP:
			case MIDI_STATUS.CONTINUE:
			case MIDI_STATUS.TIMING_CLOCK:
				get().addIncomingMessage(
					{
						...message,
					},
					input.id,
				);
				break;

			case MIDI_STATUS.PITCH_BEND: {
				// Combine LSB and MSB into 14-bit value (0-16383)
				console.log("got pitchbend");
				const rawValue = data1 | (data2 << 7);
				get().addIncomingMessage(
					{
						...message,
						pitchBendValue: rawValue, // - 8192, // Center at 0
					},
					input.id,
				);
				break;
			}
			case MIDI_STATUS.CHANNEL_PRESSURE: {
				get().addIncomingMessage(
					{
						...message,
						value: data1,
					},
					input.id,
				);
				break;
			}
			case MIDI_STATUS.POLY_PRESSURE: {
				get().addIncomingMessage(
					{
						...message,
						note: data1,
						value: data2,
					},
					input.id,
				);
				break;
			}

			case MIDI_STATUS.SYSEX_START:
				if (event.data[1] === sysexManufacturerId) {
					// F0 7D MAJOR MINOR CMD [payload…] F7
					if (
						event.data.length < 6 ||
						event.data[0] !== 0xf0 ||
						event.data[event.data.length - 1] !== 0xf7 ||
						Array.from(event.data.slice(1, -1)).some((byte) => byte > 0x7f)
					)
						break;

					const packetMajor = event.data[2];
					const packetMinor = event.data[3];
					const command = event.data[4];
					const payload = event.data.slice(5, event.data.length - 1);

					const outputId = get().outputs.find(
						(port) => deviceInputId(port.id) === input.id,
					)?.id;
					const inspector = useInspectorStore.getState();
					const inspecting =
						!!outputId && inspector.deviceId === outputId && inspector.syncing;
					if (
						outputId &&
						versionRequests.has(outputId) &&
						(packetMajor !== ESP_NOW_VERSION_MAJOR ||
							(command === ENOMIK_COMMAND_GET_VERSION_RESPONSE &&
								payload.length >= 2) ||
							((command === ENOMIK_COMMAND_GET_MAC_RESPONSE ||
								(packetMinor < 13 && command === ENOMIK_COMMAND_GET_MAC)) &&
								payload.length >= 12 &&
								Array.from(payload.slice(0, 12)).every((byte) => byte < 16)))
					) {
						clearTimeout(versionRequests.get(outputId));
						versionRequests.delete(outputId);
						const version =
							command === ENOMIK_COMMAND_GET_VERSION_RESPONSE &&
							payload.length >= 2
								? { major: payload[0], minor: payload[1], patch: payload[2] }
								: { major: packetMajor, minor: packetMinor };
						useDeviceStore.getState().setDevice(outputId, {
							status:
								packetMajor === ESP_NOW_VERSION_MAJOR &&
								isCompatibleFirmware(version)
									? "ready"
									: "incompatible",
							version,
						});
					}

					// Check version compatibility (same major version)
					if (packetMajor !== ESP_NOW_VERSION_MAJOR) {
						console.warn(
							`Incompatible protocol version: received ${packetMajor}.${packetMinor}, ` +
								`expected ${ESP_NOW_VERSION_MAJOR}.x`,
						);
						break;
					}

					// Peer entry: GET_ALL_PEERS / GET_PEER / GET_CONFIG stream (index + 12 nibbles)
					// Empty 0x48 is the GET_ALL_PEERS stream-end marker: ends a peers-only load.
					if (
						command === ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE ||
						command === ENOMIK_COMMAND_GET_PEER_RESPONSE
					) {
						if (payload.length >= ENOMIK_PEER_ENTRY_PAYLOAD_SIZE) {
							const macStr = nibblesToMacString(payload.slice(1, 13));
							if (inspecting) inspector.addPeer(macStr);
							if (matchesPendingDevice(input.id) && pendingConfigLoad) {
								if (!pendingConfigLoad.peers.includes(macStr)) {
									pendingConfigLoad.peers.push(macStr);
								}
							}
						} else if (
							command === ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE &&
							payload.length === 0 &&
							matchesPendingDevice(input.id) &&
							pendingConfigLoad?.until === "peers"
						) {
							finishConfigLoad(pendingConfigLoad);
						}
					}

					// Pin config: SET / GET / GET_ALL (and GET_CONFIG pin stream)
					// Empty 0x44 is the GET_ALL_PIN_CONFIGS stream-end marker — ignore.
					if (
						command === ENOMIK_COMMAND_GET_PIN_CONFIG_RESPONSE ||
						command === ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS_RESPONSE ||
						command === ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE
					) {
						if (payload.length >= ENOMIK_PIN_CONFIG_PAYLOAD_SIZE) {
							const pin = payload[0];
							const mode = payload[1];
							const threshold = payload[2];
							const midi_channel = payload[3];
							const midi_type = payload[4] * 2;
							const midi_cc_or_note = payload[5];
							const min_midi_value = payload[6];
							const max_midi_value = payload[7];

							const config = {
								pin,
								mode,
								threshold,
								thresholdUnit: thresholdUnit(
									outputId
										? useDeviceStore.getState().devices[outputId]?.version
										: undefined,
								),
								channel: midi_channel,
								midiType: midi_type,
								controller: midi_type === 176 ? midi_cc_or_note : undefined,
								note:
									midi_type === 144 || midi_type === 128
										? midi_cc_or_note
										: undefined,
								midiMin: min_midi_value,
								midiMax: max_midi_value,
								pinMin: 0,
								pinMax: 1023,
							};

							if (isOutputPinMode(mode)) {
								if (inspecting) inspector.addOutputPinConfig(config);
								if (matchesPendingDevice(input.id) && pendingConfigLoad) {
									pendingConfigLoad.outputs = [
										...pendingConfigLoad.outputs.filter((c) => c.pin !== pin),
										config,
									];
								}
							} else {
								if (inspecting) inspector.addInputPinConfig(config);
								if (matchesPendingDevice(input.id) && pendingConfigLoad) {
									pendingConfigLoad.inputs = [
										...pendingConfigLoad.inputs.filter((c) => c.pin !== pin),
										config,
									];
								}
							}
						}
					}

					// MIDI loopback: GET_MIDI_LOOPBACK / GET_CONFIG stream (0x4E + byte)
					if (
						command === ENOMIK_COMMAND_GET_MIDI_LOOPBACK_RESPONSE &&
						payload.length >= 1
					) {
						const enabled = payload[0] !== 0;
						if (inspecting) inspector.setMidiLoopback(enabled);
						if (matchesPendingDevice(input.id) && pendingConfigLoad) {
							pendingConfigLoad.midiLoopback = enabled;
						}
					}

					// Power save: GET_POWER_SAVE / GET_CONFIG stream (0x50 + byte)
					if (
						command === ENOMIK_COMMAND_GET_POWER_SAVE_RESPONSE &&
						payload.length >= 1
					) {
						const enabled = payload[0] !== 0;
						if (inspecting) inspector.setPowerSave(enabled);
						if (matchesPendingDevice(input.id) && pendingConfigLoad) {
							pendingConfigLoad.powerSave = enabled;
						}
					}

					// Client name: GET_NAME / SET_NAME / GET_CONFIG stream (0x52/0x51 + ASCII bytes)
					if (
						command === ENOMIK_COMMAND_GET_NAME_RESPONSE ||
						command === ENOMIK_COMMAND_SET_NAME_RESPONSE
					) {
						const name = String.fromCharCode(...payload);
						if (inspecting) inspector.setName(name);
						if (matchesPendingDevice(input.id) && pendingConfigLoad) {
							pendingConfigLoad.name = name;
						}
					}

					// GET_CONFIG done marker (empty 0x4C)
					if (
						command === ENOMIK_COMMAND_GET_CONFIG_RESPONSE &&
						payload.length === 0
					) {
						if (
							matchesPendingDevice(input.id) &&
							pendingConfigLoad?.until === "config"
						) {
							finishConfigLoad(pendingConfigLoad, "client");
						}
					}

					if (
						command === ENOMIK_COMMAND_GET_VERSION_RESPONSE &&
						payload.length >= 2
					) {
						// Payload: [major, minor] or, since 0.19, [major, minor, patch]
						const version = Array.from(payload.slice(0, 3)).join(".");
						console.log(`Device version: ${version}`);
						if (inspecting) inspector.setProtocolVersion(version);
					}

					// Raw stream frame: RAW_VALUE notification (0x17), see SET_RAW_STREAM
					if (
						command === ENOMIK_COMMAND_RAW_VALUE &&
						outputId &&
						useRawStreamStore.getState().deviceId === outputId &&
						useRawStreamStore.getState().active &&
						payload.length >= ENOMIK_RAW_VALUE_PAYLOAD_SIZE
					) {
						useRawStreamStore.getState().setValue({
							pin: payload[0],
							mode: payload[1],
							raw: decodeSeptets32(payload, 2),
							baseline: decodeSeptets32(payload, 7),
							peak: decodeSeptets32(payload, 12),
							percent: payload[17],
							norm: payload[18],
							threshold: payload[19],
							active: payload[20] !== 0,
							timestamp: Date.now(),
						});
					}

					if (
						command === ENOMIK_COMMAND_SET_RAW_STREAM_RESPONSE &&
						payload.length >= 3 &&
						payload[1] === 1 &&
						outputId &&
						useRawStreamStore.getState().deviceId === outputId &&
						useRawStreamStore.getState().active
					) {
						useRawStreamStore.getState().acknowledge();
					}

					// Own MAC: GET_MAC response (0x46 + 12 MAC nibbles)
					if (
						command === ENOMIK_COMMAND_GET_MAC_RESPONSE &&
						payload.length >= 12
					) {
						if (inspecting)
							inspector.setMacAddress(nibblesToMacString(payload.slice(0, 12)));
					}

					if (
						command === ENOMIK_COMMAND_ADD_PEER_RESPONSE &&
						payload.length >= 1 &&
						payload[0] === 1
					) {
						console.log("ADD_PEER succeeded");
					}

					if (
						command === ENOMIK_COMMAND_ERROR_RESPONSE &&
						payload.length >= 2
					) {
						const failedRequest = payload[0];
						const errorCode = payload[1];
						const context = payload.length >= 3 ? payload[2] : undefined;
						console.warn(
							`Enomik SysEx error: request=0x${failedRequest.toString(16)} ` +
								`code=0x${errorCode.toString(16)} ` +
								`(${ENOMIK_ERROR_NAMES[errorCode] ?? "unknown"})` +
								(context !== undefined ? ` context=${context}` : ""),
						);
						if (
							sysexErrorCollection &&
							(!sysexErrorOutputId ||
								sysexErrorOutputId === "-1" ||
								outputId === sysexErrorOutputId)
						) {
							sysexErrorCollection.push({
								failedRequest,
								errorCode,
								major: packetMajor,
								minor: packetMinor,
								context,
							});
						}
						if (
							failedRequest === ENOMIK_COMMAND_SET_RAW_STREAM &&
							outputId &&
							useRawStreamStore.getState().deviceId === outputId &&
							useRawStreamStore.getState().active
						) {
							const rawStream = useRawStreamStore.getState();
							rawStream.setError(ENOMIK_ERROR_NAMES[errorCode] ?? "unknown");
							rawStream.setActive(false);
						}
						if (
							matchesPendingDevice(input.id) &&
							failedRequest === ENOMIK_COMMAND_GET_CONFIG &&
							pendingConfigLoad
						) {
							if (
								errorCode === ENOMIK_ERROR_NOT_READY &&
								pendingConfigLoad.until === "config"
							)
								finishConfigLoad(pendingConfigLoad, "dongle");
							else resolveConfigLoad(null);
						}
					}

					// RESET_RESPONSE (0x49) — empty ack after RESET (0x09). F0 7D MAJ MIN 49 F7
					if (
						command === ENOMIK_COMMAND_RESET_RESPONSE &&
						event.data.length >= 6 &&
						event.data[event.data.length - 1] === 0xf7
					) {
						if (pendingResetAck && input.id === pendingResetAck.inputId) {
							pendingResetAck.finish(true);
						}
					}
				}
				break;

			default:
				// Handle other message types if needed
				break;
		}
	};
};
export const useMIDIStore = create<MonitorState>()(
	devtools(
		persist(
			(set, get) => ({
				initialized: false,
				messages: [],
				inputs: [],
				outputs: [],
				activeInputs: [],
				composerChannel: 1,
				composerType: MIDI_STATUS.NOTE_ON,
				composerNoteOrCc: 60,
				composerVelocityOrValue: 127,
				composerPitchBendValue: 0,
				composerSysexData: "",
				composerManufacturerId: "",
				init: async () => {
					if (get().initialized) return;

					try {
						midiAccess = await navigator.requestMIDIAccess({ sysex: true });
						// Convert inputs to array
						const inputs = Array.from(midiAccess.inputs.values());
						const outputs = Array.from(midiAccess.outputs.values());

						const enomikOutputId = findEnomikOutputId(outputs);
						set({
							inputs,
							outputs,
							...(enomikOutputId
								? {
										selectedComposerOutputDevice: enomikOutputId,
										selectedConfiguratorOutputDevice: enomikOutputId,
									}
								: {}),
						});

						// Set up MIDI input listeners for initial devices
						inputs.forEach((input) => {
							setupInputHandler(input, get);
						});

						// Listen for device connection/disconnection events
						midiAccess.onstatechange = (event) => {
							if (!midiAccess) {
								return;
							}

							// Update the device lists
							const inputs = Array.from(midiAccess.inputs.values());
							const outputs = Array.from(midiAccess.outputs.values());

							if (event.port?.state === "disconnected") {
								const portId = event.port.id;
								for (const out of get().outputs) {
									if (
										out.id === portId ||
										sessionInputs.get(out.id) === portId ||
										deviceInputId(out.id) === portId ||
										get().inputs.some(
											(port) => port.id === portId && port.name === out.name,
										)
									)
										clearDeviceSession(out.id);
								}
							}
							set({ inputs, outputs });
							for (const [outputId, inputId] of sessionInputs) {
								if (deviceInputId(outputId) !== inputId)
									clearDeviceSession(outputId);
							}

							// Set up handler for newly connected input
							if (
								event.port?.type === "input" &&
								event.port.state === "connected"
							) {
								const input = event.port as MIDIInput;
								setupInputHandler(input, get);
							}

							if (
								event.port?.type === "output" &&
								event.port.state === "connected" &&
								isEnomikPortName(event.port.name)
							) {
								useDeviceStore.getState().clearKind(event.port.id);
								set({
									selectedComposerOutputDevice: event.port.id,
									selectedConfiguratorOutputDevice: event.port.id,
								});
							}

							// Clean up disconnected devices from active inputs
							if (event.port?.state === "disconnected") {
								set({
									activeInputs: get().activeInputs.filter(
										(id) => id !== event.port?.id,
									),
								});
							}
						};

						set({ initialized: true });
					} catch (err) {
						console.error("Failed to get MIDI access:", err);
					}
				},

				addIncomingMessage: (message: MidiMessage, deviceId: string) => {
					queueMonitorMessage(set, { ...message, incoming: true, deviceId });
				},
				addOutgoingMessage: (message: MidiMessage, deviceId: string) => {
					queueMonitorMessage(set, { ...message, incoming: false, deviceId });
				},
				clear: () => {
					if (monitorFlushRaf !== null) {
						cancelAnimationFrame(monitorFlushRaf);
						monitorFlushRaf = null;
					}
					monitorMessageBatch = [];
					set({ messages: [] });
				},

				sendMessage: (message: MidiMessage, outputId = "-1") => {
					if (!midiAccess) {
						console.error("MIDI not initialized");
						return false;
					}
					if (outputId === "-1") {
						midiAccess.outputs.forEach((output) => {
							get().addOutgoingMessage(message, output.id);
						});
					} else {
						get().addOutgoingMessage(message, outputId);
					}

					const send = (message: MidiMessage, output: any) => {
						if (
							message.type === MIDI_STATUS.SYSEX_START &&
							message.data !== undefined
						) {
							const data = [...message.data];
							if (data[0] !== 0xf0) data.unshift(0xf0);
							if (data[data.length - 1] !== 0xf7) data.push(0xf7);
							output.send(data);
						} else if (
							message.type === MIDI_STATUS.NOTE_ON &&
							message.note !== undefined &&
							message.velocity !== undefined &&
							message.channel !== undefined
						) {
							output.send([
								0x90 | (message.channel - 1),
								message.note,
								message.velocity,
							]);
						} else if (
							message.type === MIDI_STATUS.NOTE_OFF &&
							message.note !== undefined &&
							message.velocity !== undefined &&
							message.channel !== undefined
						) {
							output.send([
								0x80 | (message.channel - 1),
								message.note,
								message.velocity,
							]);
						} else if (
							message.type === MIDI_STATUS.CONTROL_CHANGE &&
							message.controller !== undefined &&
							message.value !== undefined &&
							message.channel !== undefined
						) {
							output.send([
								0xb0 | (message.channel - 1),
								message.controller,
								message.value,
							]);
						} else if (
							message.type === MIDI_STATUS.PITCH_BEND &&
							message.pitchBendValue !== undefined &&
							message.channel !== undefined
						) {
							const lsb = (message.pitchBendValue ?? 0) & 0x7f;
							const msb = ((message.pitchBendValue ?? 0) >> 7) & 0x7f;
							output.send([0xe0 | (message.channel - 1), lsb, msb]);
						} else if (
							message.type === MIDI_STATUS.PROGRAM_CHANGE &&
							message.controller !== undefined &&
							message.channel !== undefined
						) {
							output.send([0xc0 | (message.channel - 1), message.controller]);
						} else if (
							message.type === MIDI_STATUS.CHANNEL_PRESSURE &&
							message.value !== undefined &&
							message.channel !== undefined
						) {
							output.send([0xd0 | (message.channel - 1), message.value]);
						} else if (
							message.type === MIDI_STATUS.POLY_PRESSURE &&
							message.note !== undefined &&
							message.value !== undefined &&
							message.channel !== undefined
						) {
							output.send([
								0xa0 | (message.channel - 1),
								message.note,
								message.value,
							]);
						} else if (
							message.type === MIDI_STATUS.START ||
							message.type === MIDI_STATUS.STOP ||
							message.type === MIDI_STATUS.CONTINUE
						) {
							output.send([message.type]);
						}
					};
					try {
						let sent = false;
						for (const output of midiAccess.outputs.values()) {
							if (
								(outputId === "-1" || output.id === outputId) &&
								output.state !== "disconnected"
							) {
								send(message, output);
								sent = true;
							}
						}
						return sent;
					} catch (error) {
						console.warn("MIDI send failed", error);
						return false;
					}
				},
				setSelectedConfiguratorOutputDevice: (deviceId: string) => {
					// A newly picked port starts with the kind its name suggests
					useDeviceStore.getState().clearKind(deviceId);
					useRawStreamStore.getState().setActive(false);
					useRawStreamStore.getState().clear();
					set({ selectedConfiguratorOutputDevice: deviceId });
				},
				setSelectedInspectorOutputDevice: (deviceId: string) => {
					useRawStreamStore.getState().setActive(false);
					useRawStreamStore.getState().clear();
					useInspectorStore.getState().clear();
					set({ selectedInspectorOutputDevice: deviceId });
				},
				setSelectedComposerOutputDevice: (deviceId: string) => {
					set({ selectedComposerOutputDevice: deviceId });
				},
				setComposerChannel: (value: number) => {
					set({ composerChannel: value });
				},
				setComposerType: (value: number) => {
					set({ composerType: value });
				},
				setComposerNoteOrCc: (value: number) => {
					set({ composerNoteOrCc: value });
				},
				setComposerVelocityOrValue: (value: number) => {
					set({ composerVelocityOrValue: value });
				},
				setComposerPitchBendValue: (value: number) => {
					set({ composerPitchBendValue: value });
				},
				setComposerSysexData: (value: string) => {
					set({ composerSysexData: value });
				},
				setComposerManufacturerId: (value: string) => {
					set({ composerManufacturerId: value });
				},
			}),
			{
				name: "MonitorStore",
				storage: createJSONStorage(() => sessionStorage),
				// Do not persist messages: serializing a large list every MIDI event kills UI thread.
				partialize: (state) => ({
					selectedComposerOutputDevice: state.selectedComposerOutputDevice,
					selectedConfiguratorOutputDevice:
						state.selectedConfiguratorOutputDevice,
					selectedInspectorOutputDevice: state.selectedInspectorOutputDevice,
					composerChannel: state.composerChannel,
					composerType: state.composerType,
					composerNoteOrCc: state.composerNoteOrCc,
					composerVelocityOrValue: state.composerVelocityOrValue,
					composerPitchBendValue: state.composerPitchBendValue,
					composerSysexData: state.composerSysexData,
					composerManufacturerId: state.composerManufacturerId,
				}),
			},
		),
	),
);
