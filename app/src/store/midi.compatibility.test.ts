import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildEnomikSysex, ENOMIK_COMMAND_SET_RAW_STREAM } from "./midi.config";

type MockInput = {
	id: string;
	name: string;
	state: string;
	type: string;
	onmidimessage?: (event: { data: Uint8Array; timeStamp: number }) => void;
};
let midi: typeof import("./midi");
let devices: typeof import("./device");
let inspector: typeof import("./inspector");
let raw: typeof import("./rawStream");
let inputs: MockInput[];
let outputs: {
	id: string;
	name: string;
	state: string;
	type: string;
	send: ReturnType<typeof vi.fn>;
}[];
let access: {
	inputs: Map<string, MockInput>;
	outputs: Map<string, (typeof outputs)[number]>;
	onstatechange?: (event: { port: MockInput }) => void;
};
const receive = (
	input: number,
	command: number,
	payload: number[] = [],
	major = 0,
	minor = 19,
) => {
	inputs[input].onmidimessage?.({
		data: new Uint8Array([0xf0, 0x7d, major, minor, command, ...payload, 0xf7]),
		timeStamp: 0,
	});
};
const identify = (output: number, version: number[]) => {
	midi.inspectDeviceVersion(outputs[output].id, true);
	receive(output, 0x4a, version, version[0], version[1]);
};

beforeEach(async () => {
	vi.resetModules();
	vi.useFakeTimers();
	const storage = {
		getItem: () => null,
		setItem: vi.fn(),
		removeItem: vi.fn(),
	};
	vi.stubGlobal("localStorage", storage);
	vi.stubGlobal("sessionStorage", storage);
	vi.stubGlobal(
		"requestAnimationFrame",
		vi.fn(() => 1),
	);
	vi.stubGlobal("cancelAnimationFrame", vi.fn());
	inputs = ["A", "B"].map((name) => ({
		id: `in-${name}`,
		name: `enomik ${name}`,
		state: "connected",
		type: "input",
	}));
	outputs = ["A", "B"].map((name) => ({
		id: `out-${name}`,
		name: `enomik ${name}`,
		state: "connected",
		type: "output",
		send: vi.fn(),
	}));
	access = {
		inputs: new Map(inputs.map((p) => [p.id, p])),
		outputs: new Map(outputs.map((p) => [p.id, p])),
	};
	vi.stubGlobal("navigator", {
		requestMIDIAccess: vi.fn().mockResolvedValue(access),
	});
	midi = await import("./midi");
	devices = await import("./device");
	inspector = await import("./inspector");
	raw = await import("./rawStream");
	await midi.useMIDIStore.getState().init();
});
afterEach(() => {
	raw.useRawStreamStore.getState().setActive(false);
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("firmware replies and inspection", () => {
	it.each([
		[0, 15],
		[0, 18],
		[0, 19, 0],
		[0, 99, 7, 12],
	])("accepts old, current and future version replies: %j", (...version) => {
		identify(0, version);
		expect(devices.useDeviceStore.getState().devices["out-A"]).toMatchObject({
			status: "ready",
			version: { major: version[0], minor: version[1], patch: version[2] },
		});
	});
	it("never sends live-stream commands to older or unknown firmware", async () => {
		const { sendRawStream } = await import("../hooks/useRawStream");
		for (const version of [undefined, [0, 12], [0, 15], [0, 18]]) {
			if (version) identify(0, version);
			outputs[0].send.mockClear();
			raw.useRawStreamStore.getState().setActive(true);
			sendRawStream("out-A", true);
			expect(outputs[0].send).not.toHaveBeenCalled();
			expect(raw.useRawStreamStore.getState().active).toBe(false);
		}
	});
	it("stops live streaming when selection changes to broadcast", async () => {
		identify(0, [0, 19]);
		const { sendRawStream } = await import("../hooks/useRawStream");
		const { startRawStreamSession } = await import("../utils/rawStreamSession");
		raw.useRawStreamStore.getState().setActive(true);
		startRawStreamSession("out-A", (enable) => sendRawStream("out-A", enable));
		receive(0, 0x56, [127, 1, 10]);
		midi.useMIDIStore.getState().setSelectedConfiguratorOutputDevice("-1");
		const count = outputs[0].send.mock.calls.length;
		vi.advanceTimersByTime(10000);
		expect(outputs[0].send).toHaveBeenCalledTimes(count);
		expect(outputs[0].send).toHaveBeenLastCalledWith(
			buildEnomikSysex(ENOMIK_COMMAND_SET_RAW_STREAM, [127, 0, 0]),
		);
		expect(outputs[1].send).not.toHaveBeenCalled();
		expect(raw.useRawStreamStore.getState().active).toBe(false);
	});

	it("times out without retrying forever and permits explicit retry", () => {
		midi.inspectDeviceVersion("out-A");
		vi.advanceTimersByTime(3000);
		expect(devices.useDeviceStore.getState().devices["out-A"].status).toBe(
			"timeout",
		);
		midi.inspectDeviceVersion("out-A");
		expect(outputs[0].send).toHaveBeenCalledTimes(2);
		midi.inspectDeviceVersion("out-A", true);
		receive(0, 0x4a, [0, 19, 0]);
		expect(devices.useDeviceStore.getState().devices["out-A"].status).toBe(
			"ready",
		);
	});
	it("rejects an incompatible major without breaking ordinary MIDI", () => {
		identify(0, [1, 0, 0]);
		expect(devices.useDeviceStore.getState().devices["out-A"].status).toBe(
			"incompatible",
		);
		expect(
			midi.useMIDIStore.getState().sendMessage(
				{
					id: "note",
					timestamp: 0,
					type: 0x90,
					note: 60,
					velocity: 100,
					channel: 1,
				},
				"out-A",
			),
		).toBe(true);
		expect(outputs[0].send).toHaveBeenLastCalledWith([0x90, 60, 100]);
	});
	it("ignores malformed packets and accepts extra response fields", async () => {
		identify(0, [0, 20]);
		inspector.useInspectorStore.setState({ deviceId: "out-A", syncing: true });
		const result = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x44, [4, 5]); // truncated config
		receive(0, 0x44, [4, 5, 20, 1, 88, 10, 0, 255]); // invalid data byte
		inputs[0].onmidimessage?.({
			data: new Uint8Array([
				0xf0, 0x7d, 0, 20, 0x44, 4, 5, 20, 1, 88, 10, 0, 127, 0,
			]),
			timeStamp: 0,
		}); // no terminator
		expect(inspector.useInspectorStore.getState().inputPinConfigs).toHaveLength(
			0,
		);
		receive(0, 0x44, [4, 5, 20, 1, 88, 10, 0, 127, 42]);
		receive(0, 0x60, [1, 2, 3]); // unknown future response
		receive(0, 0x4c);
		expect((await result)?.inputs).toMatchObject([
			{ pin: 4, threshold: 20, thresholdUnit: "percent" },
		]);
		expect(inspector.useInspectorStore.getState().inputPinConfigs).toHaveLength(
			1,
		);
	});
	it("reads 0.18 configs, preserves raw thresholds, and leaves missing settings unknown", async () => {
		identify(0, [0, 18]);
		inspector.useInspectorStore.setState({ deviceId: "out-A", syncing: true });
		const result = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x44, [4, 5, 31, 1, 88, 10, 0, 127]);
		receive(0, 0x4e, [1]);
		receive(0, 0x4c);
		expect(await result).toMatchObject({
			inputs: [{ threshold: 31, thresholdUnit: "raw" }],
			midiLoopback: true,
			powerSave: null,
			name: null,
		});
		expect(inspector.useInspectorStore.getState()).toMatchObject({
			midiLoopback: true,
			powerSave: null,
			name: null,
		});
	});
	it("does not mix another board's inspection, live frames or stream errors", async () => {
		identify(0, [0, 19]);
		identify(1, [0, 18]);
		inspector.useInspectorStore.setState({ deviceId: "out-A", syncing: true });
		raw.useRawStreamStore.getState().setActive(true);
		raw.useRawStreamStore.getState().begin("out-A");
		const result = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(1, 0x44, [4, 5, 31, 1, 88, 10, 0, 127]);
		receive(1, 0x17, [4, 5, ...Array(19).fill(0)]);
		receive(1, 0x7f, [0x16, 2]);
		receive(1, 0x4c);
		expect(inspector.useInspectorStore.getState().inputPinConfigs).toHaveLength(
			0,
		);
		expect(raw.useRawStreamStore.getState()).toMatchObject({
			active: true,
			values: {},
			error: null,
		});
		receive(0, 0x17, [4, 5, ...Array(19).fill(0), 99]);
		expect(raw.useRawStreamStore.getState().values[4]).toBeDefined();
		receive(0, 0x7f, [0x16, 2]);
		expect(raw.useRawStreamStore.getState()).toMatchObject({
			active: false,
			values: {},
			error: "unknown_command",
		});
		receive(0, 0x17, [4, 5, ...Array(19).fill(0)]);
		expect(raw.useRawStreamStore.getState().values).toEqual({});
		receive(0, 0x4c);
		expect((await result)?.inputs).toEqual([]);
	});
	it("clears device state on disconnect and redetects on reconnect", async () => {
		identify(0, [0, 19]);
		inspector.useInspectorStore.setState({
			deviceId: "out-A",
			syncing: true,
			name: "old",
		});
		raw.useRawStreamStore.getState().setActive(true);
		raw.useRawStreamStore.getState().begin("out-A");
		const pending = midi.beginWaitForConfigLoad("out-A", 5000);
		inputs[0].state = "disconnected";
		access.onstatechange?.({ port: inputs[0] });
		expect(await pending).toBeNull();
		expect(devices.useDeviceStore.getState().devices["out-A"]).toBeUndefined();
		expect(raw.useRawStreamStore.getState().active).toBe(false);
		expect(inspector.useInspectorStore.getState().name).toBeNull();
		inputs[0].state = "connected";
		access.onstatechange?.({ port: inputs[0] });
		identify(0, [0, 18]);
		expect(
			devices.useDeviceStore.getState().devices["out-A"].version?.minor,
		).toBe(18);
	});
	it("handles a disconnected output send without throwing", () => {
		outputs[0].send.mockImplementation(() => {
			throw new Error("disconnected");
		});
		expect(
			midi.useMIDIStore.getState().sendMessage(
				{
					id: "msg",
					timestamp: 0,
					type: 240,
					data: [0xf0, 0x7d, 0, 14, 10, 0xf7],
				},
				"out-A",
			),
		).toBe(false);
	});
});

describe("compatible configuration deployment", () => {
	const touch = {
		pin: 4,
		mode: 5 as const,
		threshold: 31,
		channel: 1,
		midiType: 176 as const,
		midiMin: 0,
		midiMax: 127,
		pinMin: 0,
		pinMax: 1023,
	};
	it("detects 0.12 via its MAC response and deploys pins and peers without new commands", async () => {
		outputs[0].send.mockImplementation((packet: number[]) => {
			// The 0.12 GET_VERSION handler is not wired up; its MAC reply echoes
			// command 0x06 with a version header and 12 MAC nibbles.
			if (packet[4] === 6) receive(0, 6, Array(12).fill(0), 0, 12);
			if (packet[4] === 9) receive(0, 0x49, [], 0, 12);
		});
		midi.inspectDeviceVersion("out-A");
		vi.advanceTimersByTime(1500);
		expect(devices.useDeviceStore.getState().devices["out-A"]).toMatchObject({
			status: "ready",
			version: { major: 0, minor: 12 },
		});
		const { useIOStore } = await import("./io");
		useIOStore.getState().loadFromFile({
			inputs: [{ ...touch, thresholdUnit: "raw" }],
			outputs: [{ ...touch, pin: 5, mode: 4 }],
			peers: [{ macAddress: "12:34:56:78:9A:BC" }],
			midiLoopback: true,
			powerSave: true,
			name: "new name",
		});
		const deployment = useIOStore.getState().deploy("out-A");
		await vi.advanceTimersByTimeAsync(400);
		expect(await deployment).toMatchObject({
			resetAck: true,
			sysexErrors: [],
			globalsSkipped: true,
			nameSkipped: true,
		});
		const packets = outputs[0].send.mock.calls.map(
			([packet]) => packet as number[],
		);
		expect(packets.map((packet) => packet[4])).toEqual([
			0x0a, 0x06, 0x09, 0x01, 0x01, 0x07,
		]);
		expect(packets[3].slice(5, 8)).toEqual([4, 5, 31]);
		expect(packets[5].slice(5, -1)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
		]);
		vi.advanceTimersByTime(5000);
		expect(devices.useDeviceStore.getState().devices["out-A"].status).toBe(
			"ready",
		);
	});
	it("continues basic deployment when old firmware does not acknowledge RESET", async () => {
		identify(0, [0, 12]);
		const { useIOStore } = await import("./io");
		useIOStore
			.getState()
			.loadFromFile({ inputs: [{ ...touch, mode: 3, threshold: 0 }] });
		outputs[0].send.mockClear();
		const deployment = useIOStore.getState().deploy("out-A");
		await vi.advanceTimersByTimeAsync(5400);
		expect(await deployment).toMatchObject({
			resetAck: false,
			globalsSkipped: true,
		});
		expect(outputs[0].send.mock.calls.map(([packet]) => packet[4])).toEqual([
			9, 1,
		]);
	});

	it("preserves legacy raw thresholds and skips unsupported client-name commands", async () => {
		identify(0, [0, 18]);
		const { useIOStore } = await import("./io");
		useIOStore.getState().loadFromFile({
			inputs: [{ ...touch, thresholdUnit: "raw" }],
			name: "My board",
		});
		outputs[0].send.mockImplementation((packet: number[]) => {
			if (packet[4] === 9) receive(0, 0x49);
		});
		const deployment = useIOStore.getState().deploy("out-A");
		await vi.advanceTimersByTimeAsync(400);
		const result = await deployment;
		expect(result.resetAck).toBe(true);
		const packets = outputs[0].send.mock.calls.map(
			([packet]) => packet as number[],
		);
		expect(packets.find((packet) => packet[4] === 1)?.slice(5, 8)).toEqual([
			4, 5, 31,
		]);
		expect(packets.some((packet) => packet[4] === 0x11)).toBe(false);
		expect(result.sysexErrors).toEqual([]);
		expect(result.nameSkipped).toBe(true);
	});
	it("blocks ambiguous or changed threshold units before sending RESET", async () => {
		identify(0, [0, 19]);
		const { useIOStore } = await import("./io");
		for (const unit of [undefined, "raw"] as const) {
			useIOStore
				.getState()
				.loadFromFile({ inputs: [{ ...touch, thresholdUnit: unit }] });
			outputs[0].send.mockClear();
			await expect(useIOStore.getState().deploy("out-A")).rejects.toThrow(
				"compat_threshold_review",
			);
			expect(outputs[0].send).not.toHaveBeenCalled();
		}
	});
	it("loads and retains percentage units from newer firmware", async () => {
		identify(0, [0, 19]);
		const pending = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x44, [4, 5, 31, 1, 88, 10, 0, 127]);
		receive(0, 0x4c);
		const result = await pending;
		const { useIOStore } = await import("./io");
		useIOStore.getState().loadFromFile({
			inputs: result?.inputs as Parameters<
				ReturnType<typeof useIOStore.getState>["loadFromFile"]
			>[0]["inputs"],
		});
		expect(useIOStore.getState().inputs[0]).toMatchObject({
			threshold: 31,
			thresholdUnit: "percent",
		});
	});
});

describe("dongle configuration and inspection", () => {
	const touch = {
		pin: 4,
		mode: 5 as const,
		threshold: 31,
		thresholdUnit: "percent" as const,
		channel: 1,
		midiType: 176 as const,
		midiMin: 0,
		midiMax: 127,
		pinMin: 0,
		pinMax: 1023,
	};
	it("deploys only RESET and peers to a dongle", async () => {
		identify(0, [0, 19]);
		const { useIOStore } = await import("./io");
		useIOStore.getState().loadFromFile({
			inputs: [{ ...touch, thresholdUnit: "raw" }],
			peers: [{ macAddress: "12:34:56:78:9A:BC" }],
			midiLoopback: true,
			powerSave: true,
			name: "My board",
		});
		outputs[0].send.mockClear();
		outputs[0].send.mockImplementation((packet: number[]) => {
			if (packet[4] === 9) receive(0, 0x49);
		});
		const deployment = useIOStore.getState().deploy("out-A", "dongle");
		await vi.advanceTimersByTimeAsync(400);
		expect(await deployment).toMatchObject({
			resetAck: true,
			sysexErrors: [],
			globalsSkipped: false,
			nameSkipped: false,
		});
		expect(outputs[0].send.mock.calls.map(([packet]) => packet[4])).toEqual([
			0x09, 0x07,
		]);
	});
	it("drops a client/dongle override when a port is picked", () => {
		const store = devices.useDeviceStore;
		store.getState().setKind("out-A", "dongle");
		midi.useMIDIStore.getState().setSelectedConfiguratorOutputDevice("out-A");
		expect(store.getState().kinds).toEqual({});
	});
	it("keeps client and dongle configs apart", async () => {
		const { useDongleIOStore, useIOStore } = await import("./io");
		useIOStore
			.getState()
			.loadFromFile({ peers: [{ macAddress: "12:34:56:78:9A:BC" }] });
		useDongleIOStore.getState().addPeer({ macAddress: "AA:BB:CC:DD:EE:FF" });
		expect(useIOStore.getState().peers.map((p) => p.macAddress)).toEqual([
			"12:34:56:78:9A:BC",
		]);
		expect(useDongleIOStore.getState().peers.map((p) => p.macAddress)).toEqual([
			"AA:BB:CC:DD:EE:FF",
		]);
	});
	it("saves client and dongle configs with their kind", async () => {
		const { useDongleIOStore, useIOStore } = await import("./io");
		const links: { download: string; href: string; click: () => void }[] = [];
		vi.stubGlobal("document", {
			createElement: () => {
				const link = { download: "", href: "", click: vi.fn() };
				links.push(link);
				return link;
			},
		});
		const blobs: Blob[] = [];
		vi.stubGlobal("URL", {
			createObjectURL: (blob: Blob) => {
				blobs.push(blob);
				return "blob:";
			},
			revokeObjectURL: vi.fn(),
		});
		useIOStore.getState().saveToFile();
		useDongleIOStore.getState().saveToFile();
		expect(links.map((link) => link.download)).toEqual([
			"io-config-client.json",
			"io-config-dongle.json",
		]);
		expect(JSON.parse(await blobs[0].text())).toMatchObject({
			kind: "client",
			inputs: [],
		});
		expect(JSON.parse(await blobs[1].text())).toEqual({
			kind: "dongle",
			peers: [],
		});
	});
	it("ends a peers-only load at the GET_ALL_PEERS stream end", async () => {
		identify(0, [0, 19]);
		inspector.useInspectorStore.setState({ deviceId: "out-A", syncing: true });
		const result = midi.beginWaitForConfigLoad("out-A", 5000, "peers");
		receive(0, 0x48, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		receive(0, 0x48);
		expect(await result).toMatchObject({
			inputs: [],
			peers: [{ macAddress: "12:34:56:78:9A:BC" }],
		});
		expect(inspector.useInspectorStore.getState().peers).toEqual([
			"12:34:56:78:9A:BC",
		]);
	});
	it("tells client and dongle firmware apart by the GET_CONFIG reply", async () => {
		identify(0, [0, 19]);
		const client = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x4c);
		expect((await client)?.firmware).toBe("client");
		const dongle = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x7f, [0x0c, 0x05]); // GET_CONFIG: NOT_READY
		expect((await dongle)?.firmware).toBe("dongle");
		const failed = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x7f, [0x0c, 0x02]); // GET_CONFIG: UNKNOWN_COMMAND
		expect(await failed).toBeNull();
	});
	it("does not end a GET_CONFIG load at a peers stream end", async () => {
		identify(0, [0, 19]);
		const result = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(0, 0x48);
		receive(0, 0x44, [4, 5, 31, 1, 88, 10, 0, 127]);
		receive(0, 0x4c);
		expect((await result)?.inputs).toHaveLength(1);
	});
	it("deploys every dongle peer and nothing else, even with client settings in its store", async () => {
		identify(0, [0, 19]);
		const { useDongleIOStore } = await import("./io");
		useDongleIOStore.getState().loadFromFile({
			inputs: [{ ...touch, thresholdUnit: undefined }],
			outputs: [{ ...touch, pin: 5, mode: 4 }],
			peers: [
				{ macAddress: "12:34:56:78:9A:BC" },
				{ macAddress: "FF:FF:FF:FF:FF:FF" },
			],
			midiLoopback: true,
			name: "ignored",
		});
		outputs[0].send.mockClear();
		outputs[0].send.mockImplementation((packet: number[]) => {
			if (packet[4] === 9) receive(0, 0x49);
		});
		// A client deploy would refuse the unknown threshold unit
		const deployment = useDongleIOStore.getState().deploy("out-A", "dongle");
		await vi.advanceTimersByTimeAsync(400);
		expect((await deployment).resetAck).toBe(true);
		const packets = outputs[0].send.mock.calls.map(
			([packet]) => packet as number[],
		);
		expect(packets.map((packet) => packet[4])).toEqual([0x09, 0x07, 0x07]);
		expect(packets[1].slice(5, -1)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
		]);
		expect(packets[2].slice(5, -1)).toEqual(Array(12).fill(15));
	});
	it("still sends dongle peers when RESET is not acknowledged", async () => {
		identify(0, [0, 19]);
		const { useDongleIOStore } = await import("./io");
		useDongleIOStore
			.getState()
			.loadFromFile({ peers: [{ macAddress: "12:34:56:78:9A:BC" }] });
		outputs[0].send.mockClear();
		const deployment = useDongleIOStore.getState().deploy("out-A", "dongle");
		await vi.advanceTimersByTimeAsync(5400);
		expect(await deployment).toMatchObject({
			resetAck: false,
			globalsSkipped: false,
			nameSkipped: false,
		});
		expect(outputs[0].send.mock.calls.map(([packet]) => packet[4])).toEqual([
			0x09, 0x07,
		]);
	});
	it("drops the override when a newly connected enomik board is auto-selected", () => {
		devices.useDeviceStore.getState().setKind("out-B", "client");
		access.onstatechange?.({ port: outputs[1] as unknown as MockInput });
		expect(midi.useMIDIStore.getState().selectedConfiguratorOutputDevice).toBe(
			"out-B",
		);
		expect(devices.useDeviceStore.getState().kinds).toEqual({});
	});
	it("keeps the override when the same board is only redetected", () => {
		devices.useDeviceStore.getState().setKind("out-A", "dongle");
		identify(0, [0, 19]);
		expect(devices.useDeviceStore.getState().kinds).toEqual({
			"out-A": "dongle",
		});
	});
	it("dedupes peers and ignores other boards and config ends in a peers-only load", async () => {
		identify(0, [0, 19]);
		identify(1, [0, 19]);
		const result = midi.beginWaitForConfigLoad("out-A", 5000, "peers");
		const entry = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		receive(0, 0x48, entry);
		receive(0, 0x48, [1, ...entry.slice(1)]);
		receive(1, 0x48, [0, ...Array(12).fill(15)]);
		receive(1, 0x48); // another board's stream end
		receive(0, 0x4c); // not the end of a peers-only load
		receive(0, 0x48);
		expect((await result)?.peers).toEqual([
			{ macAddress: "12:34:56:78:9A:BC" },
		]);
	});
	it("times out a peers-only load without a stream end", async () => {
		identify(0, [0, 19]);
		const result = midi.beginWaitForConfigLoad("out-A", 5000, "peers");
		receive(0, 0x48, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		vi.advanceTimersByTime(5000);
		expect(await result).toBeNull();
	});
	it("only takes NOT_READY for GET_CONFIG from the inspected board as a dongle", async () => {
		identify(0, [0, 19]);
		identify(1, [0, 19]);
		const result = midi.beginWaitForConfigLoad("out-A", 5000);
		receive(1, 0x7f, [0x0c, 0x05]); // another board
		receive(0, 0x7f, [0x06, 0x05]); // another command
		receive(0, 0x46, Array(12).fill(1));
		receive(0, 0x7f, [0x0c, 0x05]);
		expect(await result).toMatchObject({
			firmware: "dongle",
			inputs: [],
			outputs: [],
		});
	});
	it("fails a peers-only load when GET_CONFIG is rejected", async () => {
		identify(0, [0, 19]);
		const result = midi.beginWaitForConfigLoad("out-A", 5000, "peers");
		receive(0, 0x7f, [0x0c, 0x05]);
		expect(await result).toBeNull();
	});
	it("leaves firmware unset for a peers-only load", async () => {
		identify(0, [0, 19]);
		const result = midi.beginWaitForConfigLoad("out-A", 5000, "peers");
		receive(0, 0x48);
		expect((await result)?.firmware).toBeUndefined();
	});
	it("forgets the detected firmware when the inspector clears", () => {
		inspector.useInspectorStore.setState({ firmware: "dongle" });
		inspector.useInspectorStore.getState().clear();
		expect(inspector.useInspectorStore.getState().firmware).toBeNull();
	});
	it("round-trips saved configs through import", async () => {
		const { configFromFile, useDongleIOStore, useIOStore } = await import(
			"./io"
		);
		const saved: string[] = [];
		vi.stubGlobal("document", {
			createElement: () => ({ click: vi.fn() }),
		});
		vi.stubGlobal("URL", {
			createObjectURL: (blob: Blob) => {
				blob.text().then((text) => saved.push(text));
				return "blob:";
			},
			revokeObjectURL: vi.fn(),
		});
		useIOStore.getState().loadFromFile({
			inputs: [touch],
			peers: [{ macAddress: "12:34:56:78:9A:BC" }],
			powerSave: true,
			name: "board",
		});
		useDongleIOStore
			.getState()
			.loadFromFile({ peers: [{ macAddress: "AA:BB:CC:DD:EE:FF" }] });
		useIOStore.getState().saveToFile();
		useDongleIOStore.getState().saveToFile();
		await vi.waitFor(() => expect(saved).toHaveLength(2));
		const [clientFile, dongleFile] = saved.map((text) => JSON.parse(text));
		useIOStore.getState().loadFromFile({});
		useDongleIOStore.getState().loadFromFile({});
		const client = configFromFile(clientFile, "client");
		const dongle = configFromFile(dongleFile, "dongle");
		if (!("config" in client) || !("config" in dongle))
			throw new Error("kind mismatch");
		useIOStore.getState().loadFromFile(client.config);
		useDongleIOStore.getState().loadFromFile(dongle.config);
		expect(useIOStore.getState()).toMatchObject({
			inputs: [{ pin: 4 }],
			peers: [{ macAddress: "12:34:56:78:9A:BC" }],
			powerSave: true,
			name: "board",
		});
		expect(useDongleIOStore.getState().peers).toMatchObject([
			{ macAddress: "AA:BB:CC:DD:EE:FF" },
		]);
		expect(configFromFile(dongleFile, "client")).toEqual({
			mismatch: "dongle",
		});
		expect(configFromFile(clientFile, "dongle")).toEqual({
			mismatch: "client",
		});
	});
});

describe("old firmware", () => {
	const peers = [{ macAddress: "12:34:56:78:9A:BC" }];
	it("treats a dongle that never answers (before 0.19) as not configurable", async () => {
		midi.inspectDeviceVersion("out-A");
		vi.advanceTimersByTime(3000);
		const info = devices.useDeviceStore.getState().devices["out-A"];
		expect(info.status).toBe("timeout");
		expect(devices.dongleConfigBlocker(info)).toBe("compat_dongle_unsupported");
		// The store itself still copes: no throw, just no RESET ack
		const { useDongleIOStore } = await import("./io");
		useDongleIOStore.getState().loadFromFile({ peers });
		const deployment = useDongleIOStore.getState().deploy("out-A", "dongle");
		await vi.advanceTimersByTimeAsync(5400);
		expect(await deployment).toMatchObject({
			resetAck: false,
			sysexErrors: [],
		});
		for (const until of ["config", "peers"] as const) {
			const load = midi.beginWaitForConfigLoad("out-A", 5000, until);
			vi.advanceTimersByTime(5000);
			expect(await load).toBeNull();
		}
	});
	it("deploys only peers to an old 0.12 client set to Dongle by mistake", async () => {
		outputs[0].send.mockImplementation((packet: number[]) => {
			if (packet[4] === 6) receive(0, 6, Array(12).fill(0), 0, 12);
			if (packet[4] === 9) receive(0, 0x49, [], 0, 12);
		});
		midi.inspectDeviceVersion("out-A");
		vi.advanceTimersByTime(1500);
		const { useDongleIOStore } = await import("./io");
		useDongleIOStore.getState().loadFromFile({ peers });
		outputs[0].send.mockClear();
		const deployment = useDongleIOStore.getState().deploy("out-A", "dongle");
		await vi.advanceTimersByTimeAsync(400);
		expect((await deployment).resetAck).toBe(true);
		expect(outputs[0].send.mock.calls.map(([packet]) => packet[4])).toEqual([
			0x09, 0x07,
		]);
		// Too old to be called a configurable dongle
		expect(
			devices.dongleConfigBlocker(
				devices.useDeviceStore.getState().devices["out-A"],
			),
		).toBe("compat_dongle_unsupported");
	});
	it.each([13, 15, 18])(
		"detects a 0.%i client by its GET_CONFIG reply",
		async (minor) => {
			identify(0, [0, minor]);
			const load = midi.beginWaitForConfigLoad("out-A", 5000);
			receive(0, 0x44, [4, 5, 31, 1, 88, 10, 0, 127], 0, minor);
			receive(0, 0x4c, [], 0, minor);
			expect(await load).toMatchObject({
				firmware: "client",
				inputs: [{ pin: 4 }],
			});
		},
	);
	it("survives a client deploy to a dongle that rejects the client commands", async () => {
		identify(0, [0, 19]);
		const { useIOStore } = await import("./io");
		useIOStore.getState().loadFromFile({
			outputs: [
				{
					pin: 5,
					mode: 4,
					threshold: 0,
					channel: 1,
					midiType: 176,
					midiMin: 0,
					midiMax: 127,
					pinMin: 0,
					pinMax: 1023,
				},
			],
			peers,
			name: "board",
		});
		outputs[0].send.mockImplementation((packet: number[]) => {
			if (packet[4] === 9) receive(0, 0x49);
			else if (packet[4] !== 7) receive(0, 0x7f, [packet[4], 0x05]);
		});
		const deployment = useIOStore.getState().deploy("out-A");
		await vi.advanceTimersByTimeAsync(400);
		const result = await deployment;
		expect(result.resetAck).toBe(true);
		expect(result.sysexErrors.map((err) => err.failedRequest)).toEqual([
			0x01, 0x0d, 0x0f, 0x11,
		]);
	});
	it("never throws on malformed or unexpected replies, old or new", async () => {
		identify(0, [0, 19]);
		identify(1, [0, 12]);
		let seed = 1;
		const byte = () => {
			seed = (seed * 1103515245 + 12345) % 2 ** 31;
			return seed % 128;
		};
		const feed = () => {
			for (const header of [
				[0, 10],
				[0, 12],
				[0, 19],
				[0, 99],
				[1, 0],
			]) {
				for (let command = 0; command < 128; command++) {
					for (const length of [0, 1, 2, 3, 12, 13, 21, 40]) {
						const payload = Array.from({ length }, byte);
						for (const input of [0, 1]) {
							receive(input, command, payload, header[0], header[1]);
						}
					}
				}
			}
			for (const data of [
				[0xf0],
				[0xf0, 0x7d],
				[0xf0, 0x7d, 0],
				[0xf0, 0x7d, 0, 19],
				[0xf0, 0x7d, 0, 19, 0x48],
				[0xf0, 0x7d, 0, 19, 0x7f, 0xf7],
				[0xf0, 0x7d, 0, 19, 0x4a, 0, 0xf7],
				[],
			]) {
				inputs[0].onmidimessage?.({ data: new Uint8Array(data), timeStamp: 0 });
			}
		};
		expect(feed).not.toThrow();
		inspector.useInspectorStore.setState({ deviceId: "out-A", syncing: true });
		raw.useRawStreamStore.getState().setActive(true);
		raw.useRawStreamStore.getState().begin("out-A");
		for (const until of ["config", "peers"] as const) {
			const load = midi.beginWaitForConfigLoad("out-A", 5000, until);
			expect(feed).not.toThrow();
			vi.advanceTimersByTime(5000);
			await load;
		}
		midi.inspectDeviceVersion("out-A", true);
		expect(feed).not.toThrow();
	});
});

describe("picking client or dongle picks a port", () => {
	const port = (id: string, name: string, state = "connected") => ({
		id,
		name,
		state,
	});
	const client = port("c", "enomik3000_client");
	const dongle = port("d", "enomik3000_dongle");
	const iac = port("iac", "IAC Driver Bus 1");
	it("keeps a port whose name already fits", () => {
		expect(midi.kindChange("dongle", "d", [client, dongle])).toEqual({
			type: "keep",
		});
		expect(midi.kindChange("client", "c", [client, dongle])).toEqual({
			type: "keep",
		});
	});
	it("switches to the first fitting enomik port", () => {
		const second = port("d2", "Enomik3000_Dongle 2");
		expect(midi.kindChange("dongle", "c", [client, dongle, second])).toEqual({
			type: "switch",
			port: dongle,
		});
		expect(midi.kindChange("client", "d", [dongle, iac, client])).toEqual({
			type: "switch",
			port: client,
		});
	});
	it("picks a port when none is selected yet", () => {
		expect(midi.kindChange("dongle", undefined, [client, dongle])).toEqual({
			type: "switch",
			port: dongle,
		});
		expect(midi.kindChange("client", "-1", [dongle, client])).toEqual({
			type: "switch",
			port: client,
		});
	});
	it("never picks other MIDI gear or disconnected ports", () => {
		expect(midi.kindChange("client", "d", [dongle, iac])).toEqual({
			type: "none",
		});
		expect(
			midi.kindChange("dongle", "c", [
				client,
				port("x", "Some Dongle"),
				port("d", "enomik3000_dongle", "disconnected"),
			]),
		).toEqual({ type: "none" });
	});
	it("does not keep a disconnected port", () => {
		expect(
			midi.kindChange("dongle", "d", [
				port("d", "enomik3000_dongle", "disconnected"),
				port("d2", "enomik3000_dongle"),
			]),
		).toMatchObject({ type: "switch", port: { id: "d2" } });
	});
	it("lands on the picked kind after switching", () => {
		outputs[1].name = "enomik3000_dongle";
		devices.useDeviceStore.getState().setKind("out-B", "client");
		const change = midi.kindChange(
			"dongle",
			"out-A",
			midi.useMIDIStore.getState().outputs,
		);
		expect(change).toMatchObject({ type: "switch", port: { id: "out-B" } });
		midi.useMIDIStore.getState().setSelectedConfiguratorOutputDevice("out-B");
		// The stale override is gone, so the name decides: dongle
		expect(devices.useDeviceStore.getState().kinds["out-B"]).toBeUndefined();
		expect(devices.guessDeviceKind(outputs[1].name)).toBe("dongle");
	});
});
