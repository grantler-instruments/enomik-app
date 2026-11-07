import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * The ESP-NOW MIDI topology: two MIDI hosts, each with a dongle, and four
 * client boards in between, all talking to each other over the air.
 * Drawn after the architecture diagram, in theme colours, rearranged into a
 * near-square so it fits next to the landing page text: host 1 and its
 * dongle on the left, the clients in the middle, host 2 on the right.
 */
const LEFT = 189;
const RIGHT = 811;
const HUB = { x: 340, y: 510 };
const BOARDS = [300, 410, 560, 670].map((y) => ({ x: 430, y }));
const WIRELESS = [
	`M${LEFT + 52} ${HUB.y}H${HUB.x}`,
	...BOARDS.map((b) => `M${HUB.x} ${HUB.y} ${b.x} ${b.y + 35}`),
	`M${HUB.x} ${HUB.y}H${RIGHT - 51}`,
];
/** Host 1 to its dongle, and dongle 2 to host 2: the broadcast's way. */
const LINKS = [`M${LEFT} 290V380`, `M${RIGHT} 380V290`];

/** One round of the animation, in seconds; every packet repeats with it. */
const CYCLE = 6;

/**
 * A MIDI message travelling along a path from `from` to `to` seconds into
 * each cycle, hidden the rest of the time. `back`: from the path's end to
 * its start. `usb`: a USB MIDI message, in the second colour; ESP-NOW
 * messages are in the primary colour.
 */
const Packet = ({
	path,
	from,
	to,
	back,
	usb,
}: {
	path: string;
	from: number;
	to: number;
	back?: boolean;
	usb?: boolean;
}) => {
	const a = from / CYCLE;
	const b = to / CYCLE;
	return (
		<circle r={7} opacity={0} className={usb ? "sp-back" : "sp-fwd"}>
			<animateMotion
				path={path}
				dur={`${CYCLE}s`}
				repeatCount="indefinite"
				keyPoints={back ? "1;1;0;0" : "0;0;1;1"}
				keyTimes={`0;${a};${b};1`}
				calcMode="linear"
			/>
			<animate
				attributeName="opacity"
				dur={`${CYCLE}s`}
				repeatCount="indefinite"
				values="0;1;0"
				keyTimes={`0;${a};${b}`}
				calcMode="discrete"
			/>
		</circle>
	);
};

/**
 * What the dots act out, every cycle:
 * 1. Host 1 sends a message over USB; its dongle broadcasts it over the
 *    air, and every client and the other dongle receive it at once.
 * 2. A client answers its dongle, which passes it on to host 1.
 */
const Messages = () => (
	<g>
		<Packet path={LINKS[0]} from={0.2} to={0.8} usb />
		<Packet path={WIRELESS[0]} from={0.8} to={1.1} />
		{WIRELESS.slice(1).map((path) => (
			<Packet key={path} path={path} from={1.1} to={1.9} />
		))}
		<Packet path={LINKS[1]} from={1.9} to={2.4} usb />

		<Packet path={WIRELESS[2]} from={3.2} to={3.9} back />
		<Packet path={WIRELESS[0]} from={3.9} to={4.2} back />
		<Packet path={LINKS[0]} from={4.2} to={4.8} back usb />
	</g>
);

const PIN_X = [10, 25, 40, 55, 70, 85, 100];

/** An ESP32-S2 Mini. */
const Board = ({ x, y }: { x: number; y: number }) => (
	<g transform={`translate(${x} ${y})`}>
		<rect className="sp-board" width={135} height={70} rx={8} />
		<rect className="sp-detail" x={14} y={22} width={20} height={27} />
		<rect className="sp-detail" x={56} y={18} width={31} height={34} />
		<path className="sp-detail" d="M111 17v36l12-7V24z" />
		{PIN_X.flatMap((cx) => [
			<circle key={`t${cx}`} className="sp-pin" cx={cx} cy={10} r={3} />,
			<circle key={`b${cx}`} className="sp-pin" cx={cx} cy={60} r={3} />,
		])}
	</g>
);

/** A laptop centred on `cx`. */
const Laptop = ({ cx, label }: { cx: number; label: string }) => {
	const x = cx - 129;
	return (
		<g>
			<rect
				className="sp-outline"
				x={x}
				y={40}
				width={258}
				height={150}
				rx={10}
			/>
			<path
				className="sp-outline"
				d={`M${x - 27} 222h312l-32-32H${x + 5}zM${x + 99} 222h60`}
			/>
			<text className="sp-label" x={cx} y={262} textAnchor="middle">
				{label}
			</text>
		</g>
	);
};

/** A dongle centred on `cx`, plugged in from the top. */
const Dongle = ({
	cx,
	label,
	gap,
}: {
	cx: number;
	label: string;
	/** Between the two label lines. */
	gap: number;
}) => {
	const x = cx - 51;
	return (
		<g>
			<rect
				className="sp-board"
				x={x}
				y={430}
				width={103}
				height={160}
				rx={14}
			/>
			<path
				className="sp-detail"
				d={`M${x + 20} 430v-38h63v38M${x + 22} 482h60v73h-60z`}
			/>
			<circle className="sp-pin" cx={x + 52} cy={565} r={5} />
			<text className="sp-label" x={cx} y={635} textAnchor="middle">
				ESP-NOW
			</text>
			<text className="sp-label" x={cx} y={635 + gap} textAnchor="middle">
				{label}
			</text>
		</g>
	);
};

/** The bidirectional USB MIDI link between a host and its dongle. */
const Link = ({ path, x }: { path: string; x: number }) => (
	<g>
		<path d={path} className="sp-link" />
		<path d={`M${x} 290l-11 18h22zM${x} 380l-11-18h22z`} className="sp-arrow" />
		<text className="sp-small sp-usb" x={x + 20} y={343}>
			MIDI
		</text>
	</g>
);

const SignalPath = () => {
	const { t } = useTranslation();
	const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	// On a phone the labels would get tiny: bigger ones there.
	const narrow = useMediaQuery(useTheme().breakpoints.down("sm"));
	const host = t("tutorial_architecture_host");
	const dongle = `MIDI ${t("device_kind_dongle")}`;

	return (
		<Box
			component="svg"
			viewBox="0 20 1000 740"
			role="img"
			aria-label={t("home_topology_label")}
			sx={(theme) => {
				const ink = theme.palette.text.primary;
				const accent = theme.palette.primary.main;
				const usb = theme.palette.secondary.main;
				return {
					width: "100%",
					height: "auto",
					display: "block",
					"& .sp-outline": {
						fill: theme.palette.background.paper,
						stroke: ink,
						strokeWidth: 5,
						strokeLinecap: "round",
						strokeLinejoin: "round",
					},
					"& .sp-board": {
						fill: theme.palette.background.paper,
						stroke: ink,
						strokeWidth: 4,
					},
					"& .sp-detail": {
						fill: "none",
						stroke: ink,
						strokeWidth: 3,
						strokeLinejoin: "round",
					},
					"& .sp-pin, & .sp-fwd": { fill: accent },
					// USB MIDI in the second colour, ESP-NOW in the primary one.
					"& .sp-arrow, & .sp-back": { fill: usb },
					"& .sp-link": { stroke: usb, strokeWidth: 5 },
					"& .sp-wireless": {
						fill: "none",
						stroke: accent,
						strokeWidth: 4,
						strokeLinecap: "round",
						strokeDasharray: "12 12",
					},
					"& .sp-label": {
						fill: ink,
						font: `600 ${narrow ? 32 : 25}px ${theme.typography.fontFamily}`,
						letterSpacing: "0.5px",
						textTransform: "uppercase",
					},
					"& .sp-small": {
						fill: accent,
						font: `600 ${narrow ? 28 : 22}px ${theme.typography.fontFamily}`,
						letterSpacing: "1px",
					},
					"& .sp-small.sp-usb": { fill: usb },
				};
			}}
		>
			<Laptop cx={LEFT} label={host} />
			<Link path={LINKS[0]} x={LEFT} />
			<Dongle cx={LEFT} label={dongle} gap={narrow ? 42 : 33} />

			<text
				className="sp-small"
				x={BOARDS[0].x + 67}
				y={BOARDS[0].y - 18}
				textAnchor="middle"
			>
				ESP-NOW
			</text>
			<path className="sp-wireless" d={WIRELESS.join("")} />
			<circle cx={HUB.x} cy={HUB.y} r={9} className="sp-pin" />

			{BOARDS.map((b) => (
				<Board key={b.y} x={b.x} y={b.y} />
			))}

			<Dongle cx={RIGHT} label={dongle} gap={narrow ? 42 : 33} />
			<Link path={LINKS[1]} x={RIGHT} />
			<Laptop cx={RIGHT} label={`${host} 2`} />

			{!reduceMotion && <Messages />}
		</Box>
	);
};

export default SignalPath;
