import WebRenderer from "@elemaudio/web-renderer";
import { useEffect, useRef, useState } from "react";
import {
	type GrantulatorParamId,
	type GrantulatorState,
	useGrantulatorStore,
} from "../store/grantulator";
import { coalesce } from "../utils/coalesce";
import {
	CENTER_SNAPSHOT,
	grantulatorPatch,
	parseGrainSnapshot,
	type SamplePaths,
	SNAPSHOT_AT,
	samplePaths,
	voiceRate,
} from "../utils/grantulator";

export interface Sample {
	name: string;
	buffer: AudioBuffer;
}

/** The grain a voice is playing, as last reported by the audio thread. */
export interface Grain {
	offset: number;
	ratio: number;
	/** performance.now() at the grain start. */
	born: number;
}

/** What the audio thread last reported about the grains. */
export interface Swarm {
	voices: Map<number, Grain>;
	/** The drifting position, 0..1 of the sample; null before audio starts. */
	center: number | null;
}

interface Engine {
	context: AudioContext;
	core: WebRenderer;
	/** Master volume and mute, after the patch: no render needed to move it. */
	master: GainNode;
}

/** Output gain for the master settings; squared for an even-sounding fade. */
const masterGain = ({ values, muted }: GrantulatorState) =>
	muted ? 0 : values.volume ** 2;

/** Sound settings changed, apart from the master volume, which the GainNode handles. */
const patchChanged = (state: GrantulatorState, prev: GrantulatorState) =>
	state.delayEnabled !== prev.delayEnabled ||
	state.reverbEnabled !== prev.reverbEnabled ||
	state.intervalSet !== prev.intervalSet ||
	(state.values !== prev.values &&
		Object.keys(state.values).some(
			(id) =>
				id !== "volume" &&
				state.values[id as GrantulatorParamId] !==
					prev.values[id as GrantulatorParamId],
		));

/**
 * Runs the Grantulator patch: one AudioContext with the Elementary renderer,
 * created on the first start() (which needs a user gesture) and closed on
 * unmount. Renders the patch whenever the sample or the store's sound
 * settings change, and collects the grain reports into `swarm`.
 */
export function useGrantulatorEngine(sample: Sample | null) {
	const engine = useRef<Engine | null>(null);
	/** The first start(): later calls wait for it instead of starting again. */
	const starting = useRef<Promise<Engine> | null>(null);
	const unmounted = useRef(false);
	const swarm = useRef<Swarm>({ voices: new Map(), center: null });
	const [running, setRunning] = useState(false);

	const create = async () => {
		const context = new AudioContext();
		const core = new WebRenderer();
		const node = await core.initialize(context, {
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [2],
		});
		// Unmounted while starting: nothing will close it later.
		if (unmounted.current) {
			void context.close();
			throw new Error("Grantulator unmounted while starting");
		}
		const master = new GainNode(context, {
			gain: masterGain(useGrantulatorStore.getState()),
		});
		node.connect(master).connect(context.destination);
		core.on("snapshot", ({ source, data }) => {
			if (source === CENTER_SNAPSHOT) {
				swarm.current.center = data;
				return;
			}
			const report = parseGrainSnapshot(source);
			if (!report) return;
			const grain = swarm.current.voices.get(report.voice) ?? {
				offset: 0,
				ratio: 1,
				born: 0,
			};
			grain[report.field] = data;
			// The offset report marks a new grain, SNAPSHOT_AT into it.
			if (report.field === "offset") {
				const { size, jitter } = useGrantulatorStore.getState().values;
				const duration = 1000 / voiceRate(report.voice, size, jitter);
				grain.born = performance.now() - SNAPSHOT_AT * duration;
			}
			swarm.current.voices.set(report.voice, grain);
		});
		engine.current = { context, core, master };
		return engine.current;
	};

	const start = async () => {
		starting.current ??= create().catch((e) => {
			starting.current = null;
			throw e;
		});
		try {
			const { context } = await starting.current;
			await context.resume();
			setRunning(true);
		} catch (e) {
			// Leaving the page while starting is no error to show.
			if (!unmounted.current) throw e;
		}
	};

	const stop = async () => {
		await engine.current?.context.suspend();
		setRunning(false);
	};

	const sampleRef = useRef(sample);
	sampleRef.current = sample;
	const uploaded = useRef<{ sample: Sample; paths: SamplePaths } | null>(null);
	const uploads = useRef(0);

	const render = async () => {
		const core = engine.current?.core;
		const current = sampleRef.current;
		if (!core) return;
		if (!current) {
			await core.render(0, 0);
			return;
		}
		// A new sample goes under new paths (see samplePaths).
		const isNew = uploaded.current?.sample !== current;
		if (isNew) {
			const paths = samplePaths(++uploads.current);
			const right = current.buffer.numberOfChannels > 1 ? 1 : 0;
			await core.updateVirtualFileSystem({
				[paths[0]]: current.buffer.getChannelData(0),
				[paths[1]]: current.buffer.getChannelData(right),
			});
			uploaded.current = { sample: current, paths };
		}
		const { paths } = uploaded.current as { paths: SamplePaths };
		// Elementary crossfades the output whenever the graph changes, so
		// adding or removing voices, or swapping the sample, doesn't click.
		await core.render(
			...grantulatorPatch(useGrantulatorStore.getState(), {
				paths,
				durationSec: current.buffer.duration,
			}),
		);
		// Drop the previous sample's buffers, which no table reads any more.
		if (isNew) await core.pruneVirtualFileSystem();
	};

	// Building and rendering the graph takes several ms (about 20 at 64
	// grains), more than a dragged slider leaves between changes. render()
	// works from the latest settings, so changes during a render fold into one
	// more render instead of queueing one each. Also keeps renders in order
	// and uploads a new sample once. It only uses refs: the first render's
	// closure stays valid.
	const [requestRender] = useState(() => coalesce(render));

	// Render on sound changes straight from the store, not through React
	// state: a moved slider then re-renders only its own row, not the page.
	// biome-ignore lint/correctness/useExhaustiveDependencies: a new sample needs a render too; render() reads it from sampleRef.
	useEffect(() => {
		if (!running) return;
		const request = () =>
			requestRender().catch((e) =>
				console.error("Grantulator render failed", e),
			);
		request();
		return useGrantulatorStore.subscribe((state, prev) => {
			if (patchChanged(state, prev)) request();
		});
	}, [running, sample, requestRender]);

	// A short glide instead of a jump, so moving the volume or muting doesn't click.
	useEffect(() => {
		if (!running) return;
		const glide = (state: GrantulatorState) => {
			const master = engine.current?.master;
			if (!master) return;
			master.gain.setTargetAtTime(
				masterGain(state),
				master.context.currentTime,
				0.01,
			);
		};
		glide(useGrantulatorStore.getState());
		return useGrantulatorStore.subscribe((state, prev) => {
			if (masterGain(state) !== masterGain(prev)) glide(state);
		});
	}, [running]);

	useEffect(() => {
		unmounted.current = false;
		return () => {
			unmounted.current = true;
			void engine.current?.context.close();
			engine.current = null;
			starting.current = null;
		};
	}, []);

	return { running, start, stop, swarm };
}
