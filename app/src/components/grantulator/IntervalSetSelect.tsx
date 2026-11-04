import { MenuItem, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useGrantulatorStore } from "../../store/grantulator";
import { INTERVAL_SETS, type IntervalSetId } from "../../utils/grantulator";

/** Which intervals the Interval chance slider jumps grains by. */
const IntervalSetSelect = () => {
	const { t } = useTranslation();
	const intervalSet = useGrantulatorStore((s) => s.intervalSet);
	const setIntervalSet = useGrantulatorStore((s) => s.setIntervalSet);
	return (
		<TextField
			select
			size="small"
			label={t("grantulator_intervals")}
			value={intervalSet}
			onChange={(e) => setIntervalSet(e.target.value as IntervalSetId)}
			sx={{ marginTop: 2, minWidth: 260 }}
		>
			{Object.entries(INTERVAL_SETS).map(([id, set]) => (
				<MenuItem key={id} value={id}>
					{t(set.labelKey)} (
					{set.semitones.map((st) => (st > 0 ? `+${st}` : st)).join(", ")})
				</MenuItem>
			))}
		</TextField>
	);
};

export default IntervalSetSelect;
