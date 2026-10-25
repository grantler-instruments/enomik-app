import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import { Button, Paper, useTheme } from "@mui/material";
import {
	type PointerEvent,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import type { Sample, Swarm } from "../../hooks/useGrantulatorEngine";
import { useGrantulatorStore } from "../../store/grantulator";
import GrainCanvas from "./GrainCanvas";

/** Distance between two positions on the sample, which wraps around. */
const wrappedDistance = (a: number, b: number) => {
	const d = Math.abs(a - b) % 1;
	return Math.min(d, 1 - d);
};

/** How close to a window edge, in pixels, a press grabs the edge. */
const EDGE_PX = 6;

type Grab =
	/** Moving the window: position minus pointer. */
	| { mode: "move"; offset: number }
	/** Resizing the window from one of its edges. */
	| { mode: "spread" };

/**
 * The waveform: drop a file on it, or drag the grain window (position and
 * spread) along it. Grabbing inside the window moves it from where it was
 * grabbed; grabbing an edge widens or narrows it around its center; pressing
 * elsewhere jumps it there first.
 */
const Dropzone = ({
	sample,
	swarm,
	onFile,
}: {
	sample: Sample | null;
	swarm: RefObject<Swarm>;
	onFile: (file: File) => void;
}) => {
	const theme = useTheme();
	const fileInput = useRef<HTMLInputElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	/** A file is being dragged over. */
	const [fileOver, setFileOver] = useState(false);
	const grab = useRef<Grab | null>(null);
	/** The pointer is over a window edge: show a resize cursor. */
	const [overEdge, setOverEdge] = useState(false);
	const setValue = useGrantulatorStore((s) => s.setValue);

	/** Where the pointer is on the sample, 0..1, and where the window is. */
	const locate = (e: PointerEvent<HTMLElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const at = (e.clientX - rect.left) / rect.width;
		const { values } = useGrantulatorStore.getState();
		// The window is drawn around the drifting center, if drift is on.
		const center = swarm.current.center ?? values.position;
		const distance = wrappedDistance(at, center);
		const half = values.spread / 2;
		const tolerance = EDGE_PX / rect.width;
		// A narrow (even zero-width) window can be grabbed within EDGE_PX of
		// its center to move it; its edges then sit just outside that.
		const core = Math.max(half, tolerance);
		const onEdge =
			half > 2 * tolerance
				? Math.abs(distance - half) <= tolerance
				: distance > core && distance <= core + 2 * tolerance;
		const inside = !onEdge && distance <= core;
		return { at, center, distance, inside, onEdge, position: values.position };
	};

	const onPointerDown = (e: PointerEvent<HTMLElement>) => {
		if (!sample || e.button !== 0) return;
		const { at, inside, onEdge, position } = locate(e);
		if (onEdge) {
			grab.current = { mode: "spread" };
		} else {
			grab.current = { mode: "move", offset: inside ? position - at : 0 };
			if (!inside) setValue("position", Math.min(1, Math.max(0, at)));
		}
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const onPointerMove = (e: PointerEvent<HTMLElement>) => {
		if (!sample) return;
		const { at, distance, onEdge } = locate(e);
		if (!grab.current) {
			setOverEdge(onEdge);
		} else if (grab.current.mode === "move") {
			const position = at + grab.current.offset;
			setValue("position", Math.min(1, Math.max(0, position)));
		} else {
			// Both edges follow: the window stays centered.
			setValue("spread", Math.min(1, 2 * distance));
		}
	};

	const onPointerUp = () => {
		grab.current = null;
	};

	// Peaks per pixel column.
	useEffect(() => {
		const element = canvas.current;
		const g = element?.getContext("2d");
		if (!element || !g) return;
		const width = element.clientWidth;
		const height = element.clientHeight;
		element.width = width * devicePixelRatio;
		element.height = height * devicePixelRatio;
		g.scale(devicePixelRatio, devicePixelRatio);
		g.clearRect(0, 0, width, height);
		if (!sample) return;
		const data = sample.buffer.getChannelData(0);
		const perPixel = Math.max(1, Math.floor(data.length / width));
		g.fillStyle = theme.palette.text.secondary;
		for (let x = 0; x < width; x++) {
			let peak = 0;
			const from = x * perPixel;
			for (let i = from; i < from + perPixel && i < data.length; i++) {
				peak = Math.max(peak, Math.abs(data[i]));
			}
			const h = Math.max(1, peak * height);
			g.fillRect(x, (height - h) / 2, 1, h);
		}
	}, [sample, theme]);

	return (
		<Paper
			variant="outlined"
			// No sample yet: the whole area opens the file picker.
			onClick={() => !sample && fileInput.current?.click()}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
			onDragOver={(e) => {
				e.preventDefault();
				setFileOver(true);
			}}
			onDragLeave={() => setFileOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setFileOver(false);
				const file = e.dataTransfer.files[0];
				if (file) onFile(file);
			}}
			sx={{
				position: "relative",
				height: 160,
				cursor: !sample ? "pointer" : overEdge ? "col-resize" : "ew-resize",
				// Dragging the window shouldn't scroll the page on touch.
				touchAction: "none",
				userSelect: "none",
				borderStyle: "dashed",
				borderWidth: 2,
				borderColor: fileOver ? "primary.main" : "divider",
				overflow: "hidden",
			}}
		>
			<canvas ref={canvas} style={{ width: "100%", height: "100%" }} />
			{sample && (
				<GrainCanvas swarm={swarm} duration={sample.buffer.duration} />
			)}
			<Button
				size="small"
				color="inherit"
				startIcon={<UploadFileIcon />}
				// Not a window drag, and not a second click on the area.
				onPointerDown={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation();
					fileInput.current?.click();
				}}
				sx={{
					position: "absolute",
					top: 4,
					left: 4,
					color: "text.secondary",
					textTransform: "none",
				}}
			>
				{sample
					? `${sample.name} (${sample.buffer.duration.toFixed(1)} s)`
					: "Drop an audio file here, or click to choose one"}
			</Button>
			<input
				ref={fileInput}
				type="file"
				accept="audio/*"
				hidden
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) onFile(file);
					e.target.value = "";
				}}
			/>
		</Paper>
	);
};

export default Dropzone;
