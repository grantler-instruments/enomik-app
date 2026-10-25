import { useTheme } from "@mui/material";
import { type RefObject, useEffect, useRef } from "react";
import type { Swarm } from "../../hooks/useGrantulatorEngine";
import { useGrantulatorStore } from "../../store/grantulator";
import { grainTravel, voicePhase, voiceRate } from "../../utils/grantulator";

/**
 * The swarm over the waveform: the position with the spread around it, and
 * one dot per playing grain at its read position in the sample, one row per
 * voice, ordered by phase. Without jitter the voices fire in that order, so
 * the grains sweep down the rows; jitter scrambles them. Dots swell and fade with the grain
 * envelope and drag a tail back to where the grain started; the color shows
 * the detune, blue down to orange up.
 */
const GrainCanvas = ({
	swarm,
	duration,
}: {
	swarm: RefObject<Swarm>;
	duration: number;
}) => {
	const theme = useTheme();
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const element = canvas.current;
		const g = element?.getContext("2d");
		if (!element || !g) return;
		let frame = 0;
		const draw = () => {
			frame = requestAnimationFrame(draw);
			const width = element.clientWidth;
			const height = element.clientHeight;
			if (element.width !== width * devicePixelRatio) {
				element.width = width * devicePixelRatio;
				element.height = height * devicePixelRatio;
			}
			g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
			g.clearRect(0, 0, width, height);

			const { values } = useGrantulatorStore.getState();
			const position = swarm.current.center ?? values.position;
			const { spread } = values;
			const left = (position - spread / 2) * width;
			g.fillStyle = theme.palette.primary.main;
			g.globalAlpha = 0.25;
			// The spread wraps around the sample ends like the grains do.
			for (const shift of [-width, 0, width]) {
				g.fillRect(left + shift, 0, spread * width, height);
			}
			g.globalAlpha = 1;
			g.fillRect(position * width - 1, 0, 2, height);

			const {
				size,
				jitter,
				pitch,
				grains: count,
			} = useGrantulatorStore.getState().values;
			const now = performance.now();
			for (const [voice, grain] of swarm.current.voices) {
				if (voice >= count) continue;
				const length = 1000 / voiceRate(voice, size, jitter);
				const travel = grainTravel(length, pitch, duration);
				const progress = (now - grain.born) / length;
				if (progress < 0 || progress > 1) continue;
				const envelope = Math.sin(Math.PI * progress) ** 2;
				const wrap = (v: number) => (((v % 1) + 1) % 1) * width;
				const from = wrap(grain.offset);
				const x = wrap(grain.offset + progress * travel * grain.ratio);
				// Higher phases wrap, and start their grains, first.
				const y = 8 + (1 - voicePhase(voice)) * (height - 16);
				const semitones = 12 * Math.log2(grain.ratio);
				const color = `hsl(${200 - semitones * 15} 85% 55%)`;
				g.globalAlpha = 0.15 + 0.85 * envelope;
				g.strokeStyle = color;
				g.fillStyle = color;
				// No tail across the wrap from the end back to the start.
				if (Math.abs(x - from) < width / 2) {
					g.lineWidth = 1;
					g.beginPath();
					g.moveTo(from, y);
					g.lineTo(x, y);
					g.stroke();
				}
				g.beginPath();
				g.arc(x, y, 1.5 + 5 * envelope, 0, 2 * Math.PI);
				g.fill();
			}
			g.globalAlpha = 1;
		};
		draw();
		return () => cancelAnimationFrame(frame);
	}, [swarm, duration, theme]);

	return (
		<canvas
			ref={canvas}
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
			}}
		/>
	);
};

export default GrainCanvas;
