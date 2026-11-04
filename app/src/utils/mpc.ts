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

export interface DefaultSound {
	/** English name, for tests and logs. */
	name: string;
	/** i18n key of the name shown on the pad (src/i18n.audio.ts). */
	labelKey: string;
	/** Interpolation values for labelKey. */
	labelValues?: Record<string, number>;
	make: () => Float32Array;
}

export const DEFAULT_SOUNDS: DefaultSound[] = [
	{
		name: "Kick",
		labelKey: "mpc_sound_kick",
		make: () => sweep(0.5, 150, 45, 7),
	},
	{ name: "Snare", labelKey: "mpc_sound_snare", make: snare },
	{
		name: "Closed hat",
		labelKey: "mpc_sound_closed_hat",
		make: () => hat(0.08, 60, 3),
	},
	{
		name: "Open hat",
		labelKey: "mpc_sound_open_hat",
		make: () => hat(0.45, 8, 4),
	},
	{ name: "Clap", labelKey: "mpc_sound_clap", make: clap },
	{ name: "Rim", labelKey: "mpc_sound_rim", make: rim },
	{
		name: "Tom low",
		labelKey: "mpc_sound_tom_low",
		make: () => sweep(0.45, 120, 80, 8),
	},
	{
		name: "Tom mid",
		labelKey: "mpc_sound_tom_mid",
		make: () => sweep(0.4, 180, 120, 9),
	},
	{
		name: "Tom high",
		labelKey: "mpc_sound_tom_high",
		make: () => sweep(0.35, 260, 170, 10),
	},
	{ name: "Cowbell", labelKey: "mpc_sound_cowbell", make: cowbell },
	...PLUCK_NOTES.map((f, i) => ({
		name: `Pluck ${i + 1}`,
		labelKey: "mpc_sound_pluck",
		labelValues: { n: i + 1 },
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

/** One of a pad's two voices: a hit plays on the one not playing yet. */
export interface Voice {
	/** A rising edge (0 to 1) starts the sound from the top. */
	gate: number;
	/**
	 * Of the hit it plays, 0..1. 0 until its first one: a new voice starts
	 * playing right away.
	 */
	velocity: number;
	/** 1 while it's the pad's current voice; 0 fades it out. */
	active: number;
}

export interface PadState {
	/** Where the pad's sound is; null while it has none. */
	paths: SamplePaths | null;
	/** The sound's length in samples. */
	length: number;
	/** The sound's own sample rate. */
	sampleRate: number;
	/** The pad's volume slider, 0..1. */
	volume: number;
	/** Sound sample rate over the output's, so it plays at its pitch. */
	rate: number;
	voices: [Voice, Voice];
}

/** Fade at the end of a sound, so one that stops above zero doesn't click. */
export const END_FADE_SEC = 0.003;
/** Fade of a voice cut off by the next hit, as a time constant. */
export const CUT_FADE_SEC = 0.001;
/** Smoothing of the volume slider. */
const VOLUME_SMOOTH_SEC = 0.01;

/**
 * All pads, summed into stereo. Every value is a keyed const: a hit or a
 * moved slider re-renders as a value change, without rebuilding the graph.
 * Effects can go between the sum and the soft clip.
 *
 * Nothing jumps, so nothing clicks: a hit starts the pad's other voice while
 * the playing one fades out within a few ms, every sound fades out over its
 * last END_FADE_SEC, and the volume slider is smoothed.
 */
export function mpcPatch(pads: PadState[]): [NodeRepr_t, NodeRepr_t] {
	const outputs = pads.flatMap((p, pad) => {
		const paths = p.paths;
		if (!paths) return [];
		const key = (name: string) => `mpc:${pad}:${name}`;
		// Squared for an even-sounding fade.
		const volume = el.smooth(
			el.tau2pole(VOLUME_SMOOTH_SEC),
			el.const({ key: key("volume"), value: p.volume ** 2 }),
		);
		// From 1 down to 0 over the last END_FADE_SEC of the sound (at most a
		// quarter of it, for very short ones).
		const fadeSamples = Math.min(END_FADE_SEC * p.sampleRate, p.length / 4);
		const endScale = el.const({
			key: key("endScale"),
			value: p.length / Math.max(fadeSamples, 1),
		});
		const step = el.const({ key: key("step"), value: p.rate / p.length });
		const voices = p.voices.map((v, i) => {
			const vkey = (name: string) => key(`${i}:${name}`);
			// el.sample fades in over ~40 ms, too slow for a drum's attack. This
			// reads the sound with a table instead: the position runs from 0 to
			// 1 over its length, back to 0 on each rising edge of the gate.
			const position = el.accum(
				step,
				el.const({ key: vkey("gate"), value: v.gate }),
			);
			const endFade = el.max(
				0,
				el.min(1, el.mul(el.sub(1, position), endScale)),
			);
			// Instant on, so the attack stays sharp; smoothed off when the
			// next hit takes over.
			const active = el.const({ key: vkey("active"), value: v.active });
			const cut = el.max(active, el.smooth(el.tau2pole(CUT_FADE_SEC), active));
			const gain = el.mul(
				el.const({ key: vkey("velocity"), value: v.velocity }),
				cut,
				endFade,
			);
			return [0, 1].map((side) =>
				el.mul(
					gain,
					el.table(
						{ key: vkey(`table${side}`), path: paths[side] },
						el.min(position, 1),
					),
				),
			);
		});
		return [
			[0, 1].map((side) =>
				el.mul(volume, el.add(voices[0][side], voices[1][side])),
			) as [NodeRepr_t, NodeRepr_t],
		];
	});
	const silence = el.const({ value: 0 });
	const sum = (side: 0 | 1) => el.add(silence, ...outputs.map((v) => v[side]));
	return softClip([sum(0), sum(1)]);
}
