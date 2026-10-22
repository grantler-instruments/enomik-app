import { Chip } from "@mui/material";
import type { Path, Seen } from "../../utils/testerState";

const LABELS: Record<Path, string> = { usb: "USB", wireless: "Wireless" };

/** One chip per path, green once a message arrived that way. */
const PathChips = ({ paths, seen }: { paths: Path[]; seen?: Partial<Seen> }) =>
	paths.map((path) => (
		<Chip
			key={path}
			size="small"
			label={LABELS[path]}
			color={seen?.[path] ? "success" : "default"}
		/>
	));

export default PathChips;
