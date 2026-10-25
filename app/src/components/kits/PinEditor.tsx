import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIOStore } from "../../store/io";
import {
	canAddInput,
	canAddOutput,
	defaultInput,
	defaultOutput,
	type GpioPin,
} from "../../utils/pinout";
import PinRow from "../pinmapping/PinRow";

/** Every config of one GPIO, plus buttons to add one. */
const PinEditor = ({ pin }: { pin: GpioPin }) => {
	const { t } = useTranslation();
	const inputs = useIOStore((state) => state.inputs);
	const outputs = useIOStore((state) => state.outputs);
	const addInput = useIOStore((state) => state.addInput);
	const addOutput = useIOStore((state) => state.addOutput);
	const pinInputs = inputs.filter((input) => input.pin === pin.gpio);
	const pinOutputs = outputs.filter((output) => output.pin === pin.gpio);
	const configured = pinInputs.length + pinOutputs.length > 0;

	return (
		<Box sx={{ p: 2, width: 760, maxWidth: "calc(100vw - 32px)" }}>
			<Typography variant="subtitle1" fontWeight={600}>
				GPIO {pin.gpio} · {t(`kits_pin_${pin.type}`)}
			</Typography>
			{!configured && (
				<Typography variant="body2" color="text.secondary">
					{t("kits_pin_not_configured")}
				</Typography>
			)}
			<Stack spacing={1} mt={1}>
				{pinInputs.map((input, index) => (
					<Box key={input.uuid}>
						<Typography variant="caption" color="text.secondary">
							{t("kits_input")}
						</Typography>
						<PinRow config={input} type="input" index={index} compact />
					</Box>
				))}
				{pinOutputs.map((output, index) => (
					<Box key={output.uuid}>
						<Typography variant="caption" color="text.secondary">
							{t("kits_output")}
						</Typography>
						<PinRow config={output} type="output" index={index} compact />
					</Box>
				))}
			</Stack>
			{/* One config per pin: adding is only offered while the pin is free */}
			{!configured && (
				<Stack direction="row" spacing={1} mt={2}>
					{canAddInput(pin) && (
						<Button
							size="small"
							variant="outlined"
							onClick={() => addInput(defaultInput(pin))}
						>
							{t("kits_add_input")}
						</Button>
					)}
					{canAddOutput(pin) && (
						<Button
							size="small"
							variant="outlined"
							onClick={() => addOutput(defaultOutput(pin))}
						>
							{t("kits_add_output")}
						</Button>
					)}
				</Stack>
			)}
		</Box>
	);
};

export default PinEditor;
