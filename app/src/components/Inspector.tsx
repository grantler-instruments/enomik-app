import {
	Alert,
	Box,
	Button,
	FormControlLabel,
	Switch,
	Typography,
} from "@mui/material";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useDevice } from "../hooks/useDevice";
import { useAppStore } from "../store/app";
import { supportsInspection, thresholdUnit } from "../store/device";
import { useInspectorStore } from "../store/inspector";
import {
	beginWaitForConfigLoad,
	type MidiMessage,
	useMIDIStore,
} from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_GET_CONFIG,
	ENOMIK_COMMAND_GET_MAC,
} from "../store/midi.config";
import RawValues, { DeviceCompatibility } from "./inspector/RawValues";
import MacAddressInput from "./MacAddressInput";
import MidiDeviceChooser from "./MidiDeviceChooser";
import PinRow, {
	hasPwmOutput,
	hasTouchInput,
	PinTableHeader,
} from "./pinmapping/PinRow";

const Inspector = () => {
	const { t } = useTranslation();
	const device = useMIDIStore((state) => state.selectedInspectorOutputDevice);
	const setDevice = useMIDIStore(
		(state) => state.setSelectedInspectorOutputDevice,
	);
	const initialized = useMIDIStore((state) => state.initialized);
	const sendMessage = useMIDIStore((state) => state.sendMessage);
	const peers = useInspectorStore((state) => state.peers);
	const inputPinConfigs = useInspectorStore((state) => state.inputPinConfigs);
	const outputPinConfigs = useInspectorStore((state) => state.outputPinConfigs);
	const midiLoopback = useInspectorStore((state) => state.midiLoopback);
	const powerSave = useInspectorStore((state) => state.powerSave);
	const macAddress = useInspectorStore((state) => state.macAddress);
	const info = useDevice(device || "-1");
	const protocolVersion = info?.version
		? [info.version.major, info.version.minor, info.version.patch]
				.filter((part) => part !== undefined)
				.join(".")
		: null;
	const syncing = useInspectorStore((state) => state.syncing);
	const syncError = useInspectorStore((state) => state.syncError);
	const name = useInspectorStore((state) => state.name);
	const clear = useInspectorStore((state) => state.clear);
	const syncRequest = useRef(0);
	useEffect(() => {
		clear();
		return () => {
			syncRequest.current++;
			clear();
		};
	}, [clear]);
	const showHints = useAppStore((state) => state.showHints);
	return (
		<Box display={"flex"} flexDirection="column" gap={2} padding={2}>
			{showHints && (
				<Alert severity="info" sx={{ mb: 2 }}>
					{t("inspector_info")}
				</Alert>
			)}
			<Box display={"flex"} flex={1} gap={2}>
				<MidiDeviceChooser
					value={device || ""}
					onChange={(e) => setDevice(e)}
				></MidiDeviceChooser>
				<Button
					variant="outlined"
					color="primary"
					disabled={
						!initialized ||
						syncing ||
						info?.status !== "ready" ||
						!supportsInspection(info.version)
					}
					onClick={async () => {
						if (!device || device === "-1") return;
						const request = ++syncRequest.current;
						clear();
						useInspectorStore.setState({ deviceId: device, syncing: true });
						const wait = beginWaitForConfigLoad(device, 5000);
						for (const command of [
							ENOMIK_COMMAND_GET_MAC,
							ENOMIK_COMMAND_GET_CONFIG,
						]) {
							const msg: MidiMessage = {
								id: uuidv4(),
								type: 240,
								channel: 1,
								data: buildEnomikSysex(command),
								timestamp: Date.now(),
							};
							sendMessage(msg, device);
						}
						const result = await wait;
						if (
							request === syncRequest.current &&
							useInspectorStore.getState().deviceId === device
						) {
							useInspectorStore.setState({
								syncing: false,
								syncError: result === null,
							});
						}
					}}
				>
					{t("inspector_sync")}
				</Button>
			</Box>
			<DeviceCompatibility device={device || "-1"} inspection />
			{syncing && <Typography>{t("compat_syncing")}</Typography>}
			{syncError && <Alert severity="warning">{t("compat_sync_failed")}</Alert>}
			<Box>
				<Typography variant="h2">{t("inspector_global")}</Typography>
				<Typography>
					{t("client_name")}: {name ?? t("compat_unavailable")}
				</Typography>
				<Typography>
					{t("inspector_mac_address")}: {macAddress ?? "–"}
				</Typography>
				<Typography>
					{t("inspector_protocol_version")}: {protocolVersion ?? "–"}
				</Typography>
				<FormControlLabel
					control={<Switch checked={midiLoopback ?? false} disabled />}
					label={`${t("midi_loopback")}${midiLoopback === null ? `: ${t("compat_unavailable")}` : ""}`}
				/>
				<FormControlLabel
					control={<Switch checked={powerSave ?? false} disabled />}
					label={`${t("power_save")}${powerSave === null ? `: ${t("compat_unavailable")}` : ""}`}
				/>
			</Box>
			<Box>
				<Typography variant="h2">{t("inspector_input_to_midi")}</Typography>
				{inputPinConfigs.length > 0 && (
					<PinTableHeader
						type="input"
						showThreshold={hasTouchInput(inputPinConfigs)}
					/>
				)}
				{inputPinConfigs.map((config, index) => (
					<PinRow
						key={`input-${config.pin}`}
						config={config}
						type="input"
						index={index}
						showThreshold={hasTouchInput(inputPinConfigs)}
						thresholdUnit={thresholdUnit(info?.version)}
						readOnly
					/>
				))}
			</Box>
			{hasTouchInput(inputPinConfigs) && <RawValues device={device || "-1"} />}
			<Box>
				<Typography variant="h2">{t("inspector_midi_to_output")}</Typography>
				{outputPinConfigs.length > 0 && (
					<PinTableHeader
						type="output"
						showPwmRange={hasPwmOutput(outputPinConfigs)}
					/>
				)}
				{outputPinConfigs.map((config, index) => (
					<PinRow
						key={`output-${config.pin}`}
						config={config}
						type="output"
						index={index}
						showPwmRange={hasPwmOutput(outputPinConfigs)}
						thresholdUnit={thresholdUnit(info?.version)}
						readOnly
					/>
				))}
			</Box>
			<Box>
				<Typography variant="h2">{t("inspector_esp_now_midi")}</Typography>
				{peers.map((peer) => (
					<MacAddressInput
						key={peer}
						macAddress={peer}
						disabled={true}
						onMacAddressChange={() => {}}
					></MacAddressInput>
				))}
			</Box>
		</Box>
	);
};

export default Inspector;
