import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControlLabel,
	IconButton,
	Paper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { deviceInputId, useMIDIStore } from "../store/midi";
import { type NfcLogEntry, useNfcStore } from "../store/nfc";
import { MIDI_STATUS } from "../utils/midi";
import {
	buildNfcSysex,
	describeNfcMapping,
	NFC_COMMAND,
	nfcFile,
	parseNfcFile,
	parseNfcSysex,
	sameNfcMapping,
} from "../utils/nfc";
import Composer from "./Composer";
import PageLayout from "./layout/PageLayout";
import MidiDeviceChooser from "./MidiDeviceChooser";

/** No list end after this long: give up waiting. */
const LOAD_TIMEOUT_MS = 3000;

const describeEvent = (
	{ event, listEnd }: NfcLogEntry,
	t: TFunction,
): string => {
	switch (event.kind) {
		case "placed":
			return t("nfc_event_placed", { uid: event.uid });
		case "removed":
			return t("nfc_event_removed", { uid: event.uid });
		case "mapping_state":
			return t("nfc_event_mapping_state", {
				state: t(event.on ? "state_on" : "state_off"),
			});
		case "mapped":
			return t("nfc_event_mapped", {
				uid: event.uid,
				mapping: describeNfcMapping(event, t),
			});
		case "count":
			if (listEnd) return t("nfc_event_count", { count: event.count });
			return event.count === 0
				? t("nfc_event_cleared")
				: t("nfc_event_table_full", { count: event.count });
	}
};

/**
 * Hidden page (not in the menu, open #/nfc): set up the client_nfc example
 * (ESP-NOW-MIDI/examples/client_nfc). Turns mapping mode on and off, shows
 * the tag on the reader and maps it to a MIDI message.
 */
const Nfc = () => {
	const { t } = useTranslation();
	const midiInitialized = useMIDIStore((s) => s.initialized);
	const inputs = useMIDIStore((s) => s.inputs) as MIDIInput[];
	const outputs = useMIDIStore((s) => s.outputs);
	const sendMessage = useMIDIStore((s) => s.sendMessage);
	const {
		outputId,
		setOutputId,
		mappingMode,
		currentTag,
		mappings,
		labels,
		setLabel,
		log,
		clearLog,
		tableFull,
		handleEvent,
		loading,
		startLoading,
		stopLoading,
		fileMappings,
		loadFile,
		dismissFile,
	} = useNfcStore();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [confirmClear, setConfirmClear] = useState(false);
	const [sendFailed, setSendFailed] = useState(false);
	const [loadTimedOut, setLoadTimedOut] = useState(false);

	const outputConnected = outputs.some(
		(o) => o.id === outputId && o.state !== "disconnected",
	);

	// Reports from the client. Listen to the selected port's input when it
	// pairs, else to every input (the client may answer through a dongle).
	useEffect(() => {
		if (!midiInitialized) return;
		const pairedId = outputId ? deviceInputId(outputId) : undefined;
		const listened = pairedId
			? inputs.filter((input) => input.id === pairedId)
			: inputs;
		const listener = (event: MIDIMessageEvent) => {
			if (!event.data) return;
			const nfcEvent = parseNfcSysex(event.data);
			if (nfcEvent) handleEvent(nfcEvent);
		};
		for (const input of listened)
			input.addEventListener("midimessage", listener);
		return () => {
			for (const input of listened)
				input.removeEventListener("midimessage", listener);
		};
	}, [midiInitialized, inputs, outputId, handleEvent]);

	const send = useCallback(
		(message: Parameters<typeof sendMessage>[0]) => {
			const ok = sendMessage(message, outputId);
			setSendFailed(!ok);
			return ok;
		},
		[sendMessage, outputId],
	);

	const sendCommand = useCallback(
		(command: number) =>
			send({
				id: uuidv4(),
				timestamp: Date.now(),
				type: MIDI_STATUS.SYSEX_START,
				data: buildNfcSysex(command),
			}),
		[send],
	);

	const loadMappings = useCallback(() => {
		setLoadTimedOut(false);
		startLoading();
		if (!sendCommand(NFC_COMMAND.GET_MAPPINGS)) stopLoading();
	}, [sendCommand, startLoading, stopLoading]);

	// The board's table is the truth: read it whenever a board is picked.
	useEffect(() => {
		if (midiInitialized && outputConnected) loadMappings();
	}, [midiInitialized, outputConnected, loadMappings]);

	useEffect(() => {
		if (!loading) return;
		const timer = setTimeout(() => {
			stopLoading();
			setLoadTimedOut(true);
		}, LOAD_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, [loading, stopLoading]);

	const clearMappings = () => {
		setConfirmClear(false);
		sendCommand(NFC_COMMAND.CLEAR);
	};

	const mappingList = Object.values(mappings);
	// File mappings the board doesn't have (yet), or has with another message.
	const pendingList = Object.values(fileMappings).filter(
		(m) => !sameNfcMapping(m, mappings[m.uid]),
	);

	const saveToFile = () => {
		const data = JSON.stringify(nfcFile(mappingList, labels), null, 2);
		const url = URL.createObjectURL(
			new Blob([data], { type: "application/json" }),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = "nfc-mappings.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		// Lets the same file be picked again
		e.target.value = "";
		if (!file) return;
		try {
			const loaded = parseNfcFile(JSON.parse(await file.text()));
			if (!loaded) {
				setFileError(t("nfc_file_invalid", { name: file.name }));
				return;
			}
			setFileError(null);
			loadFile(loaded.mappings, loaded.labels);
		} catch (err) {
			setFileError(
				t("nfc_file_load_failed", {
					name: file.name,
					error: (err as Error).message,
				}),
			);
		}
	};
	// The board learns from the next channel message while a tag is armed.
	const composerActive = !!mappingMode && !!currentTag;

	return (
		<PageLayout
			title="NFC"
			actions={
				<>
					<input
						type="file"
						accept="application/json"
						style={{ display: "none" }}
						ref={fileInputRef}
						onChange={handleFileChange}
					/>
					<Tooltip title={t("nfc_save_to_file")} describeChild>
						<span>
							<IconButton
								color="inherit"
								aria-label={t("nfc_save_to_file")}
								onClick={saveToFile}
								disabled={mappingList.length === 0}
							>
								<DownloadIcon />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title={t("nfc_load_from_file")}>
						<IconButton
							color="inherit"
							onClick={() => fileInputRef.current?.click()}
						>
							<FolderOpenIcon />
						</IconButton>
					</Tooltip>
					<Box flex={1} />
					<MidiDeviceChooser value={outputId} onChange={setOutputId} />
				</>
			}
		>
			<Box display="flex" flexDirection="column" gap={2}>
				<Typography variant="body2" color="text.secondary">
					{t("nfc_intro")}
				</Typography>

				{fileError && (
					<Alert severity="error" onClose={() => setFileError(null)}>
						{fileError}
					</Alert>
				)}

				{pendingList.length > 0 && (
					<Alert
						severity="info"
						action={
							<Button color="inherit" size="small" onClick={dismissFile}>
								{t("browser_warning_dismiss")}
							</Button>
						}
					>
						{t("nfc_pending", { count: pendingList.length })}
						<Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
							{pendingList.map((m) => (
								<li key={m.uid}>
									<Box component="span" sx={{ fontFamily: "monospace" }}>
										{m.uid}
									</Box>
									{labels[m.uid] ? ` (${labels[m.uid]})` : ""}:{" "}
									{describeNfcMapping(m, t)}
								</li>
							))}
						</Box>
					</Alert>
				)}

				{sendFailed && (
					<Alert severity="error" onClose={() => setSendFailed(false)}>
						{t("nfc_send_failed")}
					</Alert>
				)}

				<Paper variant="outlined" sx={{ p: 2 }}>
					<Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
						<FormControlLabel
							control={
								<Switch
									checked={!!mappingMode}
									disabled={!outputConnected}
									onChange={(e) =>
										sendCommand(
											e.target.checked
												? NFC_COMMAND.MAPPING_ON
												: NFC_COMMAND.MAPPING_OFF,
										)
									}
								/>
							}
							label={t("nfc_mapping_mode")}
						/>
						{mappingMode === undefined && outputConnected && (
							<Typography variant="body2" color="text.secondary">
								{t("nfc_state_unknown")}
							</Typography>
						)}
						<Box flex={1} />
						{confirmClear ? (
							<>
								<Typography variant="body2">
									{t("nfc_confirm_delete_all")}
								</Typography>
								<Button
									color="error"
									variant="contained"
									onClick={clearMappings}
								>
									{t("delete")}
								</Button>
								<Button onClick={() => setConfirmClear(false)}>
									{t("nfc_cancel")}
								</Button>
							</>
						) : (
							<Button
								color="error"
								disabled={!outputConnected}
								onClick={() => setConfirmClear(true)}
							>
								{t("nfc_delete_all")}
							</Button>
						)}
					</Box>

					{mappingMode && (
						<Box mt={2} display="flex" flexDirection="column" gap={2}>
							<Box display="flex" alignItems="center" gap={1}>
								<Typography>{t("nfc_tag_on_reader")}</Typography>
								{currentTag ? (
									<Chip
										color="primary"
										label={labels[currentTag] || currentTag}
									/>
								) : (
									<Typography color="text.secondary">
										{t("nfc_no_tag")}
									</Typography>
								)}
							</Box>
							{tableFull !== undefined && (
								<Alert severity="warning">
									{t("nfc_table_full", { count: tableFull })}
								</Alert>
							)}
							<Typography variant="body2" color="text.secondary">
								{t("nfc_mapping_hint")}
							</Typography>
						</Box>
					)}
				</Paper>

				<Paper variant="outlined" sx={{ p: 2 }}>
					<Typography variant="h6" component="h2">
						{t("nfc_composer")}
					</Typography>
					<Typography variant="body2" color="text.secondary" mb={2}>
						{composerActive
							? t("nfc_composer_active", {
									tag: labels[currentTag] || currentTag,
								})
							: t("nfc_composer_inactive")}
					</Typography>
					<Composer outputId={outputId} disabled={!composerActive} />
				</Paper>

				<Box>
					<Box display="flex" alignItems="center" gap={1}>
						<Typography variant="h6" component="h2">
							{t("nfc_mappings")}
						</Typography>
						{loading && <CircularProgress size={16} />}
						<Box flex={1} />
						<Button
							size="small"
							onClick={loadMappings}
							disabled={!outputConnected || loading}
						>
							{t("nfc_reload")}
						</Button>
					</Box>
					{loadTimedOut && (
						<Alert severity="warning" onClose={() => setLoadTimedOut(false)}>
							{t("nfc_load_timeout")}
						</Alert>
					)}
					{mappingList.length === 0 ? (
						<Typography color="text.secondary" mt={1}>
							{t("nfc_no_mappings")}
						</Typography>
					) : (
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>{t("nfc_tag")}</TableCell>
									<TableCell>{t("nfc_label")}</TableCell>
									<TableCell>{t("nfc_message")}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{mappingList.map((m) => (
									<TableRow key={m.uid} selected={m.uid === currentTag}>
										<TableCell sx={{ fontFamily: "monospace" }}>
											{m.uid}
										</TableCell>
										<TableCell>
											<TextField
												size="small"
												variant="standard"
												placeholder={t("nfc_label")}
												value={labels[m.uid] ?? ""}
												onChange={(e) => setLabel(m.uid, e.target.value)}
											/>
										</TableCell>
										<TableCell>{describeNfcMapping(m, t)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Box>

				<Box>
					<Box display="flex" alignItems="center">
						<Typography variant="h6" component="h2">
							{t("nfc_events")}
						</Typography>
						<Box flex={1} />
						<Button size="small" onClick={clearLog} disabled={log.length === 0}>
							{t("clear")}
						</Button>
					</Box>
					{log.length === 0 ? (
						<Typography color="text.secondary">{t("nfc_no_events")}</Typography>
					) : (
						<Box component="ul" sx={{ m: 0, pl: 2, fontFamily: "monospace" }}>
							{log.map((entry) => (
								<li key={entry.id}>
									{new Date(entry.timestamp).toLocaleTimeString()}{" "}
									{describeEvent(entry, t)}
								</li>
							))}
						</Box>
					)}
				</Box>
			</Box>
		</PageLayout>
	);
};

export default Nfc;
