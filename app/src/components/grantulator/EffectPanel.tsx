import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Switch,
	Typography,
} from "@mui/material";
import {
	type GrantulatorGroup,
	type SwitchId,
	useGrantulatorStore,
} from "../../store/grantulator";
import MidiLearn from "./MidiLearn";
import ParamRows from "./ParamRows";

/** An effect's accordion: on/off switch and its mapping in the header. */
const EffectPanel = ({
	title,
	group,
	switchId,
	midi,
}: {
	title: string;
	group: GrantulatorGroup;
	switchId: SwitchId;
	midi: boolean;
}) => {
	const on = useGrantulatorStore((s) => s[switchId]);
	const setSwitch = useGrantulatorStore((s) => s.setSwitch);
	return (
		<Accordion defaultExpanded>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Box display="flex" alignItems="center" gap={1}>
					<Typography variant="h6">{title}</Typography>
					{/* Toggle and map the effect without folding the panel. */}
					<Switch
						checked={on}
						onClick={(e) => e.stopPropagation()}
						onChange={(_, checked) => setSwitch(switchId, checked)}
						slotProps={{ input: { "aria-label": `${title} on` } }}
					/>
					<Box onClick={(e) => e.stopPropagation()}>
						<MidiLearn target={switchId} midi={midi} />
					</Box>
				</Box>
			</AccordionSummary>
			<AccordionDetails>
				<ParamRows group={group} midi={midi} />
			</AccordionDetails>
		</Accordion>
	);
};

export default EffectPanel;
