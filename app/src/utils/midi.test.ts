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
	messageToBytes,
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

	it("names the system messages", () => {
		expect(typeToLabel(MIDI_STATUS.TIMING_CLOCK)).toBe("Clock");
		expect(typeToLabel(MIDI_STATUS.ACTIVE_SENSING)).toBe("Active Sensing");
		expect(typeToLabel(MIDI_STATUS.RESET)).toBe("Reset");
		expect(typeToLabel(MIDI_STATUS.TUNE_REQUEST)).toBe("Tune Request");
		expect(typeToLabel(MIDI_STATUS.SONG_POSITION)).toBe("Song Position");
		expect(typeToLabel(MIDI_STATUS.SONG_SELECT)).toBe("Song Select");
		expect(typeToLabel(MIDI_STATUS.MTC_QUARTER)).toBe("MTC Quarter Frame");
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

describe("messageToBytes", () => {
	const { NOTE_ON, NOTE_OFF, POLY_PRESSURE, CONTROL_CHANGE, PROGRAM_CHANGE } =
		MIDI_STATUS;

	it("puts the channel into the status byte", () => {
		expect(
			messageToBytes({ type: NOTE_ON, channel: 1, note: 60, velocity: 100 }),
		).toEqual([0x90, 60, 100]);
		expect(
			messageToBytes({ type: NOTE_OFF, channel: 16, note: 61, velocity: 0 }),
		).toEqual([0x8f, 61, 0]);
	});

	it("encodes every channel message type", () => {
		expect(
			messageToBytes({ type: POLY_PRESSURE, channel: 2, note: 64, value: 30 }),
		).toEqual([0xa1, 64, 30]);
		expect(
			messageToBytes({
				type: CONTROL_CHANGE,
				channel: 3,
				controller: 74,
				value: 14,
			}),
		).toEqual([0xb2, 74, 14]);
		expect(
			messageToBytes({ type: PROGRAM_CHANGE, channel: 1, controller: 5 }),
		).toEqual([0xc0, 5]);
		expect(
			messageToBytes({
				type: MIDI_STATUS.CHANNEL_PRESSURE,
				channel: 1,
				value: 90,
			}),
		).toEqual([0xd0, 90]);
	});

	it("keeps controller 0 (bank select)", () => {
		expect(
			messageToBytes({
				type: CONTROL_CHANGE,
				channel: 1,
				controller: 0,
				value: 1,
			}),
		).toEqual([0xb0, 0, 1]);
	});

	it("splits pitch bend into LSB and MSB", () => {
		expect(
			messageToBytes({
				type: MIDI_STATUS.PITCH_BEND,
				channel: 1,
				pitchBendValue: 8192,
			}),
		).toEqual([0xe0, 0x00, 0x40]);
		expect(
			messageToBytes({
				type: MIDI_STATUS.PITCH_BEND,
				channel: 1,
				pitchBendValue: 16383,
			}),
		).toEqual([0xe0, 0x7f, 0x7f]);
		expect(
			messageToBytes({
				type: MIDI_STATUS.PITCH_BEND,
				channel: 1,
				pitchBendValue: 0,
			}),
		).toEqual([0xe0, 0, 0]);
	});

	it("returns SysEx as received and real-time messages as one byte", () => {
		const sysex = [0xf0, 0x7d, 1, 2, 0xf7];
		expect(
			messageToBytes({ type: MIDI_STATUS.SYSEX_START, data: sysex }),
		).toEqual(sysex);
		expect(messageToBytes({ type: MIDI_STATUS.TIMING_CLOCK })).toEqual([0xf8]);
		expect(messageToBytes({ type: MIDI_STATUS.START })).toEqual([0xfa]);
	});
});
