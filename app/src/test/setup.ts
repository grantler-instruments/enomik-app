import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Node 25+ has a global localStorage that is unusable without --localstorage-file,
// and it hides jsdom's. Persisted zustand stores need a working one.
if (typeof globalThis.localStorage?.setItem !== "function") {
	const items = new Map<string, string>();
	const storage: Storage = {
		get length() {
			return items.size;
		},
		clear: () => items.clear(),
		getItem: (key) => items.get(key) ?? null,
		key: (index) => [...items.keys()][index] ?? null,
		removeItem: (key) => {
			items.delete(key);
		},
		setItem: (key, value) => {
			items.set(key, String(value));
		},
	};
	Object.defineProperty(globalThis, "localStorage", {
		value: storage,
		configurable: true,
		writable: true,
	});
}

// Runs for every test file; only jsdom files have a DOM to clean up.
if (typeof document !== "undefined") {
	const { cleanup } = await import("@testing-library/react");
	afterEach(() => cleanup());
}
