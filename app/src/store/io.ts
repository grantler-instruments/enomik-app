import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  MIDI_NOTE_ON,
  MIDI_NOTE_OFF,
  MIDI_CONTROL_CHANGE,
  MIDI_PROGRAM_CHANGE,
  MIDI_PITCH_BEND,
  MIDI_POLY_AFTERTOUCH,
  sysexEnd,
  // sysexInput,
  sysexManufacturerId,
  // sysexOutput,
  sysexPinModeAnalogIn,
  sysexPinModeDigitalIn,
  sysexPinModeDigitalOut,
  sysexPinModePWMOut,
  sysexStart,
  sysexPinModeDigitalInPullup,
  sysexPinModeTouch,
} from "./midi.config";
import { useMIDIStore, type MidiMessage} from "./midi";


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

const ENOMIK_COMMAND_SET_PIN_CONFIG = 0x01;
// const ENOMIK_COMMAND_GET_PIN_CONFIG = 0x02;
const ENOMIK_COMMAND_ADD_PEER = 0x07;
const ENOMIK_COMMAND_RESET = 0x09;


const ESP_NOW_VERSION_MAJOR = 0
const ESP_NOW_VERSION_MINOR = 10
export {ESP_NOW_VERSION_MAJOR, ESP_NOW_VERSION_MINOR}

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

  saveToFile: () => void;
  loadFromFile: (json: {
    inputs?: InputPinConfig[];
    outputs?: OutputPinConfig[];
    peers?: PeerConfig[];
  }) => void;

  deploy: (deviceId: string) => void;
}

export const useIOStore = create<IOState>()(
  devtools(
    persist(
      (set, get) => ({
        inputs: [],
        outputs: [],
        peers: [],

        addInput: (input) =>
          set((state) => ({
            inputs: [...state.inputs, { ...input, uuid: uuidv4() }],
          })),

        updateInput: (uuid, patch) =>
          set((state) => ({
            inputs: state.inputs.map((i) =>
              i.uuid === uuid ? { ...i, ...patch } : i
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

            const newInput = { ...input, uuid: uuidv4() };
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
              o.uuid === uuid ? { ...o, ...patch } : o
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

            const newOutput = { ...output, uuid: uuidv4() };
            return {
              outputs: [...state.outputs, newOutput],
            };
          }),

        // ---------- FILE SAVE ----------
        saveToFile: () =>
          set((state) => {
            const data = {
              inputs: state.inputs,
              outputs: state.outputs,
              peers: state.peers,
            };
            const dataStr = JSON.stringify(data, null, 2);

            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = "io-config.json";
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

          set(() => ({ inputs, outputs, peers }));
        },

        addPeer: (peer) =>
          set((state) => ({
            peers: [...state.peers, { ...peer, uuid: uuidv4() }],
          })),

        updatePeer: (uuid: string, patch: Partial<PeerConfig>) =>
          set((state) => ({
            peers: state.peers.map((p) =>
              p.uuid === uuid ? { ...p, ...patch } : p
            ),
          })),

        removePeer: (uuid: string) =>
          set((state) => ({
            peers: state.peers.filter((p) => p.uuid !== uuid),
          })),

        deploy: (deviceId: string) => {
          // first reset
          const resetMessage: MidiMessage = {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 240,
            data: [
              sysexStart,
              sysexManufacturerId,
              ESP_NOW_VERSION_MAJOR,
              ESP_NOW_VERSION_MINOR,
              ENOMIK_COMMAND_RESET,
              sysexEnd,
            ],
          };
          useMIDIStore.getState().sendMessage(resetMessage, deviceId);

          const mapPitchBendTo7Bit = (value: number) => {
            // Clamp value to valid pitch bend range
            const clamped = Math.max(-8192, Math.min(8191, value));
            // Map -8192 to +8191 → 0 to 127
            return Math.round(((clamped + 8192) / 16383) * 127);
          };

          // set inputs
          get().inputs.forEach((input) => {
            const sysexMessage = [
              sysexStart,
              sysexManufacturerId,
              ESP_NOW_VERSION_MAJOR,
              ESP_NOW_VERSION_MINOR,
              ENOMIK_COMMAND_SET_PIN_CONFIG,
              input.pin,
              input.mode,
              input.threshold || 0,
              input.channel || 1,
              input.midiType / 2,
              input.midiType === MIDI_CONTROL_CHANGE
                ? input.controller ?? 0
                : input.note ?? 0,
              input.midiType === MIDI_PITCH_BEND
                ? mapPitchBendTo7Bit(input.midiMin)
                : input.midiMin,
              input.midiType === MIDI_PITCH_BEND
                ? mapPitchBendTo7Bit(input.midiMax)
                : input.midiMax,
              sysexEnd,
            ];
            const msg: MidiMessage = {
              id: uuidv4(),
              timestamp: Date.now(),
              type: 240,
              data: sysexMessage,
            };
            useMIDIStore.getState().sendMessage(msg, deviceId);
          });

          // set outputs
          get().outputs.forEach((output) => {
            const noteOrCC =
              output.midiType === MIDI_CONTROL_CHANGE
                ? output.controller ?? 0
                : output.note ?? 0;

            const sysexMessage = [
              sysexStart,
              sysexManufacturerId,
              ESP_NOW_VERSION_MAJOR,
              ESP_NOW_VERSION_MINOR,
              ENOMIK_COMMAND_SET_PIN_CONFIG,
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
              sysexEnd,
            ];
            const msg: MidiMessage = {
              id: uuidv4(),
              timestamp: Date.now(),
              type: 240,
              data: sysexMessage,
            };
            useMIDIStore.getState().sendMessage(msg, deviceId);
          });

          // set peers
          get().peers.forEach((peer) => {
            const macParts = peer.macAddress
              .replace(/:/g, "") // Remove colons: "ABCDEF123456"
              .split("") // Split into chars: ['A','B','C','D','E','F','1','2','3','4','5','6']
              .map((digit) => parseInt(digit, 16)); // This converts strings to numbers!

            const sysexMessage = [
              sysexStart,
              sysexManufacturerId,
              ESP_NOW_VERSION_MAJOR,
              ESP_NOW_VERSION_MINOR,
              ENOMIK_COMMAND_ADD_PEER,
              ...macParts,
              sysexEnd,
            ];
            const msg: MidiMessage = {
              id: uuidv4(),
              timestamp: Date.now(),
              type: 240,
              data: sysexMessage,
            };
            useMIDIStore.getState().sendMessage(msg, deviceId);
          });
        },
      }),
      { name: "IOStore" }
    )
  )
);
