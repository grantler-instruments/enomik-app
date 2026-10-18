import { Alert, Box } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/app";
import { nextFreePin, useIOStore } from "../store/io";
import { MIDI_CONTROL_CHANGE, sysexPinModePWMOut } from "../store/midi.config";
import AddRowButton from "./AddRowButton";
import PinRow, { hasPwmOutput, PinTableHeader } from "./pinmapping/PinRow";

const Outputs = () => {
	const outputs = useIOStore((state) => state.outputs);
	const addOutput = useIOStore((state) => state.addOutput);
	const showHints = useAppStore((state) => state.showHints);
	const [hovered, setHovered] = useState(false);
	const { t } = useTranslation();
	const showPwmRange = hasPwmOutput(outputs);
	return (
		<Box
			display={"flex"}
			flexDirection={"column"}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{showHints && (
				<Alert severity="info" sx={{ mb: 2 }}>
					{t("tooltip_midi_to_pin")}
				</Alert>
			)}
			{outputs.length > 0 && (
				<PinTableHeader type="output" showPwmRange={showPwmRange} />
			)}
			{outputs.map((output, index) => (
				<PinRow
					key={output.uuid}
					config={output}
					type="output"
					index={index}
					showPwmRange={showPwmRange}
				/>
			))}
			<Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
				<AddRowButton
					onClick={() => {
						addOutput({
							pin: nextFreePin(useIOStore.getState().inputs, outputs),
							mode: sysexPinModePWMOut,
							pinMin: 0,
							pinMax: 1024,
							midiMin: 0,
							midiMax: 127,
							channel: 1,
							midiType: MIDI_CONTROL_CHANGE,
							controller: 20,
						});
					}}
					visible={outputs.length === 0 || hovered}
				></AddRowButton>
			</Box>
		</Box>
	);
};

export default Outputs;
