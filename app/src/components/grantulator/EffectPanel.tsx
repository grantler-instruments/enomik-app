import { Switch, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
	const on = useGrantulatorStore((s) => s[switchId]);
	const setSwitch = useGrantulatorStore((s) => s.setSwitch);
	return (
		<CollapsibleSection
			defaultExpanded
			title={
				<Typography variant="h6" component="span">
					{title}
				</Typography>
			}
			actions={
				<>
					<Switch
						checked={on}
						onChange={(_, checked) => setSwitch(switchId, checked)}
						slotProps={{
							input: {
								"aria-label": t("grantulator_effect_on", { effect: title }),
							},
						}}
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
