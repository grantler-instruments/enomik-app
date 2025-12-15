import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  isSidebarOpen: boolean;
  showHints: boolean;
  showSettingsModal: boolean;
  darkMode: boolean;
  setShowHints: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        isSidebarOpen: false,
        showHints: true,
        showSettingsModal: false,
        darkMode: false,
        setShowHints: (show) => set({ showHints: show }),
        setShowSettingsModal: (show) => set({ showSettingsModal: show }),
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      }),
      {
        name: 'app-storage', // localStorage key
      }
    ),
    { name: 'AppStore' }
  )
);
