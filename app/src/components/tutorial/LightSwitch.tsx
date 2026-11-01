import { Box, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

const LAMP_ON = "#f5c542";

/** One switch with its lamp, either off or on. */
const Panel = ({ on, x }: { on: boolean; x: number }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const muted = theme.palette.text.secondary;
	const font = theme.typography.fontFamily;
	const leverY = on ? 42 : 108;

	return (
		<g transform={`translate(${x} 0)`} fontFamily={font}>
			{/* Switch plate */}
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
			<text x={65} y={28} textAnchor="middle" fontSize={10} fill={muted}>
				{t("tutorial_electronics_switch_on")}
			</text>
			<text x={65} y={132} textAnchor="middle" fontSize={10} fill={muted}>
				{t("tutorial_electronics_switch_off")}
			</text>
			{/* Toggle lever */}
			<circle cx={65} cy={75} r={13} fill={theme.palette.action.selected} />
			<line
				x1={65}
				y1={75}
				x2={65}
				y2={leverY}
				stroke={theme.palette.text.primary}
				strokeWidth={6}
				strokeLinecap="round"
			/>
			<circle cx={65} cy={leverY} r={8} fill={theme.palette.secondary.main} />

			{/* Wire to the lamp */}
			<path d="M110 75 H140 V92" fill="none" stroke={muted} strokeWidth={1.5} />

			{/* Lamp */}
			{on &&
				[-60, -30, 0, 30, 60].map((angle) => (
					<line
						key={angle}
						x1={165}
						y1={30}
						x2={165}
						y2={22}
						stroke={LAMP_ON}
						strokeWidth={3}
						strokeLinecap="round"
						transform={`rotate(${angle} 165 62)`}
					/>
				))}
			<circle
				cx={165}
				cy={62}
				r={22}
				fill={on ? LAMP_ON : "none"}
				stroke={on ? LAMP_ON : muted}
				strokeWidth={2}
			/>
			<rect x={155} y={84} width={20} height={14} rx={3} fill={muted} />
			<path d="M140 92 H155" stroke={muted} strokeWidth={1.5} />

			{/* State */}
			<text
				x={110}
				y={165}
				textAnchor="middle"
				fontSize={13}
				fontWeight={600}
				fill={theme.palette.text.primary}
			>
				{on
					? `${t("tutorial_electronics_switch_on")} · HIGH · 3.3 V`
					: `${t("tutorial_electronics_switch_off")} · LOW · 0 V`}
			</text>
		</g>
	);
};

/** A light switch in its off and on state, as an analogy for digital signals. */
const LightSwitch = () => {
	const { t } = useTranslation();
	return (
		<Box
			component="svg"
			viewBox="0 0 440 175"
			role="img"
			aria-label={t("tutorial_electronics_switch_label")}
			sx={{ display: "block", width: "100%", maxWidth: 480, my: 2 }}
		>
			<Panel on={false} x={0} />
			<Panel on x={220} />
		</Box>
	);
};

export default LightSwitch;
