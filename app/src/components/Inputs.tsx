import { Alert, Box, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRawStream } from "../hooks/useRawStream";
import { useAppStore } from "../store/app";
import { useIOStore } from "../store/io";
import { useMIDIStore } from "../store/midi";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
} from "../store/midi.config";
import { useRawStreamStore } from "../store/rawStream";
import AddRowButton from "./AddRowButton";
import { CompactRawValue, RawStreamToggle } from "./inspector/RawValues";
import PinMapping from "./pinmapping/PinMapping";

const Inputs = () => {
	const inputs = useIOStore((state) => state.inputs);
	const addInput = useIOStore((state) => state.addInput);
	const showHints = useAppStore((state) => state.showHints);
	const initialized = useMIDIStore((state) => state.initialized);
	const device = useMIDIStore(
		(state) => state.selectedConfiguratorOutputDevice,
	);
	const streaming = useRawStreamStore((state) => state.active);
	const rawValues = useRawStreamStore((state) => state.values);
	const [hovered, setHovered] = useState(false);
	const { t } = useTranslation();

	// The stream needs one specific device; it can't run on broadcast.
	const isBroadcast = !device || device === "-1";
	useRawStream(device || "-1");

	return (
		<Box
			display={"flex"}
			flexDirection={"column"}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{showHints && (
				<Alert severity="info" sx={{ mb: 2 }}>
					{t("tooltip_pin_to_midi")}
				</Alert>
			)}
			<Box>
				<RawStreamToggle disabled={!initialized || isBroadcast} />
				{isBroadcast && (
					<Typography variant="caption" color="text.secondary">
						{t("configurator_raw_stream_broadcast")}
					</Typography>
				)}
			</Box>
			{inputs.map((input) => {
				// Values come from the device: only show them when it runs this pin in the same mode.
				const value = rawValues[input.pin];
				const deployed = value !== undefined && value.mode === input.mode;
				return (
					<Box key={input.uuid}>
						<PinMapping config={input} type="input" />
						{streaming &&
							(deployed ? (
								<CompactRawValue value={value} threshold={input.threshold} />
							) : (
								<Alert severity="info" sx={{ mx: 1, mb: 1, py: 0 }}>
									{t("configurator_raw_stream_not_deployed")}
								</Alert>
							))}
					</Box>
				);
			})}
			<Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
				<AddRowButton
					visible={inputs.length === 0 || hovered}
					onClick={() => {
						addInput({
							pin: inputs.length,
							mode: sysexPinModeAnalogIn,
							channel: 1,
							midiType: MIDI_CONTROL_CHANGE,
							midiMin: 0,
							midiMax: 127,
							pinMin: 0,
							pinMax: 1023,
							controller: 20,
						});
					}}
				></AddRowButton>
			</Box>
		</Box>
	);
};

export default Inputs;
