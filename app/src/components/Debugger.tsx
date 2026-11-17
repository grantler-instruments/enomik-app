import { Box, Button, Tab, Tabs, Tooltip } from "@mui/material";
import { lazy, type ReactNode, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import Composer from "./Composer";
import PageLayout from "./layout/PageLayout";
import MessageList from "./MessageList";
import SectionHeader from "./SectionHeader";
import WebSerialMonitor from "./SerialMonitor";

// React Flow is big: load it when the tab opens.
const Patcher = lazy(() => import("./Patcher"));

type DebuggerTab = "patcher" | "monitor" | "serial" | "tools";

const Debugger = () => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<DebuggerTab>("monitor");

	const tabs: {
		value: DebuggerTab;
		title: string;
		tooltipKey: string;
		content: ReactNode;
		/** Unmounted when inactive instead of hidden. */
		unmountWhenHidden?: boolean;
	}[] = [
		{
			value: "monitor",
			title: t("section_midi_monitor"),
			tooltipKey: "tooltip_midi_monitor",
			content: <MessageList />,
		},
		{
			value: "patcher",
			title: t("section_patcher"),
			tooltipKey: "tooltip_patcher",
			// The patch only runs while its tab is open.
			unmountWhenHidden: true,
			content: (
				<Suspense>
					<Patcher embedded />
				</Suspense>
			),
		},
		{
			value: "serial",
			title: t("section_serial_monitor"),
			tooltipKey: "tooltip_serial_monitor",
			content: <WebSerialMonitor />,
		},
		{
			value: "tools",
			title: t("section_tools"),
			tooltipKey: "tooltip_tools",
			content: (
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
			),
		},
	];

	return (
		<PageLayout
			title={t("debugger")}
			info={t("debugger_info")}
			maxWidth={false}
		>
			{/* Outside the tabs so it can be used alongside any of them. */}
			<Box component="section" sx={{ mb: 3 }}>
				<SectionHeader
					title={t("section_midi_composer")}
					tooltipKey="tooltip_midi_composer"
				/>
				<Box sx={{ mt: 2 }}>
					<Composer />
				</Box>
			</Box>
			<Tabs
				value={tab}
				onChange={(_, value: DebuggerTab) => setTab(value)}
				variant="scrollable"
				allowScrollButtonsMobile
				aria-label={t("debugger")}
				sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
			>
				{tabs.map((item) => (
					<Tab
						key={item.value}
						value={item.value}
						id={`debugger-tab-${item.value}`}
						aria-controls={`debugger-panel-${item.value}`}
						label={
							<Tooltip title={t(item.tooltipKey)} enterDelay={500}>
								<span>{item.title}</span>
							</Tooltip>
						}
						sx={{ minHeight: 48 }}
					/>
				))}
			</Tabs>
			{tabs.map((item) => {
				const active = item.value === tab;
				// Inactive panels stay mounted (hidden) so filters and inputs
				// survive tab switches, except where noted.
				if (!active && item.unmountWhenHidden) return null;
				return (
					<Box
						key={item.value}
						role="tabpanel"
						hidden={!active}
						id={`debugger-panel-${item.value}`}
						aria-labelledby={`debugger-tab-${item.value}`}
					>
						{item.content}
					</Box>
				);
			})}
		</PageLayout>
	);
};

export default Debugger;
