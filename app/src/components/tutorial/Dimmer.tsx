import { Box, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

const LAMP_ON = "#f5c542";
const KNOB = { x: 65, y: 75 };
const ARC_RADIUS = 32;
const MIN_ANGLE = -135;
const MAX_ANGLE = 135;

/** Point on a circle around the knob; 0° is straight up. */
const polar = (angle: number, radius: number) => {
	const rad = ((angle - 90) * Math.PI) / 180;
	return {
		x: KNOB.x + radius * Math.cos(rad),
		y: KNOB.y + radius * Math.sin(rad),
	};
};

const arc = (from: number, to: number) => {
	const start = polar(from, ARC_RADIUS);
	const end = polar(to, ARC_RADIUS);
	const large = to - from > 180 ? 1 : 0;
	return `M${start.x} ${start.y} A${ARC_RADIUS} ${ARC_RADIUS} 0 ${large} 1 ${end.x} ${end.y}`;
};

/** One dimmer setting with its lamp; level goes from 0 to 1. */
const Panel = ({ level, x }: { level: number; x: number }) => {
	const theme = useTheme();
	const muted = theme.palette.text.secondary;
	const angle = MIN_ANGLE + level * (MAX_ANGLE - MIN_ANGLE);
	const pointer = polar(angle, 16);
	const volts = Number((level * 3.3).toFixed(2));
	const midi = Math.round(level * 127);

	return (
		<g transform={`translate(${x} 0)`} fontFamily={theme.typography.fontFamily}>
			{/* Dimmer plate with scale */}
			<rect
				x={20}
				y={10}
				width={90}
				height={130}
				rx={10}
				fill={theme.palette.background.paper}
				stroke={theme.palette.divider}
				strokeWidth={1.5}
			/>
			<path
				d={arc(MIN_ANGLE, MAX_ANGLE)}
				fill="none"
				stroke={theme.palette.action.selected}
				strokeWidth={5}
				strokeLinecap="round"
			/>
			{level > 0 && (
				<path
					d={arc(MIN_ANGLE, angle)}
					fill="none"
					stroke={theme.palette.secondary.main}
					strokeWidth={5}
					strokeLinecap="round"
				/>
			)}
			{/* Knob */}
			<circle
				cx={KNOB.x}
				cy={KNOB.y}
				r={20}
				fill={theme.palette.action.selected}
				stroke={muted}
				strokeWidth={1}
			/>
			<line
				x1={KNOB.x}
				y1={KNOB.y}
				x2={pointer.x}
				y2={pointer.y}
				stroke={theme.palette.text.primary}
				strokeWidth={4}
				strokeLinecap="round"
			/>

			{/* Wire to the lamp */}
			<path
				d="M110 75 H140 V92 H155"
				fill="none"
				stroke={muted}
				strokeWidth={1.5}
			/>

			{/* Lamp, brighter with the level */}
			<circle
				cx={165}
				cy={62}
				r={22}
				fill={LAMP_ON}
				fillOpacity={level}
				stroke={level > 0 ? LAMP_ON : muted}
				strokeWidth={2}
			/>
			<rect x={155} y={84} width={20} height={14} rx={3} fill={muted} />

			{/* Value */}
			<text
				x={110}
				y={165}
				textAnchor="middle"
				fontSize={13}
				fontWeight={600}
				fill={theme.palette.text.primary}
			>
				{`${volts} V · MIDI ${midi}`}
			</text>
		</g>
	);
};

/** A dimmer at three settings, as an analogy for analog signals. */
const Dimmer = () => {
	const { t } = useTranslation();
	return (
		<Box
			role="img"
			aria-label={t("tutorial_electronics_dimmer_label")}
			sx={{
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "center",
				maxWidth: 680,
				my: 2,
			}}
		>
			{[0, 0.5, 1].map((level) => (
				<Box
					key={level}
					component="svg"
					viewBox="0 0 220 175"
					aria-hidden
					sx={{ display: "block", width: { xs: "50%", sm: "33.333%" } }}
				>
					<Panel level={level} x={0} />
				</Box>
			))}
		</Box>
	);
};

export default Dimmer;
