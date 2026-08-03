import { Box, FormControlLabel, Switch } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIOStore } from "../store/io";
import InfoWithTooltip from "./InfoWithTooltip";

const Globals = () => {
	const { t } = useTranslation();
	const midiLoopback = useIOStore((state) => state.midiLoopback);
	const setMidiLoopback = useIOStore((state) => state.setMidiLoopback);
	const powerSave = useIOStore((state) => state.powerSave);
	const setPowerSave = useIOStore((state) => state.setPowerSave);

	return (
		<Box display="flex" flexDirection="column" gap={1}>
			<Box display="flex" alignItems="center">
				<FormControlLabel
					control={
						<Switch
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
						<Switch
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
