import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { useInspectorStore } from "./inspector";
import { MIDI_STATUS } from "../utils/midi";
import { ESP_NOW_VERSION_MAJOR } from "./io";

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

/** Batch rapid MIDI events to one React update per frame (e.g. clock spam). */
let monitorMessageBatch: MidiMessageWithDirectionAndDevice[] = [];
let monitorFlushRaf: number | null = null;

function flushMonitorBatch(
  set: (fn: (state: MonitorState) => Partial<MonitorState>) => void
) {
  monitorFlushRaf = null;
  const batch = monitorMessageBatch;
  monitorMessageBatch = [];
  if (batch.length === 0) return;
  set((state) => ({
    messages: [...batch.reverse(), ...state.messages].slice(
      0,
      MIDI_MONITOR_MAX_MESSAGES
    ),
  }));
}

function queueMonitorMessage(
  set: (fn: (state: MonitorState) => Partial<MonitorState>) => void,
  entry: MidiMessageWithDirectionAndDevice
) {
  monitorMessageBatch.push(entry);
  if (monitorFlushRaf === null) {
    monitorFlushRaf = requestAnimationFrame(() => flushMonitorBatch(set));
  }
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
          input.id
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
            input.id
          );
        } else {
          // Velocity = 0 is sometimes used as note off
          get().addIncomingMessage(
            {
              ...message,
              note: data1,
              velocity: data2,
            },
            input.id
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
          input.id
        );
        break;

      case MIDI_STATUS.PROGRAM_CHANGE:
        get().addIncomingMessage(
          {
            ...message,
            controller: data1,
          },
          input.id
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
          input.id
        );
        break;

      case MIDI_STATUS.PITCH_BEND:
        // Combine LSB and MSB into 14-bit value (0-16383)
        console.log("got pitchbend");
        const rawValue = data1 | (data2 << 7);
        get().addIncomingMessage(
          {
            ...message,
            pitchBendValue: rawValue, // - 8192, // Center at 0
          },
          input.id
        );
        break;
      case MIDI_STATUS.CHANNEL_PRESSURE: {
        get().addIncomingMessage(
          {
            ...message,
            value: data1,
          },
          input.id
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
          input.id
        );
        break;
      }

      case MIDI_STATUS.SYSEX_START:
        if (event.data[1] === 125) {
          // MANUFACTURER_ID
          // Extract version from packet
          const packetMajor = event.data[2];
          const packetMinor = event.data[3];
          const command = event.data[4];

          // Check version compatibility (same major version)
          if (packetMajor !== ESP_NOW_VERSION_MAJOR) {
            console.warn(
              `Incompatible protocol version: received ${packetMajor}.${packetMinor}, ` +
                `expected ${ESP_NOW_VERSION_MAJOR}.x`
            );
            break;
          }

          // GET_PEERS_RESPONSE (0x48 = 72 = 64 + 8)
          if (command === 72) {
            // Payload starts at index 5 (after header)
            const nibbleData = event.data.slice(5, event.data.length - 1);
            const numberOfPeers = (event.data.length - 6) / 12; // Adjusted for new header size
            const peers: string[] = [];

            for (let i = 0; i < numberOfPeers; i++) {
              const start = i * 12;
              const macNibbles = nibbleData.slice(start, start + 12);
              const macBytes: number[] = [];

              for (let j = 0; j < macNibbles.length; j += 2) {
                macBytes.push((macNibbles[j] << 4) | macNibbles[j + 1]);
              }

              // Convert to MAC string
              const macStr = macBytes
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(":");
              peers.push(macStr.toUpperCase());
            }

            useInspectorStore.getState().setPeers(peers);
          }

          // GET_PIN_CONFIG_RESPONSE (0x42 = 66 = 64 + 2)
          if (command === 66) {
            console.log("Received get_pin_config response", event.data);

            // Payload starts at index 5 (after header with version)
            const pin = event.data[5];
            const mode = event.data[6];
            const threshold = event.data[7];
            const midi_channel = event.data[8];
            const midi_type = event.data[9] * 2;
            const midi_cc_or_note = event.data[10];
            const min_midi_value = event.data[11];
            const max_midi_value = event.data[12];

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
            };

            useInspectorStore.getState().addInputPinConfig(config);
          }

          // GET_VERSION_RESPONSE (0x4A = 74 = 64 + 10)
          if (command === 74) {
            const deviceMajor = event.data[5];
            const deviceMinor = event.data[6];
            console.log(`Device version: ${deviceMajor}.${deviceMinor}`);
            // Store or use device version as needed
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

            set({
              inputs,
              outputs,
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

              // Clean up disconnected devices from active inputs
              if (event.port?.state === "disconnected") {
                set({
                  activeInputs: get().activeInputs.filter(
                    (id) => id !== event.port?.id
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
              let data = [...message.data];
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
            }else if (
              message.type === MIDI_STATUS.START ||
              message.type === MIDI_STATUS.STOP ||
              message.type === MIDI_STATUS.CONTINUE
            ) {
              output.send([message.type]);
            }
          };
          if (outputId != "-1") {
            midiAccess.outputs.forEach((output) => {
              if (output.id == outputId) {
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
      }
    )
  )
);
