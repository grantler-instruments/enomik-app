import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { InputPinConfig, OutputPinConfig } from "./io";

interface InspectorState {
  peers: string[];
  inputPinConfigs: InputPinConfig[];
  outputPinConfigs: OutputPinConfig[];
  clear: () => void;
  setPeers: (newPeers: string[]) => void;
  addInputPinConfig: (config: any) => void;
  addOutputPinConfig: (config: any) => void;
}

export const useInspectorStore = create<InspectorState>()(
  devtools(
    persist(
      (set) => ({
        peers: [],
        inputPinConfigs: [],
        outputPinConfigs: [],
        setPeers: (newPeers: string[]) =>
          set(() => ({
            peers: newPeers,
          })),
          addInputPinConfig: (config: any) =>
          set((state) => ({
            inputPinConfigs: [...state.inputPinConfigs, config],
          })),
          addOutputPinConfig: (config: any) =>
          set((state) => ({
            outputPinConfigs: [...state.outputPinConfigs, config],
          })),
        clear: () => {
          set({ peers: [], inputPinConfigs: [], outputPinConfigs: [] });
        },
      }),
      {
        name: "InspectorStore",
      }
    )
  )
);
