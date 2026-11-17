import { Box, Chip, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMIDIStore } from "../store/midi";
import { MIDI_STATUS, typeToLabel } from "../utils/midi";
import AllNone from "./AllNone";

const midiTypes = [
	MIDI_STATUS.NOTE_OFF,
	MIDI_STATUS.NOTE_ON,
	MIDI_STATUS.CONTROL_CHANGE,
	MIDI_STATUS.PROGRAM_CHANGE,
	MIDI_STATUS.POLY_PRESSURE,
	MIDI_STATUS.CHANNEL_PRESSURE,
	MIDI_STATUS.PITCH_BEND,
	MIDI_STATUS.START,
	MIDI_STATUS.STOP,
	MIDI_STATUS.CONTINUE,
	MIDI_STATUS.SYSEX_START,
	MIDI_STATUS.TIMING_CLOCK,
	MIDI_STATUS.ACTIVE_SENSING,
];

/**
 * Types shown until the user changes the filter: everything except clock
 * and active sensing, which arrive many times a second and would bury the
 * rest.
 */
const defaultMidiTypes = midiTypes.filter(
	(type) =>
		type !== MIDI_STATUS.TIMING_CLOCK && type !== MIDI_STATUS.ACTIVE_SENSING,
);

export { defaultMidiTypes, midiTypes };

const Filter = ({
	onActiveInputsChange,
	onActiveOutputsChange,
	onActiveChannelsChange,
	onActiveTypesChange,
}: {
	onActiveInputsChange: (inputs: string[]) => void;
	onActiveOutputsChange: (outputs: string[]) => void;
	onActiveChannelsChange: (channels: number[]) => void;
	onActiveTypesChange: (types: number[]) => void;
}) => {
	const { t } = useTranslation();
	const inputs = useMIDIStore((state) => state.inputs);
	const outputs = useMIDIStore((state) => state.outputs);
	const [activeInputs, setActiveInputs] = useState<string[]>([]);
	const [activeOutputs, setActiveOutputs] = useState<string[]>([]);
	const [activeTypes, setActiveTypes] = useState<number[]>([
		...defaultMidiTypes,
	]);
	const [activeChannels, setActiveChannels] = useState(
		Array.from({ length: 16 }).map((_, i) => i + 1),
	);

	// The latest callbacks, without rerunning the effects when they change:
	// a new device list re-selects all, a new callback shouldn't.
	const onInputs = useRef(onActiveInputsChange);
	onInputs.current = onActiveInputsChange;
	const onOutputs = useRef(onActiveOutputsChange);
	onOutputs.current = onActiveOutputsChange;

	useEffect(() => {
		const newActiveInputs = inputs.map((input) => input.id);
		setActiveInputs(newActiveInputs);
		onInputs.current(newActiveInputs);
	}, [inputs]);
	useEffect(() => {
		const newActiveOutputs = outputs.map((output) => output.id);
		setActiveOutputs(newActiveOutputs);
		onOutputs.current(newActiveOutputs);
	}, [outputs]);

	const allChannels = Array.from({ length: 16 }, (_, i) => i + 1);

	const setInputs = (ids: string[]) => {
		setActiveInputs(ids);
		onActiveInputsChange(ids);
	};
	const setOutputs = (ids: string[]) => {
		setActiveOutputs(ids);
		onActiveOutputsChange(ids);
	};
	const setTypes = (types: number[]) => {
		setActiveTypes(types);
		onActiveTypesChange(types);
	};
	const setChannels = (channels: number[]) => {
		setActiveChannels(channels);
		onActiveChannelsChange(channels);
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
				columnGap: 2,
				rowGap: { xs: 0.5, sm: 1.25 },
				alignItems: "start",
			}}
		>
			<FilterRow
				label={t("inputs")}
				items={inputs.map((input) => ({ value: input.id, label: input.name }))}
				active={activeInputs}
				onChange={setInputs}
			/>
			<FilterRow
				label={t("outputs")}
				items={outputs.map((output) => ({
					value: output.id,
					label: output.name,
				}))}
				active={activeOutputs}
				onChange={setOutputs}
			/>
			<FilterRow
				label={t("channels")}
				items={allChannels.map((channel) => ({
					value: channel,
					label: String(channel),
				}))}
				active={activeChannels}
				onChange={setChannels}
				narrow
			/>
			<FilterRow
				label={t("types")}
				items={midiTypes.map((type) => ({
					value: type,
					label: typeToLabel(type),
				}))}
				active={activeTypes}
				onChange={setTypes}
			/>
		</Box>
	);
};

/** One label + a wrapping row of toggle chips, with All/None at the end. */
function FilterRow<T extends string | number>({
	label,
	items,
	active,
	onChange,
	narrow = false,
}: {
	label: string;
	items: { value: T; label: string }[];
	active: T[];
	onChange: (next: T[]) => void;
	/** Fixed-width chips, for short labels like channel numbers. */
	narrow?: boolean;
}) {
	const { t } = useTranslation();
	const toggle = (value: T) =>
		onChange(
			active.includes(value)
				? active.filter((v) => v !== value)
				: [...active, value],
		);
	return (
		<>
			<Typography
				variant="caption"
				component="div"
				sx={{
					color: "text.secondary",
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: 0.5,
					lineHeight: "24px",
					mt: { xs: 1, sm: 0 },
				}}
			>
				{label}
			</Typography>
			<Box
				role="group"
				aria-label={label}
				sx={{
					display: "flex",
					flexWrap: "wrap",
					gap: 0.5,
					alignItems: "center",
				}}
			>
				{items.length === 0 && (
					<Typography
						variant="body2"
						sx={{ color: "text.disabled", lineHeight: "24px", mr: 1 }}
					>
						{t("none")}
					</Typography>
				)}
				{items.map((item) => {
					const on = active.includes(item.value);
					return (
						<Chip
							key={item.value}
							size="small"
							label={item.label}
							color={on ? "primary" : "default"}
							variant={on ? "filled" : "outlined"}
							onClick={() => toggle(item.value)}
							aria-pressed={on}
							sx={
								narrow
									? { width: 32, "& .MuiChip-label": { px: 0 } }
									: undefined
							}
						/>
					);
				})}
				{items.length > 1 && (
					<AllNone
						onAll={() => onChange(items.map((item) => item.value))}
						onNone={() => onChange([])}
					/>
				)}
			</Box>
		</>
	);
}

export default Filter;
