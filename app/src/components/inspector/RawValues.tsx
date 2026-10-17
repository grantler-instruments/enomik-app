import {
	Alert,
	Box,
	Chip,
	FormControlLabel,
	LinearProgress,
	Switch,
	Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRawStream } from "../../hooks/useRawStream";
import { useAppStore } from "../../store/app";
import { useMIDIStore } from "../../store/midi";
import { sysexPinModeTouch } from "../../store/midi.config";
import { type RawValue, useRawStreamStore } from "../../store/rawStream";
import { INPUT_MODES } from "../pinmapping/PinConfigSection";

const Value = ({ label, value }: { label: string; value: number | string }) => (
	<Box minWidth={90}>
		<Typography variant="caption" color="text.secondary">
			{label}
		</Typography>
		<Typography fontFamily="monospace">{value}</Typography>
	</Box>
);

export const Bar = ({
	label,
	value,
	max,
	marker,
	secondaryMarker,
	suffix = "",
}: {
	label: string;
	value: number;
	max: number;
	marker?: number;
	/** Second, faded marker, e.g. the threshold on the device vs. the edited one. */
	secondaryMarker?: number;
	suffix?: string;
}) => (
	<Box flex={1} minWidth={160}>
		<Typography variant="caption" color="text.secondary">
			{label}:{" "}
			<span style={{ fontFamily: "monospace" }}>
				{value}
				{suffix}
			</span>
		</Typography>
		<Box position="relative">
			<LinearProgress
				variant="determinate"
				value={Math.min(100, (value / max) * 100)}
				sx={{ height: 8, borderRadius: 1, transition: "none" }}
			/>
			{secondaryMarker !== undefined && secondaryMarker !== marker && (
				<Box
					position="absolute"
					top={-2}
					bottom={-2}
					left={`${Math.min(100, (secondaryMarker / max) * 100)}%`}
					width={2}
					bgcolor="text.disabled"
				/>
			)}
			{marker !== undefined && (
				<Box
					position="absolute"
					top={-2}
					bottom={-2}
					left={`${Math.min(100, (marker / max) * 100)}%`}
					width={2}
					bgcolor="text.primary"
				/>
			)}
		</Box>
	</Box>
);

const RawValueRow = ({ value }: { value: RawValue }) => {
	const { t } = useTranslation();
	const modeLabel =
		INPUT_MODES.find((m) => m.value === value.mode)?.label ??
		`mode ${value.mode}`;
	const isTouch = value.mode === sysexPinModeTouch;

	return (
		<Box
			display="flex"
			flexWrap="wrap"
			alignItems="center"
			gap={2}
			paddingY={1}
			borderBottom={1}
			borderColor="divider"
		>
			<Value label={`PIN ${value.pin}`} value={modeLabel} />
			<Value label={t("raw")} value={value.raw} />
			{isTouch && (
				<>
					<Value label={t("baseline")} value={value.baseline} />
					<Value label={t("peak")} value={value.peak} />
					<Bar
						label={t("percent")}
						value={value.percent}
						max={100}
						marker={value.threshold}
						suffix="%"
					/>
					<Chip
						label={t("touched")}
						size="small"
						color={value.active ? "primary" : "default"}
						variant={value.active ? "filled" : "outlined"}
					/>
				</>
			)}
			{!isTouch && <Bar label={t("normalized")} value={value.norm} max={127} />}
		</Box>
	);
};

/** One-line live value for a Configurator input row. */
export const CompactRawValue = ({
	value,
	threshold,
}: {
	value: RawValue;
	/** Locally edited threshold; the device's threshold shows as a faded marker. */
	threshold?: number;
}) => {
	const { t } = useTranslation();
	const isTouch = value.mode === sysexPinModeTouch;
	const marker = threshold ?? value.threshold;
	return (
		<Box
			display="flex"
			alignItems="center"
			gap={2}
			paddingX={1}
			paddingBottom={1}
		>
			{isTouch ? (
				<>
					<Bar
						label={t("percent")}
						value={value.percent}
						max={100}
						marker={marker > 0 ? marker : undefined}
						secondaryMarker={value.threshold > 0 ? value.threshold : undefined}
						suffix="%"
					/>
					<Chip
						label={t("touched")}
						size="small"
						color={value.active ? "primary" : "default"}
						variant={value.active ? "filled" : "outlined"}
					/>
				</>
			) : (
				<Bar label={t("normalized")} value={value.norm} max={127} />
			)}
			<Typography variant="caption" fontFamily="monospace" minWidth={90}>
				{t("raw")}: {value.raw}
			</Typography>
		</Box>
	);
};

/** Stream on/off switch plus the stream error, shared by Inspector and Configurator. */
export const RawStreamToggle = ({ disabled }: { disabled?: boolean }) => {
	const { t } = useTranslation();
	const active = useRawStreamStore((state) => state.active);
	const error = useRawStreamStore((state) => state.error);
	const setActive = useRawStreamStore((state) => state.setActive);
	const clear = useRawStreamStore((state) => state.clear);
	return (
		<>
			<FormControlLabel
				control={
					<Switch
						checked={active}
						disabled={disabled}
						onChange={(e) => {
							if (e.target.checked) clear();
							setActive(e.target.checked);
						}}
					/>
				}
				label={t("inspector_raw_stream_toggle")}
			/>
			{error && (
				<Alert severity="warning" sx={{ my: 1 }}>
					{t("inspector_raw_stream_error", { error })}
				</Alert>
			)}
		</>
	);
};

const RawValues = ({ device }: { device: string }) => {
	const { t } = useTranslation();
	const initialized = useMIDIStore((state) => state.initialized);
	const showHints = useAppStore((state) => state.showHints);
	const active = useRawStreamStore((state) => state.active);
	const values = useRawStreamStore((state) => state.values);

	useRawStream(device);

	const rows = Object.values(values).sort((a, b) => a.pin - b.pin);

	return (
		<Box>
			<Typography variant="h2">{t("inspector_raw_stream")}</Typography>
			{showHints && (
				<Alert severity="info" sx={{ my: 1 }}>
					{t("inspector_raw_stream_hint")}
				</Alert>
			)}
			<RawStreamToggle disabled={!initialized} />
			{active && rows.length === 0 && (
				<Typography color="text.secondary">
					{t("inspector_raw_stream_waiting")}
				</Typography>
			)}
			{rows.map((value) => (
				<RawValueRow key={value.pin} value={value} />
			))}
		</Box>
	);
};

export default RawValues;
