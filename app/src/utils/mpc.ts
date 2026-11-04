/**
 * The MPC: its built-in sounds, synthesized so the pads play something before
 * any sample is dropped on them, and its Elementary patch.
 */

import { el, type NodeRepr_t } from "@elemaudio/core";
import { type SamplePaths, softClip } from "./grantulator";

export const PAD_COUNT = 16;
export const SAMPLE_RATE = 44100;

/** Seeded noise: the same sounds on every load (and in tests). */
const noise = (seed: number) => {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
	};
};

const render = (seconds: number, at: (t: number, i: number) => number) => {
	const out = new Float32Array(Math.round(seconds * SAMPLE_RATE));
	for (let i = 0; i < out.length; i++) out[i] = at(i / SAMPLE_RATE, i);
	return out;
};

/** Scales the peak to 0.9, so every pad starts out about as loud. */
export const normalize = (samples: Float32Array) => {
	let peak = 0;
	for (const v of samples) peak = Math.max(peak, Math.abs(v));
	if (peak === 0) return samples;
	const gain = 0.9 / peak;
	return samples.map((v) => v * gain);
};

/** A sine sweeping exponentially from `from` to `to` Hz. */
const sweep = (seconds: number, from: number, to: number, decay: number) => {
	let phase = 0;
	return render(seconds, (t) => {
		const f = to + (from - to) * Math.exp(-t * 30);
		phase += (2 * Math.PI * f) / SAMPLE_RATE;
		return Math.sin(phase) * Math.exp(-t * decay);
	});
};

/** Noise with its lows taken out (a first difference), for hats and claps. */
const brightNoise = (seed: number) => {
	const next = noise(seed);
	let prev = 0;
	return () => {
		const v = next();
		const out = v - prev;
		prev = v;
		return out;
	};
};

const hat = (seconds: number, decay: number, seed: number) => {
	const n = brightNoise(seed);
	return render(seconds, (t) => n() * Math.exp(-t * decay));
};

const snare = () => {
	const n = noise(2);
	return render(
		0.25,
		(t) =>
			n() * 0.6 * Math.exp(-t * 20) +
			Math.sin(2 * Math.PI * 180 * t) * 0.5 * Math.exp(-t * 30),
	);
};

/** Three quick bursts, then a tail. */
const clap = () => {
	const n = brightNoise(5);
	return render(
		0.3,
		(t) =>
			n() *
			(t < 0.03 ? Math.exp(-(t % 0.01) * 300) : Math.exp(-(t - 0.03) * 15)),
	);
};

const rim = () => {
	const n = noise(6);
	return render(
		0.06,
		(t) => (Math.sin(2 * Math.PI * 1700 * t) + n() * 0.4) * Math.exp(-t * 80),
	);
};

const square = (f: number, t: number) =>
	Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1;

const cowbell = () =>
	render(
		0.35,
		(t) => (square(540, t) + square(800, t)) * 0.5 * Math.exp(-t * 12),
	);

/** A plucked tone: a few harmonics fading out, the high ones faster. */
const pluck = (f: number) =>
	render(0.8, (t) =>
		[1, 2, 3].reduce(
			(sum, h) =>
				sum + (Math.sin(2 * Math.PI * f * h * t) / h) * Math.exp(-t * 4 * h),
			0,
		),
	);

/** C minor pentatonic, from C3. */
const PLUCK_NOTES = [130.81, 155.56, 196.0, 233.08, 261.63, 311.13];

export const DEFAULT_SOUNDS: { name: string; make: () => Float32Array }[] = [
	{ name: "Kick", make: () => sweep(0.5, 150, 45, 7) },
	{ name: "Snare", make: snare },
	{ name: "Closed hat", make: () => hat(0.08, 60, 3) },
	{ name: "Open hat", make: () => hat(0.45, 8, 4) },
	{ name: "Clap", make: clap },
	{ name: "Rim", make: rim },
	{ name: "Tom low", make: () => sweep(0.45, 120, 80, 8) },
	{ name: "Tom mid", make: () => sweep(0.4, 180, 120, 9) },
	{ name: "Tom high", make: () => sweep(0.35, 260, 170, 10) },
	{ name: "Cowbell", make: cowbell },
	...PLUCK_NOTES.map((f, i) => ({
		name: `Pluck ${i + 1}`,
		make: () => pluck(f),
	})),
];

/**
 * Which pad sits in a cell of the 4x4 grid, rows from the top: pad 1 is at
 * the bottom left, pad 16 at the top right.
 */
export const padAt = (row: number, column: number) => (3 - row) * 4 + column;

/**
 * Paths for a pad's n-th uploaded sound. A sample node only loads its buffer
 * when its path changes: a new sound under the old path would keep playing
 * the old one.
 */
export const padPaths = (pad: number, n: number): SamplePaths => [
	`mpc:pad${pad}:${n}:left`,
	`mpc:pad${pad}:${n}:right`,
];

export interface PadVoice {
	/** Where the pad's sound is; null while it has none. */
	paths: SamplePaths | null;
	/** The sound's length in samples. */
	length: number;
	/** A rising edge (0 to 1) starts the sound from the top. */
	gate: number;
	/**
	 * Of the last hit, 0..1. 0 until the first one: a new voice starts
	 * playing right away.
	 */
	velocity: number;
	/** The pad's volume slider, 0..1. */
	volume: number;
	/** Sound sample rate over the output's, so it plays at its pitch. */
	rate: number;
}

/**
 * All pads, summed into stereo. Every value is a keyed const: a hit or a
 * moved slider re-renders as a value change, without rebuilding the graph.
 * Effects can go between the sum and the soft clip.
 */
export function mpcPatch(pads: PadVoice[]): [NodeRepr_t, NodeRepr_t] {
	const voices = pads.flatMap((p, pad) => {
		if (!p.paths) return [];
		const key = (name: string) => `mpc:${pad}:${name}`;
		const gain = el.mul(
			// Squared for an even-sounding fade. Not smoothed: el.sm ramps up
			// from 0 when created, which would fade in the first hit.
			el.const({ key: key("volume"), value: p.volume ** 2 }),
			el.const({ key: key("velocity"), value: p.velocity }),
		);
		const gate = el.const({ key: key("gate"), value: p.gate });
		// el.sample fades in over ~40 ms, too slow for a drum's attack. This
		// reads the sound with a table instead: the position runs from 0 to 1
		// over its length, back to 0 on each rising edge of the gate.
		const position = el.accum(
			el.const({ key: key("step"), value: p.rate / p.length }),
			gate,
		);
		const playing = el.le(position, 1);
		const paths = p.paths;
		return [
			[0, 1].map((side) =>
				el.mul(
					gain,
					playing,
					el.table(
						{ key: key(`table${side}`), path: paths[side] },
						el.min(position, 1),
					),
				),
			) as [NodeRepr_t, NodeRepr_t],
		];
	});
	const silence = el.const({ value: 0 });
	const sum = (side: 0 | 1) => el.add(silence, ...voices.map((v) => v[side]));
	return softClip([sum(0), sum(1)]);
}
