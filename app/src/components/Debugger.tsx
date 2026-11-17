import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { Badge, Box, Button, Tab, Tabs, Typography } from "@mui/material";
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

type DebuggerTab = "patcher" | "monitor" | "serial";

const MORE_TOOLS = [
	{ to: "/tester", key: "open_tester" },
	{ to: "/grantulator", key: "open_grantulator" },
	{ to: "/mpc", key: "open_mpc" },
];

const Debugger = () => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<DebuggerTab>("monitor");
	const [monitorFilters, setMonitorFilters] = useState(0);

	const tabs: {
		value: DebuggerTab;
		title: string;
		/** One-line description shown at the top of the panel. */
		descriptionKey: string;
		/** Dot on the tab, e.g. while a filter hides messages. */
		marked?: boolean;
		/** Shown at the end of the description line. */
		action?: ReactNode;
		content: ReactNode;
		/** Unmounted when inactive instead of hidden. */
		unmountWhenHidden?: boolean;
	}[] = [
		{
			value: "monitor",
			title: t("tab_monitor"),
			descriptionKey: "tooltip_midi_monitor",
			marked: monitorFilters > 0,
			content: <MessageList onActiveFiltersChange={setMonitorFilters} />,
		},
		{
			value: "patcher",
			title: t("tab_patcher"),
			descriptionKey: "tooltip_patcher",
			// The patch only runs while its tab is open.
			unmountWhenHidden: true,
			action: (
				<Button
					size="small"
					component={NavLink}
					to="/patcher"
					startIcon={<OpenInFullIcon />}
					sx={{ flexShrink: 0 }}
				>
					{t("patcher_open_full")}
				</Button>
			),
			content: (
				<Suspense>
					<Patcher embedded hideInitMidi />
				</Suspense>
			),
		},
		{
			value: "serial",
			title: t("tab_serial"),
			descriptionKey: "tooltip_serial_monitor",
			content: <WebSerialMonitor />,
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
				{/* Smaller on phones so the monitor below stays in view. */}
				<Box sx={{ "& h2": { fontSize: { xs: "1.25rem", sm: "1.85rem" } } }}>
					<SectionHeader
						title={t("section_midi_composer")}
						tooltipKey="tooltip_midi_composer"
					/>
				</Box>
				<Box sx={{ mt: { xs: 1, sm: 2 } }}>
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
							<Badge
								variant="dot"
								color="primary"
								invisible={!item.marked}
								sx={{ "& .MuiBadge-dot": { right: -6 } }}
							>
								{item.title}
							</Badge>
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
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 2,
								mb: 2,
							}}
						>
							<Typography variant="body2" color="text.secondary">
								{t(item.descriptionKey)}
							</Typography>
							{item.action}
						</Box>
						{item.content}
					</Box>
				);
			})}
			<Box
				component="nav"
				aria-label={t("section_tools")}
				sx={{
					mt: 4,
					pt: 2,
					borderTop: 1,
					borderColor: "divider",
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
					{t("more_tools")}
				</Typography>
				{MORE_TOOLS.map((tool) => (
					<Button key={tool.to} size="small" component={NavLink} to={tool.to}>
						{t(tool.key)}
					</Button>
				))}
			</Box>
		</PageLayout>
	);
};

export default Debugger;
