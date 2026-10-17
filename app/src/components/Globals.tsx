import { Box, Checkbox, FormControlLabel, TextField } from "@mui/material";
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
		<Box display="flex" flexDirection="column" gap={1}>
			<Box display="flex" alignItems="center" gap={1}>
				<TextField
					size="small"
					label={t("client_name")}
					placeholder={t("client_name_placeholder")}
					value={name}
					onChange={(e) => setName(e.target.value)}
					helperText={`${name.length}/${ENOMIK_MAX_NAME_LENGTH}`}
					slotProps={{ htmlInput: { maxLength: ENOMIK_MAX_NAME_LENGTH } }}
				/>
				<InfoWithTooltip text={t("tooltip_client_name")} />
			</Box>
			<Box display="flex" alignItems="center">
				<FormControlLabel
					control={
						<Checkbox
							checked={midiLoopback}
							onChange={(e) => setMidiLoopback(e.target.checked)}
						/>
					}
					label={t("midi_loopback")}
				/>
				<InfoWithTooltip text={t("tooltip_midi_loopback")} />
			</Box>
			<Box display="flex" alignItems="center">
				<FormControlLabel
					control={
						<Checkbox
							checked={powerSave}
							onChange={(e) => setPowerSave(e.target.checked)}
						/>
					}
					label={t("power_save")}
				/>
				<InfoWithTooltip text={t("tooltip_power_save")} />
			</Box>
		</Box>
	);
};

export default Globals;
