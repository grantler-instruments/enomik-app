import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIOStore } from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModeTouch,
} from "../../store/midi.config";
import { TOUCH_THRESHOLD } from "../../utils/tester";
import PinRow from "../pinmapping/PinRow";
import type { BoardPin } from "./boards";

/** Pin types the configurator can set up; the rest are fixed (power, I2C). */
export const isConfigurable = (pin: BoardPin) =>
	pin.gpio !== undefined &&
	(pin.type === "touch" ||
		pin.type === "button" ||
		pin.type === "neopixel" ||
		pin.type === "digital" ||
		pin.type === "analog");

const MIDI_DEFAULTS = {
	channel: 1,
	midiType: MIDI_CONTROL_CHANGE,
	midiMin: 0,
	midiMax: 127,
	controller: 20,
} as const;

/** Every config of one GPIO, plus buttons to add one. */
const PinEditor = ({ pin }: { pin: BoardPin & { gpio: number } }) => {
	const { t } = useTranslation();
	const inputs = useIOStore((state) => state.inputs);
	const outputs = useIOStore((state) => state.outputs);
	const addInput = useIOStore((state) => state.addInput);
	const addOutput = useIOStore((state) => state.addOutput);
	const pinInputs = inputs.filter((input) => input.pin === pin.gpio);
	const pinOutputs = outputs.filter((output) => output.pin === pin.gpio);
	const configured = pinInputs.length + pinOutputs.length > 0;

	const handleAddInput = () => {
		const base = { ...MIDI_DEFAULTS, pin: pin.gpio, pinMin: 0, pinMax: 1023 };
		if (pin.type === "touch")
			addInput({
				...base,
				mode: sysexPinModeTouch,
				threshold: TOUCH_THRESHOLD,
				thresholdUnit: "percent",
			});
		else
			addInput({
				...base,
				mode:
					pin.type === "analog"
						? sysexPinModeAnalogIn
						: sysexPinModeDigitalInPullup,
			});
	};

	const handleAddOutput = () =>
		addOutput({
			...MIDI_DEFAULTS,
			pin: pin.gpio,
			mode: sysexPinModeDigitalOut,
			pinMin: 0,
			pinMax: 1024,
		});

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
					{/* NeoPixel data goes through a one-way 5V level shifter: output only */}
					{pin.type !== "neopixel" && (
						<Button size="small" variant="outlined" onClick={handleAddInput}>
							{t("kits_add_input")}
						</Button>
					)}
					{/* Buttons are wired to GND: input pull-up only */}
					{pin.type !== "button" && (
						<Button size="small" variant="outlined" onClick={handleAddOutput}>
							{t("kits_add_output")}
						</Button>
					)}
				</Stack>
			)}
		</Box>
	);
};

export default PinEditor;
