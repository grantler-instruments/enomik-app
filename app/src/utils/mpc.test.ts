import OfflineRenderer from "@elemaudio/offline-renderer";
import { describe, expect, it } from "vitest";
import {
	DEFAULT_SOUNDS,
	mpcPatch,
	normalize,
	PAD_COUNT,
	type PadVoice,
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

	/** A pad sound: a constant 0.5, 1000 samples long. */
	const tone = new Float32Array(1000).fill(0.5);

	async function renderer() {
		const core = new OfflineRenderer();
		await core.initialize({
			numInputChannels: 0,
			numOutputChannels: 2,
			sampleRate: SR,
			blockSize: 128,
		});
		// Elementary fades a new graph in over some tens of ms: the tests warm
		// up for a second (play(..., SR)) before the first hit.
		const [left, right] = padPaths(0, 1);
		core.updateVirtualFileSystem({ [left]: tone, [right]: tone });
		return (voices: PadVoice[], samples: number) => {
			core.render(...mpcPatch(voices));
			const out = [new Float32Array(samples), new Float32Array(samples)];
			core.process([], out);
			return out[0];
		};
	}

	const voice = (gate: number, velocity = 1): PadVoice => ({
		paths: padPaths(0, 1),
		length: tone.length,
		gate,
		velocity,
		volume: 1,
		rate: 1,
	});
	const peak = (xs: Float32Array) => Math.max(...xs.map(Math.abs));

	it("is silent before the first hit", async () => {
		const play = await renderer();
		expect(peak(play([voice(0, 0)], 2048))).toBe(0);
	});

	it("starts at full level, without a fade-in", async () => {
		const play = await renderer();
		play([voice(0, 0)], SR);
		const hit = play([voice(1)], 64);
		expect(hit[1]).toBeCloseTo(Math.tanh(0.5), 3);
	});

	it("plays the sound once on a hit, scaled by velocity", async () => {
		const play = await renderer();
		play([voice(0, 0)], SR);
		const hit = play([voice(1, 0.5)], 2048);
		// 0.5 * 0.5 through the soft clip.
		expect(peak(hit)).toBeCloseTo(Math.tanh(0.25), 3);
		// Over after its 1000 samples, though the gate is still open.
		expect(peak(hit.subarray(1200))).toBe(0);
	});

	it("restarts on the next rising edge", async () => {
		const play = await renderer();
		play([voice(0, 0)], SR);
		play([voice(1)], 2048);
		play([voice(0)], 256);
		expect(peak(play([voice(1)], 512))).toBeGreaterThan(0.4);
	});

	it("skips pads without a sound", async () => {
		const play = await renderer();
		const empty = { ...voice(1), paths: null };
		expect(peak(play([empty], 512))).toBe(0);
	});
});
