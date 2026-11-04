import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { CheckLine } from "../../utils/tester";

/** One OK/FAIL chip and the request's wording per line. */
const CheckLines = ({ lines }: { lines: CheckLine[] }) => {
	const { t } = useTranslation();
	return lines.map((line, index) => (
		// biome-ignore lint/suspicious/noArrayIndexKey: append-only list
		<Box key={index} display="flex" gap={1} alignItems="center">
			<Chip
				size="small"
				label={line.ok ? t("tester_ok") : t("tester_fail")}
				color={line.ok ? "success" : "error"}
			/>
			<Typography variant="body2">
				{t(`tester_check_${line.id}`, line.values)}
			</Typography>
		</Box>
	));
};

export default CheckLines;
