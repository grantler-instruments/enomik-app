import { useTheme } from "@mui/material/styles";

interface LogoProps {
	width?: number;
	height?: number;
}

const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 260;
const SIDE = 120;
const RADIUS = 30;
const CIRCLE_STROKE = 4;
const LINE_STROKE = 3;
/** Space between a line end and its circle. */
const GAP = 5;
/** Dashes per connection; odd, so the pattern is symmetric. */
const DASHES = 3;
const PIN_RADIUS = 4;
/** Distance of the five DIN pins from their circle's center. */
const PIN_RING = 16;

const TRIANGLE_HEIGHT = (Math.sqrt(3) / 2) * SIDE;
// The triangle's bounding box (not its centroid) sits in the middle of the view
const CENTER_X = VIEW_WIDTH / 2;
const TOP_Y = VIEW_HEIGHT / 2 - TRIANGLE_HEIGHT / 2;
const BOTTOM_Y = VIEW_HEIGHT / 2 + TRIANGLE_HEIGHT / 2;

const NODES = [
	{ x: CENTER_X, y: TOP_Y },
	{ x: CENTER_X - SIDE / 2, y: BOTTOM_Y },
	{ x: CENTER_X + SIDE / 2, y: BOTTOM_Y },
];

/** Pins on a regular pentagon, one pointing up. */
const PINS = Array.from({ length: 5 }, (_, i) => {
	const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
	return { dx: PIN_RING * Math.cos(angle), dy: PIN_RING * Math.sin(angle) };
});

const LINE_LENGTH = SIDE - 2 * (RADIUS + GAP);
// Equal dashes and gaps that start and end with a dash
const DASH = LINE_LENGTH / (2 * DASHES - 1);

const CONNECTIONS = [
	[0, 1],
	[0, 2],
	[1, 2],
].map(([from, to]) => {
	const a = NODES[from];
	const b = NODES[to];
	const ux = (b.x - a.x) / SIDE;
	const uy = (b.y - a.y) / SIDE;
	const offset = RADIUS + GAP;
	return {
		key: `${from}-${to}`,
		x1: a.x + ux * offset,
		y1: a.y + uy * offset,
		x2: b.x - ux * offset,
		y2: b.y - uy * offset,
	};
});

const Logo: React.FC<LogoProps> = ({ width = 64, height = 64 }) => {
	const color = useTheme().palette.primary.main;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
			width={width}
			height={height}
		>
			<title>Grantler Instruments</title>
			{NODES.map((node) => (
				<g key={`${node.x},${node.y}`}>
					<circle
						cx={node.x}
						cy={node.y}
						r={RADIUS}
						fill="none"
						stroke={color}
						strokeWidth={CIRCLE_STROKE}
					/>
					{PINS.map((pin) => (
						<circle
							key={`${pin.dx},${pin.dy}`}
							cx={node.x + pin.dx}
							cy={node.y + pin.dy}
							r={PIN_RADIUS}
							fill={color}
						/>
					))}
				</g>
			))}
			{CONNECTIONS.map(({ key, ...line }) => (
				<line
					key={key}
					{...line}
					stroke={color}
					strokeWidth={LINE_STROKE}
					strokeDasharray={`${DASH} ${DASH}`}
				/>
			))}
		</svg>
	);
};

export default Logo;
