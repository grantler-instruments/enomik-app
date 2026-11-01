import { Box, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

type Kind = "digital" | "analog" | "pwm";

const LEFT = 44; // room for the voltage labels
const WIDTH = 400;
const HIGH = 20;
const LOW = 80;

const pwmPath = () => {
	// 25 % duty cycle on the left half, 75 % on the right half
	let d = `M0 ${LOW}`;
	for (let x = 0; x < WIDTH; x += 40) {
		const on = x < WIDTH / 2 ? 10 : 30;
		d += ` V${HIGH} H${x + on} V${LOW} H${x + 40}`;
	}
	return d;
};

const PATHS: Record<Kind, string> = {
	digital: `M0 ${LOW} H60 V${HIGH} H140 V${LOW} H200 V${HIGH} H230 V${LOW} H310 V${HIGH} H${WIDTH}`,
	analog: "M0 65 C50 15, 90 15, 130 45 S210 85, 260 55 S350 15, 400 35",
	pwm: pwmPath(),
};

/** Small voltage-over-time plot of a digital, analog or PWM signal. */
const Waveform = ({ kind }: { kind: Kind }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const muted = theme.palette.text.secondary;
	const font = theme.typography.fontFamily;
	const height = kind === "pwm" ? 120 : 100;

	return (
		<Box
			component="svg"
			viewBox={`0 0 ${LEFT + WIDTH + 8} ${height}`}
			role="img"
			aria-label={t(`tutorial_electronics_${kind}_title`)}
			sx={{ display: "block", width: "100%", maxWidth: 560, my: 2 }}
		>
			<g fontSize={11} fontFamily={font} fill={muted}>
				<text x={LEFT - 6} y={HIGH + 4} textAnchor="end">
					3.3 V
				</text>
				<text x={LEFT - 6} y={LOW + 4} textAnchor="end">
					0 V
				</text>
				{kind === "pwm" && (
					<>
						<text x={LEFT + WIDTH / 4} y={LOW + 32} textAnchor="middle">
							{t("tutorial_electronics_pwm_dim")}
						</text>
						<text x={LEFT + (WIDTH * 3) / 4} y={LOW + 32} textAnchor="middle">
							{t("tutorial_electronics_pwm_bright")}
						</text>
					</>
				)}
			</g>
			<g transform={`translate(${LEFT} 0)`}>
				{[HIGH, LOW].map((y) => (
					<line
						key={y}
						x1={0}
						x2={WIDTH}
						y1={y}
						y2={y}
						stroke={theme.palette.divider}
						strokeDasharray="3 3"
					/>
				))}
				{kind === "pwm" && (
					<line
						x1={WIDTH / 2}
						x2={WIDTH / 2}
						y1={HIGH - 10}
						y2={LOW + 10}
						stroke={theme.palette.divider}
					/>
				)}
				<path
					d={PATHS[kind]}
					fill="none"
					stroke={theme.palette.secondary.main}
					strokeWidth={2}
					strokeLinejoin="round"
				/>
			</g>
		</Box>
	);
};

export default Waveform;
