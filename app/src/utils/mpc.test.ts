import OfflineRenderer from "@elemaudio/offline-renderer";
import { describe, expect, it } from "vitest";
import {
	DEFAULT_SOUNDS,
	mpcPatch,
	normalize,
	PAD_COUNT,
	type PadState,
	padAt,
	padPaths,
} from "./mpc";

describe("mpc sounds", () => {
	it("has a sound for every pad", () => {
		expect(DEFAULT_SOUNDS).toHaveLength(PAD_COUNT);
	});

	it.each(DEFAULT_SOUNDS)("$name is audible and finite", ({ make }) => {
		const samples = normalize(make());
		expect(samples.length).toBeGreaterThan(0);
		const peak = Math.max(...samples.map(Math.abs));
		expect(peak).toBeCloseTo(0.9);
		expect(samples.every(Number.isFinite)).toBe(true);
	});

	it("comes out the same every time", () => {
		expect(DEFAULT_SOUNDS[1].make()).toEqual(DEFAULT_SOUNDS[1].make());
	});
});

describe("padAt", () => {
	it("puts pad 1 bottom left and pad 16 top right", () => {
		expect(padAt(3, 0)).toBe(0);
		expect(padAt(3, 3)).toBe(3);
		expect(padAt(0, 0)).toBe(12);
		expect(padAt(0, 3)).toBe(15);
	});
});

describe("mpcPatch", () => {
	const SR = 48000;
	// The offline renderer replaces globalThis.crypto when it starts; vitest's
	// is read-only.
	Object.defineProperty(globalThis, "crypto", {
		value: globalThis.crypto,
		writable: true,
		configurable: true,
	});

	/** A pad sound: a constant 0.5 for 100 ms, which ends far from zero. */
	const tone = new Float32Array(SR / 10).fill(0.5);

	type Hit = { gate: number; velocity: number; active: number };
	const idle: Hit = { gate: 0, velocity: 0, active: 0 };

	const pad = (a: Hit, b: Hit = idle): PadState => ({
		paths: padPaths(0, 1),
		length: tone.length,
		sampleRate: SR,
		volume: 1,
		rate: 1,
		voices: [a, b],
	});

	/**
	 * Renders graphs offline, one after another, like the engine re-rendering.
	 * Elementary fades a new graph in over some tens of ms: warm up for a
	 * second before the first hit.
	 */
	async function renderer() {
		const core = new OfflineRenderer();
		await core.initialize({
			numInputChannels: 0,
			numOutputChannels: 2,
			sampleRate: SR,
			blockSize: 128,
		});
		const [left, right] = padPaths(0, 1);
		core.updateVirtualFileSystem({ [left]: tone, [right]: tone });
		const play = (pads: PadState[], samples: number) => {
			core.render(...mpcPatch(pads));
			const out = [new Float32Array(samples), new Float32Array(samples)];
			core.process([], out);
			return out[0];
		};
		play([pad(idle)], SR);
		return play;
	}

	const peak = (xs: Float32Array) => Math.max(...xs.map(Math.abs));
	/** The biggest jump between two samples: a click. */
	const maxStep = (xs: Float32Array) => {
		let max = 0;
		for (let i = 1; i < xs.length; i++)
			max = Math.max(max, Math.abs(xs[i] - xs[i - 1]));
		return max;
	};
	const on = (velocity = 1): Hit => ({ gate: 1, velocity, active: 1 });

	it("is silent before the first hit", async () => {
		const play = await renderer();
		expect(peak(play([pad(idle)], 2048))).toBe(0);
	});

	it("starts at full level, without a fade-in", async () => {
		const play = await renderer();
		const hit = play([pad(on())], 64);
		expect(hit[1]).toBeCloseTo(Math.tanh(0.5), 3);
	});

	it("scales the sound by velocity and plays it once", async () => {
		const play = await renderer();
		const hit = play([pad(on(0.5))], tone.length + 2048);
		// 0.5 * 0.5 through the soft clip.
		expect(peak(hit)).toBeCloseTo(Math.tanh(0.25), 3);
		// Over after the sound, though the gate is still open.
		expect(peak(hit.subarray(tone.length + 128))).toBe(0);
	});

	it("fades out at the end instead of cutting off", async () => {
		const play = await renderer();
		const hit = play([pad(on())], tone.length + 2048);
		// A cut from 0.46 to 0 would be one step of 0.46.
		expect(maxStep(hit.subarray(256))).toBeLessThan(0.01);
	});

	it("fades the playing voice out when the next hit takes over", async () => {
		const play = await renderer();
		play([pad(on())], 1024);
		const before = play([pad({ gate: 0, velocity: 1, active: 1 })], 256);
		// A silent hit (velocity 0) on the other voice: all that's left is the
		// first one stopping. Cut off, it would drop from 0.46 to 0 at once.
		const after = play([pad({ gate: 0, velocity: 1, active: 0 }, on(0))], 2048);
		const joined = new Float32Array([before[before.length - 1], ...after]);
		expect(joined[0]).toBeCloseTo(Math.tanh(0.5), 3);
		expect(maxStep(joined)).toBeLessThan(0.05);
		expect(peak(after.subarray(1024))).toBeLessThan(0.001);
	});

	it("skips pads without a sound", async () => {
		const play = await renderer();
		const empty = { ...pad(on()), paths: null };
		expect(peak(play([empty], 512))).toBe(0);
	});
});
