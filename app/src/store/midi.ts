import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { useInspectorStore } from "./inspector";
import { MIDI_STATUS } from "../utils/midi";

export interface MidiMessage {
  id: string;
  timestamp: number;
  type: number;
  note?: number;
  controller?: number;
  value?: number;
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
  init: () => void;
  addIncomingMessage: (message: MidiMessage, deviceId: string) => void;
  addOutgoingMessage: (message: MidiMessage, deviceId: string) => void;
  clear: () => void;
  sendMessage: (message: MidiMessage, outputId?: string) => void;
  setSelectedConfiguratorOutputDevice: (deviceId: string) => void;
  setSelectedInspectorOutputDevice: (deviceId: string) => void;
  setSelectedComposerOutputDevice: (deviceId: string) => void;
}

let midiAccess: MIDIAccess | null = null;

const setupInputHandler = (input: MIDIInput, get: () => MonitorState) => {
  console.log(`Setting up handler for: ${input.name} (ID: ${input.id})`);

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
        const rawValue = data1 | (data2 << 7);
        get().addIncomingMessage(
          {
            ...message,
            value: rawValue - 8192, // Center at 0
          },
          input.id
        );
        break;

      case MIDI_STATUS.SYSEX_START:
        if (event.data[1] === 125) {
          if (event.data[2] === 64 + 8) {
            // get peers response
            const nibbleData = event.data.slice(3, event.data.length - 1);
            const numberOfPeers = (event.data.length - 4) / 12;
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
              useInspectorStore.getState().setPeers(peers);
            }
          }

          if (event.data[2] === 64 + 2) {
            // get pin config response
            console.log("Received get_pin_config response", event.data);

            const pin = event.data[3];
            const mode = event.data[4];
            const threshold = event.data[5];
            const midi_channel = event.data[6];
            const midi_type = event.data[7] * 2;
            const midi_cc_or_note = event.data[8];
            const min_midi_value = event.data[9];
            const max_midi_value = event.data[10];

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
        }

        get().addIncomingMessage(
          {
            ...message,
            data: Array.from(event.data),
          },
          input.id
        );
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
        init: async () => {
          if (get().initialized) return;

          try {
            midiAccess = await navigator.requestMIDIAccess({ sysex: true });
            console.log("MIDI access granted");

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
              console.log("MIDI device state changed:", event);
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
                console.log(
                  `New MIDI Input connected: ${input.name} (ID: ${input.id})`
                );
                setupInputHandler(input, get);
              }

              // Clean up disconnected devices from active inputs
              if (event.port?.state === "disconnected") {
                console.log(
                  `MIDI device disconnected: ${event.port.name} (ID: ${event.port.id})`
                );
                set({
                  activeInputs: get().activeInputs.filter(
                    (id) => id !== event.port?.id
                  ),
                });
              }
            };

            console.log("Initializing MIDI Monitor");
            set({ initialized: true });
          } catch (err) {
            console.error("Failed to get MIDI access:", err);
          }
        },

        addIncomingMessage: (message: MidiMessage, deviceId: string) => {
          set((state) => ({
            messages: [
              { ...message, incoming: true, deviceId },
              ...state.messages,
            ],
          }));
        },
        addOutgoingMessage: (message: MidiMessage, deviceId: string) => {
          set((state) => ({
            messages: [
              { ...message, incoming: false, deviceId },
              ...state.messages,
            ],
          }));
        },
        clear: () => {
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
              message.value !== undefined &&
              message.channel !== undefined
            ) {
              const lsb = message.value & 0x7f;
              const msb = (message.value >> 7) & 0x7f;
              output.send([0xe0 | (message.channel - 1), lsb, msb]);
            } else if (
              message.type === MIDI_STATUS.PROGRAM_CHANGE &&
              message.controller !== undefined &&
              message.channel !== undefined
            ) {
              output.send([0xc0 | (message.channel - 1), message.controller]);
            } else if (
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
            midiAccess.outputs.forEach((output)=>{
              send(message, output)
            })
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
      }),
      {
        name: "MonitorStore",
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          selectedComposerOutputDevice: state.selectedComposerOutputDevice,
          selectedConfiguratorOutputDevice:
            state.selectedConfiguratorOutputDevice,
          selectedInspectorOutputDevice: state.selectedInspectorOutputDevice,
          messages: state.messages,
        }),
      }
    )
  )
);
