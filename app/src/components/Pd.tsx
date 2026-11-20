import ClearAllIcon from "@mui/icons-material/ClearAll";
import DeleteIcon from "@mui/icons-material/Delete";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import {
	Alert,
	Box,
	Button,
	IconButton,
	LinearProgress,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { deviceInputId, useMIDIStore } from "../store/midi";
import { usePdStore } from "../store/pd";
import { MIDI_STATUS } from "../utils/midi";
import { autoNfcOutputId } from "../utils/nfc";
import {
	ALL_DEVICES,
	createHandshakeQueue,
	fileDumpType,
	MAX_FILE_SIZE,
	MAX_NAME_LENGTH,
	orderFiles,
	parseHandshake,
	UploadError,
	uploadFile,
	validFileName,
} from "../utils/pd";
import IntegerField from "./IntegerField";
import PageLayout from "./layout/PageLayout";
import MidiDeviceChooser from "./MidiDeviceChooser";

type FileStatus =
	| "queued"
	| "sending"
	| "done"
	| "error"
	| "invalid"
	| "too_large";

interface PdFile {
	id: string;
	name: string;
	bytes: Uint8Array;
	status: FileStatus;
	/** 0..1 while sending */
	progress: number;
}

const formatSize = (bytes: number) =>
	bytes < 1024
		? `${bytes} B`
		: bytes < 1024 * 1024
			? `${(bytes / 1024).toFixed(1)} KB`
			: `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const initialStatus = (name: string, size: number): FileStatus =>
	!validFileName(name)
		? "invalid"
		: size > MAX_FILE_SIZE
			? "too_large"
			: "queued";

const uploadable = (f: PdFile) =>
	f.status !== "invalid" && f.status !== "too_large";

/**
 * Hidden page (not in the menu, open #/pd): upload Pure Data patches and
 * other files to a Pd client (ESP-NOW-MIDI components/enomik_pd) over
 * MIDI File Dump SysEx, through USB or the dongle.
 */
const Pd = () => {
	const { t } = useTranslation();
	const midiInitialized = useMIDIStore((s) => s.initialized);
	const inputs = useMIDIStore((s) => s.inputs) as MIDIInput[];
	const outputs = useMIDIStore((s) => s.outputs);
	const sendMessage = useMIDIStore((s) => s.sendMessage);
	const {
		outputId,
		setOutputId,
		deviceId,
		setDeviceId,
		mainFile,
		log,
		addLog,
		clearLog,
	} = usePdStore();

	const [files, setFiles] = useState<PdFile[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queueRef = useRef(createHandshakeQueue());
	const abortRef = useRef<AbortController | null>(null);

	const outputConnected = outputs.some(
		(o) => o.id === outputId && o.state !== "disconnected",
	);

	// Pick the client, else the dongle, unless a connected output is selected.
	useEffect(() => {
		if (!midiInitialized) return;
		const id = autoNfcOutputId(outputId, outputs);
		if (id) setOutputId(id);
	}, [midiInitialized, outputs, outputId, setOutputId]);

	// Answers from the client: the selected port's input when it pairs, else
	// every input (the answer may come back through a dongle).
	useEffect(() => {
		if (!midiInitialized) return;
		const pairedId = outputId ? deviceInputId(outputId) : undefined;
		const listened = pairedId
			? inputs.filter((input) => input.id === pairedId)
			: inputs;
		const listener = (event: MIDIMessageEvent) => {
			if (!event.data) return;
			const handshake = parseHandshake(event.data);
			if (handshake) queueRef.current.push(handshake);
		};
		for (const input of listened)
			input.addEventListener("midimessage", listener);
		return () => {
			for (const input of listened)
				input.removeEventListener("midimessage", listener);
		};
	}, [midiInitialized, inputs, outputId]);

	// Leaving the page stops a running upload.
	useEffect(() => () => abortRef.current?.abort(), []);

	const addFiles = useCallback(async (list: FileList | File[]) => {
		const added = await Promise.all(
			Array.from(list).map(async (file) => {
				const bytes = new Uint8Array(await file.arrayBuffer());
				return {
					id: uuidv4(),
					name: file.name,
					bytes,
					status: initialStatus(file.name, bytes.length),
					progress: 0,
				};
			}),
		);
		// Same name again: the newer file replaces the older one.
		setFiles((current) => [
			...current.filter((f) => !added.some((a) => a.name === f.name)),
			...added,
		]);
	}, []);

	const updateFile = (id: string, patch: Partial<PdFile>) =>
		setFiles((current) =>
			current.map((f) => (f.id === id ? { ...f, ...patch } : f)),
		);

	const send = useCallback(
		(data: number[]) =>
			sendMessage(
				{
					id: uuidv4(),
					timestamp: Date.now(),
					type: MIDI_STATUS.SYSEX_START,
					data,
				},
				outputId,
			),
		[sendMessage, outputId],
	);

	const upload = async () => {
		const toSend = orderFiles(files.filter(uploadable), mainFile);
		if (toSend.length === 0) return;
		const controller = new AbortController();
		abortRef.current = controller;
		setBusy(true);
		setError(null);
		queueRef.current.clear();
		for (const f of toSend) updateFile(f.id, { status: "queued", progress: 0 });
		addLog(
			"info",
			t("pd_log_start", { count: toSend.length, device: deviceId }),
		);

		for (const f of toSend) {
			updateFile(f.id, { status: "sending" });
			try {
				await uploadFile({
					name: f.name,
					bytes: f.bytes,
					device: deviceId,
					send,
					nextHandshake: queueRef.current.next,
					signal: controller.signal,
					onProgress: (sent, total) =>
						updateFile(f.id, { progress: total ? sent / total : 1 }),
				});
				updateFile(f.id, { status: "done", progress: 1 });
				addLog(
					"success",
					t("pd_log_stored", {
						name: f.name,
						size: formatSize(f.bytes.length),
					}),
				);
				if (f.name === mainFile)
					addLog("info", t("pd_log_reload", { main: mainFile }));
			} catch (err) {
				updateFile(f.id, { status: "error" });
				const reason = err instanceof UploadError ? err.reason : undefined;
				const message =
					reason === "send_failed"
						? t("pd_send_failed")
						: reason === "cancelled"
							? t("pd_cancelled", { name: f.name })
							: reason === "aborted"
								? t("pd_aborted")
								: t("pd_no_answer");
				setError(message);
				addLog("error", t("pd_log_failed", { name: f.name, error: message }));
				break; // later files may depend on this one
			}
		}
		if (!controller.signal.aborted) addLog("info", t("pd_log_done"));
		abortRef.current = null;
		setBusy(false);
	};

	const invalidCount = files.filter((f) => f.status === "invalid").length;
	const tooLargeCount = files.filter((f) => f.status === "too_large").length;
	const canUpload = outputConnected && !busy && files.some(uploadable);

	const statusCell = (f: PdFile) => {
		if (f.status === "sending")
			return (
				<Box display="flex" alignItems="center" gap={1} minWidth={120}>
					<LinearProgress
						variant="determinate"
						value={f.progress * 100}
						sx={{ flex: 1 }}
					/>
					<Typography variant="caption">
						{Math.round(f.progress * 100)}%
					</Typography>
				</Box>
			);
		const color =
			f.status === "done"
				? "success.main"
				: f.status === "queued"
					? "text.secondary"
					: "error.main";
		return (
			<Typography variant="body2" color={color}>
				{t(`pd_status_${f.status}`)}
			</Typography>
		);
	};

	const toolbar = (
		<>
			<input
				type="file"
				multiple
				style={{ display: "none" }}
				ref={fileInputRef}
				onChange={(e) => {
					if (e.target.files) addFiles(e.target.files);
					e.target.value = ""; // lets the same files be picked again
				}}
			/>
			<Tooltip title={t("pd_add_files")}>
				<span>
					<IconButton
						color="inherit"
						aria-label={t("pd_add_files")}
						disabled={busy}
						onClick={() => fileInputRef.current?.click()}
					>
						<NoteAddIcon />
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title={t("pd_clear_files")} describeChild>
				<span>
					<IconButton
						color="inherit"
						aria-label={t("pd_clear_files")}
						disabled={busy || files.length === 0}
						onClick={() => setFiles([])}
					>
						<ClearAllIcon />
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title={t("pd_device_id_hint")}>
				<span>
					<IntegerField
						size="small"
						label={t("pd_device_id")}
						value={deviceId}
						onChange={setDeviceId}
						max={ALL_DEVICES}
						disabled={busy}
						sx={{ width: 110 }}
					/>
				</span>
			</Tooltip>
			<Box flex={1} />
			<MidiDeviceChooser value={outputId} onChange={setOutputId} />
		</>
	);

	return (
		<PageLayout title="Pd" actions={toolbar}>
			<Box display="flex" flexDirection="column" gap={2}>
				<Typography variant="body2" color="text.secondary">
					{t("pd_intro")}
				</Typography>

				{error && (
					<Alert severity="error" onClose={() => setError(null)}>
						{error}
					</Alert>
				)}
				{invalidCount > 0 && (
					<Alert severity="warning">
						{t("pd_invalid_names", {
							count: invalidCount,
							max: MAX_NAME_LENGTH,
						})}
					</Alert>
				)}
				{tooLargeCount > 0 && (
					<Alert severity="warning">
						{t("pd_too_large", { max: formatSize(MAX_FILE_SIZE) })}
					</Alert>
				)}

				<Paper
					variant="outlined"
					onDragOver={(e) => {
						e.preventDefault();
						if (!busy) setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragOver(false);
						if (!busy && e.dataTransfer.files.length)
							addFiles(e.dataTransfer.files);
					}}
					sx={[
						{ p: 2, borderStyle: "dashed", borderWidth: 2 },
						dragOver && {
							borderColor: "primary.main",
							bgcolor: (theme: Theme) =>
								alpha(theme.palette.primary.main, 0.06),
						},
					]}
				>
					{files.length === 0 ? (
						<Typography color="text.secondary" textAlign="center" py={3}>
							{t("pd_drop_here")}
						</Typography>
					) : (
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>{t("pd_file")}</TableCell>
									<TableCell>{t("pd_type")}</TableCell>
									<TableCell align="right">{t("pd_size")}</TableCell>
									<TableCell>{t("pd_status")}</TableCell>
									<TableCell />
								</TableRow>
							</TableHead>
							<TableBody>
								{orderFiles(files, mainFile).map((f) => (
									<TableRow key={f.id} hover>
										<TableCell sx={{ fontFamily: "monospace" }}>
											{f.name}
											{f.name === mainFile && " ⟳"}
										</TableCell>
										<TableCell sx={{ fontFamily: "monospace" }}>
											{fileDumpType(f.name).trim()}
										</TableCell>
										<TableCell align="right">
											{formatSize(f.bytes.length)}
										</TableCell>
										<TableCell>{statusCell(f)}</TableCell>
										<TableCell align="right" padding="checkbox">
											<Tooltip title={t("pd_remove_file")}>
												<span>
													<IconButton
														size="small"
														aria-label={t("pd_remove_file")}
														disabled={busy}
														onClick={() =>
															setFiles((cur) =>
																cur.filter((x) => x.id !== f.id),
															)
														}
													>
														<DeleteIcon fontSize="small" />
													</IconButton>
												</span>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Paper>

				<Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
					<Button variant="contained" disabled={!canUpload} onClick={upload}>
						{t("pd_upload")}
					</Button>
					{busy && (
						<Button onClick={() => abortRef.current?.abort()}>
							{t("pd_cancel")}
						</Button>
					)}
					<Typography variant="body2" color="text.secondary">
						{t("pd_main_hint", { main: mainFile })}
					</Typography>
				</Box>

				<Box>
					<Box display="flex" alignItems="center">
						<Typography variant="h6" component="h2">
							{t("pd_log")}
						</Typography>
						<Box flex={1} />
						<Button size="small" onClick={clearLog} disabled={log.length === 0}>
							{t("clear")}
						</Button>
					</Box>
					{log.length === 0 ? (
						<Typography color="text.secondary">{t("pd_no_events")}</Typography>
					) : (
						<Box component="ul" sx={{ m: 0, pl: 2, fontFamily: "monospace" }}>
							{log.map((entry) => (
								<Typography
									component="li"
									key={entry.id}
									variant="body2"
									color={
										entry.severity === "error"
											? "error.main"
											: entry.severity === "success"
												? "success.main"
												: "text.primary"
									}
								>
									{new Date(entry.timestamp).toLocaleTimeString()} {entry.text}
								</Typography>
							))}
						</Box>
					)}
				</Box>
			</Box>
		</PageLayout>
	);
};

export default Pd;
