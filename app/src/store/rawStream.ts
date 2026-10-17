import { create } from "zustand";

/** One RAW_VALUE frame (0x17): live reading of an input pin. */
export interface RawValue {
	pin: number;
	mode: number;
	/** Last reading: touchRead(), analogRead() or digital 0/1 */
	raw: number;
	/** Touch: untouched reading; else 0 */
	baseline: number;
	/** Touch continuous: change from baseline that maps to 127; else 0 */
	peak: number;
	/** Touch: change from baseline in %, at most 127; else 0 */
	percent: number;
	/** Reading as 0–127 (touch threshold mode: 0 / 127) */
	norm: number;
	threshold: number;
	/** Touch threshold mode: true while touched */
	active: boolean;
	timestamp: number;
}

interface RawStreamState {
	active: boolean;
	values: Record<number, RawValue>;
	error: string | null;
	setActive: (active: boolean) => void;
	setValue: (value: RawValue) => void;
	setError: (error: string | null) => void;
	clear: () => void;
}

// Not persisted and no devtools: frames arrive at up to 50 Hz per pin.
export const useRawStreamStore = create<RawStreamState>()((set) => ({
	active: false,
	values: {},
	error: null,
	setActive: (active: boolean) => set(() => ({ active })),
	setValue: (value: RawValue) =>
		set((state) => ({ values: { ...state.values, [value.pin]: value } })),
	setError: (error: string | null) => set(() => ({ error })),
	clear: () => set(() => ({ values: {}, error: null })),
}));
