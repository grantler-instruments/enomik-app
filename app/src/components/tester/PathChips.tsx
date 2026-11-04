import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Path, Seen } from "../../utils/testerState";

/** One chip per path, green once a message arrived that way. */
const PathChips = ({
	paths,
	seen,
}: {
	paths: Path[];
	seen?: Partial<Seen>;
}) => {
	const { t } = useTranslation();
	const labels: Record<Path, string> = {
		usb: "USB",
		wireless: t("tester_wireless"),
	};
	return paths.map((path) => (
		<Chip
			key={path}
			size="small"
			label={labels[path]}
			color={seen?.[path] ? "success" : "default"}
		/>
	));
};

export default PathChips;
