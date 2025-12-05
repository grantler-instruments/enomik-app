import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { useInspectorStore } from "./inspector";

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
  init: () => void;
  toggleInput: (inputId: string) => void;
  addIncomingMessage: (message: MidiMessage, deviceId: string) => void;
  addOutgoingMessage: (message: MidiMessage, deviceId: string) => void;
  clear: () => void;
  sendMessage: (message: MidiMessage, outputId?: string) => void;
}

let midiAccess: MIDIAccess | null = null;

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

            // Set up MIDI input listeners
            inputs.forEach((input) => {
              console.log(`MIDI Input: ${input.name} (ID: ${input.id})`);

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
                  case 0xb0: // Control Change
                    get().addIncomingMessage(
                      {
                        ...message,
                        controller: data1,
                        value: data2,
                      },
                      input.id
                    );
                    break;

                  case 0x90: // Note On
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

                  case 0x80: // Note Off
                    get().addIncomingMessage(
                      {
                        ...message,
                        note: data1,
                        velocity: data2,
                      },
                      input.id
                    );
                    break;

                  case 0xe0: // Pitch Bend
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
                  case 0xf0: // SysEx
                    console.log("Received SysEx message:", event.data);

                    if (event.data[1] === 125) {
                      if (event.data[2] === 64 + 8) {
                        const nibbleData = event.data.slice(
                          3,
                          event.data.length - 1
                        );

                        const numberOfPeers = (event.data.length - 4) / 12;
                        console.log(
                          "Received get_peers response",
                          numberOfPeers
                        );
                        const peers: string[] = [];

                        for (let i = 0; i < numberOfPeers; i++) {
                          const start = i * 12;
                          const macNibbles = nibbleData.slice(
                            start,
                            start + 12
                          );
                          const macBytes: number[] = [];

                          for (let j = 0; j < macNibbles.length; j += 2) {
                            macBytes.push(
                              (macNibbles[j] << 4) | macNibbles[j + 1]
                            );
                          }

                          // Convert to MAC string
                          const macStr = macBytes
                            .map((b) => b.toString(16).padStart(2, "0"))
                            .join(":");
                          peers.push(macStr.toUpperCase());
                          useInspectorStore.getState().setPeers(peers);
                        }
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
            });

            console.log("Initializing MIDI Monitor");
            set({ initialized: true });
          } catch (err) {
            console.error("Failed to get MIDI access:", err);
          }
        },

        toggleInput: (inputId: string) => {
          const activeInputs = get().activeInputs;
          const inputs = get().inputs;
          console.log("Toggling input:", inputId, inputs);
          const input = inputs.find((inp) => inp.id === inputId);
          if (!input) return;

          if (activeInputs.includes(inputId)) {
            set({
              activeInputs: activeInputs.filter((id) => id !== inputId),
            });
          } else {
            set({ activeInputs: [...activeInputs, inputId] });
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

          midiAccess.outputs.forEach((output) => {
            if (output.id !== outputId && outputId !== "-1") return;
            if (message.type === 240 && message.data !== undefined) {
              let data = [...message.data];
              if (data[0] !== 0xf0) data.unshift(0xf0);
              if (data[data.length - 1] !== 0xf7) data.push(0xf7);
              console.log("Sending sysex - Raw data:", data);
              output.send(data);
            } else if (
              message.type === 144 &&
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
              message.type === 128 &&
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
              message.type === 176 &&
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
              message.type === 224 &&
              message.value !== undefined &&
              message.channel !== undefined
            ) {
              const lsb = message.value & 0x7f;
              const msb = (message.value >> 7) & 0x7f;
              output.send([0xe0 | (message.channel - 1), lsb, msb]);
            }
          });
        },
      }),
      {
        name: "MonitorStore",
        partialize: (state) => ({
          messages: state.messages,
        }),
      }
    )
  )
);
