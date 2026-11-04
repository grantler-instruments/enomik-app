import { Alert, Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type Sample,
	useGrantulatorEngine,
} from "../hooks/useGrantulatorEngine";
import { useGrantulatorStore } from "../store/grantulator";
import { useMIDIStore } from "../store/midi";
import { getChannel, getStatus, isNoteOn, MIDI_STATUS } from "../utils/midi";
import { loadSample, saveSample } from "../utils/sampleStore";
import CollapsibleSection from "./common/CollapsibleSection";
import Dropzone from "./grantulator/Dropzone";
import EffectPanel from "./grantulator/EffectPanel";
import IntervalSetSelect from "./grantulator/IntervalSetSelect";
import MasterPanel from "./grantulator/MasterPanel";
import ParamRows from "./grantulator/ParamRows";
import InitMidi from "./InitMidi";
import PageLayout from "./layout/PageLayout";

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
 * input. `embedded`: without page chrome, toolbar inline (used in the
 * tutorial).
 */
const Grantulator = ({ embedded = false }: { embedded?: boolean }) => {
	const { t } = useTranslation();
	const [sample, setSample] = useState<Sample | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { running, start, stop, swarm } = useGrantulatorEngine(sample);
	const handleControlChange = useGrantulatorStore((s) => s.handleControlChange);
	const handleNoteOn = useGrantulatorStore((s) => s.handleNoteOn);
	const midiInitialized = useMIDIStore((s) => s.initialized);
	const inputs = useMIDIStore((s) => s.inputs) as MIDIInput[];

	const startAudio = () =>
		start().catch((e) =>
			setError(t("audio_error_start", { message: (e as Error).message })),
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
			setError(
				t("audio_error_load", {
					name: file.name,
					message: (e as Error).message,
				}),
			);
		}
	};

	// Something to play right away: the last loaded sample, else the default.
	// A file dropped meanwhile wins.
	// biome-ignore lint/correctness/useExhaustiveDependencies: loads once; t only words the error
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
				setError(
					t("audio_error_load", {
						name: DEFAULT_SAMPLE,
						message: (e as Error).message,
					}),
				);
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

	const toolbar = (
		<>
			<Box flex={1} />
			<InitMidi />
			{running ? (
				<Button variant="outlined" onClick={stop}>
					{t("audio_stop")}
				</Button>
			) : (
				<Button variant="contained" onClick={startAudio}>
					{t("audio_start")}
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
			<div>
				<CollapsibleSection
					defaultExpanded
					title={
						<Typography variant="h6" component="span">
							{t("grantulator_section_grains")}
						</Typography>
					}
				>
					<Dropzone sample={sample} swarm={swarm} onFile={loadFile} />
					<ParamRows group="grains" midi={midiInitialized} />
					<IntervalSetSelect />
				</CollapsibleSection>
				<EffectPanel
					title={t("grantulator_section_delay")}
					group="delay"
					switchId="delayEnabled"
					midi={midiInitialized}
				/>
				<EffectPanel
					title={t("grantulator_section_reverb")}
					group="reverb"
					switchId="reverbEnabled"
					midi={midiInitialized}
				/>
				<MasterPanel midi={midiInitialized} />
			</div>
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
		<PageLayout title="Grantulator" maxWidth={false} actions={toolbar}>
			{body}
		</PageLayout>
	);
};

export default Grantulator;
