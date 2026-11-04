import { Close as CloseIcon } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
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
						? t("audio_move_control")
						: mapping
							? `Ch ${mapping.channel} ${"note" in mapping ? `Note ${mapping.note}` : `CC ${mapping.controller}`}`
							: t("audio_midi_learn")
				}
				onClick={() => setLearning(learning ? null : target)}
			/>
			{mapping && (
				<IconButton
					size="small"
					aria-label={t("grantulator_clear_mapping")}
					onClick={() => clearMapping(target)}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			)}
		</Box>
	);
};

export default MidiLearn;
