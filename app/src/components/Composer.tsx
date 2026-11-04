import { Send } from "@mui/icons-material";
import {
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
} from "@mui/material";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { type MidiMessage, useMIDIStore } from "../store/midi";
import {
	hexDigits,
	hexStringToBytes,
	MIDI_STATUS,
	sysexHexError,
	typeToLabel,
} from "../utils/midi";
import MidiDeviceChooser from "./MidiDeviceChooser";

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

const Composer = ({
	outputId,
	disabled = false,
	onSend,
}: {
	/** Send here, without the output chooser (a page with its own). */
	outputId?: string;
	disabled?: boolean;
	/**
	 * Gets every sent message, e.g. to play it in the page. Sending then
	 * works without an output too; with one, the message also goes there.
	 */
	onSend?: (message: MidiMessage) => void;
} = {}) => {
	const { t } = useTranslation();
	const channelLabelId = useId();
	const typeLabelId = useId();
	const sendMessage = useMIDIStore((state) => state.sendMessage);
	const composerOutputId = useMIDIStore(
		(state) => state.selectedComposerOutputDevice,
	);
	const selectedOutputId = outputId ?? composerOutputId;
	const setSelectedOutputId = useMIDIStore(
		(state) => state.setSelectedComposerOutputDevice,
	);
	const hasSelectedOutput = useMIDIStore((state) =>
		state.outputs.some(
			(port) => port.id === selectedOutputId && port.state !== "disconnected",
		),
	);

	const channel = useMIDIStore((state) => state.composerChannel);
	const setChannel = useMIDIStore((state) => state.setComposerChannel);
	const type = useMIDIStore((state) => state.composerType);
	const setType = useMIDIStore((state) => state.setComposerType);
	const noteOrCc = useMIDIStore((state) => state.composerNoteOrCc);
	const setNoteOrCc = useMIDIStore((state) => state.setComposerNoteOrCc);
	const velocityOrValue = useMIDIStore(
		(state) => state.composerVelocityOrValue,
	);
	const setVelocityOrValue = useMIDIStore(
		(state) => state.setComposerVelocityOrValue,
	);
	const pitchBendValue = useMIDIStore((state) => state.composerPitchBendValue);
	const setPitchBendValue = useMIDIStore(
		(state) => state.setComposerPitchBendValue,
	);

	const [noteOrCcInput, setNoteOrCcInput] = useState(String(noteOrCc));
	const [velocityInput, setVelocityInput] = useState(String(velocityOrValue));
	const [pitchBendInput, setPitchBendInput] = useState(String(pitchBendValue));

	useEffect(() => setNoteOrCcInput(String(noteOrCc)), [noteOrCc]);
	useEffect(() => setVelocityInput(String(velocityOrValue)), [velocityOrValue]);
	useEffect(() => setPitchBendInput(String(pitchBendValue)), [pitchBendValue]);

	const handleNumberChange = (
		raw: string,
		setLocal: (s: string) => void,
		setStore: (n: number) => void,
		min: number,
		max: number,
	) => {
		setLocal(raw);
		if (raw === "" || raw === "-") return;
		const num = parseInt(raw, 10);
		if (!Number.isNaN(num)) setStore(clamp(num, min, max));
	};

	const handleNumberBlur = (
		local: string,
		setLocal: (s: string) => void,
		setStore: (n: number) => void,
		min: number,
		max: number,
	) => {
		const num = parseInt(local, 10);
		const clamped = Number.isNaN(num) ? min : clamp(num, min, max);
		setStore(clamped);
		setLocal(String(clamped));
	};

	const sysexData = useMIDIStore((state) => state.composerSysexData);
	const setSysexData = useMIDIStore((state) => state.setComposerSysexData);
	const manufacturerId = useMIDIStore((state) => state.composerManufacturerId);
	const setManufacturerId = useMIDIStore(
		(state) => state.setComposerManufacturerId,
	);

	// SysEx data bytes are 7-bit: anything else is refused before it reaches Web MIDI.
	const isSysex = type === MIDI_STATUS.SYSEX_START;
	const manufacturerError = sysexHexError(manufacturerId);
	const sysexError = sysexHexError(sysexData);
	const sysexInvalid = isSysex && (!!manufacturerError || !!sysexError);

	const types = [
		{ value: MIDI_STATUS.NOTE_ON, label: typeToLabel(MIDI_STATUS.NOTE_ON) },
		{ value: MIDI_STATUS.NOTE_OFF, label: typeToLabel(MIDI_STATUS.NOTE_OFF) },
		{
			value: MIDI_STATUS.CONTROL_CHANGE,
			label: typeToLabel(MIDI_STATUS.CONTROL_CHANGE),
		},
		{
			value: MIDI_STATUS.PROGRAM_CHANGE,
			label: typeToLabel(MIDI_STATUS.PROGRAM_CHANGE),
		},
		{
			value: MIDI_STATUS.PITCH_BEND,
			label: typeToLabel(MIDI_STATUS.PITCH_BEND),
		},
		{
			value: MIDI_STATUS.CHANNEL_PRESSURE,
			label: typeToLabel(MIDI_STATUS.CHANNEL_PRESSURE),
		},
		{
			value: MIDI_STATUS.POLY_PRESSURE,
			label: typeToLabel(MIDI_STATUS.POLY_PRESSURE),
		},
		{
			value: MIDI_STATUS.SYSEX_START,
			label: typeToLabel(MIDI_STATUS.SYSEX_START),
		},
		{ value: MIDI_STATUS.START, label: typeToLabel(MIDI_STATUS.START) },
		{ value: MIDI_STATUS.STOP, label: typeToLabel(MIDI_STATUS.STOP) },
		{ value: MIDI_STATUS.CONTINUE, label: typeToLabel(MIDI_STATUS.CONTINUE) },
	];

	return (
		<Box>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				alignItems={{ sm: "center" }}
				width="100%"
			>
				<FormControl
					size="small"
					disabled={disabled}
					sx={{ width: { xs: "100%", sm: 120 } }}
				>
					<InputLabel id={channelLabelId}>{t("channel")}</InputLabel>
					<Select
						labelId={channelLabelId}
						value={channel}
						label={t("channel")}
						onChange={(e) => setChannel(Number(e.target.value))}
					>
						{Array.from({ length: 16 }, (_, i) => i + 1).map((ch) => (
							<MenuItem key={ch} value={ch}>
								{ch}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl
					size="small"
					disabled={disabled}
					sx={{ width: { xs: "100%", sm: 180 } }}
				>
					<InputLabel id={typeLabelId}>{t("type")}</InputLabel>
					<Select
						labelId={typeLabelId}
						value={type}
						label={t("type")}
						onChange={(e) => setType(Number(e.target.value))}
					>
						{types.map((item) => (
							<MenuItem key={item.value} value={item.value}>
								{item.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{type === MIDI_STATUS.SYSEX_START && (
					<>
						<TextField
							label={t("composer_start_byte")}
							value="F0"
							disabled
							size="small"
							sx={{ width: { xs: "100%", sm: 80 } }}
						/>
						<TextField
							disabled={disabled}
							label={t("composer_manufacturer_id")}
							value={manufacturerId}
							// One byte, or three for extended IDs (00 xx xx)
							onChange={(e) =>
								setManufacturerId(hexDigits(e.target.value).slice(0, 6))
							}
							placeholder="FD"
							size="small"
							error={!!manufacturerError}
							helperText={
								manufacturerError && t(`composer_sysex_${manufacturerError}`)
							}
							sx={{ width: { xs: "100%", sm: 140 } }}
						/>
						<TextField
							disabled={disabled}
							label={t("composer_data_hex")}
							value={hexDigits(sysexData)}
							onChange={(e) => setSysexData(hexDigits(e.target.value))}
							placeholder="43 12 00"
							size="small"
							error={!!sysexError}
							helperText={sysexError && t(`composer_sysex_${sysexError}`)}
							sx={{ width: { xs: "100%", sm: 240 } }}
						/>
						<TextField
							label={t("composer_end_byte")}
							value="F7"
							disabled
							size="small"
							sx={{ width: { xs: "100%", sm: 80 } }}
						/>
					</>
				)}

				{(type === MIDI_STATUS.NOTE_ON ||
					type === MIDI_STATUS.NOTE_OFF ||
					type === MIDI_STATUS.CHANNEL_PRESSURE ||
					type === MIDI_STATUS.POLY_PRESSURE ||
					type === MIDI_STATUS.CONTROL_CHANGE ||
					type === MIDI_STATUS.PROGRAM_CHANGE) && (
					<>
						{type !== MIDI_STATUS.CHANNEL_PRESSURE && (
							<TextField
								disabled={disabled}
								label={
									type === MIDI_STATUS.NOTE_ON ||
									type === MIDI_STATUS.NOTE_OFF ||
									type === MIDI_STATUS.POLY_PRESSURE
										? t("note")
										: type === MIDI_STATUS.PROGRAM_CHANGE
											? t("composer_program")
											: t("controller")
								}
								value={noteOrCcInput}
								onChange={(e) =>
									handleNumberChange(
										e.target.value,
										setNoteOrCcInput,
										setNoteOrCc,
										0,
										127,
									)
								}
								onBlur={() =>
									handleNumberBlur(
										noteOrCcInput,
										setNoteOrCcInput,
										setNoteOrCc,
										0,
										127,
									)
								}
								inputMode="numeric"
								size="small"
								sx={{ width: { xs: "100%", sm: 120 } }}
							/>
						)}

						{type !== MIDI_STATUS.PROGRAM_CHANGE && (
							<TextField
								disabled={disabled}
								label={
									type === MIDI_STATUS.NOTE_ON || type === MIDI_STATUS.NOTE_OFF
										? t("composer_velocity")
										: t("composer_value")
								}
								value={velocityInput}
								onChange={(e) =>
									handleNumberChange(
										e.target.value,
										setVelocityInput,
										setVelocityOrValue,
										0,
										127,
									)
								}
								onBlur={() =>
									handleNumberBlur(
										velocityInput,
										setVelocityInput,
										setVelocityOrValue,
										0,
										127,
									)
								}
								inputMode="numeric"
								size="small"
								sx={{ width: { xs: "100%", sm: 120 } }}
							/>
						)}
					</>
				)}

				{type === MIDI_STATUS.PITCH_BEND && (
					<TextField
						disabled={disabled}
						label={t("composer_pitch_bend")}
						value={pitchBendInput}
						onChange={(e) =>
							handleNumberChange(
								e.target.value,
								setPitchBendInput,
								setPitchBendValue,
								-8192,
								8191,
							)
						}
						onBlur={() =>
							handleNumberBlur(
								pitchBendInput,
								setPitchBendInput,
								setPitchBendValue,
								-8192,
								8191,
							)
						}
						inputMode="numeric"
						size="small"
						sx={{ width: { xs: "100%", sm: 220 } }}
					/>
				)}

				<Box sx={{ flexGrow: { sm: 1 } }} />

				{outputId === undefined && (
					<MidiDeviceChooser
						value={selectedOutputId || ""}
						onChange={setSelectedOutputId}
					/>
				)}

				<Button
					variant="contained"
					startIcon={<Send />}
					sx={{ width: { xs: "100%", sm: "auto" } }}
					disabled={disabled || (!hasSelectedOutput && !onSend) || sysexInvalid}
					onClick={() => {
						const msg: MidiMessage = {
							id: uuidv4(),
							type,
							timestamp: Date.now(),
							channel,
							note: type !== 240 ? noteOrCc : undefined,
							controller: type !== 240 ? noteOrCc : undefined,
							value:
								type === MIDI_STATUS.CONTROL_CHANGE ||
								type === MIDI_STATUS.NOTE_ON ||
								type === MIDI_STATUS.NOTE_OFF ||
								type === MIDI_STATUS.CHANNEL_PRESSURE ||
								type === MIDI_STATUS.POLY_PRESSURE
									? velocityOrValue
									: undefined,
							pitchBendValue:
								type === MIDI_STATUS.PITCH_BEND
									? pitchBendValue + 8192
									: undefined,
							velocity: type !== 240 ? velocityOrValue : undefined,
							data:
								type === MIDI_STATUS.SYSEX_START
									? [
											0xf0,
											...hexStringToBytes(manufacturerId),
											...hexStringToBytes(sysexData),
											0xf7,
										]
									: undefined,
						};

						if (hasSelectedOutput) sendMessage(msg, selectedOutputId);
						onSend?.(msg);
					}}
				>
					{t("composer_send_midi")}
				</Button>
			</Stack>
		</Box>
	);
};

export default Composer;
