import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface InspectorState {
  peers: string[];
  inputPinConfigs: any[];
  outputPinConfigs: any[];
  clear: () => void;
  setPeers: (newPeers: string[]) => void;
  addInputPinConfig: (config: any) => void;
  addOutputPinConfig: (config: any) => void;
}

export const useInspectorStore = create<InspectorState>()(
  devtools(
    persist(
      (set, get) => ({
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
        partialize: (state) => ({}),
      }
    )
  )
);
