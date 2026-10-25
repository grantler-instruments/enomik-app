import { Box, Slider, Typography } from "@mui/material";
import {
	GRANTULATOR_PARAMS,
	type GrantulatorGroup,
	type GrantulatorParam,
	useGrantulatorStore,
} from "../../store/grantulator";
import MidiLearn from "./MidiLearn";

const formatValue = (param: GrantulatorParam, value: number) =>
	`${value.toFixed(param.step >= 1 ? 0 : 2)}${param.unit ? ` ${param.unit}` : ""}`;

const ParamRows = ({
	group,
	midi,
}: {
	group: GrantulatorGroup;
	midi: boolean;
}) => (
	<Box paddingTop={2}>
		{GRANTULATOR_PARAMS.filter((param) => param.group === group).map(
			(param) => (
				<ParamRow key={param.id} param={param} midi={midi} />
			),
		)}
	</Box>
);

const ParamRow = ({
	param,
	midi,
}: {
	param: GrantulatorParam;
	midi: boolean;
}) => {
	const value = useGrantulatorStore((s) => s.values[param.id]);
	const setValue = useGrantulatorStore((s) => s.setValue);

	return (
		<Box display="flex" alignItems="center" gap={2} paddingY={0.5}>
			<Typography width={100}>{param.label}</Typography>
			<Slider
				sx={{ flex: 1 }}
				min={param.min}
				max={param.max}
				step={param.step}
				value={value}
				onChange={(_, v) => setValue(param.id, v as number)}
			/>
			<Typography width={80} textAlign="right" variant="body2">
				{formatValue(param, value)}
			</Typography>
			<Box width={180}>
				<MidiLearn target={param.id} midi={midi} />
			</Box>
		</Box>
	);
};

export default ParamRows;
