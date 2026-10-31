import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
	Box,
	IconButton,
	InputAdornment,
	MenuItem,
	Select,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ThresholdUnit } from "../../store/device";
import {
	type InputPinConfig,
	type OutputPinConfig,
	useConflictingPins,
	useIOStore,
} from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
	MIDI_TYPE_LABELS,
	sysexPinModePWMOut,
	sysexPinModeTouch,
} from "../../store/midi.config";
import MinMax from "../MinMax";
import PinMappingMenu from "./Menu";
import { INPUT_MODES, MODE_DESCRIPTION_KEYS, OUTPUT_MODES } from "./modes";

type PinConfig = InputPinConfig | OutputPinConfig;
type RowType = "input" | "output";

const MIDI_TYPES = [
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
] as const;
const DEFAULT_NOTE = 60;
const MIDI_CHANNELS = Array.from({ length: 16 }, (_, i) => i + 1);

// One column template per direction, shared by header and rows so columns line up.
// Columns grow with the available width (fr) but never below their minimum.
// input:  pin | mode | [thr] | → | ch | type | cc/note | min | max | menu
// output: ch | type | cc/note | min | max | → | pin | mode | pwm min | pwm max | menu
const PIN = "minmax(56px, 0.7fr)";
const MODE = "minmax(130px, 2fr)";
const THRESHOLD = "minmax(76px, 0.9fr)";
const ARROW = "48px";
const CHANNEL = "minmax(64px, 0.8fr)";
const MIDI_TYPE = "minmax(96px, 1.4fr)";
const CC_NOTE = "minmax(72px, 0.9fr)";
const RANGE = "minmax(64px, 0.8fr)";
const MENU = "32px";
const MIDI = [CHANNEL, MIDI_TYPE, CC_NOTE, RANGE, RANGE];
const columns = (
	type: RowType,
	showThreshold: boolean,
	showPwmRange: boolean,
) =>
	(type === "input"
		? [PIN, MODE, ...(showThreshold ? [THRESHOLD] : []), ARROW, ...MIDI, MENU]
		: [...MIDI, ARROW, PIN, MODE, ...(showPwmRange ? [RANGE, RANGE] : []), MENU]
	).join(" ");

/** The threshold column only exists while at least one input is a touch pin. */
/** The PWM min/max columns only exist while at least one output is PWM. */
export const hasPwmOutput = (configs: { mode: number }[]) =>
	configs.some((c) => c.mode === sysexPinModePWMOut);

export const hasTouchInput = (configs: { mode: number }[]) =>
	configs.some((c) => c.mode === sysexPinModeTouch);

// Below `sm`: wrapping cells with labels instead of the table.
const MOBILE_COLUMNS = "repeat(auto-fill, minmax(84px, 1fr))";

const fieldSx = {
	"& .MuiInputBase-input, & .MuiSelect-select": { py: 0.75, px: 1 },
	"& .MuiInputBase-root": { fontSize: 14 },
};

/** Alternating background so neighbouring pin rows are easy to tell apart. */
const rowBg = (index: number) =>
	index % 2 === 1 ? "action.hover" : "transparent";

const useWide = () => {
	const theme = useTheme();
	return useMediaQuery(theme.breakpoints.up("sm"));
};

export const PinTableHeader = ({
	type,
	showThreshold = false,
	showPwmRange = false,
}: {
	type: RowType;
	showThreshold?: boolean;
	showPwmRange?: boolean;
}) => {
	const { t } = useTranslation();
	const wide = useWide();
	if (!wide) return null;

	const midi = [
		t("channel"),
		t("midi_type"),
		t("cc_or_note"),
		t("min"),
		t("max"),
	];
	const pin = [t("pin"), t("mode")];
	const labels =
		type === "input"
			? [...pin, ...(showThreshold ? [t("threshold")] : []), "", ...midi, ""]
			: [
					...midi,
					"",
					...pin,
					...(showPwmRange ? [t("pwm_min"), t("pwm_max")] : []),
					"",
				];

	return (
		<Box
			display="grid"
			gridTemplateColumns={columns(type, showThreshold, showPwmRange)}
			columnGap={1}
			paddingX={1}
			paddingBottom={0.5}
		>
			{labels.map((label, i) => (
				<Typography
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed column order
					key={i}
					variant="caption"
					color="text.secondary"
					noWrap
					title={label}
				>
					{label}
				</Typography>
			))}
		</Box>
	);
};

const ReadOnly = ({ children }: { children: ReactNode }) => (
	<Typography variant="body2" noWrap paddingX={1}>
		{children}
	</Typography>
);

interface PinRowProps {
	config: PinConfig;
	type: RowType;
	index: number;
	/** Inspector: plain text instead of fields, no row menu. */
	readOnly?: boolean;
	/** Narrow container (e.g. a popover): always the wrapping mobile layout. */
	compact?: boolean;
	/** Hide the row menu (duplicate/delete), e.g. when the parent offers its own delete. */
	hideMenu?: boolean;
	thresholdUnit?: ThresholdUnit;
	/** Live value shown on a full-width line below the row (inputs only). */
	live?: ReactNode;
	/** Table has a threshold column (see hasTouchInput). */
	showThreshold?: boolean;
	/** Table has PWM min/max columns (see hasPwmOutput). */
	showPwmRange?: boolean;
}

const PinRow = ({
	config,
	type,
	index,
	readOnly = false,
	compact = false,
	hideMenu = false,
	thresholdUnit,
	live,
	showThreshold = false,
	showPwmRange = false,
}: PinRowProps) => {
	const { t } = useTranslation();
	const wide = useWide() && !compact;
	const {
		updateInput,
		removeInput,
		duplicateInput,
		updateOutput,
		removeOutput,
		duplicateOutput,
	} = useIOStore();
	const conflictingPins = useConflictingPins();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const isInput = type === "input";

	const onChange = <K extends keyof PinConfig>(key: K, value: PinConfig[K]) => {
		const updated = { ...config, [key]: value };
		if (isInput) updateInput(config.uuid, updated as InputPinConfig);
		else updateOutput(config.uuid, updated as OutputPinConfig);
	};

	// Display falls back to 60 when note is missing; write it into the store so
	// deploy does not send note 0 while the field still looks like 60.
	useEffect(() => {
		if (
			!readOnly &&
			config.midiType === MIDI_NOTE_ON &&
			(config.note === undefined || config.note === null)
		) {
			onChange("note", DEFAULT_NOTE);
		}
	});

	// Labels only on mobile; the table header names the columns otherwise.
	const label = (text: string) => (wide ? undefined : text);
	const numberProps = (ariaLabel: string) => ({
		htmlInput: { inputMode: "numeric" as const, "aria-label": ariaLabel },
	});

	const modes = isInput ? INPUT_MODES : OUTPUT_MODES;
	const modeLabel = modes.find((m) => m.value === config.mode)?.label ?? "";
	const hasConflict = conflictingPins.has(config.pin);
	const isTouch = isInput && config.mode === sysexPinModeTouch;
	const displayedUnit =
		(config as InputPinConfig).thresholdUnit ?? thresholdUnit;
	const touchDescription =
		displayedUnit === "percent"
			? t("pin_mode_touch_desc")
			: t(
					displayedUnit === "raw" ? "compat_touch_raw" : "compat_touch_unknown",
				);
	const isPwm = !isInput && config.mode === sysexPinModePWMOut;
	const isPitchBend = config.midiType === MIDI_PITCH_BEND;
	const ccOrNoteKey =
		config.midiType === MIDI_CONTROL_CHANGE
			? "controller"
			: config.midiType === MIDI_NOTE_ON
				? "note"
				: null;
	const ccOrNoteValue =
		ccOrNoteKey === "controller"
			? config.controller
			: ccOrNoteKey === "note"
				? (config.note ?? DEFAULT_NOTE)
				: undefined;

	const pinCell = readOnly ? (
		<ReadOnly>{config.pin}</ReadOnly>
	) : (
		<Tooltip
			title={hasConflict ? t("pin_conflict", { pin: config.pin }) : ""}
			arrow
		>
			<TextField
				label={label(t("pin"))}
				type="number"
				value={config.pin != null ? String(Number(config.pin)) : ""}
				onChange={(e) => onChange("pin", Number(e.target.value))}
				size="small"
				fullWidth
				error={hasConflict}
				sx={fieldSx}
				slotProps={{
					...numberProps(t("pin")),
					input: hasConflict
						? {
								endAdornment: (
									<InputAdornment position="end">
										<WarningAmberIcon fontSize="small" color="error" />
									</InputAdornment>
								),
							}
						: undefined,
				}}
			/>
		</Tooltip>
	);

	const modeCell = (
		<Tooltip
			title={
				isTouch ? touchDescription : t(MODE_DESCRIPTION_KEYS[config.mode] ?? "")
			}
			placement="top"
			enterDelay={600}
			arrow
		>
			{readOnly ? (
				<ReadOnly>{modeLabel}</ReadOnly>
			) : (
				<Select
					value={config.mode}
					onChange={(e) => onChange("mode", e.target.value)}
					size="small"
					fullWidth
					sx={fieldSx}
					inputProps={{ "aria-label": t("mode") }}
				>
					{modes.map((mode) => (
						<MenuItem key={mode.value} value={mode.value}>
							{mode.label}
						</MenuItem>
					))}
				</Select>
			)}
		</Tooltip>
	);

	const thresholdCell = !isTouch ? (
		<Box />
	) : readOnly ? (
		<ReadOnly>
			{config.threshold ?? 0}
			{displayedUnit === "percent" ? "%" : ""}
		</ReadOnly>
	) : (
		<TextField
			label={label(t("threshold"))}
			value={config.threshold != null ? String(Number(config.threshold)) : ""}
			onChange={(e) => {
				// Both protocols use a 7-bit byte; its meaning depends on firmware.
				const n = Math.round(Number(e.target.value));
				updateInput(config.uuid, {
					threshold: Number.isNaN(n) ? 0 : Math.max(0, Math.min(127, n)),
					thresholdUnit: displayedUnit,
				});
			}}
			size="small"
			fullWidth
			sx={fieldSx}
			slotProps={{
				...numberProps(t("threshold")),
				input: {
					endAdornment: (
						<InputAdornment position="end">
							{displayedUnit === "percent"
								? "%"
								: displayedUnit === "raw"
									? t("raw")
									: "?"}
						</InputAdornment>
					),
				},
			}}
		/>
	);

	const channelCell = readOnly ? (
		<ReadOnly>{config.channel}</ReadOnly>
	) : (
		<TextField
			select
			label={label(t("channel"))}
			value={config.channel}
			onChange={(e) => onChange("channel", Number(e.target.value))}
			size="small"
			fullWidth
			sx={fieldSx}
			slotProps={{ htmlInput: { "aria-label": t("channel") } }}
		>
			{MIDI_CHANNELS.map((channel) => (
				<MenuItem key={channel} value={channel}>
					{channel}
				</MenuItem>
			))}
		</TextField>
	);

	const typeCell = (
		<Tooltip
			title={isPitchBend && isInput ? t("pitch_bend_precision_info") : ""}
			placement="top"
			arrow
		>
			{readOnly ? (
				<ReadOnly>{MIDI_TYPE_LABELS[config.midiType] ?? ""}</ReadOnly>
			) : (
				<TextField
					select
					label={label(t("midi_type"))}
					value={config.midiType}
					onChange={(e) =>
						onChange(
							"midiType",
							Number(e.target.value) as PinConfig["midiType"],
						)
					}
					size="small"
					fullWidth
					sx={fieldSx}
					slotProps={{ htmlInput: { "aria-label": t("midi_type") } }}
				>
					{MIDI_TYPES.map((midiType) => (
						<MenuItem key={midiType} value={midiType}>
							{MIDI_TYPE_LABELS[midiType]}
						</MenuItem>
					))}
				</TextField>
			)}
		</Tooltip>
	);

	const ccOrNoteCell = !ccOrNoteKey ? (
		<Box />
	) : readOnly ? (
		<ReadOnly>{ccOrNoteValue}</ReadOnly>
	) : (
		<TextField
			label={label(t(ccOrNoteKey))}
			type="number"
			value={ccOrNoteValue != null ? String(Number(ccOrNoteValue)) : ""}
			onChange={(e) => onChange(ccOrNoteKey, Number(e.target.value))}
			size="small"
			fullWidth
			sx={fieldSx}
			slotProps={numberProps(t(ccOrNoteKey))}
		/>
	);

	// On mobile MinMax renders one box with both fields: give it two cells.
	const mobileSpan = (node: ReactNode) =>
		wide ? node : <Box sx={{ gridColumn: "span 2" }}>{node}</Box>;

	const midiRangeCells = readOnly ? (
		<>
			<ReadOnly>{config.midiMin}</ReadOnly>
			<ReadOnly>{config.midiMax}</ReadOnly>
		</>
	) : (
		mobileSpan(
			<MinMax
				bare={wide}
				min={Number(config.midiMin) ?? 0}
				max={Number(config.midiMax) ?? 127}
				onChangeMin={(value) => onChange("midiMin", value)}
				onChangeMax={(value) => onChange("midiMax", value)}
				bitResolution={isPitchBend ? 14 : 7}
			/>,
		)
	);

	const pwmRangeCells = !isPwm ? (
		<>
			<Box />
			<Box />
		</>
	) : readOnly ? (
		<>
			<ReadOnly>{config.pinMin}</ReadOnly>
			<ReadOnly>{config.pinMax}</ReadOnly>
		</>
	) : (
		mobileSpan(
			<MinMax
				bare={wide}
				min={Number(config.pinMin) ?? 0}
				max={Number(config.pinMax) ?? 1024}
				onChangeMin={(value) => onChange("pinMin", value)}
				onChangeMax={(value) => onChange("pinMax", value)}
			/>,
		)
	);

	const arrowCell = wide ? (
		<ArrowForwardIcon
			fontSize="small"
			sx={{ opacity: 0.5, justifySelf: "center" }}
		/>
	) : null;

	const showMenu = !readOnly && !hideMenu;
	const menuCell = !showMenu ? (
		<Box />
	) : (
		<IconButton
			onClick={(e) => setAnchorEl(e.currentTarget)}
			aria-label="more options"
			size="small"
			sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}
		>
			<MoreVertIcon fontSize="small" />
		</IconButton>
	);

	const pinCells = (
		<>
			{pinCell}
			<Box sx={{ gridColumn: wide ? undefined : "span 2", minWidth: 0 }}>
				{modeCell}
			</Box>
		</>
	);
	const midiCells = (
		<>
			{channelCell}
			<Box sx={{ gridColumn: wide ? undefined : "span 2", minWidth: 0 }}>
				{typeCell}
			</Box>
			{ccOrNoteCell}
			{midiRangeCells}
		</>
	);
	// Live value: its own full-width line below the row's fields.
	const liveLine = live ? (
		<Box sx={{ gridColumn: "1 / -1", paddingTop: 0.5, paddingX: 0.5 }}>
			{live}
		</Box>
	) : null;

	return (
		<Box
			display="grid"
			gridTemplateColumns={
				wide ? columns(type, showThreshold, showPwmRange) : MOBILE_COLUMNS
			}
			columnGap={1}
			rowGap={wide ? 0 : 1}
			alignItems="center"
			paddingX={1}
			paddingY={wide ? 0.5 : 1}
			borderRadius={1}
			bgcolor={rowBg(index)}
		>
			{isInput ? (
				<>
					{pinCells}
					{(wide ? showThreshold : isTouch) && thresholdCell}
					{arrowCell}
					{midiCells}
					{menuCell}
					{liveLine}
				</>
			) : (
				<>
					{midiCells}
					{arrowCell}
					{pinCells}
					{(wide ? showPwmRange : isPwm) && pwmRangeCells}
					{menuCell}
				</>
			)}
			{showMenu && (
				<PinMappingMenu
					anchorEl={anchorEl}
					onClose={() => setAnchorEl(null)}
					onDuplicate={() => {
						isInput
							? duplicateInput(config.uuid)
							: duplicateOutput(config.uuid);
						setAnchorEl(null);
					}}
					onDelete={() => {
						isInput ? removeInput(config.uuid) : removeOutput(config.uuid);
						setAnchorEl(null);
					}}
				/>
			)}
		</Box>
	);
};

export default PinRow;
