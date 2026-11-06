import { Box, Button } from "@mui/material";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import Composer from "./Composer";
import CollapsibleSection from "./common/CollapsibleSection";
import InitMidi from "./InitMidi";
import PageLayout from "./layout/PageLayout";
import MessageList from "./MessageList";
import SectionHeader from "./SectionHeader";
import WebSerialMonitor from "./SerialMonitor";

// React Flow is big: load it when the section opens.
const Patcher = lazy(() => import("./Patcher"));

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
					<SectionHeader
						component="span"
						title={t("section_midi_composer")}
						tooltipKey="tooltip_midi_composer"
					/>
				}
				// InitMidi renders nothing once MIDI is up.
				actions={!composerOpen && <InitMidi />}
			>
				<Composer />
			</CollapsibleSection>
			<CollapsibleSection
				// Unmounted when closed: the patch only runs while it's open.
				unmountOnExit
				sx={{ mb: 2 }}
				title={
					<SectionHeader
						component="span"
						title={t("section_patcher")}
						tooltipKey="tooltip_patcher"
					/>
				}
			>
				<Suspense>
					<Patcher embedded />
				</Suspense>
			</CollapsibleSection>
			<CollapsibleSection
				expanded={monitorOpen}
				onChange={setMonitorOpen}
				sx={{ mb: 2 }}
				title={
					<SectionHeader
						component="span"
						title={t("section_midi_monitor")}
						tooltipKey="tooltip_midi_monitor"
					/>
				}
				// InitMidi renders nothing once MIDI is up.
				actions={!monitorOpen && <InitMidi />}
			>
				<MessageList />
			</CollapsibleSection>
			<CollapsibleSection
				sx={{ mb: 2 }}
				title={
					<SectionHeader
						component="span"
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
						component="span"
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
					<Button variant="outlined" component={NavLink} to={"/patcher"}>
						{t("open_patcher")}
					</Button>
				</Box>
			</CollapsibleSection>
		</PageLayout>
	);
};

export default Debugger;
