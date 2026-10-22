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
