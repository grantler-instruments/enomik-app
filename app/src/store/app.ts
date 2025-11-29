import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  themeMode: 'light' | 'dark';
  isSidebarOpen: boolean;
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      themeMode: 'light',
      isSidebarOpen: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    { name: 'AppStore' } // Label for Zustand DevTools
  )
);
