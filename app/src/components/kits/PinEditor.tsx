import DeleteIcon from "@mui/icons-material/Delete";
import {
	Box,
	Button,
	IconButton,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
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

/** Caption above a config, with a button that deletes it. */
const ConfigHeader = ({
	label,
	onDelete,
}: {
	label: string;
	onDelete: () => void;
}) => {
	const { t } = useTranslation();
	return (
		<Stack direction="row" alignItems="center" justifyContent="space-between">
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Tooltip title={t("delete")}>
				<IconButton size="small" aria-label={t("delete")} onClick={onDelete}>
					<DeleteIcon fontSize="small" />
				</IconButton>
			</Tooltip>
		</Stack>
	);
};

/** Every config of one GPIO, plus buttons to add or delete one. */
const PinEditor = ({ pin }: { pin: GpioPin }) => {
	const { t } = useTranslation();
	const inputs = useIOStore((state) => state.inputs);
	const outputs = useIOStore((state) => state.outputs);
	const addInput = useIOStore((state) => state.addInput);
	const addOutput = useIOStore((state) => state.addOutput);
	const removeInput = useIOStore((state) => state.removeInput);
	const removeOutput = useIOStore((state) => state.removeOutput);
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
						<ConfigHeader
							label={t("kits_input")}
							onDelete={() => removeInput(input.uuid)}
						/>
						<PinRow
							config={input}
							type="input"
							index={index}
							compact
							hideMenu
						/>
					</Box>
				))}
				{pinOutputs.map((output, index) => (
					<Box key={output.uuid}>
						<ConfigHeader
							label={t("kits_output")}
							onDelete={() => removeOutput(output.uuid)}
						/>
						<PinRow
							config={output}
							type="output"
							index={index}
							compact
							hideMenu
						/>
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
