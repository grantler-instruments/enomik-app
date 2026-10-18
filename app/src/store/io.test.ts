import { describe, expect, it } from "vitest";
import { findDuplicatePins, nextFreePin } from "./io";

describe("findDuplicatePins", () => {
	it("flags a pin used twice within inputs", () => {
		// e.g. touch on 4 and analog on 4
		expect(findDuplicatePins([{ pin: 4 }, { pin: 4 }, { pin: 5 }], [])).toEqual(
			new Set([4]),
		);
	});

	it("flags a pin used by an input and an output", () => {
		expect(findDuplicatePins([{ pin: 2 }], [{ pin: 2 }, { pin: 3 }])).toEqual(
			new Set([2]),
		);
	});

	it("is empty when every pin is unique", () => {
		expect(findDuplicatePins([{ pin: 1 }, { pin: 2 }], [{ pin: 3 }]).size).toBe(
			0,
		);
	});
});

describe("nextFreePin", () => {
	it("skips pins used by inputs and outputs", () => {
		expect(nextFreePin([{ pin: 0 }, { pin: 1 }], [{ pin: 2 }])).toBe(3);
	});

	it("starts searching at `from`", () => {
		expect(nextFreePin([{ pin: 4 }, { pin: 5 }], [], 5)).toBe(6);
		expect(nextFreePin([{ pin: 4 }], [], 7)).toBe(7);
	});
});
