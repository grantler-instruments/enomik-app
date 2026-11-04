import { beforeEach, describe, expect, it, vi } from "vitest";

// The store persists to localStorage, which node doesn't have.
vi.hoisted(() => {
	const items = new Map<string, string>();
	globalThis.localStorage = {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => items.set(key, value),
		removeItem: (key: string) => items.delete(key),
	} as unknown as Storage;
});

import { useMpcStore } from "./mpc";

const store = () => useMpcStore.getState();

describe("mpc pads", () => {
	beforeEach(() => store().reset());

	it("maps notes 36 to 51 on channel 1 by default", () => {
		expect(store().handleNoteOn(1, 36, 127)).toEqual([{ pad: 0, velocity: 1 }]);
		expect(store().handleNoteOn(1, 51, 127)).toEqual([
			{ pad: 15, velocity: 1 },
		]);
		expect(store().handleNoteOn(2, 36, 127)).toEqual([]);
		expect(store().handleNoteOn(1, 52, 127)).toEqual([]);
	});

	it("scales the velocity to 0..1", () => {
		const [hit] = store().handleNoteOn(1, 40, 64);
		expect(hit.velocity).toBeCloseTo(64 / 127);
	});

	it("learns the next note without playing it", () => {
		store().setLearning({ kind: "trigger", pad: 3 });
		expect(store().handleNoteOn(5, 60, 100)).toEqual([]);
		expect(store().mappings[3]).toEqual({ channel: 5, note: 60 });
		expect(store().learning).toBeNull();
		expect(store().handleNoteOn(5, 60, 127)).toEqual([{ pad: 3, velocity: 1 }]);
	});

	it("moves a learned note away from the pad that had it", () => {
		store().setLearning({ kind: "trigger", pad: 5 });
		store().handleNoteOn(1, 36, 100);
		expect(store().mappings[0]).toBeNull();
		expect(store().handleNoteOn(1, 36, 127)).toEqual([{ pad: 5, velocity: 1 }]);
	});

	it("triggers on control changes above 0, e.g. touch pads", () => {
		store().setLearning({ kind: "trigger", pad: 7 });
		store().handleControlChange(1, 20, 0);
		// A release doesn't learn.
		expect(store().learning).toEqual({ kind: "trigger", pad: 7 });
		store().handleControlChange(1, 20, 127);
		expect(store().mappings[7]).toEqual({ channel: 1, controller: 20 });
		expect(store().handleControlChange(1, 20, 127)).toEqual([
			{ pad: 7, velocity: 1 },
		]);
		expect(store().handleControlChange(1, 20, 0)).toEqual([]);
	});

	it("clears a mapping", () => {
		store().setMapping({ kind: "trigger", pad: 0 }, null);
		expect(store().handleNoteOn(1, 36, 127)).toEqual([]);
	});

	it("learns a control change for a pad volume and scales it", () => {
		store().setLearning({ kind: "volume", pad: 2 });
		// A note has no value: it doesn't map a volume.
		store().handleNoteOn(1, 60, 100);
		expect(store().volumeMappings[2]).toBeNull();
		store().handleControlChange(1, 7, 0);
		expect(store().volumeMappings[2]).toEqual({ channel: 1, controller: 7 });
		expect(store().handleControlChange(1, 7, 127)).toEqual([]);
		expect(store().padVolumes[2]).toBe(1);
		store().handleControlChange(1, 7, 0);
		expect(store().padVolumes[2]).toBe(0);
		expect(store().padVolumes[3]).toBe(1);
	});

	it("learns a control change for the master volume", () => {
		store().setLearning({ kind: "master" });
		store().handleControlChange(2, 1, 50);
		expect(store().masterMapping).toEqual({ channel: 2, controller: 1 });
		store().handleControlChange(2, 1, 127);
		expect(store().volume).toBe(1);
	});

	it("moves a control change from a trigger to a volume", () => {
		store().setMapping(
			{ kind: "trigger", pad: 0 },
			{ channel: 1, controller: 20 },
		);
		store().setLearning({ kind: "volume", pad: 0 });
		store().handleControlChange(1, 20, 64);
		expect(store().mappings[0]).toBeNull();
		expect(store().volumeMappings[0]).toEqual({ channel: 1, controller: 20 });
	});
});
