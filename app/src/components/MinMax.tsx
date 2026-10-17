import { Box, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// local string buffers for typing; normalize to strip leading zeros
const norm = (n: number | string) => String(Number(n));

const MidiMinMax = ({
	min,
	max,
	onChangeMin,
	onChangeMax,
	disabled,
	bitResolution = 7,
	sx,
	bare = false,
}: {
	min: number;
	max: number;
	onChangeMin: (value: number) => void;
	onChangeMax: (value: number) => void;
	disabled?: boolean;
	bitResolution?: 7 | 14;
	sx?: any;
	/** Render the two fields without wrapper and labels, e.g. as two table cells. */
	bare?: boolean;
}) => {
	const { t } = useTranslation();
	const minRange = bitResolution === 7 ? 0 : -8192;
	const maxRange = bitResolution === 7 ? 127 : 8191;

	const [minText, setMinText] = useState(norm(min));
	const [maxText, setMaxText] = useState(norm(max));

	// keep local text in sync when parent changes
	useEffect(() => setMinText(norm(min)), [min]);
	useEffect(() => setMaxText(norm(max)), [max]);

	const clamp = (n: number) => Math.max(minRange, Math.min(maxRange, n));

	const parseOrNull = (v: string) => {
		if (v === "" || v === "-") return null;
		const n = Number(v);
		if (Number.isNaN(n)) return null;
		return n;
	};

	const handleMinBlur = () => {
		const val = parseOrNull(minText);
		const result = val === null ? minRange : clamp(val);
		onChangeMin(result);
		setMinText(norm(result));
	};

	const handleMaxBlur = () => {
		const val = parseOrNull(maxText);
		const result = val === null ? maxRange : clamp(val);
		onChangeMax(result);
		setMaxText(norm(result));
	};

	const fieldSx = bare ? { width: "100%" } : { width: 100 };
	const minField = (
		<TextField
			label={bare ? undefined : t("min")}
			value={minText}
			onChange={(e) => setMinText(e.target.value)}
			onBlur={handleMinBlur}
			sx={fieldSx}
			disabled={disabled}
			size="small"
			inputProps={{
				inputMode: "numeric",
				pattern: "-?[0-9]*",
				"aria-label": t("min"),
			}}
		/>
	);
	const maxField = (
		<TextField
			label={bare ? undefined : t("max")}
			value={maxText}
			onChange={(e) => setMaxText(e.target.value)}
			onBlur={handleMaxBlur}
			sx={fieldSx}
			disabled={disabled}
			size="small"
			inputProps={{
				inputMode: "numeric",
				pattern: "-?[0-9]*",
				"aria-label": t("max"),
			}}
		/>
	);

	if (bare) {
		return (
			<>
				{minField}
				{maxField}
			</>
		);
	}

	return (
		<Box
			display="flex"
			flexDirection="row"
			alignItems="center"
			gap={1}
			sx={{ ...sx }}
		>
			{minField}
			{maxField}
		</Box>
	);
};

export default MidiMinMax;
