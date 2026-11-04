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
import { useCallback, useEffect, useRef, useState } from "react";
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

const describeEvent = ({ event, listEnd }: NfcLogEntry): string => {
	switch (event.kind) {
		case "placed":
			return `Tag placed: ${event.uid}`;
		case "removed":
			return `Tag removed: ${event.uid}`;
		case "mapping_state":
			return `Mapping mode ${event.on ? "on" : "off"}`;
		case "mapped":
			return `Tag ${event.uid} mapped to ${describeNfcMapping(event)}`;
		case "count":
			if (listEnd) return `Board has ${event.count} mapping(s)`;
			return event.count === 0
				? "All mappings deleted"
				: `Mapping table full (${event.count})`;
	}
};

/**
 * Hidden page (not in the menu, open #/nfc): set up the client_nfc example
 * (ESP-NOW-MIDI/examples/client_nfc). Turns mapping mode on and off, shows
 * the tag on the reader and maps it to a MIDI message.
 */
const Nfc = () => {
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
				setFileError(`${file.name} is not an NFC mappings file.`);
				return;
			}
			setFileError(null);
			loadFile(loaded.mappings, loaded.labels);
		} catch (err) {
			setFileError(`Could not load ${file.name}: ${(err as Error).message}`);
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
					<Tooltip title="Save mappings to file" describeChild>
						<span>
							<IconButton
								color="inherit"
								aria-label="Save mappings to file"
								onClick={saveToFile}
								disabled={mappingList.length === 0}
							>
								<DownloadIcon />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title="Load mappings from file">
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
					Maps NFC tags to MIDI messages on a board running the client_nfc
					example. Connect the board over USB: the dongle keeps this SysEx to
					itself, so mapping mode can't be switched through it.
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
								Dismiss
							</Button>
						}
					>
						{pendingList.length} mapping(s) from the file aren't on the board
						yet. The board only learns a mapping with its tag on the reader:
						turn mapping mode on and place each tag: its saved message is filled
						into the composer, then press send.
						<Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
							{pendingList.map((m) => (
								<li key={m.uid}>
									<Box component="span" sx={{ fontFamily: "monospace" }}>
										{m.uid}
									</Box>
									{labels[m.uid] ? ` (${labels[m.uid]})` : ""}:{" "}
									{describeNfcMapping(m)}
								</li>
							))}
						</Box>
					</Alert>
				)}

				{sendFailed && (
					<Alert severity="error" onClose={() => setSendFailed(false)}>
						Could not send: pick a connected MIDI output.
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
							label="Mapping mode"
						/>
						{mappingMode === undefined && outputConnected && (
							<Typography variant="body2" color="text.secondary">
								State unknown until the board answers.
							</Typography>
						)}
						<Box flex={1} />
						{confirmClear ? (
							<>
								<Typography variant="body2">
									Delete all mappings on the board?
								</Typography>
								<Button
									color="error"
									variant="contained"
									onClick={clearMappings}
								>
									Delete
								</Button>
								<Button onClick={() => setConfirmClear(false)}>Cancel</Button>
							</>
						) : (
							<Button
								color="error"
								disabled={!outputConnected}
								onClick={() => setConfirmClear(true)}
							>
								Delete all mappings
							</Button>
						)}
					</Box>

					{mappingMode && (
						<Box mt={2} display="flex" flexDirection="column" gap={2}>
							<Box display="flex" alignItems="center" gap={1}>
								<Typography>Tag on reader:</Typography>
								{currentTag ? (
									<Chip
										color="primary"
										label={labels[currentTag] || currentTag}
									/>
								) : (
									<Typography color="text.secondary">
										none, place a tag on the reader
									</Typography>
								)}
							</Box>
							{tableFull !== undefined && (
								<Alert severity="warning">
									Mapping table full ({tableFull}). Delete all mappings to add
									new tags.
								</Alert>
							)}
							<Typography variant="body2" color="text.secondary">
								Send the message for this tag with the composer below, or send
								any note, CC or program change from another app or controller.
							</Typography>
						</Box>
					)}
				</Paper>

				<Paper variant="outlined" sx={{ p: 2 }}>
					<Typography variant="h6" component="h2">
						MIDI composer
					</Typography>
					<Typography variant="body2" color="text.secondary" mb={2}>
						{composerActive
							? `Sends to the board: the message gets mapped to ${labels[currentTag] || currentTag}.`
							: "Turn mapping mode on and place a tag on the reader to map it to a message."}
					</Typography>
					<Composer outputId={outputId} disabled={!composerActive} />
				</Paper>

				<Box>
					<Box display="flex" alignItems="center" gap={1}>
						<Typography variant="h6" component="h2">
							Mappings
						</Typography>
						{loading && <CircularProgress size={16} />}
						<Box flex={1} />
						<Button
							size="small"
							onClick={loadMappings}
							disabled={!outputConnected || loading}
						>
							Reload
						</Button>
					</Box>
					{loadTimedOut && (
						<Alert severity="warning" onClose={() => setLoadTimedOut(false)}>
							The board didn't send its mappings. Is it running client_nfc with
							the get all command, connected over USB?
						</Alert>
					)}
					{mappingList.length === 0 ? (
						<Typography color="text.secondary" mt={1}>
							No mappings yet.
						</Typography>
					) : (
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Tag</TableCell>
									<TableCell>Label</TableCell>
									<TableCell>Message</TableCell>
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
												placeholder="Label"
												value={labels[m.uid] ?? ""}
												onChange={(e) => setLabel(m.uid, e.target.value)}
											/>
										</TableCell>
										<TableCell>{describeNfcMapping(m)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Box>

				<Box>
					<Box display="flex" alignItems="center">
						<Typography variant="h6" component="h2">
							Events
						</Typography>
						<Box flex={1} />
						<Button size="small" onClick={clearLog} disabled={log.length === 0}>
							Clear
						</Button>
					</Box>
					{log.length === 0 ? (
						<Typography color="text.secondary">
							Nothing received from the board yet.
						</Typography>
					) : (
						<Box component="ul" sx={{ m: 0, pl: 2, fontFamily: "monospace" }}>
							{log.map((entry) => (
								<li key={entry.id}>
									{new Date(entry.timestamp).toLocaleTimeString()}{" "}
									{describeEvent(entry)}
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
