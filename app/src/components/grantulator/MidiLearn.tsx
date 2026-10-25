import { Close as CloseIcon } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";
import {
	type MappingTarget,
	useGrantulatorStore,
} from "../../store/grantulator";

/** Learn, show and clear the control change driving a target. */
const MidiLearn = ({
	target,
	midi,
}: {
	target: MappingTarget;
	midi: boolean;
}) => {
	const mapping = useGrantulatorStore((s) => s.mappings[target]);
	const learning = useGrantulatorStore((s) => s.learning === target);
	const setLearning = useGrantulatorStore((s) => s.setLearning);
	const clearMapping = useGrantulatorStore((s) => s.clearMapping);

	return (
		<Box display="flex" alignItems="center" gap={0.5}>
			<Chip
				size="small"
				disabled={!midi}
				color={learning ? "warning" : mapping ? "primary" : "default"}
				variant={mapping || learning ? "filled" : "outlined"}
				label={
					learning
						? "Move a control…"
						: mapping
							? `Ch ${mapping.channel} ${"note" in mapping ? `Note ${mapping.note}` : `CC ${mapping.controller}`}`
							: "MIDI learn"
				}
				onClick={() => setLearning(learning ? null : target)}
			/>
			{mapping && (
				<IconButton
					size="small"
					aria-label="Clear mapping"
					onClick={() => clearMapping(target)}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			)}
		</Box>
	);
};

export default MidiLearn;
