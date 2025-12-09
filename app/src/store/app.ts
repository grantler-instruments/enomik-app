import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  themeMode: 'light' | 'dark';
  isSidebarOpen: boolean;
  showHints: boolean;
  showSettingsModal: boolean;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setShowHints: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      themeMode: 'light',
      isSidebarOpen: false,
      showHints: true,
      showSettingsModal: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setShowHints: (show) => set({ showHints: show }),
      setShowSettingsModal: (show) => set({ showSettingsModal: show }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    { name: 'AppStore' } // Label for Zustand DevTools
  )
);
