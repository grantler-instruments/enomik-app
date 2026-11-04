import ClearAllIcon from "@mui/icons-material/ClearAll";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useDevice, useDeviceKind } from "../hooks/useDevice";
import { useToast } from "../hooks/useToast";
import { useAccordionOpen } from "../store/app";
import {
	type DeviceKind,
	dongleConfigBlocker,
	supportsInspection,
	supportsLiveValues,
	useDeviceStore,
} from "../store/device";
import {
	activeConfigs,
	configFromFile,
	findDuplicatePins,
	findInvalidPeers,
	useDongleIOStore,
	useIOStore,
} from "../store/io";
import {
	beginWaitForConfigLoad,
	isEnomikPortName,
	kindChange,
	type MidiMessage,
	useMIDIStore,
} from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_GET_ALL_PEERS,
	ENOMIK_COMMAND_GET_CONFIG,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK,
	ENOMIK_COMMAND_SET_NAME,
	ENOMIK_COMMAND_SET_POWER_SAVE,
	ENOMIK_ERROR_UNKNOWN_COMMAND,
} from "../store/midi.config";
import { useRawStreamStore } from "../store/rawStream";
import CollapsibleSection from "./common/CollapsibleSection";
import BoardView from "./configurator/BoardView";
import DeviceKindChooser from "./DeviceKindChooser";
import Globals from "./Globals";
import Inputs from "./Inputs";
import PageLayout from "./layout/PageLayout";
import MidiDeviceChooser from "./MidiDeviceChooser";
import Outputs from "./Outputs";
import Peers from "./Peers";
import SectionHeader from "./SectionHeader";
import {
	GlobalIcon,
	MidiToPinIcon,
	PinToMidiIcon,
	WirelessMidiIcon,
} from "./SectionIcons";

/** `embedded`: without page chrome, toolbar inline (used in the tutorial). */
const Configurator = ({ embedded = false }: { embedded?: boolean }) => {
	const { t } = useTranslation();
	const selectedOutputId = useMIDIStore(
		(state) => state.selectedConfiguratorOutputDevice,
	);
	const isDongle = useDeviceKind(selectedOutputId || "-1") === "dongle";
	// Client and dongle configs are separate stores. Both are zustand hooks,
	// so swapping them keeps the hook order.
	const useConfig: typeof useIOStore = isDongle ? useDongleIOStore : useIOStore;
	const deployConfiguration = useConfig((state) => state.deploy);
	const inputs = useConfig((state) => state.inputs);
	const outputs = useConfig((state) => state.outputs);
	const peers = useConfig((state) => state.peers);
	const midiLoopback = useConfig((state) => state.midiLoopback);
	const powerSave = useConfig((state) => state.powerSave);
	const initialized = useMIDIStore((state) => state.initialized);
	const sendMessage = useMIDIStore((state) => state.sendMessage);
	const midiInputs = useMIDIStore((state) => state.inputs);
	const midiOutputs = useMIDIStore((state) => state.outputs);
	const deviceInfo = useDevice(selectedOutputId || "-1");
	const setSelectedOutputId = useMIDIStore(
		(state) => state.setSelectedConfiguratorOutputDevice,
	);
	const hasSelectedOutput = midiOutputs.some(
		(port) => port.id === selectedOutputId && port.state !== "disconnected",
	);
	const hasEnomikBoard = [...midiInputs, ...midiOutputs].some((port) =>
		isEnomikPortName(port.name),
	);

	const saveToFile = useConfig((state) => state.saveToFile);
	const loadFromFile = useConfig((state) => state.loadFromFile);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	const { showToast, toast } = useToast();
	const [deploying, setDeploying] = useState(false);
	const [loadingFromDevice, setLoadingFromDevice] = useState(false);
	const [globalOpen, setGlobalOpen] = useAccordionOpen(
		"configurator_global",
		() => {
			const s = useConfig.getState();
			return s.midiLoopback || s.powerSave || s.name !== "";
		},
	);
	const [boardOpen, setBoardOpen] = useAccordionOpen(
		"configurator_board",
		true,
	);
	const [inputsOpen, setInputsOpen] = useAccordionOpen(
		"configurator_inputs",
		false,
	);
	const [outputsOpen, setOutputsOpen] = useAccordionOpen(
		"configurator_outputs",
		false,
	);
	const [peersOpen, setPeersOpen] = useAccordionOpen(
		"configurator_peers",
		() => useConfig.getState().peers.length > 0,
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

	const setKind = useDeviceStore((state) => state.setKind);
	// Picking a kind picks a matching port; picking a port sets the kind (store)
	const handleKindChange = (kind: DeviceKind) => {
		const change = kindChange(kind, selectedOutputId, midiOutputs);
		if (change.type === "switch") {
			setSelectedOutputId(change.port.id);
			showToast(t("port_switched", { port: change.port.name }), "info");
			return;
		}
		const current = midiOutputs.find((port) => port.id === selectedOutputId);
		if (current) setKind(current.id, kind);
		if (change.type === "none") {
			showToast(
				t(current ? "port_kind_not_found" : "port_kind_not_found_none", {
					kind: t(`device_kind_${kind}`),
					port: current?.name,
				}),
				"warning",
			);
		}
	};

	const handleDeploy = async () => {
		const dongleBlocker = isDongle ? dongleConfigBlocker(deviceInfo) : null;
		if (dongleBlocker) {
			showToast(t(dongleBlocker), "warning");
			return;
		}
		// ADD_PEER needs all six bytes; a half typed MAC would send garbage.
		const invalidPeers = findInvalidPeers(peers);
		if (invalidPeers.length > 0) {
			showToast(
				t("deploy_toast_invalid_peer", {
					macs: invalidPeers.map((peer) => peer.macAddress || "–").join(", "),
				}),
				"error",
			);
			return;
		}
		// The firmware keeps one config per pin: a duplicate would silently overwrite another row.
		const duplicatePins = isDongle
			? new Set<number>()
			: findDuplicatePins(inputs, outputs);
		if (duplicatePins.size > 0) {
			showToast(
				t("deploy_toast_duplicate_pins", {
					pins: [...duplicatePins].sort((x, y) => x - y).join(", "),
				}),
				"error",
			);
			return;
		}

		const pinConfigs = isDongle
			? 0
			: activeConfigs(inputs).length + activeConfigs(outputs).length;
		const peerCount = peers.length;
		if (!selectedOutputId || !hasSelectedOutput) return;
		const rawOut = selectedOutputId;
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
				await deployConfiguration(rawOut, isDongle ? "dongle" : "client");
			// Only resume if the user is still on the Configurator.
			if (
				wasStreaming &&
				!isDongle &&
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
			const summaryKey = isDongle
				? "deploy_toast_dongle_summary"
				: "deploy_toast_summary";
			const summary = t(
				`${summaryKey}_${resetAck ? "reset_ok" : "reset_timeout"}`,
				toastGlobals,
			);

			if (globalsUnsupported) {
				showToast(
					`${summary} ${t("deploy_toast_globals_unsupported", {
						version: `${globalsUnsupported.major}.${globalsUnsupported.minor}`,
					})}`,
					"warning",
				);
			} else if (nameUnsupported) {
				showToast(
					`${summary} ${t("deploy_toast_name_unsupported", {
						version: `${nameUnsupported.major}.${nameUnsupported.minor}`,
					})}`,
					"warning",
				);
			} else if (nameSkipped || globalsSkipped) {
				showToast(
					[
						summary,
						globalsSkipped && t("compat_globals_skipped"),
						nameSkipped && t("compat_name_skipped"),
					]
						.filter(Boolean)
						.join(" "),
					"warning",
				);
			} else if (resetAck) {
				showToast(summary, "success");
			} else {
				showToast(summary, "warning");
			}
		} catch (error) {
			showToast(
				t(
					error instanceof Error && error.message.startsWith("compat_")
						? error.message
						: "compat_deploy_failed",
				),
				"error",
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
		// Lets the same file be picked again, e.g. after switching kind
		e.target.value = "";
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const kind = isDongle ? "dongle" : "client";
				const loaded = configFromFile(
					JSON.parse(event.target?.result as string),
					kind,
				);
				if ("mismatch" in loaded) {
					showToast(
						t("load_from_file_kind_mismatch", {
							file: t(`device_kind_${loaded.mismatch}`),
							selected: t(`device_kind_${kind}`),
						}),
						"warning",
					);
					return;
				}
				const { config } = loaded;
				loadFromFile(config);
				syncSectionOpen({
					inputsCount: config.inputs?.length ?? 0,
					outputsCount: config.outputs?.length ?? 0,
					peersCount: config.peers?.length ?? 0,
					midiLoopback: config.midiLoopback ?? false,
					powerSave: config.powerSave ?? false,
					name: config.name ?? "",
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
			showToast(t("load_from_device_toast_no_device"), "warning");
			return;
		}

		const dongleBlocker = isDongle ? dongleConfigBlocker(deviceInfo) : null;
		if (dongleBlocker) {
			showToast(t(dongleBlocker), "warning");
			return;
		}
		if (deviceInfo?.status !== "ready") {
			showToast(
				t(
					deviceInfo?.status && deviceInfo.status !== "checking"
						? `compat_${deviceInfo.status}`
						: "compat_checking",
				),
				"warning",
			);
			return;
		}
		if (!supportsInspection(deviceInfo.version)) {
			showToast(t("compat_inspection_unsupported"), "warning");
			return;
		}
		setLoadingFromDevice(true);
		try {
			const waitPromise = beginWaitForConfigLoad(
				rawOut,
				5000,
				isDongle ? "peers" : "config",
			);
			const msg: MidiMessage = {
				id: uuidv4(),
				timestamp: Date.now(),
				type: 240,
				data: buildEnomikSysex(
					isDongle ? ENOMIK_COMMAND_GET_ALL_PEERS : ENOMIK_COMMAND_GET_CONFIG,
				),
			};
			sendMessage(msg, rawOut);

			const result = await waitPromise;
			if (
				useMIDIStore.getState().selectedConfiguratorOutputDevice !== rawOut ||
				!mountedRef.current
			)
				return;
			if (!result) {
				showToast(t("load_from_device_toast_timeout"), "warning");
				return;
			}
			if (isDongle) {
				loadFromFile({ peers: result.peers });
				setPeersOpen(result.peers.length > 0);
				showToast(
					t("load_from_device_toast_dongle_ok", {
						peerCount: result.peers.length,
					}),
					"success",
				);
				return;
			}

			loadFromFile({
				inputs: result.inputs as Parameters<typeof loadFromFile>[0]["inputs"],
				outputs: result.outputs as Parameters<
					typeof loadFromFile
				>[0]["outputs"],
				peers: result.peers,
				midiLoopback: result.midiLoopback ?? useConfig.getState().midiLoopback,
				powerSave: result.powerSave ?? useConfig.getState().powerSave,
				name: result.name ?? "",
			});
			syncSectionOpen({
				inputsCount: result.inputs.length,
				outputsCount: result.outputs.length,
				peersCount: result.peers.length,
				midiLoopback: result.midiLoopback ?? useConfig.getState().midiLoopback,
				powerSave: result.powerSave ?? useConfig.getState().powerSave,
				name: result.name ?? "",
			});
			showToast(
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
				"success",
			);
		} finally {
			setLoadingFromDevice(false);
		}
	};

	const toolbar = (
		<>
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

			{/* The span keeps the tooltip on a disabled button; the label goes on
			    the button itself (describeChild), not on the span. */}
			<Tooltip
				title={t("tooltip_load_configuration_from_device") || ""}
				describeChild
			>
				<span>
					<IconButton
						color="inherit"
						aria-label={t("tooltip_load_configuration_from_device")}
						onClick={handleLoadFromDevice}
						disabled={!initialized || loadingFromDevice || deploying}
					>
						<DevicesOtherIcon />
					</IconButton>
				</span>
			</Tooltip>

			<Tooltip title={t("tooltip_pin_modes")}>
				<IconButton color="inherit" component={NavLink} to="/kits">
					<SettingsInputComponentIcon />
				</IconButton>
			</Tooltip>

			<Box flex={1} />
			<DeviceKindChooser
				deviceId={selectedOutputId || "-1"}
				onChange={handleKindChange}
			/>
			<MidiDeviceChooser
				value={selectedOutputId || ""}
				onChange={setSelectedOutputId}
			/>

			<Button
				variant="contained"
				color="primary"
				onClick={handleDeploy}
				disabled={!initialized || deploying || !hasSelectedOutput}
			>
				{t("deploy")}
			</Button>
		</>
	);
	const body = (
		<>
			{!isDongle && (
				<>
					<CollapsibleSection
						id="global"
						expanded={globalOpen}
						onChange={setGlobalOpen}
						title={
							<SectionHeader
								component="span"
								title={t("section_global")}
								icon={<GlobalIcon />}
								tooltipKey="tooltip_global"
							/>
						}
					>
						<Globals />
					</CollapsibleSection>
					<CollapsibleSection
						id="board"
						expanded={boardOpen}
						onChange={setBoardOpen}
						unmountOnExit
						title={
							<SectionHeader
								component="span"
								title={t("section_board")}
								icon={<DeveloperBoardIcon />}
							/>
						}
					>
						<BoardView />
					</CollapsibleSection>
					<CollapsibleSection
						id="inputs"
						expanded={inputsOpen}
						onChange={setInputsOpen}
						title={
							<SectionHeader
								component="span"
								title={t("section_input_pin_to_midi")}
								icon={<PinToMidiIcon />}
								tooltipKey="tooltip_pin_to_midi"
							/>
						}
					>
						<Inputs></Inputs>
					</CollapsibleSection>
					<CollapsibleSection
						id="outputs"
						expanded={outputsOpen}
						onChange={setOutputsOpen}
						title={
							<SectionHeader
								component="span"
								title={t("section_midi_to_output_pin")}
								icon={<MidiToPinIcon />}
								tooltipKey="tooltip_midi_to_pin"
							/>
						}
					>
						<Outputs></Outputs>
					</CollapsibleSection>
				</>
			)}
			<CollapsibleSection
				id="wireless-midi"
				expanded={isDongle || peersOpen}
				onChange={setPeersOpen}
				title={
					<SectionHeader
						component="span"
						title={t("section_wireless_midi")}
						icon={<WirelessMidiIcon />}
						tooltipKey="tooltip_wireless_midi"
					/>
				}
			>
				<Peers store={useConfig}></Peers>
			</CollapsibleSection>
			{toast}
		</>
	);
	if (embedded) {
		return (
			<>
				<Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
					{toolbar}
				</Box>
				{body}
			</>
		);
	}
	return (
		<PageLayout
			title={t("configurator")}
			maxWidth="xl"
			info={hasEnomikBoard ? undefined : t("configurator_info")}
			infoAction={
				<Button
					color="inherit"
					size="small"
					component={NavLink}
					to={"/uploader"}
				>
					{t("firmware_uploader")}
				</Button>
			}
			actions={toolbar}
		>
			{body}
		</PageLayout>
	);
};

export default Configurator;
