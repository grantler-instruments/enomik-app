import WebRenderer from "@elemaudio/web-renderer";
import { useEffect, useRef, useState } from "react";
import { type MpcState, useMpcStore } from "../store/mpc";
import type { SamplePaths } from "../utils/grantulator";
import { mpcPatch, PAD_COUNT, type PadVoice, padPaths } from "../utils/mpc";

export interface PadSound {
	name: string;
	buffer: AudioBuffer;
	/** Dropped by the user, not built in. */
	custom: boolean;
}

interface Engine {
	context: AudioContext;
	core: WebRenderer;
	/** Master volume, after the patch: no render needed to move it. */
	master: GainNode;
}

/** How long a hit holds the gate open: the next hit needs it closed again. */
const GATE_MS = 10;

const masterGain = (state: MpcState) => state.volume ** 2;

/**
 * Runs the MPC patch: one AudioContext with the Elementary renderer, created
 * on the first start() (which needs a user gesture) and closed on unmount.
 * Uploads the pad sounds when they change and renders a hit as a gate pulse.
 */
export function useMpcEngine(sounds: PadSound[]) {
	const engine = useRef<Engine | null>(null);
	/** The first start(): later calls wait for it instead of starting again. */
	const starting = useRef<Promise<Engine> | null>(null);
	const unmounted = useRef(false);
	const [running, setRunning] = useState(false);

	const soundsRef = useRef(sounds);
	soundsRef.current = sounds;
	/** What each pad's paths hold in the renderer's file system. */
	const uploaded = useRef<{ sound: PadSound; paths: SamplePaths }[]>([]);
	const uploads = useRef(0);
	const gates = useRef<number[]>(Array(PAD_COUNT).fill(0));
	// 0 until a pad is hit: a new voice starts playing right away.
	const velocities = useRef<number[]>(Array(PAD_COUNT).fill(0));
	const gateTimers = useRef<number[]>([]);

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
			throw new Error("MPC unmounted while starting");
		}
		const master = new GainNode(context, {
			gain: masterGain(useMpcStore.getState()),
		});
		node.connect(master).connect(context.destination);
		engine.current = { context, core, master };
		// Elementary fades a new graph in: render it now, not on the first hit.
		void requestRender();
		return engine.current;
	};

	/** Uploads changed sounds, renders, then drops the replaced buffers. */
	const render = async () => {
		const current = engine.current;
		if (!current) return;
		const { core, context } = current;
		const changed: Record<string, Float32Array> = {};
		soundsRef.current.forEach((sound, pad) => {
			if (uploaded.current[pad]?.sound === sound) return;
			const paths = padPaths(pad, ++uploads.current);
			const right = sound.buffer.numberOfChannels > 1 ? 1 : 0;
			changed[paths[0]] = sound.buffer.getChannelData(0);
			changed[paths[1]] = sound.buffer.getChannelData(right);
			uploaded.current[pad] = { sound, paths };
		});
		const isNew = Object.keys(changed).length > 0;
		if (isNew) await core.updateVirtualFileSystem(changed);
		const { padVolumes } = useMpcStore.getState();
		const voices: PadVoice[] = Array.from({ length: PAD_COUNT }, (_, pad) => {
			const upload = uploaded.current[pad];
			return {
				paths: upload?.paths ?? null,
				length: upload?.sound.buffer.length ?? 1,
				gate: gates.current[pad],
				velocity: velocities.current[pad],
				volume: padVolumes[pad],
				rate: upload ? upload.sound.buffer.sampleRate / context.sampleRate : 1,
			};
		});
		await core.render(...mpcPatch(voices));
		if (isNew) await core.pruneVirtualFileSystem();
	};

	const requestRender = () =>
		render().catch((e) => console.error("MPC render failed", e));

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

	/** Plays a pad from the top; starts the audio first if it isn't yet. */
	const trigger = async (pad: number, velocity: number) => {
		if (engine.current?.context.state !== "running") await start();
		velocities.current[pad] = velocity;
		gates.current[pad] = 1;
		void requestRender();
		window.clearTimeout(gateTimers.current[pad]);
		gateTimers.current[pad] = window.setTimeout(() => {
			gates.current[pad] = 0;
			void requestRender();
		}, GATE_MS);
	};

	// New sounds and moved pad volumes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: render() reads the sounds from soundsRef.
	useEffect(() => {
		if (!running) return;
		void requestRender();
		return useMpcStore.subscribe((state, prev) => {
			if (state.padVolumes !== prev.padVolumes) void requestRender();
		});
	}, [running, sounds]);

	// A short glide instead of a jump, so moving the volume doesn't click.
	useEffect(() => {
		if (!running) return;
		const glide = (state: MpcState) => {
			const master = engine.current?.master;
			if (!master) return;
			master.gain.setTargetAtTime(
				masterGain(state),
				master.context.currentTime,
				0.01,
			);
		};
		glide(useMpcStore.getState());
		return useMpcStore.subscribe((state, prev) => {
			if (state.volume !== prev.volume) glide(state);
		});
	}, [running]);

	useEffect(() => {
		unmounted.current = false;
		return () => {
			unmounted.current = true;
			for (const timer of gateTimers.current) window.clearTimeout(timer);
			void engine.current?.context.close();
			engine.current = null;
			starting.current = null;
		};
	}, []);

	return { running, start, stop, trigger };
}
