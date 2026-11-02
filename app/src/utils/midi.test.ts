import { describe, expect, it } from "vitest";
import {
	getChannel,
	getStatus,
	hexDigits,
	hexStringToBytes,
	isNoteOff,
	isNoteOn,
	isStatus,
	MIDI_STATUS,
	sysexHexError,
	typeToLabel,
} from "./midi";

describe("MIDI utilities", () => {
	it("extracts the status and channel from channel messages", () => {
		expect(getStatus(0x93)).toBe(MIDI_STATUS.NOTE_ON);
		expect(getChannel(0x93)).toBe(3);
	});

	it("recognizes status bytes", () => {
		expect(isStatus(0x80)).toBe(true);
		expect(isStatus(0x7f)).toBe(false);
	});

	it("handles note-on and note-off velocity conventions", () => {
		expect(isNoteOn(MIDI_STATUS.NOTE_ON, 1)).toBe(true);
		expect(isNoteOn(MIDI_STATUS.NOTE_ON, 0)).toBe(false);
		expect(isNoteOff(MIDI_STATUS.NOTE_OFF, 64)).toBe(true);
		expect(isNoteOff(MIDI_STATUS.NOTE_ON, 0)).toBe(true);
	});

	it("maps known and unknown message types to display labels", () => {
		expect(typeToLabel(MIDI_STATUS.CONTROL_CHANGE)).toBe("Control Change");
		expect(typeToLabel(0x00)).toBe("Unknown");
	});
});

describe("hexStringToBytes", () => {
	it("reads two hex digits per byte", () => {
		expect(hexStringToBytes("431200")).toEqual([0x43, 0x12, 0x00]);
	});

	it("ignores whitespace and case", () => {
		expect(hexStringToBytes(" 7d 0a\tFF\n")).toEqual([0x7d, 0x0a, 0xff]);
	});

	it("is empty for empty input", () => {
		expect(hexStringToBytes("")).toEqual([]);
		expect(hexStringToBytes("   ")).toEqual([]);
	});

	it("reads a trailing single digit as its own byte", () => {
		expect(hexStringToBytes("ABC")).toEqual([0xab, 0x0c]);
	});

	it("drops characters that are not hex instead of producing NaN", () => {
		expect(hexStringToBytes("ZZ")).toEqual([]);
		expect(hexStringToBytes("0x7d, 0x0a")).toEqual([0x07, 0xd0, 0x0a]);
		expect(hexStringToBytes("7d-0a:Xg")).toEqual([0x7d, 0x0a]);
	});
});

describe("hexDigits", () => {
	it("keeps hex digits, uppercased", () => {
		expect(hexDigits("7d 0a-ff:zz")).toBe("7D0AFF");
	});
});

describe("sysexHexError", () => {
	it("accepts complete 7-bit bytes and empty text", () => {
		expect(sysexHexError("00 7F 12")).toBeNull();
		expect(sysexHexError("")).toBeNull();
	});

	it("flags an odd number of digits as incomplete", () => {
		expect(sysexHexError("7")).toBe("incomplete");
		expect(sysexHexError("00 1")).toBe("incomplete");
	});

	it("flags bytes from 80 up, which are status bytes, not data", () => {
		expect(sysexHexError("80")).toBe("not_7bit");
		expect(sysexHexError("01 FF")).toBe("not_7bit");
	});
});
