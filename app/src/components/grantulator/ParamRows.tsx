import { Box, Slider, Typography } from "@mui/material";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
	GRANTULATOR_PARAMS,
	type GrantulatorGroup,
	type GrantulatorParam,
	useGrantulatorStore,
} from "../../store/grantulator";
import MidiLearn from "./MidiLearn";

/** Units that are words, not symbols like ms or Hz: translated. */
const UNIT_KEYS: Record<string, string> = { st: "grantulator_unit_semitones" };

const formatValue = (t: TFunction, param: GrantulatorParam, value: number) => {
	const unit =
		param.unit &&
		(UNIT_KEYS[param.unit] ? t(UNIT_KEYS[param.unit]) : param.unit);
	return `${value.toFixed(param.step >= 1 ? 0 : 2)}${unit ? ` ${unit}` : ""}`;
};

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
	const { t } = useTranslation();
	const value = useGrantulatorStore((s) => s.values[param.id]);
	const setValue = useGrantulatorStore((s) => s.setValue);

	return (
		<Box display="flex" alignItems="center" gap={2} paddingY={0.5}>
			<Typography width={100}>{t(param.labelKey)}</Typography>
			<Slider
				sx={{ flex: 1 }}
				min={param.min}
				max={param.max}
				step={param.step}
				value={value}
				onChange={(_, v) => setValue(param.id, v as number)}
				aria-label={t(param.labelKey)}
				getAriaValueText={(v) => formatValue(t, param, v)}
			/>
			<Typography width={80} textAlign="right" variant="body2">
				{formatValue(t, param, value)}
			</Typography>
			<Box width={180}>
				<MidiLearn target={param.id} midi={midi} />
			</Box>
		</Box>
	);
};

export default ParamRows;
