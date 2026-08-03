import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { MIDI_STATUS } from "../utils/midi";
import { useInspectorStore } from "./inspector";
import {
	ENOMIK_COMMAND_ADD_PEER_RESPONSE,
	ENOMIK_COMMAND_ERROR_RESPONSE,
	ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE,
	ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS_RESPONSE,
	ENOMIK_COMMAND_GET_CONFIG,
	ENOMIK_COMMAND_GET_CONFIG_RESPONSE,
	ENOMIK_COMMAND_GET_MIDI_LOOPBACK_RESPONSE,
	ENOMIK_COMMAND_GET_PEER_RESPONSE,
	ENOMIK_COMMAND_GET_PIN_CONFIG_RESPONSE,
	ENOMIK_COMMAND_GET_POWER_SAVE_RESPONSE,
	ENOMIK_COMMAND_GET_VERSION_RESPONSE,
	ENOMIK_COMMAND_RESET_RESPONSE,
	ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE,
	ENOMIK_ERROR_NAMES,
	ENOMIK_PEER_ENTRY_PAYLOAD_SIZE,
	ENOMIK_PIN_CONFIG_PAYLOAD_SIZE,
	ESP_NOW_VERSION_MAJOR,
	isOutputPinMode,
	nibblesToMacString,
	sysexManufacturerId,
} from "./midi.config";

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
	sendMessage: (message: MidiMessage, outputId?: string) => void;
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

const isEnomikPortName = (name: string | null | undefined) =>
	typeof name === "string" && /enomik/i.test(name);

const findEnomikOutputId = (outputs: { id: string; name?: string | null }[]) =>
	outputs.find((out) => isEnomikPortName(out.name))?.id;

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
	outputName: string;
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
		const outputName = out.name ?? "";
		const timeoutId = setTimeout(() => {
			if (pendingResetAck?.outputName === outputName) {
				pendingResetAck = null;
				resolve(false);
			}
		}, timeoutMs);
		pendingResetAck = {
			outputName,
			finish: (ok) => {
				clearTimeout(timeoutId);
				if (pendingResetAck?.outputName === outputName) {
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
	midiLoopback: boolean;
	powerSave: boolean;
};

type PendingConfigLoad = {
	outputName: string;
	inputs: LoadedDeviceConfig["inputs"];
	outputs: LoadedDeviceConfig["outputs"];
	peers: string[];
	midiLoopback: boolean;
	powerSave: boolean;
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

/** Resolves when empty GET_CONFIG_RESPONSE (0x4C) arrives from the matching device. */
export function beginWaitForConfigLoad(
	outputId: string,
	timeoutMs: number,
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
		const outputName = out.name ?? "";
		const timeoutId = setTimeout(() => {
			if (pendingConfigLoad?.outputName === outputName) {
				pendingConfigLoad = null;
				resolve(null);
			}
		}, timeoutMs);
		pendingConfigLoad = {
			outputName,
			inputs: [],
			outputs: [],
			peers: [],
			midiLoopback: false,
			powerSave: false,
			finish: (result) => resolve(result),
			timeoutId,
		};
	});
}

function matchesPendingDevice(inputName: string | null | undefined): boolean {
	return (
		!!pendingConfigLoad && (inputName ?? "") === pendingConfigLoad.outputName
	);
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
					if (event.data.length < 6) break;

					const packetMajor = event.data[2];
					const packetMinor = event.data[3];
					const command = event.data[4];
					const payload = event.data.slice(5, event.data.length - 1);

					// Check version compatibility (same major version)
					if (packetMajor !== ESP_NOW_VERSION_MAJOR) {
						console.warn(
							`Incompatible protocol version: received ${packetMajor}.${packetMinor}, ` +
								`expected ${ESP_NOW_VERSION_MAJOR}.x`,
						);
						break;
					}

					// Peer entry: GET_ALL_PEERS / GET_PEER / GET_CONFIG stream (index + 12 nibbles)
					// Empty 0x48 is the GET_ALL_PEERS stream-end marker — ignore.
					if (
						command === ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE ||
						command === ENOMIK_COMMAND_GET_PEER_RESPONSE
					) {
						if (payload.length >= ENOMIK_PEER_ENTRY_PAYLOAD_SIZE) {
							const macStr = nibblesToMacString(payload.slice(1, 13));
							useInspectorStore.getState().addPeer(macStr);
							if (matchesPendingDevice(input.name) && pendingConfigLoad) {
								if (!pendingConfigLoad.peers.includes(macStr)) {
									pendingConfigLoad.peers.push(macStr);
								}
							}
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
								useInspectorStore.getState().addOutputPinConfig(config);
								if (matchesPendingDevice(input.name) && pendingConfigLoad) {
									pendingConfigLoad.outputs = [
										...pendingConfigLoad.outputs.filter((c) => c.pin !== pin),
										config,
									];
								}
							} else {
								useInspectorStore.getState().addInputPinConfig(config);
								if (matchesPendingDevice(input.name) && pendingConfigLoad) {
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
						useInspectorStore.getState().setMidiLoopback(enabled);
						if (matchesPendingDevice(input.name) && pendingConfigLoad) {
							pendingConfigLoad.midiLoopback = enabled;
						}
					}

					// Power save: GET_POWER_SAVE / GET_CONFIG stream (0x50 + byte)
					if (
						command === ENOMIK_COMMAND_GET_POWER_SAVE_RESPONSE &&
						payload.length >= 1
					) {
						const enabled = payload[0] !== 0;
						useInspectorStore.getState().setPowerSave(enabled);
						if (matchesPendingDevice(input.name) && pendingConfigLoad) {
							pendingConfigLoad.powerSave = enabled;
						}
					}

					// GET_CONFIG done marker (empty 0x4C)
					if (
						command === ENOMIK_COMMAND_GET_CONFIG_RESPONSE &&
						payload.length === 0
					) {
						if (matchesPendingDevice(input.name) && pendingConfigLoad) {
							resolveConfigLoad({
								inputs: pendingConfigLoad.inputs,
								outputs: pendingConfigLoad.outputs,
								peers: pendingConfigLoad.peers.map((macAddress) => ({
									macAddress,
								})),
								midiLoopback: pendingConfigLoad.midiLoopback,
								powerSave: pendingConfigLoad.powerSave,
							});
						}
					}

					if (command === ENOMIK_COMMAND_GET_VERSION_RESPONSE) {
						const deviceMajor = payload[0];
						const deviceMinor = payload[1];
						console.log(`Device version: ${deviceMajor}.${deviceMinor}`);
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
							matchesPendingDevice(input.name) &&
							failedRequest === ENOMIK_COMMAND_GET_CONFIG
						) {
							resolveConfigLoad(null);
						}
					}

					// RESET_RESPONSE (0x49) — empty ack after RESET (0x09). F0 7D MAJ MIN 49 F7
					if (
						command === ENOMIK_COMMAND_RESET_RESPONSE &&
						event.data.length >= 6 &&
						event.data[event.data.length - 1] === 0xf7
					) {
						if (
							pendingResetAck &&
							(input.name ?? "") === pendingResetAck.outputName
						) {
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

							set({ inputs, outputs });

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

				sendMessage: async (message: MidiMessage, outputId = "-1") => {
					if (!midiAccess) {
						console.error("MIDI not initialized");
						return;
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
					if (outputId !== "-1") {
						midiAccess.outputs.forEach((output) => {
							if (output.id === outputId) {
								send(message, output);
							}
						});
					} else {
						midiAccess.outputs.forEach((output) => {
							send(message, output);
						});
					}
				},
				setSelectedConfiguratorOutputDevice: (deviceId: string) => {
					set({ selectedConfiguratorOutputDevice: deviceId });
				},
				setSelectedInspectorOutputDevice: (deviceId: string) => {
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
