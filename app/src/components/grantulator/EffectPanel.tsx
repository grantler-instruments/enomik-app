import { Switch, Typography } from "@mui/material";
import {
	type GrantulatorGroup,
	type SwitchId,
	useGrantulatorStore,
} from "../../store/grantulator";
import CollapsibleSection from "../common/CollapsibleSection";
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
		<CollapsibleSection
			defaultExpanded
			title={<Typography variant="h6">{title}</Typography>}
			actions={
				<>
					<Switch
						checked={on}
						onChange={(_, checked) => setSwitch(switchId, checked)}
						slotProps={{ input: { "aria-label": `${title} on` } }}
					/>
					<MidiLearn target={switchId} midi={midi} />
				</>
			}
		>
			<ParamRows group={group} midi={midi} />
		</CollapsibleSection>
	);
};

export default EffectPanel;
