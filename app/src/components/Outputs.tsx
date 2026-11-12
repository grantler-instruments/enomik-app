import { Alert, Box } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/app";
import { nextFreePin, useIOStore } from "../store/io";
import { MIDI_CONTROL_CHANGE, sysexPinModePWMOut } from "../store/midi.config";
import { controllerForPin } from "../utils/pinout";
import AddRowButton from "./AddRowButton";
import PinRow, { hasPwmOutput, PinTableHeader } from "./pinmapping/PinRow";
import SelectableRow from "./pinmapping/SelectableRow";

const Outputs = ({
	selectedGpio = null,
	onSelect,
}: {
	/** Pin whose rows are marked, e.g. the one picked on the board. */
	selectedGpio?: number | null;
	/** Called with a row's pin when the row is clicked or focused. */
	onSelect?: (gpio: number) => void;
}) => {
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
				<SelectableRow
					key={output.uuid}
					pin={output.pin}
					selected={output.pin === selectedGpio}
					onSelect={onSelect}
				>
					<PinRow
						config={output}
						type="output"
						index={index}
						showPwmRange={showPwmRange}
					/>
				</SelectableRow>
			))}
			<Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
				<AddRowButton
					onClick={() => {
						const pin = nextFreePin(useIOStore.getState().inputs, outputs);
						addOutput({
							pin,
							mode: sysexPinModePWMOut,
							pinMin: 0,
							pinMax: 1024,
							midiMin: 0,
							midiMax: 127,
							channel: 1,
							midiType: MIDI_CONTROL_CHANGE,
							controller: controllerForPin(pin),
						});
					}}
					visible={outputs.length === 0 || hovered}
				></AddRowButton>
			</Box>
		</Box>
	);
};

export default Outputs;
