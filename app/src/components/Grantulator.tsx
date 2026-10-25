import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
	type Sample,
	useGrantulatorEngine,
} from "../hooks/useGrantulatorEngine";
import { useGrantulatorStore } from "../store/grantulator";
import { useMIDIStore } from "../store/midi";
import { getChannel, getStatus, isNoteOn, MIDI_STATUS } from "../utils/midi";
import { loadSample, saveSample } from "../utils/sampleStore";
import Dropzone from "./grantulator/Dropzone";
import EffectPanel from "./grantulator/EffectPanel";
import IntervalSetSelect from "./grantulator/IntervalSetSelect";
import ParamRows from "./grantulator/ParamRows";
import InitMidi from "./InitMidi";

/** CC0, see public/samples/LICENSE.md. */
const DEFAULT_SAMPLE = "birds-isaiah658.mp3";

/**
 * Decodes without the page's AudioContext, which can only start after a user
 * gesture. The grain tables are read by normalized position, so the decode
 * sample rate doesn't have to match the output one. Decodes a copy: decoding
 * detaches the buffer it gets.
 */
const decode = (data: ArrayBuffer) =>
	new OfflineAudioContext(1, 1, 48000).decodeAudioData(data.slice(0));

/**
 * Hidden page (not in the menu, open #/grantulator): a granular synth built
 * with Elementary Audio. Starts with a default sample; drop another, move
 * the grains around, map the parameters to control changes from any MIDI
 * input.
 */
const Grantulator = () => {
	const [sample, setSample] = useState<Sample | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { running, start, stop, swarm } = useGrantulatorEngine(sample);
	const handleControlChange = useGrantulatorStore((s) => s.handleControlChange);
	const handleNoteOn = useGrantulatorStore((s) => s.handleNoteOn);
	const midiInitialized = useMIDIStore((s) => s.initialized);
	const inputs = useMIDIStore((s) => s.inputs) as MIDIInput[];

	const startAudio = () =>
		start().catch((e) =>
			setError(`Could not start audio: ${(e as Error).message}`),
		);

	const loadFile = async (file: File) => {
		setError(null);
		void startAudio();
		try {
			const data = await file.arrayBuffer();
			const buffer = await decode(data);
			setSample({ name: file.name, buffer });
			// Back on the next visit; playing doesn't depend on it.
			saveSample({ name: file.name, data }).catch((e) =>
				console.warn("Could not keep the Grantulator sample", e),
			);
		} catch (e) {
			setError(`Could not load ${file.name}: ${(e as Error).message}`);
		}
	};

	// Something to play right away: the last loaded sample, else the default.
	// A file dropped meanwhile wins.
	useEffect(() => {
		const loadStored = async () => {
			try {
				const stored = await loadSample();
				if (!stored) return false;
				const buffer = await decode(stored.data);
				setSample((prev) => prev ?? { name: stored.name, buffer });
				return true;
			} catch (e) {
				console.warn("Could not restore the Grantulator sample", e);
				return false;
			}
		};
		const load = async () => {
			if (await loadStored()) return;
			try {
				const response = await fetch(
					`${import.meta.env.BASE_URL}/samples/${DEFAULT_SAMPLE}`,
				);
				if (!response.ok) throw new Error(response.statusText);
				const buffer = await decode(await response.arrayBuffer());
				setSample((prev) => prev ?? { name: DEFAULT_SAMPLE, buffer });
			} catch (e) {
				setError(`Could not load ${DEFAULT_SAMPLE}: ${(e as Error).message}`);
			}
		};
		void load();
	}, []);

	// Control changes and notes from every input: learn mappings, move
	// parameters, flip switches.
	useEffect(() => {
		if (!midiInitialized) return;
		const listener = (event: MIDIMessageEvent) => {
			if (!event.data || event.data.length < 3) return;
			const [status, data1, data2] = event.data;
			// Mappings count channels from 1.
			const channel = getChannel(status) + 1;
			if (getStatus(status) === MIDI_STATUS.CONTROL_CHANGE) {
				handleControlChange(channel, data1, data2);
			} else if (isNoteOn(getStatus(status), data2)) {
				handleNoteOn(channel, data1);
			}
		};
		for (const input of inputs) input.addEventListener("midimessage", listener);
		return () => {
			for (const input of inputs)
				input.removeEventListener("midimessage", listener);
		};
	}, [midiInitialized, inputs, handleControlChange, handleNoteOn]);

	return (
		<Box display="flex" flexDirection="column" gap={2} paddingY={2}>
			<Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
				<Typography variant="h5">Grantulator</Typography>
				<Box flex={1} />
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
			</Box>
			{error && <Alert severity="error">{error}</Alert>}
			<div>
				<Accordion defaultExpanded>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography variant="h6">Grains</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<Dropzone sample={sample} swarm={swarm} onFile={loadFile} />
						<ParamRows group="grains" midi={midiInitialized} />
						<IntervalSetSelect />
					</AccordionDetails>
				</Accordion>
				<EffectPanel
					title="Delay"
					group="delay"
					switchId="delayEnabled"
					midi={midiInitialized}
				/>
				<EffectPanel
					title="Reverb"
					group="reverb"
					switchId="reverbEnabled"
					midi={midiInitialized}
				/>
			</div>
		</Box>
	);
};

export default Grantulator;
