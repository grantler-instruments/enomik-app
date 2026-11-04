import {
	Close as CloseIcon,
	UploadFile as UploadFileIcon,
	VolumeUp as VolumeUpIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	ButtonBase,
	Chip,
	IconButton,
	Paper,
	Slider,
	Tooltip,
	Typography,
} from "@mui/material";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type PadSound, useMpcEngine } from "../hooks/useMpcEngine";
import { type MidiMessage, useMIDIStore } from "../store/midi";
import {
	type Hits,
	type LearnTarget,
	type MidiMapping,
	sameTarget,
	useMpcStore,
} from "../store/mpc";
import { getChannel, getStatus, isNoteOn, MIDI_STATUS } from "../utils/midi";
import {
	DEFAULT_SOUNDS,
	normalize,
	PAD_COUNT,
	padAt,
	SAMPLE_RATE,
} from "../utils/mpc";
import { deleteSample, loadSample, saveSample } from "../utils/sampleStore";
import Composer from "./Composer";
import CollapsibleSection from "./common/CollapsibleSection";
import InitMidi from "./InitMidi";
import PageLayout from "./layout/PageLayout";
import SectionHeader from "./SectionHeader";

/** Where a pad's dropped sample is kept. */
const sampleKey = (pad: number) => `mpc-${pad}`;

/** How long a pad lights up when hit, in ms. */
const FLASH_MS = 120;

const toBuffer = (samples: Float32Array) => {
	const buffer = new AudioBuffer({
		length: samples.length,
		sampleRate: SAMPLE_RATE,
		numberOfChannels: 1,
	});
	buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
	return buffer;
};

const defaultSound = (pad: number): PadSound => {
	const sound = DEFAULT_SOUNDS[pad];
	return {
		name: sound.name,
		buffer: toBuffer(normalize(sound.make())),
		custom: false,
	};
};

/** Decodes without the page's AudioContext, which needs a user gesture. */
const decode = (data: ArrayBuffer) =>
	new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(data.slice(0));

const mappingLabel = (mapping: MidiMapping) =>
	`Ch ${mapping.channel} ${"note" in mapping ? `Note ${mapping.note}` : `CC ${mapping.controller}`}`;

const mappingOf =
	(target: LearnTarget) => (s: ReturnType<typeof useMpcStore.getState>) =>
		target.kind === "trigger"
			? s.mappings[target.pad]
			: target.kind === "volume"
				? s.volumeMappings[target.pad]
				: s.masterMapping;

/** Learn, show and clear the note or control change driving a target. */
const LearnChip = ({
	target,
	midi,
	waiting,
}: {
	target: LearnTarget;
	midi: boolean;
	/** Shown while learning. */
	waiting: string;
}) => {
	const mapping = useMpcStore(mappingOf(target));
	const learning = useMpcStore((s) => sameTarget(s.learning, target));
	const setLearning = useMpcStore((s) => s.setLearning);
	const setMapping = useMpcStore((s) => s.setMapping);
	return (
		<Chip
			size="small"
			disabled={!midi}
			color={learning ? "warning" : mapping ? "primary" : "default"}
			variant={mapping || learning ? "filled" : "outlined"}
			label={
				learning ? waiting : mapping ? mappingLabel(mapping) : "MIDI learn"
			}
			onClick={() => setLearning(learning ? null : target)}
			onDelete={mapping ? () => setMapping(target, null) : undefined}
			sx={{ minWidth: 0 }}
		/>
	);
};

const Pad = ({
	pad,
	sound,
	lit,
	midi,
	onHit,
	onFile,
	onClear,
}: {
	pad: number;
	sound: PadSound | undefined;
	lit: boolean;
	midi: boolean;
	onHit: () => void;
	onFile: (file: File) => void;
	onClear: () => void;
}) => {
	const volume = useMpcStore((s) => s.padVolumes[pad]);
	const setPadVolume = useMpcStore((s) => s.setPadVolume);
	const fileInput = useRef<HTMLInputElement>(null);
	const [fileOver, setFileOver] = useState(false);

	const drop = (e: DragEvent) => {
		e.preventDefault();
		setFileOver(false);
		const file = e.dataTransfer.files[0];
		if (file) onFile(file);
	};

	return (
		<Paper
			variant="outlined"
			onDragOver={(e) => {
				e.preventDefault();
				setFileOver(true);
			}}
			onDragLeave={() => setFileOver(false)}
			onDrop={drop}
			sx={{
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				borderColor: fileOver ? "primary.main" : undefined,
			}}
		>
			<ButtonBase
				aria-label={`Pad ${pad + 1}`}
				// On press, not on release: pads should feel immediate.
				onPointerDown={onHit}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onHit();
					}
				}}
				sx={{
					aspectRatio: "3 / 2",
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					justifyContent: "space-between",
					p: 1,
					bgcolor: lit ? "primary.main" : "action.hover",
					color: lit ? "primary.contrastText" : "text.primary",
					transition: lit ? "none" : "background-color 200ms",
				}}
			>
				<Typography variant="caption" fontWeight="bold">
					{pad + 1}
				</Typography>
				<Typography variant="body2" noWrap maxWidth="100%">
					{sound?.name ?? "…"}
				</Typography>
			</ButtonBase>
			<Box display="flex" alignItems="center" gap={0.5} p={0.5}>
				<LearnChip
					target={{ kind: "trigger", pad }}
					midi={midi}
					waiting="Hit a pad…"
				/>
				<Box flex={1} />
				<Tooltip title="Load sample">
					<IconButton
						size="small"
						aria-label={`Load sample on pad ${pad + 1}`}
						onClick={() => fileInput.current?.click()}
					>
						<UploadFileIcon fontSize="small" />
					</IconButton>
				</Tooltip>
				{sound?.custom && (
					<Tooltip title="Back to the built-in sound">
						<IconButton
							size="small"
							aria-label={`Reset pad ${pad + 1}`}
							onClick={onClear}
						>
							<CloseIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}
				<input
					ref={fileInput}
					type="file"
					accept="audio/*"
					hidden
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) onFile(file);
						e.target.value = "";
					}}
				/>
			</Box>
			<Box display="flex" alignItems="center" gap={1} px={1} pb={0.5}>
				<Slider
					size="small"
					aria-label={`Pad ${pad + 1} volume`}
					min={0}
					max={1}
					step={0.01}
					value={volume}
					onChange={(_, v) => setPadVolume(pad, v as number)}
				/>
				<LearnChip
					target={{ kind: "volume", pad }}
					midi={midi}
					waiting="Move a control…"
				/>
			</Box>
		</Paper>
	);
};

/**
 * Hidden page (open #/mpc): 16 sample pads in a 4x4 grid. Each pad plays a
 * built-in sound or a dropped sample, and is triggered by a click, a note or
 * a control change (e.g. a touch pad). `embedded`: without page chrome,
 * toolbar inline (used in the tutorial).
 */
const Mpc = ({ embedded = false }: { embedded?: boolean }) => {
	const { t } = useTranslation();
	const [sounds, setSounds] = useState<PadSound[]>(() =>
		Array.from({ length: PAD_COUNT }, (_, pad) => defaultSound(pad)),
	);
	const [lit, setLit] = useState<boolean[]>(() => Array(PAD_COUNT).fill(false));
	const volume = useMpcStore((s) => s.volume);
	const setVolume = useMpcStore((s) => s.setVolume);
	const handleNoteOn = useMpcStore((s) => s.handleNoteOn);
	const handleControlChange = useMpcStore((s) => s.handleControlChange);
	const midiInitialized = useMIDIStore((s) => s.initialized);
	const inputs = useMIDIStore((s) => s.inputs) as MIDIInput[];

	const [error, setError] = useState<string | null>(null);
	const { running, start: startEngine, stop, trigger } = useMpcEngine(sounds);
	const flashTimers = useRef<number[]>([]);

	const flash = (pad: number) => {
		setLit((prev) => prev.map((on, i) => (i === pad ? true : on)));
		window.clearTimeout(flashTimers.current[pad]);
		flashTimers.current[pad] = window.setTimeout(
			() => setLit((prev) => prev.map((on, i) => (i === pad ? false : on))),
			FLASH_MS,
		);
	};

	const play = (pad: number, velocity = 1) => {
		flash(pad);
		trigger(pad, velocity).catch((e) =>
			setError(`Could not start audio: ${(e as Error).message}`),
		);
	};

	const startAudio = () =>
		startEngine().catch((e) =>
			setError(`Could not start audio: ${(e as Error).message}`),
		);

	const playHits = (hits: Hits) => {
		for (const { pad, velocity } of hits) play(pad, velocity);
	};

	/** The Composer's messages play (or learn) like incoming ones. */
	const playComposed = (message: MidiMessage) => {
		const { type, channel = 1, note = 0, velocity = 0, value = 0 } = message;
		if (type === MIDI_STATUS.CONTROL_CHANGE) {
			playHits(handleControlChange(channel, message.controller ?? 0, value));
		} else if (isNoteOn(type, velocity)) {
			playHits(handleNoteOn(channel, note, velocity));
		}
	};

	const setSound = (pad: number, sound: PadSound) =>
		setSounds((prev) => prev.map((s, i) => (i === pad ? sound : s)));

	const loadFile = async (pad: number, file: File) => {
		setError(null);
		try {
			const data = await file.arrayBuffer();
			const buffer = await decode(data);
			setSound(pad, { name: file.name, buffer, custom: true });
			saveSample({ name: file.name, data }, sampleKey(pad)).catch((e) =>
				console.warn("Could not keep the MPC sample", e),
			);
		} catch (e) {
			setError(`Could not load ${file.name}: ${(e as Error).message}`);
		}
	};

	const clearPad = (pad: number) => {
		setSound(pad, defaultSound(pad));
		deleteSample(sampleKey(pad)).catch((e) =>
			console.warn("Could not remove the MPC sample", e),
		);
	};

	// The samples dropped on an earlier visit.
	useEffect(() => {
		for (let pad = 0; pad < PAD_COUNT; pad++) {
			loadSample(sampleKey(pad))
				.then(async (stored) => {
					if (!stored) return;
					const buffer = await decode(stored.data);
					const sound = { name: stored.name, buffer, custom: true };
					// A file dropped meanwhile wins.
					setSounds((prev) =>
						prev.map((s, i) => (i === pad && !s.custom ? sound : s)),
					);
				})
				.catch((e) => console.warn("Could not restore an MPC sample", e));
		}
	}, []);

	useEffect(
		() => () => {
			for (const timer of flashTimers.current) window.clearTimeout(timer);
		},
		[],
	);

	// Notes and control changes from every input: learn mappings, hit pads.
	// biome-ignore lint/correctness/useExhaustiveDependencies: play reads refs
	useEffect(() => {
		if (!midiInitialized) return;
		const listener = (event: MIDIMessageEvent) => {
			if (!event.data || event.data.length < 3) return;
			const [status, data1, data2] = event.data;
			// Mappings count channels from 1.
			const channel = getChannel(status) + 1;
			if (getStatus(status) === MIDI_STATUS.CONTROL_CHANGE) {
				playHits(handleControlChange(channel, data1, data2));
			} else if (isNoteOn(getStatus(status), data2)) {
				playHits(handleNoteOn(channel, data1, data2));
			}
		};
		for (const input of inputs) input.addEventListener("midimessage", listener);
		return () => {
			for (const input of inputs)
				input.removeEventListener("midimessage", listener);
		};
	}, [midiInitialized, inputs, handleControlChange, handleNoteOn]);

	const toolbar = (
		<>
			<Box flex={1} />
			<Box display="flex" alignItems="center" gap={1} width={200}>
				<VolumeUpIcon fontSize="small" />
				<Slider
					size="small"
					aria-label="Volume"
					min={0}
					max={1}
					step={0.01}
					value={volume}
					onChange={(_, v) => setVolume(v as number)}
				/>
			</Box>
			<LearnChip
				target={{ kind: "master" }}
				midi={midiInitialized}
				waiting="Move a control…"
			/>
			<InitMidi />
			{running ? (
				<Button variant="outlined" onClick={stop}>
					Stop audio
				</Button>
			) : (
				<Button variant="contained" onClick={startAudio}>
					Start audio
				</Button>
			)}
		</>
	);

	const body = (
		<>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			<CollapsibleSection
				defaultExpanded
				sx={{ mb: 2 }}
				title={
					<SectionHeader
						component="span"
						title={t("section_midi_composer")}
						tooltipKey="tooltip_midi_composer"
					/>
				}
			>
				<Composer onSend={playComposed} />
			</CollapsibleSection>
			<Box
				display="grid"
				gridTemplateColumns="repeat(4, minmax(0, 1fr))"
				gap={1}
				maxWidth={720}
				mx="auto"
			>
				{Array.from({ length: PAD_COUNT }, (_, cell) => {
					const pad = padAt(Math.floor(cell / 4), cell % 4);
					return (
						<Pad
							key={pad}
							pad={pad}
							sound={sounds[pad]}
							lit={lit[pad]}
							midi={midiInitialized}
							onHit={() => play(pad)}
							onFile={(file) => loadFile(pad, file)}
							onClear={() => clearPad(pad)}
						/>
					);
				})}
			</Box>
		</>
	);

	if (embedded) {
		return (
			<>
				<Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
					{toolbar}
				</Box>
				{body}
			</>
		);
	}

	return (
		<PageLayout
			title="MPC"
			maxWidth={false}
			actions={toolbar}
			info="Click a pad or hit it from any MIDI controller: pads 1 to 16 listen to notes 36 to 51 on channel 1. Drop an audio file on a pad to replace its sound; MIDI learn maps a pad to another note or a touch pad's control change, and a volume slider to a knob."
		>
			{body}
		</PageLayout>
	);
};

export default Mpc;
