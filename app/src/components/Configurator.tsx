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
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../store/app";
import { useIOStore } from "../store/io";
import {
	beginWaitForConfigLoad,
	type MidiMessage,
	useMIDIStore,
} from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_GET_CONFIG,
} from "../store/midi.config";
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
	const selectedOutputId = useMIDIStore(
		(state) => state.selectedConfiguratorOutputDevice,
	);
	const setSelectedOutputId = useMIDIStore(
		(state) => state.setSelectedConfiguratorOutputDevice,
	);

	const saveToFile = useIOStore((state) => state.saveToFile);
	const loadFromFile = useIOStore((state) => state.loadFromFile);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [deployToast, setDeployToast] = useState<string | null>(null);
	const [deployToastSeverity, setDeployToastSeverity] = useState<
		"success" | "warning"
	>("success");
	const [deploying, setDeploying] = useState(false);
	const [loadingFromDevice, setLoadingFromDevice] = useState(false);

	const handleDeploy = async () => {
		const pinConfigs = inputs.length + outputs.length;
		const peerCount = peers.length;
		const rawOut = selectedOutputId ?? "";
		const isBroadcast = rawOut === "" || rawOut === "-1";

		setDeploying(true);
		try {
			const { resetAck } = await deployConfiguration(rawOut);
			if (isBroadcast) {
				setDeployToastSeverity("success");
				setDeployToast(t("deploy_toast_summary", { pinConfigs, peerCount }));
			} else if (resetAck) {
				setDeployToastSeverity("success");
				setDeployToast(
					t("deploy_toast_summary_reset_ok", { pinConfigs, peerCount }),
				);
			} else {
				setDeployToastSeverity("warning");
				setDeployToast(
					t("deploy_toast_summary_reset_timeout", { pinConfigs, peerCount }),
				);
			}
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
			} catch (err) {
				console.error("Failed to load JSON", err);
			}
		};
		reader.readAsText(file);
	};

	const handleClearConfiguration = () => {
		loadFromFile({});
	};

	const handleLoadFromDevice = async () => {
		const rawOut = selectedOutputId ?? "";
		if (!rawOut || rawOut === "-1") {
			setDeployToastSeverity("warning");
			setDeployToast(t("load_from_device_toast_no_device"));
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
				midiLoopback: result.midiLoopback,
				powerSave: result.powerSave,
			});
			setDeployToastSeverity("success");
			setDeployToast(
				t("load_from_device_toast_ok", {
					pinConfigs: result.inputs.length + result.outputs.length,
					peerCount: result.peers.length,
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
				{showHints && (
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
				<Accordion defaultExpanded={midiLoopback || powerSave}>
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
				<Accordion defaultExpanded={inputs.length > 0}>
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
				<Accordion defaultExpanded={outputs.length > 0}>
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
				<Accordion defaultExpanded={peers.length > 0}>
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
