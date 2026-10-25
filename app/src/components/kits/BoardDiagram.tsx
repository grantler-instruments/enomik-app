import { Box, Chip, Tooltip, useTheme } from "@mui/material";
import type { SVGProps } from "react";
import { useTranslation } from "react-i18next";
import type { Board, BoardPin, LabelSide, PinGroup, PinType } from "./boards";

const PAD_RADIUS = 0.7;
const LABEL_SIZE = 0.75;
const NAME_SIZE = 0.8;
const GROUP_LABEL_SIZE = 0.65;
/** Room around the board for the pad labels, in mm. */
const MARGIN = 3;

/** Legend order. */
const PIN_TYPES: PinType[] = [
	"touch",
	"neopixel",
	"digital",
	"analog",
	"i2c_sda",
	"i2c_scl",
	"power_5v",
	"power_3v3",
	"gnd",
	"nc",
];

const usePinColors = (): Record<PinType, string> => {
	const { palette } = useTheme();
	return {
		touch: palette.info.main,
		neopixel: palette.warning.main,
		digital: palette.success.main,
		analog: palette.primary.main,
		i2c_sda: palette.secondary.main,
		i2c_scl: palette.secondary.dark,
		power_5v: palette.error.main,
		power_3v3: palette.error.light,
		gnd: palette.text.primary,
		nc: palette.text.disabled,
	};
};

/** Text position and anchor for a label on the given side of its pad. */
const labelPosition = (
	pin: BoardPin,
	side: LabelSide,
): {
	x: number;
	y: number;
	anchor: "middle" | "start" | "end";
	baseline: "auto" | "hanging" | "central";
} => {
	const gap = PAD_RADIUS + 0.4;
	switch (side) {
		case "top":
			return { x: pin.x, y: pin.y - gap, anchor: "middle", baseline: "auto" };
		case "bottom":
			return {
				x: pin.x,
				y: pin.y + gap,
				anchor: "middle",
				baseline: "hanging",
			};
		case "left":
			return { x: pin.x - gap, y: pin.y, anchor: "end", baseline: "central" };
		case "right":
			return {
				x: pin.x + gap,
				y: pin.y,
				anchor: "start",
				baseline: "central",
			};
	}
};

/** Group label just outside the frame; left/right labels run vertically. */
const groupLabelProps = (group: PinGroup): SVGProps<SVGTextElement> => {
	const gap = 0.3;
	const cx = group.x + group.width / 2;
	const cy = group.y + group.height / 2;
	switch (group.labelSide) {
		case "top":
			return { x: cx, y: group.y - gap, dominantBaseline: "auto" };
		case "bottom":
			return {
				x: cx,
				y: group.y + group.height + gap,
				dominantBaseline: "hanging",
			};
		case "left": {
			const x = group.x - gap;
			return { x, y: cy, transform: `rotate(-90 ${x} ${cy})` };
		}
		case "right": {
			const x = group.x + group.width + gap;
			return { x, y: cy, transform: `rotate(90 ${x} ${cy})` };
		}
	}
};

const BoardDiagram = ({ board }: { board: Board }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const colors = usePinColors();
	const groupColors = { digital: colors.digital, analog: colors.analog };
	const usedTypes = PIN_TYPES.filter((type) =>
		board.pins.some((pin) => pin.type === type),
	);

	return (
		<Box>
			<Box
				component="svg"
				viewBox={`${-MARGIN} ${-MARGIN} ${board.width + 2 * MARGIN} ${board.height + 2 * MARGIN}`}
				role="img"
				aria-label={t("kits_board_diagram", { name: board.name })}
				sx={{ width: "100%", maxWidth: 960, display: "block" }}
			>
				<rect
					width={board.width}
					height={board.height}
					rx={board.cornerRadius}
					fill={theme.palette.action.hover}
					stroke={theme.palette.divider}
					strokeWidth={0.3}
				/>
				{board.mountingHoles?.map((hole) => (
					<circle
						key={`${hole.x}-${hole.y}`}
						cx={hole.x}
						cy={hole.y}
						r={hole.diameter / 2}
						fill={theme.palette.background.paper}
						stroke={theme.palette.divider}
						strokeWidth={0.2}
					/>
				))}
				{board.outlines.map((outline) => (
					<g key={`${outline.x}-${outline.y}`}>
						<rect
							x={outline.x}
							y={outline.y}
							width={outline.width}
							height={outline.height}
							rx={0.3}
							fill="none"
							stroke={theme.palette.text.secondary}
							strokeWidth={0.12}
							strokeDasharray={outline.part ? "0.6 0.4" : undefined}
						/>
						{outline.name && (
							<text
								x={outline.x + outline.width / 2}
								y={
									outline.part
										? outline.y + outline.height / 2
										: outline.y + outline.height + 0.3
								}
								fontSize={outline.part ? 1.4 : NAME_SIZE}
								textAnchor="middle"
								dominantBaseline={outline.part ? "central" : "hanging"}
								fill={theme.palette.text.secondary}
							>
								{outline.name}
							</text>
						)}
					</g>
				))}
				{board.groups.map((group) => (
					<g key={`${group.x}-${group.y}`} color={groupColors[group.kind]}>
						<rect
							x={group.x}
							y={group.y}
							width={group.width}
							height={group.height}
							rx={0.5}
							fill="none"
							stroke="currentColor"
							strokeWidth={0.15}
						/>
						<text
							{...groupLabelProps(group)}
							fontSize={GROUP_LABEL_SIZE}
							fontWeight={600}
							textAnchor="middle"
							fill="currentColor"
						>
							{t(`kits_group_${group.kind}`)}
						</text>
					</g>
				))}
				{board.pins.map((pin) => {
					const label = labelPosition(pin, pin.labelSide ?? "top");
					const description = [
						pin.gpio !== undefined ? `GPIO ${pin.gpio}` : pin.label,
						t(`kits_pin_${pin.type}`),
					].join(" · ");
					return (
						<Tooltip key={`${pin.x}-${pin.y}`} title={description} arrow>
							<g tabIndex={0} aria-label={description}>
								<circle
									cx={pin.x}
									cy={pin.y}
									r={PAD_RADIUS}
									fill={colors[pin.type]}
									stroke={theme.palette.background.paper}
									strokeWidth={0.15}
								/>
								{pin.label && (
									<text
										x={label.x}
										y={label.y}
										fontSize={LABEL_SIZE}
										textAnchor={label.anchor}
										dominantBaseline={label.baseline}
										fill={theme.palette.text.primary}
									>
										{pin.label}
									</text>
								)}
							</g>
						</Tooltip>
					);
				})}
			</Box>
			<Box display="flex" flexWrap="wrap" gap={1} mt={2}>
				{usedTypes.map((type) => (
					<Chip
						key={type}
						size="small"
						variant="outlined"
						label={t(`kits_pin_${type}`)}
						icon={
							<Box
								component="span"
								sx={{
									width: 10,
									height: 10,
									borderRadius: "50%",
									bgcolor: colors[type],
								}}
							/>
						}
					/>
				))}
			</Box>
		</Box>
	);
};

export default BoardDiagram;
