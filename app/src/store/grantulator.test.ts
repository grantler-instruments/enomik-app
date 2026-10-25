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

import { useGrantulatorStore } from "./grantulator";

const store = () => useGrantulatorStore.getState();

describe("grantulator MIDI mappings", () => {
	beforeEach(() => store().reset());

	it("learns the next control change", () => {
		store().setLearning("position");
		store().handleControlChange(2, 74, 10);
		expect(store().mappings.position).toEqual({ channel: 2, controller: 74 });
		expect(store().learning).toBeNull();
		// Learning doesn't move the parameter.
		expect(store().values.position).toBe(0.5);
	});

	it("scales mapped control changes to the parameter range", () => {
		store().setMapping("size", { channel: 1, controller: 1 });
		store().handleControlChange(1, 1, 127);
		expect(store().values.size).toBe(2000);
		store().handleControlChange(1, 1, 0);
		expect(store().values.size).toBe(10);
	});

	it("ignores other channels and controllers", () => {
		store().setMapping("gain", { channel: 1, controller: 7 });
		store().handleControlChange(2, 7, 0);
		store().handleControlChange(1, 8, 0);
		expect(store().values.gain).toBe(0.7);
	});

	it("moves a control change to the parameter that learned it last", () => {
		store().setMapping("spread", { channel: 1, controller: 20 });
		store().setMapping("pitch", { channel: 1, controller: 20 });
		expect(store().mappings.spread).toBeUndefined();
		expect(store().mappings.pitch).toEqual({ channel: 1, controller: 20 });
	});

	it("switches the delay at the middle of the control range", () => {
		store().setLearning("delayEnabled");
		store().handleControlChange(1, 64, 0);
		expect(store().mappings.delayEnabled).toEqual({
			channel: 1,
			controller: 64,
		});
		store().handleControlChange(1, 64, 127);
		expect(store().delayEnabled).toBe(true);
		store().handleControlChange(1, 64, 63);
		expect(store().delayEnabled).toBe(false);
		store().handleControlChange(1, 64, 64);
		expect(store().delayEnabled).toBe(true);
	});

	it("moves a control change from a parameter to the delay switch", () => {
		store().setMapping("gain", { channel: 1, controller: 7 });
		store().setMapping("delayEnabled", { channel: 1, controller: 7 });
		expect(store().mappings.gain).toBeUndefined();
		store().handleControlChange(1, 7, 0);
		expect(store().values.gain).toBe(0.7);
	});

	it("switches the reverb from its own control change", () => {
		store().setMapping("delayEnabled", { channel: 1, controller: 64 });
		store().setMapping("reverbEnabled", { channel: 1, controller: 65 });
		store().handleControlChange(1, 65, 0);
		expect(store().reverbEnabled).toBe(false);
		expect(store().delayEnabled).toBe(false);
		store().handleControlChange(1, 65, 127);
		expect(store().reverbEnabled).toBe(true);
	});

	it("learns a note for a switch, and each press flips it", () => {
		store().setLearning("delayEnabled");
		store().handleNoteOn(10, 36);
		expect(store().mappings.delayEnabled).toEqual({ channel: 10, note: 36 });
		expect(store().delayEnabled).toBe(false);
		store().handleNoteOn(10, 36);
		expect(store().delayEnabled).toBe(true);
		store().handleNoteOn(10, 36);
		expect(store().delayEnabled).toBe(false);
		// Another note, or the same number as a control change, does nothing.
		store().handleNoteOn(10, 37);
		store().handleControlChange(10, 36, 127);
		expect(store().delayEnabled).toBe(false);
	});

	it("doesn't learn a note for a slider", () => {
		store().setLearning("position");
		store().handleNoteOn(1, 60);
		expect(store().mappings.position).toBeUndefined();
		expect(store().learning).toBe("position");
		store().handleControlChange(1, 74, 0);
		expect(store().mappings.position).toEqual({ channel: 1, controller: 74 });
	});

	it("moves a note from one switch to the other", () => {
		store().setMapping("delayEnabled", { channel: 1, note: 60 });
		store().setMapping("reverbEnabled", { channel: 1, note: 60 });
		expect(store().mappings.delayEnabled).toBeUndefined();
		store().handleNoteOn(1, 60);
		expect(store().reverbEnabled).toBe(false);
	});

	it("clears a mapping", () => {
		store().setMapping("pitch", { channel: 1, controller: 20 });
		store().clearMapping("pitch");
		expect(store().mappings.pitch).toBeUndefined();
	});
});
