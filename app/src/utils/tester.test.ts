import { describe, expect, it } from "vitest";
import {
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
	sysexManufacturerId,
} from "../store/midi.config";
import {
	buttonEvent,
	macFromString,
	noteDown,
	type Port,
	parsePins,
	parseReply,
	request,
	setMidiLoopback,
	sysex,
} from "./tester";

const header = [
	sysexManufacturerId,
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
];

const reply = (cmd: number, payload: number[]) => [...header, cmd, ...payload];

/** Payload of a full packet built by sysex.*: drop F0, header, command, F7. */
const payload = (packet: number[]) => packet.slice(5, -1);

describe("tester", () => {
	it("configures a button as input pull-up sending CC <pin>", () => {
		expect(sysex.buttonConfig(16)).toEqual([
			0xf0,
			...header,
			0x01,
			16,
			0x02,
			0,
			1,
			0x58,
			16,
			0,
			127,
			0xf7,
		]);
	});

	it("sends the typed MAC as nibbles in ADD_PEER", () => {
		expect(payload(sysex.addPeer(macFromString("84:f7:03:F2:54:6")))).toEqual([
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
		expect(payload(sysex.ledConfig(15))).toEqual([
			15, 0x01, 0, 1, 0x48, 15, 0, 127,
		]);
	});

	it("sends a pin's note to another number for the loopback test", () => {
		expect(payload(sysex.buttonConfig(16, 0x90, 15))).toEqual([
			16, 0x02, 0, 1, 0x48, 15, 0, 127,
		]);
	});

	it("parses the MIDI loopback reply", () => {
		expect(sysex.setMidiLoopback(true).slice(4)).toEqual([0x0d, 1, 0xf7]);
		expect(parseReply(reply(0x4d, [1]))).toEqual({
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
		expect(payload(sysex.touchConfig(4))).toEqual([
			4, 0x05, 20, 1, 0x58, 4, 0, 127,
		]);
		expect(buttonEvent([0xb0, 4, 127])).toBeNull();
		expect(buttonEvent([0xb0, 4, 127], [4])?.down).toBe(true);
		expect(parsePins(" 1, 2 3,")).toEqual([1, 2, 3]);
	});

	it("configures pitch bend with the halved status", () => {
		expect(payload(sysex.buttonConfig(16, 0xe0))[4]).toBe(0x70);
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

	it("only takes error replies for the command it sent", async () => {
		// The board answers SET_MIDI_LOOPBACK with an error for SET_PIN_CONFIG
		// (another request in flight), then with the loopback reply.
		const answers = [
			[0xf0, ...reply(0x7f, [0x01, 0x04]), 0xf7],
			[0xf0, ...reply(0x4d, [1]), 0xf7],
		];
		expect(await setMidiLoopback(fakePort(answers), true)).toBe(true);
		const ownError = [[0xf0, ...reply(0x7f, [0x0d, 0x06]), 0xf7]];
		expect(
			await request(
				fakePort(ownError),
				sysex.setMidiLoopback(true),
				() => false,
			),
		).toMatchObject({ cmd: "error", failedRequest: 0x0d });
	});
});

/** Port whose input answers every send with these packets, in order. */
function fakePort(answers: number[][]): Port {
	const listeners = new Set<(event: MIDIMessageEvent) => void>();
	const input = {
		addEventListener: (_: string, l: (event: MIDIMessageEvent) => void) =>
			listeners.add(l),
		removeEventListener: (_: string, l: (event: MIDIMessageEvent) => void) =>
			listeners.delete(l),
		open: async () => input,
	};
	const output = {
		send: () => {
			for (const data of answers)
				for (const l of [...listeners])
					l({ data: new Uint8Array(data) } as MIDIMessageEvent);
		},
	};
	return { input, output } as unknown as Port;
}
