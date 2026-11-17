import { Close } from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import FilterListIcon from "@mui/icons-material/FilterList";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Badge,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	IconButton,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import {
	type MidiMessageWithDirectionAndDevice,
	useMIDIStore,
} from "../store/midi";
import { MIDI_STATUS, typeToLabel } from "../utils/midi";
import Filter, { midiTypes } from "./Filter";
import InitMidi from "./InitMidi";

// Desktop columns: fixed width for short values, flexible for text.
const desktopColumns =
	"32px 96px minmax(120px, 1.5fr) 64px minmax(110px, 1fr) 96px 80px minmax(140px, 2fr)";

const desktopRowSx = {
	display: "grid",
	gridTemplateColumns: desktopColumns,
	columnGap: 2,
	alignItems: "center",
	px: 1,
} as const;

// Fill the screen once scrolled to (minus the app bar and some air), but
// never shrink to uselessness on short screens.
const listHeight = "max(300px, calc(100dvh - 180px))";

const ellipsis = {
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
} as const;

function getDeviceName(
	msg: MidiMessageWithDirectionAndDevice,
	inputs: { id: string; name: string }[],
	outputs: { id: string; name: string }[],
) {
	if (msg.incoming) {
		return inputs.find((input) => input.id === msg.deviceId)?.name || "";
	}
	return outputs.find((output) => output.id === msg.deviceId)?.name || "";
}

function getNoteOrController(msg: MidiMessageWithDirectionAndDevice) {
	if (
		msg.type === MIDI_STATUS.NOTE_OFF ||
		msg.type === MIDI_STATUS.NOTE_ON ||
		msg.type === MIDI_STATUS.POLY_PRESSURE
	) {
		return msg.note;
	}
	if (
		msg.type === MIDI_STATUS.CONTROL_CHANGE ||
		msg.type === MIDI_STATUS.PROGRAM_CHANGE
	) {
		return msg.controller;
	}
	return "";
}

function getVelocityOrValue(msg: MidiMessageWithDirectionAndDevice) {
	if (msg.type === MIDI_STATUS.NOTE_OFF || msg.type === MIDI_STATUS.NOTE_ON) {
		return msg.velocity;
	}
	if (
		msg.type === MIDI_STATUS.CONTROL_CHANGE ||
		msg.type === MIDI_STATUS.POLY_PRESSURE ||
		msg.type === MIDI_STATUS.CHANNEL_PRESSURE
	) {
		return msg.value;
	}
	if (msg.type === MIDI_STATUS.PITCH_BEND) {
		return msg.pitchBendValue !== undefined ? msg.pitchBendValue - 8192 : "";
	}
	return "";
}

function formatData(msg: MidiMessageWithDirectionAndDevice) {
	if (msg.type === MIDI_STATUS.SYSEX_START) {
		return msg.data?.join(", ") || "";
	}

	const parts: (number | string | undefined)[] = [msg.type];

	if (
		msg.type === MIDI_STATUS.NOTE_OFF ||
		msg.type === MIDI_STATUS.NOTE_ON ||
		msg.type === MIDI_STATUS.POLY_PRESSURE
	) {
		if (msg.note !== undefined) parts.push(msg.note);
		if (msg.velocity !== undefined) parts.push(msg.velocity);
	}

	if (msg.type === MIDI_STATUS.CONTROL_CHANGE) {
		if (msg.controller) parts.push(msg.controller);
		parts.push(msg.value);
	}

	if (
		msg.type === MIDI_STATUS.POLY_PRESSURE ||
		msg.type === MIDI_STATUS.CHANNEL_PRESSURE
	) {
		parts.push(msg.value);
	}

	return parts.join(", ");
}

type MobileMessageCardProps = {
	msg: MidiMessageWithDirectionAndDevice;
	stripe: boolean;
	deviceName: string;
	sendMessage: ReturnType<typeof useMIDIStore.getState>["sendMessage"];
};

const MobileMessageCard = memo(function MobileMessageCard({
	msg,
	stripe,
	deviceName,
	sendMessage,
}: MobileMessageCardProps) {
	const { t } = useTranslation();
	const noteOrCc = getNoteOrController(msg);
	const velOrVal = getVelocityOrValue(msg);
	const dataStr = formatData(msg);

	return (
		<Card
			sx={{
				mb: 1.5,
				backgroundColor: stripe ? "background.paper" : "action.hover",
			}}
		>
			<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
				<Box
					display="flex"
					justifyContent="space-between"
					alignItems="flex-start"
					mb={1.5}
				>
					<Box display="flex" alignItems="center" gap={1}>
						{msg.incoming ? (
							<CallReceivedIcon fontSize="small" color="primary" />
						) : (
							<SendIcon
								fontSize="small"
								color="secondary"
								sx={{ cursor: "pointer" }}
								onClick={() =>
									sendMessage({ ...msg, id: uuidv4() }, msg.deviceId)
								}
							/>
						)}
						<Chip
							label={typeToLabel(msg.type)}
							size="small"
							color={msg.incoming ? "primary" : "secondary"}
							sx={{ fontSize: "0.7rem", height: "24px" }}
						/>
					</Box>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontSize: "0.7rem" }}
					>
						{new Date(msg.timestamp).toLocaleTimeString()}
					</Typography>
				</Box>

				<Box
					display="grid"
					gridTemplateColumns="1fr 1fr"
					gap={1.5}
					sx={{ fontSize: "0.875rem" }}
				>
					<Box>
						<Typography
							variant="caption"
							color="text.secondary"
							display="block"
							sx={{ fontSize: "0.65rem", mb: 0.25 }}
						>
							{t("device")}
						</Typography>
						<Typography
							variant="body2"
							sx={{ fontSize: "0.8rem", wordBreak: "break-word" }}
						>
							{deviceName}
						</Typography>
					</Box>

					{msg.channel ? (
						<Box>
							<Typography
								variant="caption"
								color="text.secondary"
								display="block"
								sx={{ fontSize: "0.65rem", mb: 0.25 }}
							>
								{t("channel")}
							</Typography>
							<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
								{msg.channel}
							</Typography>
						</Box>
					) : null}

					{noteOrCc !== "" && (
						<Box>
							<Typography
								variant="caption"
								color="text.secondary"
								display="block"
								sx={{ fontSize: "0.65rem", mb: 0.25 }}
							>
								{t("note_cc_prg")}
							</Typography>
							<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
								{noteOrCc}
							</Typography>
						</Box>
					)}

					{velOrVal !== "" && (
						<Box>
							<Typography
								variant="caption"
								color="text.secondary"
								display="block"
								sx={{ fontSize: "0.65rem", mb: 0.25 }}
							>
								{t("vel_value")}
							</Typography>
							<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
								{velOrVal}
							</Typography>
						</Box>
					)}
				</Box>

				{dataStr ? (
					<Box mt={1.5} pt={1.5} borderTop="1px solid" borderColor="divider">
						<Typography
							variant="caption"
							color="text.secondary"
							display="block"
							sx={{ fontSize: "0.65rem", mb: 0.25 }}
						>
							{t("data")}
						</Typography>
						<Typography
							variant="body2"
							sx={{
								fontSize: "0.75rem",
								fontFamily: "monospace",
								wordBreak: "break-all",
							}}
						>
							{dataStr}
						</Typography>
					</Box>
				) : null}
			</CardContent>
		</Card>
	);
});

type DesktopMessageRowProps = {
	msg: MidiMessageWithDirectionAndDevice;
	stripe: boolean;
	deviceName: string;
	sendMessage: ReturnType<typeof useMIDIStore.getState>["sendMessage"];
};

const DesktopMessageRow = memo(function DesktopMessageRow({
	msg,
	stripe,
	deviceName,
	sendMessage,
}: DesktopMessageRowProps) {
	return (
		<Box
			sx={{
				...desktopRowSx,
				backgroundColor: stripe ? "inherit" : "action.hover",
				py: 0.5,
			}}
		>
			<Box sx={{ display: "flex" }}>
				{msg.incoming ? (
					<CallReceivedIcon fontSize="small" color="primary" />
				) : (
					<SendIcon
						fontSize="small"
						color="secondary"
						sx={{ cursor: "pointer" }}
						onClick={() => sendMessage({ ...msg, id: uuidv4() }, msg.deviceId)}
					/>
				)}
			</Box>
			<Box>{new Date(msg.timestamp).toLocaleTimeString()}</Box>
			<Box sx={ellipsis} title={deviceName}>
				{deviceName}
			</Box>
			<Box>{msg.channel}</Box>
			<Box sx={ellipsis}>{typeToLabel(msg.type)}</Box>
			<Box>{getNoteOrController(msg)}</Box>
			<Box>{getVelocityOrValue(msg)}</Box>
			<Box sx={ellipsis} title={formatData(msg)}>
				{formatData(msg)}
			</Box>
		</Box>
	);
});

function MessageList() {
	const messages = useMIDIStore((state) => state.messages);
	const sendMessage = useMIDIStore((state) => state.sendMessage);
	const inputs = useMIDIStore((state) => state.inputs);
	const outputs = useMIDIStore((state) => state.outputs);
	const clear = useMIDIStore((state) => state.clear);
	const initialized = useMIDIStore((state) => state.initialized);

	const { t } = useTranslation();

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const [activeInputs, setActiveInputs] = useState<string[]>([]);
	const [activeOutputs, setActiveOutputs] = useState<string[]>([]);
	const [activeTypes, setActiveTypes] = useState<number[]>([...midiTypes]);
	const [activeChannels, setActiveChannels] = useState(() =>
		Array.from({ length: 16 }, (_, i) => i + 1),
	);

	// Calculate active filters count
	const activeFilters = [
		activeInputs.length < inputs.length,
		activeOutputs.length < outputs.length,
		activeTypes.length < midiTypes.length,
		activeChannels.length < 16,
	].filter(Boolean).length;

	// Frozen snapshot of the list: set while paused, or while the user is
	// scrolled away from the newest messages so rows don't move under them.
	const [frozen, setFrozen] = useState<
		MidiMessageWithDirectionAndDevice[] | null
	>(null);
	const [paused, setPaused] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const shownMessages = frozen ?? messages;

	// Messages that arrived since freezing (newest are first in the list).
	const newCount = useMemo(() => {
		if (!frozen) return 0;
		if (frozen.length === 0) return messages.length;
		const index = messages.findIndex((msg) => msg.id === frozen[0].id);
		return index === -1 ? messages.length : index;
	}, [frozen, messages]);

	const resume = () => {
		setPaused(false);
		setFrozen(null);
		if (scrollRef.current) scrollRef.current.scrollTop = 0;
	};
	const pause = () => {
		setPaused(true);
		setFrozen((current) => current ?? messages);
	};
	const clearAll = () => {
		clear();
		setPaused(false);
		setFrozen(null);
	};
	const onScroll = () => {
		const scrolledAway = (scrollRef.current?.scrollTop ?? 0) > 8;
		if (scrolledAway && !frozen) setFrozen(messages);
		else if (!scrolledAway && frozen && !paused) setFrozen(null);
	};

	const filteredMessages = useMemo(() => {
		return shownMessages.filter((msg) => {
			const channelMatch = msg.channel
				? activeChannels.includes(msg.channel)
				: true;
			const deviceMatch =
				activeInputs.includes(msg.deviceId) ||
				activeOutputs.includes(msg.deviceId);
			const typeMatch = activeTypes.includes(msg.type);
			return channelMatch && deviceMatch && typeMatch;
		});
	}, [shownMessages, activeChannels, activeInputs, activeOutputs, activeTypes]);

	return (
		<Box>
			<Box display="flex" gap={1} alignItems="flex-start" mb={2}>
				<Accordion
					disableGutters
					variant="outlined"
					sx={{ flex: 1, minWidth: 0, "&::before": { display: "none" } }}
				>
					<AccordionSummary
						expandIcon={<ArrowDropDownIcon />}
						aria-controls="message-filter-content"
						sx={{
							minHeight: 40,
							"& .MuiAccordionSummary-content": { my: 0.75 },
						}}
					>
						<Box display="flex" gap={1} alignItems="center">
							<FilterListIcon
								fontSize="small"
								sx={{ color: "text.secondary" }}
							/>
							{/* Plain text: the summary is a button; the Accordion's own
						    h3 is the heading. */}
							<Typography variant="subtitle2" component="span">
								{t("filter")}
							</Typography>
							{activeFilters > 0 && (
								<Chip
									size="small"
									color="primary"
									label={t("filters_active", { count: activeFilters })}
									sx={{ height: 20, fontSize: 11 }}
								/>
							)}
						</Box>
					</AccordionSummary>
					<AccordionDetails id="message-filter-content" sx={{ pt: 0, pb: 1.5 }}>
						<Filter
							onActiveChannelsChange={setActiveChannels}
							onActiveInputsChange={setActiveInputs}
							onActiveOutputsChange={setActiveOutputs}
							onActiveTypesChange={setActiveTypes}
						/>
					</AccordionDetails>
				</Accordion>
				{isMobile ? (
					<Tooltip title={frozen ? t("monitor_resume") : t("monitor_pause")}>
						<span>
							<IconButton
								onClick={frozen ? resume : pause}
								disabled={!frozen && messages.length === 0}
								color={frozen ? "primary" : "default"}
								aria-label={frozen ? t("monitor_resume") : t("monitor_pause")}
								sx={{ height: 42, width: 42, flexShrink: 0 }}
							>
								<Badge
									badgeContent={newCount}
									color="primary"
									max={999}
									invisible={newCount === 0}
								>
									{frozen ? <PlayArrowIcon /> : <PauseIcon />}
								</Badge>
							</IconButton>
						</span>
					</Tooltip>
				) : (
					<Button
						variant={frozen ? "contained" : "outlined"}
						onClick={frozen ? resume : pause}
						disabled={!frozen && messages.length === 0}
						startIcon={frozen ? <PlayArrowIcon /> : <PauseIcon />}
						sx={{ height: 42, flexShrink: 0 }}
					>
						{frozen
							? newCount > 0
								? `${t("monitor_resume")} · ${t("monitor_new", { count: newCount })}`
								: t("monitor_resume")
							: t("monitor_pause")}
					</Button>
				)}
				{isMobile ? (
					<Tooltip title={t("clear")}>
						<span>
							<IconButton
								onClick={clearAll}
								disabled={messages.length === 0}
								aria-label={t("clear")}
								sx={{ height: 42, width: 42 }}
							>
								<Close />
							</IconButton>
						</span>
					</Tooltip>
				) : (
					<Button
						variant="outlined"
						onClick={clearAll}
						startIcon={<Close />}
						disabled={messages.length === 0}
						sx={{ height: 42, flexShrink: 0 }}
					>
						{t("clear")}
					</Button>
				)}
			</Box>

			<Box display="flex" flexDirection="column" gap={1}>
				{messages.length > 0 && (
					<Typography
						variant="caption"
						color="text.secondary"
						aria-live="polite"
					>
						{filteredMessages.length === shownMessages.length
							? t("monitor_count", { count: shownMessages.length })
							: t("monitor_count_filtered", {
									shown: filteredMessages.length,
									count: shownMessages.length,
								})}
					</Typography>
				)}

				{filteredMessages.length === 0 ? (
					<Box
						sx={{
							py: 6,
							px: 2,
							border: 1,
							borderStyle: "dashed",
							borderColor: "divider",
							borderRadius: 1,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 2,
							textAlign: "center",
						}}
					>
						<Typography color="text.secondary">
							{!initialized
								? t("monitor_empty_no_midi")
								: messages.length > 0
									? t("monitor_empty_filtered")
									: t("monitor_empty_waiting")}
						</Typography>
						<InitMidi />
					</Box>
				) : isMobile ? (
					<Box
						ref={scrollRef}
						onScroll={onScroll}
						sx={{ maxHeight: listHeight, overflowY: "auto" }}
					>
						{filteredMessages.map((msg, index) => (
							<MobileMessageCard
								key={msg.id}
								msg={msg}
								stripe={index % 2 === 0}
								deviceName={getDeviceName(msg, inputs, outputs)}
								sendMessage={sendMessage}
							/>
						))}
					</Box>
				) : (
					<Box
						ref={scrollRef}
						onScroll={onScroll}
						sx={{
							maxHeight: listHeight,
							overflowY: "auto",
							fontFamily: "monospace",
							fontSize: "12px",
						}}
					>
						<Box
							sx={{
								...desktopRowSx,
								fontWeight: "bold",
								py: 1,
								borderBottom: 1,
								borderColor: "divider",
								position: "sticky",
								top: 0,
								zIndex: 1,
								bgcolor: "background.paper",
							}}
						>
							<Box />
							<Box sx={ellipsis}>{t("timestamp")}</Box>
							<Box sx={ellipsis}>{t("device")}</Box>
							<Box sx={ellipsis}>{t("channel")}</Box>
							<Box sx={ellipsis}>{t("type")}</Box>
							<Box sx={ellipsis}>{t("note_cc_prg")}</Box>
							<Box sx={ellipsis}>{t("vel_value")}</Box>
							<Box sx={ellipsis}>{t("data")}</Box>
						</Box>

						{filteredMessages.map((msg, index) => (
							<DesktopMessageRow
								key={msg.id}
								msg={msg}
								stripe={index % 2 === 0}
								deviceName={getDeviceName(msg, inputs, outputs)}
								sendMessage={sendMessage}
							/>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
}

export default MessageList;
