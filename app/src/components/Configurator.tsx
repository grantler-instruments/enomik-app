import { ArrowDropDown } from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
	Alert,
	Box,
	Button,
	Container,
	IconButton,
	Snackbar,
	Tooltip,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useDevice } from "../hooks/useDevice";
import { useAppStore } from "../store/app";
import {
	supportsInspection,
	supportsLiveValues,
	useDeviceStore,
} from "../store/device";
import { findDuplicatePins, useIOStore } from "../store/io";
import {
	beginWaitForConfigLoad,
	isEnomikPortName,
	type MidiMessage,
	useMIDIStore,
} from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_GET_CONFIG,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK,
	ENOMIK_COMMAND_SET_NAME,
	ENOMIK_COMMAND_SET_POWER_SAVE,
	ENOMIK_ERROR_UNKNOWN_COMMAND,
} from "../store/midi.config";
import { useRawStreamStore } from "../store/rawStream";
import Globals from "./Globals";
import Inputs from "./Inputs";
import MidiDeviceChooser from "./MidiDeviceChooser";
import Outputs from "./Outputs";
import Peers from "./Peers";
import SectionHeader from "./SectionHeader";

const Configurator = () => {
	const { t } = useTranslation();
	const showHints = useAppStore((state) => state.showHints);
	const deployConfiguration = useIOStore((state) => state.deploy);
	const inputs = useIOStore((state) => state.inputs);
	const outputs = useIOStore((state) => state.outputs);
	const peers = useIOStore((state) => state.peers);
	const midiLoopback = useIOStore((state) => state.midiLoopback);
	const powerSave = useIOStore((state) => state.powerSave);
	const initialized = useMIDIStore((state) => state.initialized);
	const sendMessage = useMIDIStore((state) => state.sendMessage);
	const midiInputs = useMIDIStore((state) => state.inputs);
	const midiOutputs = useMIDIStore((state) => state.outputs);
	const selectedOutputId = useMIDIStore(
		(state) => state.selectedConfiguratorOutputDevice,
	);
	const deviceInfo = useDevice(selectedOutputId || "-1");
	const setSelectedOutputId = useMIDIStore(
		(state) => state.setSelectedConfiguratorOutputDevice,
	);
	const hasEnomikBoard = [...midiInputs, ...midiOutputs].some((port) =>
		isEnomikPortName(port.name),
	);

	const saveToFile = useIOStore((state) => state.saveToFile);
	const loadFromFile = useIOStore((state) => state.loadFromFile);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	const [deployToast, setDeployToast] = useState<string | null>(null);
	const [deployToastSeverity, setDeployToastSeverity] = useState<
		"success" | "warning" | "error"
	>("success");
	const [deploying, setDeploying] = useState(false);
	const [loadingFromDevice, setLoadingFromDevice] = useState(false);
	const [globalOpen, setGlobalOpen] = useState(() => {
		const s = useIOStore.getState();
		return s.midiLoopback || s.powerSave || s.name !== "";
	});
	const [inputsOpen, setInputsOpen] = useState(
		() => useIOStore.getState().inputs.length > 0,
	);
	const [outputsOpen, setOutputsOpen] = useState(
		() => useIOStore.getState().outputs.length > 0,
	);
	const [peersOpen, setPeersOpen] = useState(
		() => useIOStore.getState().peers.length > 0,
	);

	const syncSectionOpen = (cfg: {
		inputsCount: number;
		outputsCount: number;
		peersCount: number;
		midiLoopback: boolean;
		powerSave: boolean;
		name: string;
	}) => {
		setGlobalOpen(cfg.midiLoopback || cfg.powerSave || cfg.name !== "");
		setInputsOpen(cfg.inputsCount > 0);
		setOutputsOpen(cfg.outputsCount > 0);
		setPeersOpen(cfg.peersCount > 0);
	};

	const handleDeploy = async () => {
		// The firmware keeps one config per pin: a duplicate would silently overwrite another row.
		const duplicatePins = findDuplicatePins(inputs, outputs);
		if (duplicatePins.size > 0) {
			setDeployToastSeverity("error");
			setDeployToast(
				t("deploy_toast_duplicate_pins", {
					pins: [...duplicatePins].sort((x, y) => x - y).join(", "),
				}),
			);
			return;
		}

		const pinConfigs = inputs.length + outputs.length;
		const peerCount = peers.length;
		const rawOut = selectedOutputId ?? "";
		const isBroadcast = rawOut === "" || rawOut === "-1";
		const toastGlobals = {
			pinConfigs,
			peerCount,
			midiLoopback: t(midiLoopback ? "state_on" : "state_off"),
			powerSave: t(powerSave ? "state_on" : "state_off"),
		};

		// Deploy starts with RESET, which ends the raw stream on the device, and a
		// keepalive between RESET and the new pin configs would fail. Pause, then resume.
		const rawStream = useRawStreamStore.getState();
		const wasStreaming = rawStream.active;
		rawStream.setActive(false);

		setDeploying(true);
		try {
			const { resetAck, sysexErrors, nameSkipped, globalsSkipped } =
				await deployConfiguration(rawOut);
			// Only resume if the user is still on the Configurator.
			if (
				wasStreaming &&
				resetAck &&
				sysexErrors.length === 0 &&
				mountedRef.current &&
				useMIDIStore.getState().selectedConfiguratorOutputDevice === rawOut &&
				useDeviceStore.getState().devices[rawOut]?.status === "ready" &&
				supportsLiveValues(useDeviceStore.getState().devices[rawOut]?.version)
			) {
				rawStream.clear();
				rawStream.setActive(true);
			}
			const globalsUnsupported = sysexErrors.find(
				(err) =>
					err.errorCode === ENOMIK_ERROR_UNKNOWN_COMMAND &&
					(err.failedRequest === ENOMIK_COMMAND_SET_MIDI_LOOPBACK ||
						err.failedRequest === ENOMIK_COMMAND_SET_POWER_SAVE),
			);
			const nameUnsupported = sysexErrors.find(
				(err) =>
					err.errorCode === ENOMIK_ERROR_UNKNOWN_COMMAND &&
					err.failedRequest === ENOMIK_COMMAND_SET_NAME,
			);

			if (globalsSkipped) {
				toastGlobals.midiLoopback = t("compat_unavailable");
				toastGlobals.powerSave = t("compat_unavailable");
			}
			let summary: string;
			if (isBroadcast) {
				summary = t("deploy_toast_summary", toastGlobals);
			} else if (resetAck) {
				summary = t("deploy_toast_summary_reset_ok", toastGlobals);
			} else {
				summary = t("deploy_toast_summary_reset_timeout", toastGlobals);
			}

			if (globalsUnsupported) {
				setDeployToastSeverity("warning");
				setDeployToast(
					`${summary} ${t("deploy_toast_globals_unsupported", {
						version: `${globalsUnsupported.major}.${globalsUnsupported.minor}`,
					})}`,
				);
			} else if (nameUnsupported) {
				setDeployToastSeverity("warning");
				setDeployToast(
					`${summary} ${t("deploy_toast_name_unsupported", {
						version: `${nameUnsupported.major}.${nameUnsupported.minor}`,
					})}`,
				);
			} else if (nameSkipped || globalsSkipped) {
				setDeployToastSeverity("warning");
				setDeployToast(
					[
						summary,
						globalsSkipped && t("compat_globals_skipped"),
						nameSkipped && t("compat_name_skipped"),
					]
						.filter(Boolean)
						.join(" "),
				);
			} else if (isBroadcast || resetAck) {
				setDeployToastSeverity("success");
				setDeployToast(summary);
			} else {
				setDeployToastSeverity("warning");
				setDeployToast(summary);
			}
		} catch (error) {
			setDeployToastSeverity("error");
			setDeployToast(
				t(
					error instanceof Error && error.message.startsWith("compat_")
						? error.message
						: "compat_deploy_failed",
				),
			);
		} finally {
			setDeploying(false);
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const json = JSON.parse(event.target?.result as string);
				loadFromFile(json);
				syncSectionOpen({
					inputsCount: json.inputs?.length ?? 0,
					outputsCount: json.outputs?.length ?? 0,
					peersCount: json.peers?.length ?? 0,
					midiLoopback: json.midiLoopback ?? false,
					powerSave: json.powerSave ?? false,
					name: json.name ?? "",
				});
			} catch (err) {
				console.error("Failed to load JSON", err);
			}
		};
		reader.readAsText(file);
	};

	const handleClearConfiguration = () => {
		loadFromFile({});
		syncSectionOpen({
			inputsCount: 0,
			outputsCount: 0,
			peersCount: 0,
			midiLoopback: false,
			powerSave: false,
			name: "",
		});
	};

	const handleLoadFromDevice = async () => {
		const rawOut = selectedOutputId ?? "";
		if (!rawOut || rawOut === "-1") {
			setDeployToastSeverity("warning");
			setDeployToast(t("load_from_device_toast_no_device"));
			return;
		}

		if (deviceInfo?.status !== "ready") {
			setDeployToastSeverity("warning");
			setDeployToast(
				t(
					deviceInfo?.status && deviceInfo.status !== "checking"
						? `compat_${deviceInfo.status}`
						: "compat_checking",
				),
			);
			return;
		}
		if (!supportsInspection(deviceInfo.version)) {
			setDeployToastSeverity("warning");
			setDeployToast(t("compat_inspection_unsupported"));
			return;
		}
		setLoadingFromDevice(true);
		try {
			const waitPromise = beginWaitForConfigLoad(rawOut, 5000);
			const msg: MidiMessage = {
				id: uuidv4(),
				timestamp: Date.now(),
				type: 240,
				data: buildEnomikSysex(ENOMIK_COMMAND_GET_CONFIG),
			};
			sendMessage(msg, rawOut);

			const result = await waitPromise;
			if (
				useMIDIStore.getState().selectedConfiguratorOutputDevice !== rawOut ||
				!mountedRef.current
			)
				return;
			if (!result) {
				setDeployToastSeverity("warning");
				setDeployToast(t("load_from_device_toast_timeout"));
				return;
			}

			loadFromFile({
				inputs: result.inputs as Parameters<typeof loadFromFile>[0]["inputs"],
				outputs: result.outputs as Parameters<
					typeof loadFromFile
				>[0]["outputs"],
				peers: result.peers,
				midiLoopback: result.midiLoopback ?? useIOStore.getState().midiLoopback,
				powerSave: result.powerSave ?? useIOStore.getState().powerSave,
				name: result.name ?? "",
			});
			syncSectionOpen({
				inputsCount: result.inputs.length,
				outputsCount: result.outputs.length,
				peersCount: result.peers.length,
				midiLoopback: result.midiLoopback ?? useIOStore.getState().midiLoopback,
				powerSave: result.powerSave ?? useIOStore.getState().powerSave,
				name: result.name ?? "",
			});
			setDeployToastSeverity("success");
			setDeployToast(
				t("load_from_device_toast_ok", {
					pinConfigs: result.inputs.length + result.outputs.length,
					peerCount: result.peers.length,
					midiLoopback: t(
						result.midiLoopback === null
							? "compat_unavailable"
							: result.midiLoopback
								? "state_on"
								: "state_off",
					),
					powerSave: t(
						result.powerSave === null
							? "compat_unavailable"
							: result.powerSave
								? "state_on"
								: "state_off",
					),
				}),
			);
		} finally {
			setLoadingFromDevice(false);
		}
	};

	return (
		<Box display={"flex"} flexDirection={"column"} gap={1} marginBottom={2}>
			<Box
				display={"flex"}
				alignItems={"center"}
				gap={2}
				mb={2}
				pl={2}
				pr={2}
				py={2}
				sx={{
					position: "sticky",
					top: 0,
					zIndex: (theme) => theme.zIndex.appBar,
					backgroundColor: "background.default",
				}}
			>
				{/* Hidden file input */}
				<input
					type="file"
					accept="application/json"
					style={{ display: "none" }}
					ref={fileInputRef}
					onChange={handleFileChange}
				/>
				<Tooltip title={t("tooltip_save_configuration_to_file") || ""}>
					<IconButton color="inherit" onClick={saveToFile}>
						<DownloadIcon />
					</IconButton>
				</Tooltip>

				<Tooltip title={t("tooltip_load_configuration_from_file") || ""}>
					<IconButton color="inherit" onClick={handleUploadClick}>
						<FolderOpenIcon />
					</IconButton>
				</Tooltip>

				<Tooltip title={t("tooltip_clear_configuration") || ""}>
					<IconButton color="inherit" onClick={handleClearConfiguration}>
						<ClearAllIcon />
					</IconButton>
				</Tooltip>

				<Tooltip title={t("tooltip_load_configuration_from_device") || ""}>
					<span>
						<IconButton
							color="inherit"
							onClick={handleLoadFromDevice}
							disabled={!initialized || loadingFromDevice || deploying}
						>
							<DevicesOtherIcon />
						</IconButton>
					</span>
				</Tooltip>

				<Box flex={1} />
				<MidiDeviceChooser
					value={selectedOutputId || ""}
					onChange={setSelectedOutputId}
				/>

				<Button
					variant="contained"
					color="primary"
					onClick={handleDeploy}
					disabled={!initialized || deploying}
				>
					{t("deploy")}
				</Button>
			</Box>
			<Container maxWidth="xl">
				{showHints && !hasEnomikBoard && (
					<Box mb={8} display={"flex"} flexDirection={"column"} gap={2}>
						<Alert severity="info" sx={{ mb: 2 }}>
							{t("configurator_info")}
						</Alert>
						<Box>
							<Button variant="outlined" component={NavLink} to={"/uploader"}>
								{t("firmware_uploader")}
							</Button>
						</Box>
					</Box>
				)}
				<Accordion
					expanded={globalOpen}
					onChange={(_, open) => setGlobalOpen(open)}
				>
					<AccordionSummary
						expandIcon={<ArrowDropDownIcon />}
						aria-controls="global-content"
					>
						<SectionHeader
							title={t("section_global")}
							tooltipKey="tooltip_global"
						/>
					</AccordionSummary>
					<AccordionDetails>
						<Globals />
					</AccordionDetails>
				</Accordion>
				<Accordion
					expanded={inputsOpen}
					onChange={(_, open) => setInputsOpen(open)}
				>
					<AccordionSummary
						expandIcon={<ArrowDropDownIcon />}
						aria-controls="inputs-content"
					>
						<SectionHeader
							title={t("section_input_pin_to_midi")}
							tooltipKey="tooltip_pin_to_midi"
						/>
					</AccordionSummary>
					<AccordionDetails>
						<Inputs></Inputs>
					</AccordionDetails>
				</Accordion>
				<Accordion
					expanded={outputsOpen}
					onChange={(_, open) => setOutputsOpen(open)}
				>
					<AccordionSummary
						expandIcon={<ArrowDropDown />}
						aria-controls="outputs-content"
					>
						<SectionHeader
							title={t("section_midi_to_output_pin")}
							tooltipKey="tooltip_midi_to_pin"
						/>
					</AccordionSummary>
					<AccordionDetails>
						<Outputs></Outputs>
					</AccordionDetails>
				</Accordion>
				<Accordion
					expanded={peersOpen}
					onChange={(_, open) => setPeersOpen(open)}
				>
					<AccordionSummary
						expandIcon={<ArrowDropDown />}
						aria-controls="wireless-midi-content"
					>
						<SectionHeader
							title={t("section_wireless_midi")}
							tooltipKey="tooltip_wireless_midi"
						/>
					</AccordionSummary>
					<AccordionDetails>
						<Peers></Peers>
					</AccordionDetails>
				</Accordion>
			</Container>
			<Box flex={1}></Box>
			<Snackbar
				open={deployToast !== null}
				autoHideDuration={8000}
				onClose={() => setDeployToast(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert
					onClose={() => setDeployToast(null)}
					severity={deployToastSeverity}
					variant="filled"
					sx={{ width: "100%" }}
				>
					{deployToast}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default Configurator;
