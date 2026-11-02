import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	activeConfigs,
	configFromFile,
	findDuplicatePins,
	findInvalidPeers,
	nextFreePin,
	useIOStore,
} from "./io";
import { type MidiMessage, useMIDIStore } from "./midi";
import {
	ENOMIK_COMMAND_ADD_PEER,
	ENOMIK_COMMAND_SET_PIN_CONFIG,
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
	sysexPinModePWMOut,
	sysexPinModeTouch,
} from "./midi.config";

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

	it("ignores muted rows, which are never deployed", () => {
		expect(
			findDuplicatePins(
				[{ pin: 4 }, { pin: 4, muted: true }],
				[{ pin: 4, muted: true }],
			).size,
		).toBe(0);
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

describe("configFromFile", () => {
	const peers = [{ macAddress: "12:34:56:78:9A:BC" }];
	const clientFile = {
		kind: "client" as const,
		inputs: [],
		outputs: [],
		peers,
		powerSave: true,
		name: "board",
	};

	it("loads a client file into the client config as is", () => {
		expect(configFromFile(clientFile, "client")).toEqual({
			config: clientFile,
		});
	});

	it("loads only the peers of a dongle file", () => {
		expect(configFromFile({ kind: "dongle", peers }, "dongle")).toEqual({
			config: { peers },
		});
	});

	it("refuses a file saved for the other kind", () => {
		expect(configFromFile(clientFile, "dongle")).toEqual({
			mismatch: "client",
		});
		expect(configFromFile({ kind: "dongle", peers }, "client")).toEqual({
			mismatch: "dongle",
		});
	});

	it("imports files without kind, taking only peers into a dongle", () => {
		const { kind: _, ...legacy } = clientFile;
		expect(configFromFile(legacy, "client")).toEqual({ config: legacy });
		expect(configFromFile(legacy, "dongle")).toEqual({ config: { peers } });
	});

	it("treats an unknown kind like a file without kind", () => {
		const file = { ...clientFile, kind: "mixer" } as unknown as Parameters<
			typeof configFromFile
		>[0];
		expect(configFromFile(file, "dongle")).toEqual({ config: { peers } });
	});
});

describe("activeConfigs", () => {
	it("drops muted rows and keeps the rest in order", () => {
		const rows = [
			{ pin: 1 },
			{ pin: 2, muted: true },
			{ pin: 3, muted: false },
		];
		expect(activeConfigs(rows)).toEqual([{ pin: 1 }, { pin: 3, muted: false }]);
	});
});

describe("deploy with muted rows", () => {
	const input = {
		mode: sysexPinModeAnalogIn,
		channel: 1,
		midiType: MIDI_CONTROL_CHANGE,
		midiMin: 0,
		midiMax: 127,
		pinMin: 0,
		pinMax: 1023,
		controller: 20,
	} as const;
	const output = {
		mode: sysexPinModePWMOut,
		channel: 1,
		midiType: MIDI_CONTROL_CHANGE,
		midiMin: 0,
		midiMax: 127,
		pinMin: 0,
		pinMax: 1024,
		controller: 20,
	} as const;

	let sent: MidiMessage[];
	let originalSend: ReturnType<typeof useMIDIStore.getState>["sendMessage"];

	beforeEach(() => {
		vi.useFakeTimers();
		sent = [];
		originalSend = useMIDIStore.getState().sendMessage;
		useMIDIStore.setState({
			sendMessage: (message: MidiMessage) => {
				sent.push(message);
				return true;
			},
		});
	});

	afterEach(() => {
		useMIDIStore.setState({ sendMessage: originalSend });
		useIOStore.getState().loadFromFile({});
		vi.useRealTimers();
	});

	// SysEx layout: F0, manufacturer, version major, version minor, command, payload…, F7
	const pinConfigPins = () =>
		sent
			.filter((m) => m.data?.[4] === ENOMIK_COMMAND_SET_PIN_CONFIG)
			.map((m) => m.data?.[5]);

	const deploy = async () => {
		// Broadcast: no reset ack to wait for, only the trailing error window.
		const done = useIOStore.getState().deploy("-1");
		await vi.runAllTimersAsync();
		return done;
	};

	it("sends no pin config for muted inputs and outputs", async () => {
		useIOStore.getState().loadFromFile({
			inputs: [
				{ ...input, pin: 1 },
				{ ...input, pin: 2, muted: true },
			],
			outputs: [
				{ ...output, pin: 3, muted: true },
				{ ...output, pin: 4 },
			],
		});

		await deploy();

		expect(pinConfigPins()).toEqual([1, 4]);
	});

	it("keeps muted rows in the store after deploy", async () => {
		useIOStore.getState().loadFromFile({
			inputs: [{ ...input, pin: 2, muted: true }],
		});

		await deploy();

		expect(useIOStore.getState().inputs).toMatchObject([
			{ pin: 2, muted: true },
		]);
	});

	it("deploys a muted row's pin once it is unmuted", async () => {
		useIOStore.getState().loadFromFile({
			inputs: [{ ...input, pin: 2, muted: true }],
		});
		const { uuid } = useIOStore.getState().inputs[0];
		useIOStore.getState().updateInput(uuid, { muted: false });

		await deploy();

		expect(pinConfigPins()).toEqual([2]);
	});

	it("does not block on the threshold of a muted touch input", async () => {
		useIOStore.getState().loadFromFile({
			inputs: [
				{
					...input,
					pin: 5,
					mode: sysexPinModeTouch,
					threshold: 40,
					muted: true,
				},
			],
		});

		await expect(deploy()).resolves.toMatchObject({ sysexErrors: [] });
		expect(pinConfigPins()).toEqual([]);
	});

	it("still blocks on the threshold of an unmuted touch input", async () => {
		useIOStore.getState().loadFromFile({
			inputs: [{ ...input, pin: 5, mode: sysexPinModeTouch, threshold: 40 }],
		});

		await expect(useIOStore.getState().deploy("-1")).rejects.toThrow(
			"compat_threshold_review",
		);
		expect(sent).toEqual([]);
	});
});

describe("findInvalidPeers", () => {
	it.each([
		"84:F7:03:F2:54:62",
		"84-f7-03-f2-54-62",
		" 84:F7:03:F2:54:62 ",
		"4:F7:3:F2:54:62",
	])("accepts %j", (macAddress) => {
		expect(findInvalidPeers([{ macAddress }])).toEqual([]);
	});

	it.each([
		["half typed", "AA:BB:::::"],
		["empty", ""],
		["five bytes", "84:F7:03:F2:54"],
		["seven bytes", "84:F7:03:F2:54:62:00"],
		["not hex", "GG:F7:03:F2:54:62"],
		["three digits in a byte", "84F:F7:03:F2:54:62"],
		["no separators", "84F703F25462"],
	])("rejects %s", (_, macAddress) => {
		expect(findInvalidPeers([{ macAddress }])).toEqual([{ macAddress }]);
	});
});

describe("deploy peers", () => {
	let sent: MidiMessage[];
	let originalSend: ReturnType<typeof useMIDIStore.getState>["sendMessage"];

	beforeEach(() => {
		vi.useFakeTimers();
		sent = [];
		originalSend = useMIDIStore.getState().sendMessage;
		useMIDIStore.setState({
			sendMessage: (message: MidiMessage) => {
				sent.push(message);
				return true;
			},
		});
	});

	afterEach(() => {
		useMIDIStore.setState({ sendMessage: originalSend });
		useIOStore.getState().loadFromFile({});
		vi.useRealTimers();
	});

	/** Payload between the command byte and F7. */
	const addPeerPayloads = () =>
		sent
			.filter((m) => m.data?.[4] === ENOMIK_COMMAND_ADD_PEER)
			.map((m) => m.data?.slice(5, -1));

	it("sends each MAC byte as two nibbles", async () => {
		useIOStore
			.getState()
			.loadFromFile({ peers: [{ macAddress: "84:F7:03:F2:54:62" }] });

		const done = useIOStore.getState().deploy("-1");
		await vi.runAllTimersAsync();
		await done;

		expect(addPeerPayloads()).toEqual([
			[0x8, 0x4, 0xf, 0x7, 0x0, 0x3, 0xf, 0x2, 0x5, 0x4, 0x6, 0x2],
		]);
	});

	it("pads single-digit bytes instead of shifting the rest", async () => {
		useIOStore
			.getState()
			.loadFromFile({ peers: [{ macAddress: "4:F7:3:F2:54:62" }] });

		const done = useIOStore.getState().deploy("-1");
		await vi.runAllTimersAsync();
		await done;

		expect(addPeerPayloads()[0]).toEqual([
			0x0, 0x4, 0xf, 0x7, 0x0, 0x3, 0xf, 0x2, 0x5, 0x4, 0x6, 0x2,
		]);
	});

	it.each(["client", "dongle"] as const)(
		"refuses an incomplete MAC before sending anything (%s)",
		async (kind) => {
			useIOStore.getState().loadFromFile({
				peers: [
					{ macAddress: "84:F7:03:F2:54:62" },
					{ macAddress: "AA:BB:::::" },
				],
			});

			await expect(useIOStore.getState().deploy("-1", kind)).rejects.toThrow(
				"deploy_invalid_peer",
			);
			// Not even RESET: the device keeps its current config.
			expect(sent).toEqual([]);
		},
	);
});
