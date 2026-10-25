import {
	ExpandMore as ExpandMoreIcon,
	VolumeOff as VolumeOffIcon,
	VolumeUp as VolumeUpIcon,
} from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	IconButton,
	Typography,
} from "@mui/material";
import { useGrantulatorStore } from "../../store/grantulator";
import MidiLearn from "./MidiLearn";
import ParamRows from "./ParamRows";

/** The output's accordion: mute and its mapping in the header, volume inside. */
const MasterPanel = ({ midi }: { midi: boolean }) => {
	const muted = useGrantulatorStore((s) => s.muted);
	const setSwitch = useGrantulatorStore((s) => s.setSwitch);
	return (
		<Accordion defaultExpanded>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Box display="flex" alignItems="center" gap={1}>
					<Typography variant="h6">Master</Typography>
					{/* Mute and map it without folding the panel. */}
					<IconButton
						color={muted ? "warning" : "default"}
						aria-label={muted ? "Unmute" : "Mute"}
						aria-pressed={muted}
						onClick={(e) => {
							e.stopPropagation();
							setSwitch("muted", !muted);
						}}
					>
						{muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
					</IconButton>
					<Box onClick={(e) => e.stopPropagation()}>
						<MidiLearn target="muted" midi={midi} />
					</Box>
				</Box>
			</AccordionSummary>
			<AccordionDetails>
				<ParamRows group="master" midi={midi} />
			</AccordionDetails>
		</Accordion>
	);
};

export default MasterPanel;
