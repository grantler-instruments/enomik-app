import {
	VolumeOff as VolumeOffIcon,
	VolumeUp as VolumeUpIcon,
} from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useGrantulatorStore } from "../../store/grantulator";
import CollapsibleSection from "../common/CollapsibleSection";
import MidiLearn from "./MidiLearn";
import ParamRows from "./ParamRows";

/** The output's accordion: mute and its mapping in the header, volume inside. */
const MasterPanel = ({ midi }: { midi: boolean }) => {
	const { t } = useTranslation();
	const muted = useGrantulatorStore((s) => s.muted);
	const setSwitch = useGrantulatorStore((s) => s.setSwitch);
	return (
		<CollapsibleSection
			defaultExpanded
			title={
				<Typography variant="h6" component="span">
					{t("grantulator_section_master")}
				</Typography>
			}
			actions={
				<>
					<IconButton
						color={muted ? "warning" : "default"}
						aria-label={t(muted ? "grantulator_unmute" : "grantulator_mute")}
						aria-pressed={muted}
						onClick={() => setSwitch("muted", !muted)}
					>
						{muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
					</IconButton>
					<MidiLearn target="muted" midi={midi} />
				</>
			}
		>
			<ParamRows group="master" midi={midi} />
		</CollapsibleSection>
	);
};

export default MasterPanel;
