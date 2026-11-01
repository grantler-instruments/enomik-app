import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import ExtensionIcon from "@mui/icons-material/Extension";
import LaptopIcon from "@mui/icons-material/Laptop";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SensorsIcon from "@mui/icons-material/Sensors";
import UsbIcon from "@mui/icons-material/Usb";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { useList } from "./blocks";

type NodeId =
	| "host"
	| "dongle"
	| "client"
	| "extender"
	| "sensors"
	| "actuators";
type Rect = { x: number; y: number; w: number; h: number };
type Edge = {
	path: string;
	/** Arrowheads; default "end". */
	arrows?: "end" | "both" | "none";
	dashed?: boolean;
	/** Translation key (starting with "tutorial_") or literal text. */
	label?: string;
	labelX?: number;
	labelY?: number;
	labelAnchor?: "start" | "middle";
	/** Rotate the label 90° around its anchor point. */
	labelVertical?: boolean;
};
type Layout = {
	width: number;
	height: number;
	nodes: Record<NodeId, Rect>;
	edges: Edge[];
};

// Optional parts get a dashed outline
const OPTIONAL: NodeId[] = ["extender"];

// Wide: host → dongle → client in a row, extender below the client,
// sensors and actuators on the right, joined to client and extender by a pin bus
const WIDE: Layout = {
	width: 910,
	height: 440,
	nodes: {
		host: { x: 10, y: 60, w: 170, h: 150 },
		dongle: { x: 250, y: 60, w: 170, h: 150 },
		client: { x: 490, y: 60, w: 170, h: 150 },
		extender: { x: 490, y: 290, w: 170, h: 130 },
		sensors: { x: 730, y: 0, w: 170, h: 210 },
		actuators: { x: 730, y: 230, w: 170, h: 210 },
	},
	edges: [
		{
			path: "M180 135 H250",
			arrows: "both",
			label: "tutorial_architecture_usb",
			labelX: 215,
			labelY: 125,
		},
		{
			path: "M95 60 V30 H575 V60",
			arrows: "both",
			dashed: true,
			label: "tutorial_architecture_usb_direct",
			labelX: 335,
			labelY: 22,
		},
		{
			path: "M420 135 H490",
			arrows: "both",
			label: "ESP-NOW",
			labelX: 455,
			labelY: 125,
		},
		{
			path: "M575 210 V290",
			arrows: "both",
			dashed: true,
			label: "IDC16",
			labelX: 583,
			labelY: 254,
			labelAnchor: "start",
		},
		{
			path: "M660 135 H695 V355 H660",
			arrows: "none",
			label: "tutorial_architecture_pins",
			labelX: 700,
			labelY: 249,
			labelAnchor: "start",
		},
		{ path: "M730 105 H695" },
		{ path: "M695 335 H730" },
	],
};

// Narrow: everything stacked, sensors and actuators side by side at the bottom
const NARROW: Layout = {
	width: 360,
	height: 895,
	nodes: {
		host: { x: 60, y: 10, w: 240, h: 115 },
		dongle: { x: 60, y: 175, w: 240, h: 115 },
		client: { x: 60, y: 340, w: 240, h: 115 },
		extender: { x: 60, y: 505, w: 240, h: 110 },
		sensors: { x: 10, y: 675, w: 165, h: 210 },
		actuators: { x: 185, y: 675, w: 165, h: 210 },
	},
	edges: [
		{
			path: "M180 125 V175",
			arrows: "both",
			label: "tutorial_architecture_usb",
			labelX: 190,
			labelY: 154,
			labelAnchor: "start",
		},
		{
			path: "M300 67 H335 V397 H300",
			arrows: "both",
			dashed: true,
			label: "tutorial_architecture_usb_direct",
			labelX: 345,
			labelY: 232,
			labelVertical: true,
		},
		{
			path: "M180 290 V340",
			arrows: "both",
			label: "ESP-NOW",
			labelX: 190,
			labelY: 319,
			labelAnchor: "start",
		},
		{
			path: "M180 455 V505",
			arrows: "both",
			dashed: true,
			label: "IDC16",
			labelX: 190,
			labelY: 484,
			labelAnchor: "start",
		},
		{
			path: "M60 400 H35 V645 H267",
			arrows: "none",
			label: "tutorial_architecture_pins",
			labelX: 200,
			labelY: 638,
			labelAnchor: "start",
		},
		{ path: "M180 615 V645", arrows: "none" },
		{ path: "M92 675 V645" },
		{ path: "M267 645 V675" },
	],
};

const NodeContent = ({
	icon,
	title,
	description,
	examples,
}: {
	icon: ReactNode;
	title: string;
	description: string;
	examples?: string[];
}) => (
	<Box
		sx={{
			height: "100%",
			p: 1.5,
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			textAlign: "center",
			overflow: "hidden",
		}}
	>
		<Box color="secondary.main" sx={{ display: "flex" }}>
			{icon}
		</Box>
		<Typography variant="subtitle2" fontWeight={600}>
			{title}
		</Typography>
		<Typography
			variant="caption"
			color="text.secondary"
			sx={{ lineHeight: 1.35 }}
		>
			{description}
		</Typography>
		{examples && (
			<Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 0.75 }}>
				{examples.map((example) => (
					<Typography
						key={example}
						component="li"
						variant="caption"
						sx={{ display: "block", lineHeight: 1.4 }}
					>
						{example}
					</Typography>
				))}
			</Box>
		)}
	</Box>
);

/** Host, dongle, client, sensors and actuators, rendered as SVG. */
const ArchitectureDiagram = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const wide = useMediaQuery(theme.breakpoints.up("md"));
	const layout = wide ? WIDE : NARROW;
	const markerId = useId();
	const sensorExamples = useList("tutorial_architecture_sensors_examples");
	const actuatorExamples = useList("tutorial_architecture_actuators_examples");

	const lineColor = theme.palette.text.secondary;
	const content: Record<NodeId, ReactNode> = {
		host: (
			<NodeContent
				icon={<LaptopIcon />}
				title={t("tutorial_architecture_host")}
				description={t("tutorial_architecture_host_desc")}
			/>
		),
		dongle: (
			<NodeContent
				icon={<UsbIcon />}
				title={t("device_kind_dongle")}
				description={t("tutorial_architecture_dongle_desc")}
			/>
		),
		client: (
			<NodeContent
				icon={<DeveloperBoardIcon />}
				title={t("tutorial_architecture_clients")}
				description={t("tutorial_architecture_client_desc")}
			/>
		),
		extender: (
			<NodeContent
				icon={<ExtensionIcon />}
				title={t("tutorial_architecture_extender")}
				description={t("tutorial_architecture_extender_desc")}
			/>
		),
		sensors: (
			<NodeContent
				icon={<SensorsIcon />}
				title={t("tutorial_architecture_sensors")}
				description={t("tutorial_architecture_sensors_desc")}
				examples={sensorExamples}
			/>
		),
		actuators: (
			<NodeContent
				icon={<LightbulbIcon />}
				title={t("tutorial_architecture_actuators")}
				description={t("tutorial_architecture_actuators_desc")}
				examples={actuatorExamples}
			/>
		),
	};

	return (
		<Box
			component="svg"
			viewBox={`0 0 ${layout.width} ${layout.height}`}
			role="img"
			aria-label={t("tutorial_architecture_title")}
			sx={{
				display: "block",
				width: "100%",
				maxWidth: wide ? undefined : 480,
				height: "auto",
				mx: "auto",
				my: 3,
			}}
		>
			<defs>
				<marker
					id={markerId}
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path d="M0 0 L10 5 L0 10 z" fill={lineColor} />
				</marker>
			</defs>

			{layout.edges.map((edge) => {
				const arrows = edge.arrows ?? "end";
				const marker = `url(#${markerId})`;
				return (
					<g key={edge.path}>
						<path
							d={edge.path}
							fill="none"
							stroke={lineColor}
							strokeWidth={1.5}
							strokeDasharray={edge.dashed ? "5 4" : undefined}
							markerEnd={arrows === "none" ? undefined : marker}
							markerStart={arrows === "both" ? marker : undefined}
						/>
						{edge.label && (
							<text
								x={edge.labelX}
								y={edge.labelY}
								textAnchor={edge.labelAnchor ?? "middle"}
								transform={
									edge.labelVertical
										? `rotate(90 ${edge.labelX} ${edge.labelY})`
										: undefined
								}
								fontSize={11}
								fontFamily={theme.typography.fontFamily}
								fill={lineColor}
							>
								{edge.label.startsWith("tutorial_")
									? t(edge.label)
									: edge.label}
							</text>
						)}
					</g>
				);
			})}

			{(Object.keys(layout.nodes) as NodeId[]).map((id) => {
				const { x, y, w, h } = layout.nodes[id];
				return (
					<g key={id}>
						<rect
							x={x}
							y={y}
							width={w}
							height={h}
							rx={8}
							fill={theme.palette.background.paper}
							stroke={theme.palette.divider}
							strokeDasharray={OPTIONAL.includes(id) ? "6 4" : undefined}
						/>
						<foreignObject x={x} y={y} width={w} height={h}>
							{content[id]}
						</foreignObject>
					</g>
				);
			})}
		</Box>
	);
};

export default ArchitectureDiagram;
