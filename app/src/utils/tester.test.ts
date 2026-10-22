import { describe, expect, it, vi } from "vitest";
import {
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
	sysexManufacturerId,
} from "../store/midi.config";
import {
	boardInfoText,
	buttonEvent,
	macFromString,
	macToString,
	noteDown,
	type Port,
	parsePins,
	parseReply,
	readBoardInfo,
	request,
	setMidiLoopback,
	sysex,
	versionToString,
	writeDefaultConfig,
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

describe("board info", () => {
	const mac = [8, 4, 15, 7, 0, 3, 15, 2, 5, 4, 0, 6];
	const packet = (data: number[]) => [0xf0, ...data, 0xf7];
	const from = (minor: number, cmd: number, payload: number[]) =>
		packet([sysexManufacturerId, 0, minor, cmd, ...payload]);

	it("parses MAC replies, including the pre-0.13 echo of GET_MAC", () => {
		expect(parseReply(reply(0x46, mac))).toEqual({
			cmd: "mac",
			mac: [0x84, 0xf7, 0x03, 0xf2, 0x54, 0x06],
			header: { major: ESP_NOW_VERSION_MAJOR, minor: ESP_NOW_VERSION_MINOR },
		});
		expect(
			parseReply([sysexManufacturerId, 0, 12, 0x06, ...mac]),
		).toMatchObject({ cmd: "mac", header: { major: 0, minor: 12 } });
	});

	it("ignores truncated or invalid MAC replies", () => {
		expect(parseReply(reply(0x46, mac.slice(0, 11)))).toBeNull();
		expect(parseReply(reply(0x46, [...mac.slice(0, 11), 16]))).toBeNull();
	});

	it("parses version replies with and without patch", () => {
		expect(parseReply(reply(0x4a, [0, 18]))).toEqual({
			cmd: "version",
			version: { major: 0, minor: 18, patch: undefined },
		});
		expect(parseReply(reply(0x4a, [0, 19, 2]))).toMatchObject({
			version: { major: 0, minor: 19, patch: 2 },
		});
		expect(parseReply(reply(0x4a, [0]))).toBeNull();
	});

	it("formats MACs and versions", () => {
		expect(macToString([0x84, 0xf7, 0x03, 0xf2, 0x54, 0x06])).toBe(
			"84:F7:03:F2:54:06",
		);
		expect(versionToString({ major: 0, minor: 19, patch: 0 })).toBe("0.19.0");
		expect(versionToString({ major: 0, minor: 12 })).toBe("0.12");
		expect(boardInfoText(null)).toBe("reading firmware and MAC…");
		expect(
			boardInfoText({
				mac: [0, 1, 2, 3, 4, 255],
				version: { major: 0, minor: 19, patch: 1 },
			}),
		).toBe("firmware 0.19.1 · MAC 00:01:02:03:04:FF");
		expect(boardInfoText({ mac: null, version: null })).toBe(
			"firmware unknown · MAC unknown",
		);
	});

	it("reads MAC and version from a current board", async () => {
		const port = fakePort([from(19, 0x46, mac), from(19, 0x4a, [0, 19, 0])]);
		expect(await readBoardInfo(port)).toEqual({
			mac: [0x84, 0xf7, 0x03, 0xf2, 0x54, 0x06],
			version: { major: 0, minor: 19, patch: 0 },
		});
	});

	it("takes the version from the MAC reply when GET_VERSION is unknown", async () => {
		const port = fakePort([
			from(12, 0x06, mac),
			from(12, 0x7f, [0x0a, 0x02]), // GET_VERSION: unknown command
		]);
		expect(await readBoardInfo(port)).toEqual({
			mac: [0x84, 0xf7, 0x03, 0xf2, 0x54, 0x06],
			version: { major: 0, minor: 12 },
		});
	});

	it("gives up on a board that never answers (dongle before 0.19)", async () => {
		vi.useFakeTimers();
		try {
			const info = readBoardInfo(fakePort([]));
			await vi.advanceTimersByTimeAsync(4000);
			expect(await info).toEqual({ mac: null, version: null });
		} finally {
			vi.useRealTimers();
		}
	});

	it("keeps the MAC when only GET_VERSION times out", async () => {
		vi.useFakeTimers();
		try {
			const info = readBoardInfo(fakePort([from(12, 0x06, mac)]));
			await vi.advanceTimersByTimeAsync(1000);
			expect(await info).toMatchObject({ version: { major: 0, minor: 12 } });
		} finally {
			vi.useRealTimers();
		}
	});

	it("ignores another board's or a garbled reply", async () => {
		const port = fakePort([
			packet([0x7e, 0, 19, 0x46, ...mac]), // other manufacturer
			from(19, 0x46, [1, 2, 3]), // truncated
			from(19, 0x46, mac),
			from(19, 0x4a, [0, 19, 0]),
		]);
		expect((await readBoardInfo(port)).mac).toEqual([
			0x84, 0xf7, 0x03, 0xf2, 0x54, 0x06,
		]);
	});
});

describe("default configuration", () => {
	const ack = (cmd: number, payload: number[]) => [
		0xf0,
		...reply(cmd, payload),
		0xf7,
	];
	const pinAck = (pin: number) => ack(0x41, [pin, 0, 0, 1, 0x58, pin, 0, 127]);
	const answers = [
		ack(0x49, []),
		pinAck(16),
		pinAck(17),
		pinAck(15),
		ack(0x4d, [1]),
		ack(0x47, [1]),
	];
	const dongleMac = [0x84, 0xf7, 0x03, 0xf2, 0x54, 0x06];

	it("resets, sets the buttons, the LED on CC 16, loopback and the dongle peer", async () => {
		const sent: number[][] = [];
		const lines = await writeDefaultConfig(fakePort(answers, sent), {
			ledPin: 15,
			dongleMac,
		});
		expect(lines.every((line) => line.ok)).toBe(true);
		expect(sent.map((packet) => packet[4])).toEqual([
			0x09, 0x01, 0x01, 0x01, 0x0d, 0x07,
		]);
		expect(sent[1]).toEqual(sysex.buttonConfig(16));
		expect(sent[2]).toEqual(sysex.buttonConfig(17));
		// pin 15, digital out, CC (0xB0 / 2) 16, values 0–127
		expect(payload(sent[3])).toEqual([15, 0x01, 0, 1, 0x58, 16, 0, 127]);
		expect(payload(sent[4])).toEqual([1]);
		expect(payload(sent[5])).toEqual([8, 4, 15, 7, 0, 3, 15, 2, 5, 4, 0, 6]);
	});

	it("pairs no dongle when its MAC is unknown", async () => {
		const sent: number[][] = [];
		const lines = await writeDefaultConfig(fakePort(answers, sent), {
			ledPin: 15,
			dongleMac: null,
		});
		expect(lines).toHaveLength(5);
		expect(sent.some((packet) => packet[4] === 0x07)).toBe(false);
	});

	it("uses the chosen LED pin", async () => {
		const sent: number[][] = [];
		await writeDefaultConfig(fakePort([...answers, pinAck(21)], sent), {
			ledPin: 21,
			dongleMac: null,
		});
		expect(payload(sent[3])[0]).toBe(21);
	});

	it("reports each unacknowledged step and still writes the rest", async () => {
		vi.useFakeTimers();
		try {
			const sent: number[][] = [];
			const write = writeDefaultConfig(
				fakePort(
					answers.filter((_, i) => i !== 0 && i !== 4),
					sent,
				),
				{ ledPin: 15, dongleMac },
			);
			await vi.advanceTimersByTimeAsync(5000);
			const lines = await write;
			expect(lines.filter((line) => !line.ok).map((line) => line.text)).toEqual(
				["reset: no pins, no peers", "MIDI loopback on"],
			);
			expect(sent).toHaveLength(6);
		} finally {
			vi.useRealTimers();
		}
	});

	it("treats an already paired dongle as success", async () => {
		const lines = await writeDefaultConfig(
			fakePort([...answers.slice(0, 5), ack(0x7f, [0x07, 0x09])]),
			{ ledPin: 15, dongleMac },
		);
		expect(lines.at(-1)).toEqual({
			text: "add dongle 84:F7:03:F2:54:06 as peer",
			ok: true,
		});
	});
});

/** Port whose input answers every send with these packets, in order. */
function fakePort(answers: number[][], sent: number[][] = []): Port {
	const listeners = new Set<(event: MIDIMessageEvent) => void>();
	const input = {
		addEventListener: (_: string, l: (event: MIDIMessageEvent) => void) =>
			listeners.add(l),
		removeEventListener: (_: string, l: (event: MIDIMessageEvent) => void) =>
			listeners.delete(l),
		open: async () => input,
	};
	const output = {
		send: (data: number[]) => {
			sent.push(data);
			for (const data of answers)
				for (const l of [...listeners])
					l({ data: new Uint8Array(data) } as MIDIMessageEvent);
		},
	};
	return { input, output } as unknown as Port;
}
