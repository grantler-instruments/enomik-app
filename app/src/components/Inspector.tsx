import {
	Alert,
	Box,
	Button,
	FormControlLabel,
	Switch,
	Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../store/app";
import { useInspectorStore } from "../store/inspector";
import { type MidiMessage, useMIDIStore } from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_GET_CONFIG,
} from "../store/midi.config";
import MacAddressInput from "./MacAddressInput";
import MidiDeviceChooser from "./MidiDeviceChooser";
import PinMapping from "./pinmapping/PinMapping";

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
	const clear = useInspectorStore((state) => state.clear);
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
					disabled={!initialized}
					onClick={() => {
						clear();
						// GET_CONFIG streams 0x44 pins + 0x48 peers + 0x4E loopback + 0x50 power-save + empty 0x4C done
						const msg: MidiMessage = {
							id: uuidv4(),
							type: 240,
							channel: 1,
							data: buildEnomikSysex(ENOMIK_COMMAND_GET_CONFIG),
							timestamp: Date.now(),
						};
						sendMessage(msg);
					}}
				>
					{t("inspector_sync")}
				</Button>
			</Box>
			<Box>
				<Typography variant="h2">{t("inspector_global")}</Typography>
				<FormControlLabel
					control={<Switch checked={midiLoopback} disabled />}
					label={t("midi_loopback")}
				/>
				<FormControlLabel
					control={<Switch checked={powerSave} disabled />}
					label={t("power_save")}
				/>
			</Box>
			<Box>
				<Typography variant="h2">{t("inspector_input_to_midi")}</Typography>
				{inputPinConfigs.map((config) => (
					<PinMapping
						key={`input-${config.uuid}`}
						config={config}
						type={"input"}
						disabled={true}
					></PinMapping>
				))}
			</Box>
			<Box>
				<Typography variant="h2">{t("inspector_midi_to_output")}</Typography>
				{outputPinConfigs.map((config) => (
					<PinMapping
						key={`output-${config.uuid}`}
						config={config}
						type={"output"}
						disabled={true}
					></PinMapping>
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
