import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type MidiType = 'cc' | 'noteon' | 'pitchbend' | 'aftertouch';
export type PinMode = 'analog' | 'digital';

export interface InputPinConfig {
  uuid: string;
  pin: number;
  mode: PinMode;
  midiType: MidiType;
  inputMin?: number;
  inputMax?: number;
  outputMin?: number;
  outputMax?: number;
  controller?: number;
  note?: number;
}

export type OutputPinMode = 'digital' | 'pwm';

export interface OutputPinConfig {
  uuid: string;
  pin: number;
  mode: OutputPinMode;
  midiType: MidiType;
  channel?: number;
  controller?: number;
  note?: number;
  velocitySensitive?: boolean;
  outputMin?: number;
  outputMax?: number;
}

interface IOState {
  inputs: InputPinConfig[];
  outputs: OutputPinConfig[];

  addInput: (input: Omit<InputPinConfig, 'uuid'>) => void;
  updateInput: (uuid: string, patch: Partial<InputPinConfig>) => void;
  removeInput: (uuid: string) => void;

  addOutput: (output: Omit<OutputPinConfig, 'uuid'>) => void;
  updateOutput: (uuid: string, patch: Partial<OutputPinConfig>) => void;
  removeOutput: (uuid: string) => void;

  saveToFile: () => void;
  loadFromFile: (json: { inputs?: InputPinConfig[]; outputs?: OutputPinConfig[] }) => void;
}

export const useIOStore = create<IOState>()(
  devtools(
    persist(
      (set) => ({
        inputs: [],
        outputs: [],

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

        // ---------- FILE SAVE ----------
        saveToFile: () =>
          set((state) => {
            const data = { inputs: state.inputs, outputs: state.outputs };
            const dataStr = JSON.stringify(data, null, 2);

            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = 'io-config.json';
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

          set(() => ({ inputs, outputs }));
        },
      }),
      { name: 'IOStore' }
    )
  )
);
