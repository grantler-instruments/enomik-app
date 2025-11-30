import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { WebMidi, Input, Output } from "webmidi";
import { v4 as uuidv4 } from "uuid";

export interface MidiMessage {
  id: string;
  timestamp: number;
  type: string;
  note?: number;
  controller?: number;
  value?: number;
  velocity?: number;
  channel?: number;
  data?: number[];
}

interface MonitorState {
  initialized: boolean;
  messages: MidiMessage[];
  inputs: any[];
  outputs: any[];
  activeInputs: string[];
  init: () => void;
  toggleInput: (inputId: string) => void;
  addMessage: (message: MidiMessage) => void;
  clear: () => void;
  sendMessage: (message: MidiMessage) => void;
}

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
          await WebMidi.enable({ sysex: true });
          const inputs = WebMidi.inputs;
          const outputs = WebMidi.outputs;
          set({
            inputs: inputs.map((input) => ({ id: input.id, name: input.name })),
            outputs: outputs.map((output) => ({
              id: output.id,
              name: output.name,
            })),
          });

          // Log available MIDI inputs for debugging
          WebMidi.inputs.forEach((input) => {
            console.log(`MIDI Input: ${input.name} (ID: ${input.id})`);
            input.addListener("controlchange", (e) => {
              console.log("control change", e);
              if (get().activeInputs.includes(input.id)) {
                get().addMessage({
                  id: uuidv4(),
                  timestamp: e.timestamp,
                  type: "controlchange",
                  controller: e.controller.number,
                  value: e.rawValue,
                  channel: e.message.channel,
                });
              }
            });
            input.addListener("noteon", (e) => {
              if (get().activeInputs.includes(input.id)) {
                get().addMessage({
                  id: uuidv4(),
                  timestamp: e.timestamp,
                  type: "noteon",
                  note: e.note.number,
                  velocity: e.message.dataBytes[2], //TODO
                  channel: e.message.channel,
                });
              }
            });
            input.addListener("noteoff", (e) => {
              if (get().activeInputs.includes(input.id)) {
                get().addMessage({
                  id: uuidv4(),
                  timestamp: e.timestamp,
                  type: "noteoff",
                  note: e.note.number,
                  velocity: e.message.dataBytes[2], //TODO
                  channel: e.message.channel,
                });
              }
            });
            input.addListener("pitchbend", (e) => {
              if (get().activeInputs.includes(input.id)) {
                get().addMessage({
                  id: uuidv4(),
                  timestamp: e.timestamp,
                  type: "pitchbend",
                  value: e.rawValue ? e.rawValue - 8192 : 0,
                  channel: e.message.channel,
                });
              }
            });
          });
          console.log("Initializing MIDI Monitor");
          set({ initialized: true });
        },
        toggleInput: (inputId: string) => {
          const activeInputs = get().activeInputs;
          const inputs = WebMidi.inputs;
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
        addMessage: (message: MidiMessage) => {
          set((state) => ({
            messages: [...state.messages, message],
          }));
        },

        clear: () => {
          set({ messages: [] });
        },

        sendMessage: async (message: MidiMessage) => {
          // Handle SysEx separately using native Web MIDI API
          if (message.type === "sysex" && message.data !== undefined) {
            // Ensure message has proper SysEx framing (0xF0...0xF7)
            let data = [...message.data];
            if (data[0] !== 0xf0) {
              data.unshift(0xf0);
            }
            if (data[data.length - 1] !== 0xf7) {
              data.push(0xf7);
            }

            console.log("Sending sysex - Raw data:", data);

            // Bypass WebMIDI.js and use native Web MIDI API directly
            if (navigator.requestMIDIAccess) {
              try {
                const midiAccess = await navigator.requestMIDIAccess({
                  sysex: true,
                });
                midiAccess.outputs.forEach((midiOutput) => {
                  console.log("Sending to:", midiOutput.name);
                  midiOutput.send(data);
                });
              } catch (err) {
                console.error("Native MIDI send failed:", err);
              }
            }
            return;
          }

          // Handle all other message types with WebMIDI.js
          WebMidi.outputs.forEach((output) => {
            if (
              message.type === "noteon" &&
              message.note !== undefined &&
              message.velocity !== undefined &&
              message.channel !== undefined
            ) {
              output.sendNoteOn(message.note, {
                attack: message.velocity / 127,
                channels: [message.channel],
              });
            } else if (
              message.type === "noteoff" &&
              message.note !== undefined &&
              message.velocity !== undefined &&
              message.channel !== undefined
            ) {
              output.sendNoteOff(message.note, {
                release: message.velocity / 127,
                channels: [message.channel],
              });
            } else if (
              message.type === "controlchange" &&
              message.controller !== undefined &&
              message.value !== undefined &&
              message.channel !== undefined
            ) {
              output.sendControlChange(message.controller, message.value, {
                channels: [message.channel],
              });
            } else if (
              message.type === "pitchbend" &&
              message.value !== undefined &&
              message.channel !== undefined
            ) {
              output.sendPitchBend(message.value, {
                channels: [message.channel],
              });
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
