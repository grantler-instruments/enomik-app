import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AppState {
	isSidebarOpen: boolean;
	showHints: boolean;
	showSettingsModal: boolean;
	darkMode: boolean;
	/** Board set the configurator's board section shows, see BOARD_SETS. */
	configuratorBoard: string;
	setConfiguratorBoard: (id: string) => void;
	/** Open state of accordions the user toggled, by key. */
	accordions: Record<string, boolean>;
	setAccordionOpen: (key: string, open: boolean) => void;
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
				configuratorBoard: "enomik_3000",
				setConfiguratorBoard: (id) => set({ configuratorBoard: id }),
				accordions: {},
				setAccordionOpen: (key, open) =>
					set((state) => ({
						accordions: { ...state.accordions, [key]: open },
					})),
				setShowHints: (show) => set({ showHints: show }),
				setShowSettingsModal: (show) => set({ showSettingsModal: show }),
				toggleSidebar: () =>
					set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
				toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
			}),
			{
				name: "app-storage", // localStorage key
			},
		),
		{ name: "AppStore" },
	),
);

/**
 * Remembered open state of an accordion, like useState. Until the user
 * toggles it, the fallback decides.
 */
export const useAccordionOpen = (
	key: string,
	fallback: boolean | (() => boolean),
) => {
	const stored = useAppStore((state) => state.accordions[key]);
	const setAccordionOpen = useAppStore((state) => state.setAccordionOpen);
	const open =
		stored ?? (typeof fallback === "function" ? fallback() : fallback);
	const setOpen = (value: boolean) => setAccordionOpen(key, value);
	return [open, setOpen] as const;
};
