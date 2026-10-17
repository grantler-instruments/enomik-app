import { describe, expect, it } from "vitest";
import { decodeSeptets32 } from "./midi.config";

describe("decodeSeptets32", () => {
	it("decodes 5 septets, most significant first", () => {
		// 200000 = 0b1100_0011010_1000000
		expect(decodeSeptets32([0, 0, 12, 26, 64], 0)).toBe(200000);
	});

	it("reads at an offset", () => {
		expect(decodeSeptets32([9, 9, 0, 0, 0, 0, 42], 2)).toBe(42);
	});

	it("keeps the full 32-bit range unsigned", () => {
		expect(decodeSeptets32([0x0f, 0x7f, 0x7f, 0x7f, 0x7f], 0)).toBe(0xffffffff);
	});
});
