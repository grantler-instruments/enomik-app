import {
	Box,
	Checkbox,
	FormControlLabel,
	InputAdornment,
	TextField,
	Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIOStore } from "../store/io";
import { ENOMIK_MAX_NAME_LENGTH } from "../store/midi.config";
import InfoWithTooltip from "./InfoWithTooltip";

const Globals = () => {
	const { t } = useTranslation();
	const midiLoopback = useIOStore((state) => state.midiLoopback);
	const setMidiLoopback = useIOStore((state) => state.setMidiLoopback);
	const powerSave = useIOStore((state) => state.powerSave);
	const setPowerSave = useIOStore((state) => state.setPowerSave);
	const name = useIOStore((state) => state.name);
	const setName = useIOStore((state) => state.setName);

	return (
		<Box
			display="flex"
			flexWrap="wrap"
			alignItems="center"
			columnGap={3}
			rowGap={1}
		>
			<Box display="flex" alignItems="center">
				<TextField
					size="small"
					label={t("client_name")}
					placeholder={t("client_name_placeholder")}
					value={name}
					onChange={(e) => setName(e.target.value)}
					sx={{ width: 240 }}
					slotProps={{
						htmlInput: { maxLength: ENOMIK_MAX_NAME_LENGTH },
						input: {
							endAdornment: (
								<InputAdornment position="end">
									<Typography variant="caption" color="text.secondary">
										{name.length}/{ENOMIK_MAX_NAME_LENGTH}
									</Typography>
								</InputAdornment>
							),
						},
					}}
				/>
				<InfoWithTooltip text={t("tooltip_client_name")} />
			</Box>
			<Box display="flex" alignItems="center">
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							checked={midiLoopback}
							onChange={(e) => setMidiLoopback(e.target.checked)}
						/>
					}
					label={t("midi_loopback")}
					sx={{ mr: 0 }}
				/>
				<InfoWithTooltip text={t("tooltip_midi_loopback")} />
			</Box>
			<Box display="flex" alignItems="center">
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							checked={powerSave}
							onChange={(e) => setPowerSave(e.target.checked)}
						/>
					}
					label={t("power_save")}
					sx={{ mr: 0 }}
				/>
				<InfoWithTooltip text={t("tooltip_power_save")} />
			</Box>
		</Box>
	);
};

export default Globals;
