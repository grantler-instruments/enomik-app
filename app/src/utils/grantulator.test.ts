import { el, type NodeRepr_t } from "@elemaudio/core";
import OfflineRenderer from "@elemaudio/offline-renderer";
import { describe, expect, it } from "vitest";
import {
	CENTER_SNAPSHOT,
	delayEffect,
	type GrainParams,
	grainPatch,
	parseGrainSnapshot,
	reverbEffect,
	samplePaths,
} from "./grantulator";

const SR = 48000;

// The offline renderer replaces globalThis.crypto when it starts; vitest's is
// read-only.
Object.defineProperty(globalThis, "crypto", {
	value: globalThis.crypto,
	writable: true,
	configurable: true,
});

const silence = el.const({ value: 0 });

type Stereo = [NodeRepr_t, NodeRepr_t];

/** Renders graphs offline, one after another, like the page re-rendering. */
async function renderer(sample?: Float32Array) {
	const core = new OfflineRenderer();
	await core.initialize({
		numInputChannels: 0,
		numOutputChannels: 2,
		sampleRate: SR,
		blockSize: 128,
	});
	/** Uploads a sample the way the engine does: the n-th under its own paths. */
	const load = (data: Float32Array, n: number) => {
		const [left, right] = samplePaths(n);
		core.updateVirtualFileSystem({ [left]: data, [right]: data });
	};
	if (sample) load(sample, 1);
	const snapshots: { source?: string; data: number }[] = [];
	core.on("snapshot", (e) => snapshots.push(e));
	const left: number[] = [];
	return {
		load,
		prune: () => core.pruneVirtualFileSystem(),
		snapshots,
		left,
		/** Renders the graph, then runs it for `seconds`. Returns the left channel. */
		play(graph: Stereo, seconds: number) {
			core.render(...graph);
			const out = [
				new Float32Array(Math.round(SR * seconds)),
				new Float32Array(Math.round(SR * seconds)),
			];
			core.process([], out);
			for (const x of out[0]) left.push(x);
			return out[0];
		},
	};
}

const rms = (xs: ArrayLike<number>) => {
	let sum = 0;
	for (let i = 0; i < xs.length; i++) sum += xs[i] ** 2;
	return Math.sqrt(sum / xs.length);
};
const db = (x: number) => 20 * Math.log10(x);
/** The strongest frequency between lo and hi Hz, in 2 Hz steps. */
const strongestHz = (xs: Float32Array, lo: number, hi: number) => {
	let best = 0;
	let bestHz = lo;
	for (let hz = lo; hz <= hi; hz += 2) {
		let re = 0;
		let im = 0;
		for (let i = 0; i < xs.length; i += 2) {
			const phase = (2 * Math.PI * hz * i) / SR;
			re += xs[i] * Math.cos(phase);
			im += xs[i] * Math.sin(phase);
		}
		if (re * re + im * im > best) {
			best = re * re + im * im;
			bestHz = hz;
		}
	}
	return bestHz;
};

const noise = (seconds: number) => {
	let seed = 1;
	return Float32Array.from({ length: SR * seconds }, () => {
		seed = (seed * 16807) % 2147483647;
		return (seed / 2147483647 - 0.5) * 0.6;
	});
};
const sine = (seconds: number, hz = 220) =>
	Float32Array.from(
		{ length: SR * seconds },
		(_, i) => 0.3 * Math.sin((2 * Math.PI * hz * i) / SR),
	);

const grains = (p: Partial<GrainParams>): GrainParams => ({
	position: 0.5,
	spread: 0.1,
	drift: 0,
	driftRateHz: 0.1,
	sizeMs: 120,
	semitones: 0,
	grains: 32,
	jitter: 0.5,
	detune: 0,
	intervalChance: 0,
	intervals: [],
	width: 0,
	gain: 0.5,
	paths: samplePaths(1),
	durationSec: 10,
	...p,
});

describe("grainPatch", () => {
	it("keeps the level whatever the grain count", async () => {
		const levels = [];
		for (const count of [4, 16, 64]) {
			const { play } = await renderer(noise(10));
			play(grainPatch(grains({ grains: count })), 0.5);
			levels.push(db(rms(play(grainPatch(grains({ grains: count })), 1))));
		}
		expect(Math.max(...levels) - Math.min(...levels)).toBeLessThan(2);
	}, 30000);

	it("keeps the other voices' grains going when the count changes", async () => {
		const { play, snapshots } = await renderer(sine(10));
		const starts = () =>
			snapshots.filter((s) => parseGrainSnapshot(s.source)?.field === "offset")
				.length;
		play(grainPatch(grains({ grains: 32, sizeMs: 400 })), 1);
		// 32 voices at about 2.5 grains per second: about 4 starts in 50 ms.
		const before = starts();
		play(grainPatch(grains({ grains: 40, sizeMs: 400 })), 0.05);
		// Only the 8 new voices may start a grain right away, not all 40.
		expect(starts() - before).toBeLessThan(8 + 10);
	}, 30000);

	it("keeps the pitch whatever the jitter", async () => {
		const tone = Float32Array.from(
			{ length: SR * 2 },
			(_, i) => 0.3 * Math.sin((2 * Math.PI * 440 * i) / SR),
		);
		for (const jitter of [0, 1]) {
			const { play } = await renderer(tone);
			play(grainPatch(grains({ jitter, durationSec: 2 })), 0.2);
			const out = play(grainPatch(grains({ jitter, durationSec: 2 })), 0.5);
			expect(Math.abs(strongestHz(out, 300, 600) - 440)).toBeLessThanOrEqual(4);
		}
	}, 30000);

	it("plays a newly loaded sample instead of the old one", async () => {
		const { play, load, prune } = await renderer(new Float32Array(SR * 10));
		// The first sample is silence.
		expect(rms(play(grainPatch(grains({})), 0.5))).toBe(0);
		// The second, noise, under its own paths; then the old one is dropped.
		load(noise(10), 2);
		play(grainPatch(grains({ paths: samplePaths(2) })), 0.1);
		prune();
		expect(
			rms(play(grainPatch(grains({ paths: samplePaths(2) })), 0.5)),
		).toBeGreaterThan(0.01);
	}, 30000);

	it("jumps the given share of grains by the given intervals", async () => {
		const { play, snapshots } = await renderer(sine(10));
		play(
			grainPatch(
				grains({ grains: 64, intervalChance: 0.3, intervals: [-12, 7, 12] }),
			),
			3,
		);
		const semitones = snapshots
			.filter((s) => parseGrainSnapshot(s.source)?.field === "ratio")
			.map((s) => Math.round(12 * Math.log2(s.data)));
		const jumped = semitones.filter((st) => st !== 0);
		expect(new Set(jumped)).toEqual(new Set([-12, 7, 12]));
		expect(jumped.length / semitones.length).toBeGreaterThan(0.22);
		expect(jumped.length / semitones.length).toBeLessThan(0.38);
	}, 30000);

	it("drifts the position within the drift range", async () => {
		const { play, snapshots } = await renderer(sine(10));
		play(grainPatch(grains({ drift: 0.2, driftRateHz: 1 })), 6);
		// Skip the first second: the smoothed position ramps up from 0.
		const centers = snapshots
			.filter((s) => s.source === CENTER_SNAPSHOT)
			.slice(30)
			.map((s) => s.data);
		expect(Math.min(...centers)).toBeGreaterThanOrEqual(0.3);
		expect(Math.max(...centers)).toBeLessThanOrEqual(0.7);
		// It does move.
		expect(Math.max(...centers) - Math.min(...centers)).toBeGreaterThan(0.05);
	}, 30000);
});

describe("delayEffect", () => {
	const delay = { timeMs: 250, feedback: 0.5, toneHz: 18000, mix: 1 };
	// One sample at 0.5, from the second render on (the first settles).
	const impulse = el.mul(0.5, el.le(el.counter(1), 1));

	it("repeats at the delay time, each echo times the feedback", async () => {
		const { play } = await renderer();
		play(delayEffect({ ...delay, enabled: true }, [silence, silence]), 0.5);
		const out = play(
			delayEffect({ ...delay, enabled: true }, [impulse, impulse]),
			1,
		);
		const peakNear = (ms: number) => {
			const at = Math.round((ms / 1000) * SR);
			let max = 0;
			for (let i = at - 200; i < at + 200; i++)
				max = Math.max(max, Math.abs(out[i]));
			return max;
		};
		const echoes = [250, 500, 750].map(peakNear);
		expect(echoes[0]).toBeGreaterThan(0.1);
		expect(echoes[1] / echoes[0]).toBeCloseTo(0.5, 1);
		expect(echoes[2] / echoes[1]).toBeCloseTo(0.5, 1);
	});

	it("passes the dry signal untouched when off", async () => {
		const { play } = await renderer();
		const tone = el.mul(0.3, el.cycle(440));
		const out = play(
			delayEffect({ ...delay, enabled: false }, [tone, tone]),
			1,
		);
		expect(rms(out.subarray(SR / 2))).toBeCloseTo(0.3 / Math.SQRT2, 2);
	});
});

describe("reverbEffect", () => {
	const reverb = { enabled: true, size: 1, dampingHz: 16000, mix: 1 };

	it("decays 60 dB in the decay time", async () => {
		const { play } = await renderer();
		const params = { ...reverb, decaySec: 2 };
		play(reverbEffect(params, [silence, silence]), 0.5);
		const burst = el.mul(
			el.le(el.counter(1), 0.2 * SR),
			el.mul(0.3, el.noise({ seed: 3 })),
		);
		const out = play(reverbEffect(params, [burst, burst]), 2);
		const at = (s: number) =>
			rms(out.subarray(Math.round(s * SR), Math.round((s + 0.1) * SR)));
		const dbPerSecond = (db(at(1.5)) - db(at(0.5))) / 1;
		expect(-60 / dbPerSecond).toBeGreaterThan(1.7);
		expect(-60 / dbPerSecond).toBeLessThan(2.3);
	}, 30000);

	it("keeps the level whatever the decay and size", async () => {
		const levels = [];
		for (const [decaySec, size] of [
			[1, 1],
			[4, 0.5],
			[10, 2],
		]) {
			const { play } = await renderer();
			const x = el.mul(0.2, el.noise({ seed: 3 }));
			const params = { ...reverb, decaySec, size };
			// Long enough for the tail to build up to its steady level.
			play(reverbEffect(params, [x, x]), decaySec);
			levels.push(db(rms(play(reverbEffect(params, [x, x]), 1))));
		}
		expect(Math.max(...levels) - Math.min(...levels)).toBeLessThan(2);
	}, 60000);
});
