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
  sysexInput,
  sysexManufacturerId,
  sysexOutput,
  sysexPinModeAnalogIn,
  sysexPinModeDigitalIn,
  sysexPinModeDigitalOut,
  sysexPinModePWMOut,
  sysexStart,
  sysexPinModeDigitalInPullup,
} from "./midi.config";
import { useMIDIStore, type MidiMessage } from "./midi";

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
  | typeof sysexPinModePWMOut;
export type OutputPinMode =
  | typeof sysexPinModeDigitalOut
  | typeof sysexPinModePWMOut;

const ENOMIK_COMMAND_SET_PIN_CONFIG = 0x01;
const ENOMIK_COMMAND_GET_PIN_CONFIG = 0x02;
const ENOMIK_COMMAND_ADD_PEER = 0x07;
const ENOMIK_COMMAND_RESET = 0x09;

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

  deploy: () => void;
}

export const useIOStore = create<IOState>()(
  devtools(
    persist((set, get) => ({
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

      updateOutput: (uuid, patch) =>
        set((state) => ({
          outputs: state.outputs.map((o) =>
            o.uuid === uuid ? { ...o, ...patch } : o
          ),
        })),

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

        set(() => ({ inputs, outputs }));
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

      deploy: () => {
        console.log("Deploying configuration...");

        // first reset
        const resetMessage: MidiMessage = {
          id: uuidv4(),
          timestamp: Date.now(),
          type: 240,
          data: [
            sysexStart,
            sysexManufacturerId,
            ENOMIK_COMMAND_RESET,
            sysexEnd,
          ],
        };
        useMIDIStore.getState().sendMessage(resetMessage);

        // set inputs
        get().inputs.forEach((input) => {
          const sysexMessage = [
            sysexStart,
            sysexManufacturerId,
            ENOMIK_COMMAND_SET_PIN_CONFIG,
            input.pin,
            input.mode,
            input.channel || 1,
            input.midiType / 2,
            input.midiType === MIDI_CONTROL_CHANGE
              ? input.controller ?? 0
              : input.note ?? 0,
            input.midiMin,
            input.midiMax,
            sysexEnd,
          ];
          const msg: MidiMessage = {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 240,
            data: sysexMessage,
          };
          useMIDIStore.getState().sendMessage(msg);
        });

        // set inputs
        get().outputs.forEach((output) => {
          const sysexMessage = [
            sysexStart,
            sysexManufacturerId,
            ENOMIK_COMMAND_SET_PIN_CONFIG,
            output.pin,
            output.mode,
            output.midiType,
            output.midiMin,
            output.midiMax,
            sysexEnd,
          ];
          const msg: MidiMessage = {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 240,
            data: sysexMessage,
          };
          useMIDIStore.getState().sendMessage(msg);
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
          useMIDIStore.getState().sendMessage(msg);
        });
      },
    })),
    { name: "IOStore" }
  )
);
