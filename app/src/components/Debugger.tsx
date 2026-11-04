import { Box, Button } from "@mui/material";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import Composer from "./Composer";
import CollapsibleSection from "./common/CollapsibleSection";
import InitMidi from "./InitMidi";
import PageLayout from "./layout/PageLayout";
import MessageList from "./MessageList";
import SectionHeader from "./SectionHeader";
import WebSerialMonitor from "./SerialMonitor";

/** Section title with the Init MIDI button on the right while collapsed. */
const TitleWithInit = ({
	collapsed,
	children,
}: {
	collapsed: boolean;
	children: ReactNode;
}) => (
	<Box display="flex" alignItems="center" gap={2} flex={1} mr={1}>
		{children}
		<Box flex={1} />
		{/* InitMidi renders nothing once MIDI is up. Initialise without unfolding the panel. */}
		{collapsed && (
			<Box onClick={(e) => e.stopPropagation()}>
				<InitMidi />
			</Box>
		)}
	</Box>
);

const Debugger = () => {
	const { t } = useTranslation();
	const [composerOpen, setComposerOpen] = useState(true);
	const [monitorOpen, setMonitorOpen] = useState(true);
	return (
		<PageLayout
			title={t("debugger")}
			info={t("debugger_info")}
			maxWidth={false}
		>
			<CollapsibleSection
				expanded={composerOpen}
				onChange={setComposerOpen}
				sx={{ mb: 2 }}
				title={
					<TitleWithInit collapsed={!composerOpen}>
						<SectionHeader
							title={t("section_midi_composer")}
							tooltipKey="tooltip_midi_composer"
						/>
					</TitleWithInit>
				}
			>
				<Composer />
			</CollapsibleSection>
			<CollapsibleSection
				expanded={monitorOpen}
				onChange={setMonitorOpen}
				sx={{ mb: 2 }}
				title={
					<TitleWithInit collapsed={!monitorOpen}>
						<SectionHeader
							title={t("section_midi_monitor")}
							tooltipKey="tooltip_midi_monitor"
						/>
					</TitleWithInit>
				}
			>
				<MessageList />
			</CollapsibleSection>
			<CollapsibleSection
				sx={{ mb: 2 }}
				title={
					<SectionHeader
						title={t("section_serial_monitor")}
						tooltipKey="tooltip_serial_monitor"
					/>
				}
			>
				<WebSerialMonitor />
			</CollapsibleSection>
			<CollapsibleSection
				defaultExpanded
				sx={{ mb: 2 }}
				title={
					<SectionHeader
						title={t("section_tools")}
						tooltipKey="tooltip_tools"
					/>
				}
			>
				<Box display={"flex"} gap={1} flexWrap={"wrap"}>
					<Button variant="outlined" component={NavLink} to={"/tester"}>
						{t("open_tester")}
					</Button>
					<Button variant="outlined" component={NavLink} to={"/grantulator"}>
						{t("open_grantulator")}
					</Button>
					<Button variant="outlined" component={NavLink} to={"/mpc"}>
						{t("open_mpc")}
					</Button>
				</Box>
			</CollapsibleSection>
		</PageLayout>
	);
};

export default Debugger;
