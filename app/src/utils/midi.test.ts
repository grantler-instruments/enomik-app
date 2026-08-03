import { describe, expect, it } from "vitest";
import {
	getChannel,
	getStatus,
	isNoteOff,
	isNoteOn,
	isStatus,
	MIDI_STATUS,
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
