import { MenuItem, TextField } from "@mui/material";
import { useGrantulatorStore } from "../../store/grantulator";
import { INTERVAL_SETS, type IntervalSetId } from "../../utils/grantulator";

/** Which intervals the Interval chance slider jumps grains by. */
const IntervalSetSelect = () => {
	const intervalSet = useGrantulatorStore((s) => s.intervalSet);
	const setIntervalSet = useGrantulatorStore((s) => s.setIntervalSet);
	return (
		<TextField
			select
			size="small"
			label="Intervals"
			value={intervalSet}
			onChange={(e) => setIntervalSet(e.target.value as IntervalSetId)}
			sx={{ marginTop: 2, minWidth: 260 }}
		>
			{Object.entries(INTERVAL_SETS).map(([id, set]) => (
				<MenuItem key={id} value={id}>
					{set.label} (
					{set.semitones.map((st) => (st > 0 ? `+${st}` : st)).join(", ")})
				</MenuItem>
			))}
		</TextField>
	);
};

export default IntervalSetSelect;
