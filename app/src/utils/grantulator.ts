import { el, type NodeRepr_t } from "@elemaudio/core";
import type { GrantulatorState } from "../store/grantulator";

/** Where a loaded sample's channels live in the renderer's file system. */
export type SamplePaths = readonly [left: string, right: string];

/**
 * Paths for the n-th loaded sample. A table node only loads its buffer when
 * its path changes: uploading a new sample under the old path would keep
 * playing the old one.
 */
export const samplePaths = (n: number): SamplePaths => [
	`grantulator:sample${n}:left`,
	`grantulator:sample${n}:right`,
];

/** Intervals a grain can jump by, in semitones (see intervalChance). */
export const INTERVAL_SETS = {
	octaves: { label: "Octaves", semitones: [-12, 12] },
	fifths: { label: "Fifths and octaves", semitones: [-12, 7, 12] },
	major: { label: "Major chord", semitones: [4, 7, 12] },
	minor: { label: "Minor chord", semitones: [3, 7, 12] },
	shimmer: { label: "Shimmer", semitones: [12, 19, 24] },
} as const;

export type IntervalSetId = keyof typeof INTERVAL_SETS;

export interface GrainParams {
	/** Grain start, 0..1 of the sample. */
	position: number;
	/** Random start offset around the position, 0..1 of the sample. */
	spread: number;
	/** How far the position wanders on its own, 0..0.5 of the sample. */
	drift: number;
	/** How often the wandering position picks a new direction. */
	driftRateHz: number;
	sizeMs: number;
	semitones: number;
	/** Grain voices playing at once; each plays one grain after another. */
	grains: number;
	/** How far each voice's grain rate strays from the others, 0..1. */
	jitter: number;
	/** Random pitch offset per grain, up to this many semitones either way. */
	detune: number;
	/** Share of grains, 0..1, that jump by one of the intervals. */
	intervalChance: number;
	/** Semitones a jumping grain picks from, at random. */
	intervals: readonly number[];
	/** Random stereo position per grain, 0 (center) to 1 (hard left/right). */
	width: number;
	gain: number;
	/** The loaded sample: where it lives, and its length. */
	paths: SamplePaths;
	durationSec: number;
}

const param = (key: string, value: number) =>
	el.sm(el.const({ key: `grantulator:${key}`, value }));

/**
 * Fixed phase of voice i in 0..1, golden-ratio spaced: evenly spread for any
 * voice count, and independent of it, so changing the count leaves the other
 * voices' graphs (and their grains) untouched.
 */
export const voicePhase = (i: number) => (i * 0.618034) % 1;

/** Grains per second of voice i: a fixed, slightly different rate each. */
export const voiceRate = (i: number, sizeMs: number, jitter: number) =>
	(1 + jitter * (voicePhase(i) - 0.5)) / (sizeMs / 1000);

/** How far a grain travels at the base pitch, normalized to the sample. */
export const grainTravel = (
	sizeMs: number,
	semitones: number,
	durationSec: number,
) => ((sizeMs / 1000) * 2 ** (semitones / 12)) / Math.max(durationSec, 1e-3);

/**
 * Each voice reports its grains as snapshot events named
 * `grantulator:<voice>:<field>`, a little after the start so the latched
 * values have settled. See parseGrainSnapshot.
 */
export const SNAPSHOT_AT = 0.05;
/** The drifting position, reported 30 times a second. */
export const CENTER_SNAPSHOT = "grantulator:center";
export type GrainField = "offset" | "ratio";

export const parseGrainSnapshot = (source: string | undefined) => {
	const match = source?.match(/^grantulator:(\d+):(offset|ratio)$/);
	return match
		? { voice: Number(match[1]), field: match[2] as GrainField }
		: null;
};

/**
 * A slow random wander in about -0.5..0.5: a new random target at the given
 * rate, glided to through two smoothing stages so it never jumps.
 */
const wander = (key: string, rateHz: number) => {
	const target = el.latch(
		el.train(el.const({ key: `grantulator:${key}:rate`, value: rateHz })),
		el.sub(el.rand({ key: `grantulator:${key}`, seed: 7919 }), 0.5),
	);
	const pole = el.tau2pole(
		el.const({ key: `grantulator:${key}:tau`, value: 0.5 / rateHz }),
	);
	return el.smooth(pole, el.smooth(pole, target));
};

/** One of the semitone values, picked by a 0..1 random value. */
const pick = (random: NodeRepr_t, semitones: readonly number[]) => {
	if (semitones.length === 0) return el.const({ value: 0 });
	const index = el.floor(el.mul(random, semitones.length));
	return el.add(...semitones.map((st, k) => el.mul(el.eq(index, k), st)));
};

/** A random value in -0.5..0.5, held from one grain start to the next. */
const perGrain = (start: NodeRepr_t, key: string, seed: number) =>
	el.latch(start, el.sub(el.rand({ key: `grantulator:${key}`, seed }), 0.5));

/**
 * Granular patch: a swarm of voices, each with its own phasor at a slightly
 * different rate so they drift apart instead of firing in lockstep. When a
 * voice's phasor wraps, a new grain starts and picks its start (the drifting
 * position plus random spread), pitch (plus random detune, sometimes an
 * interval jump) and stereo position, and keeps them until the next wrap:
 * moving a parameter never smears a grain that is already playing.
 */
export function grainPatch(p: GrainParams): [NodeRepr_t, NodeRepr_t] {
	const voiceCount = Math.max(1, Math.round(p.grains));
	const position = el.add(
		param("position", p.position),
		el.mul(param("drift", p.drift), 2, wander("drift", p.driftRateHz)),
	);
	const chance = param("intervalChance", p.intervalChance);
	const spread = param("spread", p.spread);
	const detune = param("detune", p.detune);
	const width = param("width", p.width);
	const reports: NodeRepr_t[] = [
		el.snapshot(
			{ name: CENTER_SNAPSHOT },
			el.train(30),
			el.mod(el.add(position, 2), 1),
		),
	];

	const voices = Array.from({ length: voiceCount }, (_, i) => {
		const rate = el.const({
			key: `grantulator:rate${i}`,
			value: voiceRate(i, p.sizeMs, p.jitter),
		});
		const t = el.mod(el.add(el.phasor(rate), voicePhase(i)), 1);
		// How far this voice's grains travel through the sample at the base
		// pitch. Jitter changes the voice's grain length, so the travel must
		// follow, or jitter would change the pitch too.
		const lengthMs = 1000 / voiceRate(i, p.sizeMs, p.jitter);
		const travel = param(
			`travel${i}`,
			grainTravel(lengthMs, p.semitones, p.durationSec),
		);
		// Rises when t wraps around to 0: a new grain starts.
		const start = el.le(t, 0.5);
		const offset = el.latch(
			start,
			el.add(position, el.mul(spread, perGrain(start, `pos${i}`, 5 * i + 1))),
		);
		// -0.5..0.5 random times 2 * detune semitones, plus an interval for the
		// grains whose roll comes in under the chance.
		const jumps = el.le(
			perGrain(start, `roll${i}`, 5 * i + 4),
			el.sub(chance, 0.5),
		);
		const interval = pick(
			el.add(perGrain(start, `interval${i}`, 5 * i + 5), 0.5),
			p.intervals,
		);
		const semitones = el.add(
			el.mul(2, detune, perGrain(start, `pitch${i}`, 5 * i + 2)),
			el.mul(jumps, interval),
		);
		const ratio = el.pow(2, el.div(semitones, 12));
		// Keep the read index in 0..1 whatever the spread pushes it to.
		const index = el.mod(el.add(offset, el.mul(t, travel, ratio), 2), 1);
		const window = el.hann(t);
		// Equal-power pan, 0 left .. 1 right.
		const pan = el.add(
			0.5,
			el.mul(width, perGrain(start, `pan${i}`, 5 * i + 3)),
		);
		const angle = el.mul(pan, Math.PI / 2);
		const report = el.ge(t, SNAPSHOT_AT);
		const fields: [GrainField, NodeRepr_t][] = [
			["offset", offset],
			["ratio", ratio],
		];
		for (const [field, x] of fields) {
			reports.push(
				el.snapshot({ name: `grantulator:${i}:${field}` }, report, x),
			);
		}
		return [
			el.mul(window, el.cos(angle), el.table({ path: p.paths[0] }, index)),
			el.mul(window, el.sin(angle), el.table({ path: p.paths[1] }, index)),
		];
	});

	// Grains drift out of phase, so they add up like noise: by the square root
	// of their count. softClip catches the peaks when many line up.
	const level = param("level", (2 * p.gain) / Math.sqrt(voiceCount));

	// Snapshots only run when connected to an output: add them in silenced.
	const silent = el.mul(0, el.add(...reports));
	return [0, 1].map((channel) =>
		el.add(el.mul(level, el.add(...voices.map((v) => v[channel]))), silent),
	) as [NodeRepr_t, NodeRepr_t];
}

export interface DelayParams {
	enabled: boolean;
	timeMs: number;
	/** 0..<1, share of each echo fed back into the next. */
	feedback: number;
	/** Lowpass cutoff on the echoes. */
	toneHz: number;
	/** Echo level added to the dry signal, 0..1. */
	mix: number;
}

/** Room for the longest delay time (2 s) at up to 96 kHz. */
const DELAY_SIZE = 192000;

/**
 * Stereo feedback delay on top of the dry signal. The switch fades the
 * delay's input, feedback and output instead of removing it from the graph:
 * no click, and switching back on doesn't replay old echoes.
 */
export function delayEffect(
	p: DelayParams,
	input: [NodeRepr_t, NodeRepr_t],
): [NodeRepr_t, NodeRepr_t] {
	const on = param("delay:on", p.enabled ? 1 : 0);
	const time = el.ms2samps(param("delay:time", p.timeMs));
	const feedback = el.mul(on, param("delay:feedback", p.feedback));
	const tone = param("delay:tone", p.toneHz);
	const mix = el.mul(on, param("delay:mix", p.mix));
	return input.map((dry, channel) => {
		const echoes = el.delay(
			{ key: `grantulator:delay${channel}`, size: DELAY_SIZE },
			time,
			feedback,
			el.mul(on, dry),
		);
		return el.add(dry, el.mul(mix, el.lowpass(tone, Math.SQRT1_2, echoes)));
	}) as [NodeRepr_t, NodeRepr_t];
}

export interface ReverbParams {
	enabled: boolean;
	/** Time for the tail to fall by 60 dB. */
	decaySec: number;
	/** Scales the room's delay lengths, 1 is medium. */
	size: number;
	/** Lowpass cutoff in the feedback loop: lower is darker, softer walls. */
	dampingHz: number;
	/** Crossfade from dry (0) to reverb only (1). */
	mix: number;
}

const REVERB_LINES = 8;
/** Feedback delay lengths at size 1, mutually prime so echoes don't pile up. */
const FDN_MS = [53, 67, 79, 97, 113, 131, 149, 173];
/** Diffuser stage lengths at size 1: each smears the input a bit more. */
const DIFFUSER_MS = [13, 23, 37, 59];
/** Room for the longest line at size 2 at up to 96 kHz. */
const REVERB_DELAY_SIZE = 48000;
/**
 * Long tails pile up energy: the wet level is scaled by the power each pass
 * loses so moving decay or size doesn't change the loudness much. Exponent
 * and gain fitted to offline measurements of steady noise.
 */
const REVERB_NORM_EXPONENT = 0.75;
const REVERB_NORM_GAIN = 0.9;
const reverbWet = (decaySec: number, size: number) => {
	const meanMs = FDN_MS.reduce((a, b) => a + b, 0) / FDN_MS.length;
	const loss = 10 ** ((-3 * meanMs * size) / 1000 / Math.max(decaySec, 0.1));
	return REVERB_NORM_GAIN * (1 - loss ** 2) ** (REVERB_NORM_EXPONENT / 2);
};

/** Unitary mix of the lines: each output hears every input equally. */
const hadamard = (xs: NodeRepr_t[]): NodeRepr_t[] => {
	const mix = (ys: NodeRepr_t[]): NodeRepr_t[] => {
		if (ys.length === 1) return ys;
		const a = mix(ys.slice(0, ys.length / 2));
		const b = mix(ys.slice(ys.length / 2));
		return [
			...a.map((x, k) => el.add(x, b[k])),
			...a.map((x, k) => el.sub(x, b[k])),
		];
	};
	return mix(xs).map((x) => el.mul(x, 1 / Math.sqrt(xs.length)));
};

/**
 * Feedback delay network reverb: the input is smeared across 8 channels by a
 * few diffuser stages (short delays, mixed), then circulates through 8 delay
 * lines that feed each other through a Hadamard mix. Each pass loses enough
 * to fall 60 dB in the decay time, and a lowpass in the loop darkens the tail
 * as it fades. Slow wobbles on the line lengths keep it from ringing
 * metallic. Like the delay, the switch fades it rather than removing it.
 */
export function reverbEffect(
	p: ReverbParams,
	input: [NodeRepr_t, NodeRepr_t],
): [NodeRepr_t, NodeRepr_t] {
	const on = param("reverb:on", p.enabled ? 1 : 0);
	const size = param("reverb:size", p.size);
	const mix = el.mul(on, param("reverb:mix", p.mix));
	const pole = el.tau2pole(
		param("reverb:tau", 1 / (2 * Math.PI * p.dampingHz)),
	);

	// Left into the even channels, right into the odd ones.
	let channels = Array.from({ length: REVERB_LINES }, (_, c) =>
		el.mul(on, el.dcblock(input[c % 2])),
	);
	DIFFUSER_MS.forEach((ms, stage) => {
		channels = hadamard(
			channels.map((x, c) => {
				// Spread the channel lengths over 30..100% of the stage length.
				const spread = 0.3 + 0.7 * ((c * 0.618034 + stage * 0.31) % 1);
				const delayed = el.delay(
					{ key: `grantulator:diffuse${stage}:${c}`, size: REVERB_DELAY_SIZE },
					el.ms2samps(el.mul(size, ms * spread)),
					0,
					x,
				);
				// Flip some polarities so the mix doesn't just sum them back.
				return (c + stage) % 3 === 0 ? el.mul(-1, delayed) : delayed;
			}),
		);
	});

	const name = (i: number) => `grantulator:fdn${i}`;
	const feedback = hadamard(
		Array.from({ length: REVERB_LINES }, (_, i) => el.tapIn({ name: name(i) })),
	);
	const lines = FDN_MS.map((ms, i) => {
		// Loss per pass for -60 dB after decaySec.
		const loss = param(
			`reverb:loss${i}`,
			10 ** ((-3 * ms * p.size) / 1000 / Math.max(p.decaySec, 0.1)),
		);
		const wobble = el.mul(0.4, el.cycle(0.07 + 0.023 * i));
		return el.tapOut(
			{ name: name(i) },
			el.delay(
				{ key: name(i), size: REVERB_DELAY_SIZE },
				el.ms2samps(el.add(el.mul(size, ms), wobble)),
				0,
				el.add(channels[i], el.mul(on, loss, el.smooth(pole, feedback[i]))),
			),
		);
	});

	return [0, 1].map((side) => {
		const wet = el.mul(
			param("reverb:wet", reverbWet(p.decaySec, p.size)),
			el.add(...lines.filter((_, i) => i % 2 === side)),
		);
		return el.add(el.mul(el.sub(1, mix), input[side]), el.mul(mix, wet));
	}) as [NodeRepr_t, NodeRepr_t];
}

/** Last stage: tanh catches peaks when grains, echoes and tail pile up. */
export const softClip = (input: [NodeRepr_t, NodeRepr_t]) =>
	input.map((x) => el.tanh(x)) as [NodeRepr_t, NodeRepr_t];

/** The store's sound settings: everything the patch is built from. */
export type PatchSettings = Pick<
	GrantulatorState,
	"values" | "delayEnabled" | "reverbEnabled" | "intervalSet"
>;

/** The whole chain: grains, delay, reverb, soft clip. */
export function grantulatorPatch(
	{ values: v, delayEnabled, reverbEnabled, intervalSet }: PatchSettings,
	sample: { paths: SamplePaths; durationSec: number },
): [NodeRepr_t, NodeRepr_t] {
	const grains = grainPatch({
		position: v.position,
		spread: v.spread,
		drift: v.drift,
		driftRateHz: v.driftRate,
		sizeMs: v.size,
		semitones: v.pitch,
		grains: v.grains,
		jitter: v.jitter,
		detune: v.detune,
		intervalChance: v.intervalChance,
		intervals: INTERVAL_SETS[intervalSet].semitones,
		width: v.width,
		gain: v.gain,
		...sample,
	});
	const delayed = delayEffect(
		{
			enabled: delayEnabled,
			timeMs: v.delayTime,
			feedback: v.delayFeedback,
			toneHz: v.delayTone,
			mix: v.delayMix,
		},
		grains,
	);
	const reverberated = reverbEffect(
		{
			enabled: reverbEnabled,
			decaySec: v.reverbDecay,
			size: v.reverbSize,
			dampingHz: v.reverbDamping,
			mix: v.reverbMix,
		},
		delayed,
	);
	return softClip(reverberated);
}
