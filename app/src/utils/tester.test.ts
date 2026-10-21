import { describe, expect, it } from "vitest";
import {
	buttonEvent,
	macFromString,
	noteDown,
	parsePins,
	parseReply,
	sysex,
} from "./tester";

const reply = (cmd: number, payload: number[]) => [
	0x7d,
	0,
	19,
	cmd,
	...payload,
];

describe("tester", () => {
	it("configures a button as input pull-up sending CC <pin>", () => {
		expect(sysex.buttonConfig(16)).toEqual([
			0x7d, 0, 19, 0x01, 16, 0x02, 0, 1, 0x58, 16, 0, 127,
		]);
	});

	it("sends the typed MAC as nibbles in ADD_PEER", () => {
		expect(sysex.addPeer(macFromString("84:f7:03:F2:54:6")).slice(4)).toEqual([
			8, 4, 15, 7, 0, 3, 15, 2, 5, 4, 0, 6,
		]);
	});

	it("rejects malformed MACs", () => {
		expect(() => macFromString("84:F7:03")).toThrow();
		expect(() => macFromString("84:F7:03:F2:54:XX")).toThrow();
	});

	it("parses pin config acks and errors", () => {
		expect(parseReply(reply(0x41, [17, 2, 0, 1, 0x58, 17, 0, 127]))).toEqual({
			cmd: "pin_config",
			pin: 17,
		});
		expect(parseReply(reply(0x7f, [0x07, 0x09]))).toEqual({
			cmd: "error",
			failedRequest: 0x07,
			errorCode: 0x09,
		});
	});

	it("configures the LED as output on note <pin>", () => {
		expect(sysex.ledConfig(15).slice(4)).toEqual([
			15, 0x01, 0, 1, 0x48, 15, 0, 127,
		]);
	});

	it("sends a pin's note to another number for the loopback test", () => {
		expect(sysex.buttonConfig(16, 0x90, 15).slice(4)).toEqual([
			16, 0x02, 0, 1, 0x48, 15, 0, 127,
		]);
	});

	it("parses the MIDI loopback reply", () => {
		expect(sysex.setMidiLoopback(true).slice(3)).toEqual([0x0d, 1]);
		expect(parseReply([0x7d, 0, 19, 0x4d, 1])).toEqual({
			cmd: "midi_loopback",
			enabled: true,
		});
	});

	it("detects the loopback note, velocity 0 as release", () => {
		expect(noteDown([0x90, 15, 127], 15)).toBe(true);
		expect(noteDown([0x90, 15, 0], 15)).toBe(false);
		expect(noteDown([0x80, 15, 64], 15)).toBe(false);
		expect(noteDown([0x90, 16, 127], 15)).toBeNull();
		expect(noteDown([0x91, 15, 127], 15)).toBeNull();
	});

	it("configures touch pads in threshold mode sending CC <pin>", () => {
		expect(sysex.touchConfig(4).slice(4)).toEqual([
			4, 0x05, 20, 1, 0x58, 4, 0, 127,
		]);
		expect(buttonEvent([0xb0, 4, 127])).toBeNull();
		expect(buttonEvent([0xb0, 4, 127], [4])?.down).toBe(true);
		expect(parsePins(" 1, 2 3,")).toEqual([1, 2, 3]);
	});

	it("configures pitch bend with the halved status", () => {
		expect(sysex.buttonConfig(16, 0xe0)[8]).toBe(0x70);
	});

	it("detects presses and releases of every type on channel 1 only", () => {
		expect(buttonEvent([0xb0, 16, 127])).toEqual({
			pin: 16,
			status: 0xb0,
			down: true,
		});
		expect(buttonEvent([0x90, 16, 0])).toEqual({
			pin: 16,
			status: 0x90,
			down: false,
		});
		expect(buttonEvent([0x80, 17, 127])?.down).toBe(true);
		expect(buttonEvent([0xe0, 0x7f, 0x7f])).toEqual({
			pin: 16,
			status: 0xe0,
			down: true,
		});
		expect(buttonEvent([0xe0, 0, 0])?.down).toBe(false);
		expect(buttonEvent([0xb1, 16, 127])).toBeNull();
		expect(buttonEvent([0xb0, 18, 127])).toBeNull();
	});
});
