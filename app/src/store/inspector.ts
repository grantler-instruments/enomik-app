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

        addInputPinConfig: (config: InputPinConfig) =>
          set((state) => ({
            inputPinConfigs: [
              ...state.inputPinConfigs.filter((c) => c.pin !== config.pin),
              config,
            ],
          })),

        addOutputPinConfig: (config: OutputPinConfig) =>
          set((state) => ({
            outputPinConfigs: [
              ...state.outputPinConfigs.filter((c) => c.pin !== config.pin),
              config,
            ],
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
