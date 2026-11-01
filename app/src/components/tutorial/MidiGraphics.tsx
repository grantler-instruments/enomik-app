import { Box, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

type Part = { label: string; value: string; sub?: string; hex: string };

const BOX_W = 150;
const GAP = 10;

/** One MIDI message as status byte plus data bytes, with their hex values. */
export const MessageDiagram = ({ kind }: { kind: "note" | "cc" }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const font = theme.typography.fontFamily;
	const channel = `${t("tutorial_midi_channel")} 1`;
	const parts: Part[] =
		kind === "note"
			? [
					{
						label: t("tutorial_midi_status"),
						value: "Note On",
						sub: channel,
						hex: "0x90",
					},
					{ label: t("tutorial_midi_note"), value: "60", hex: "0x3C" },
					{ label: t("tutorial_midi_velocity"), value: "100", hex: "0x64" },
				]
			: [
					{
						label: t("tutorial_midi_status"),
						value: "Control Change",
						sub: channel,
						hex: "0xB0",
					},
					{ label: t("tutorial_midi_controller"), value: "7", hex: "0x07" },
					{ label: t("tutorial_midi_value"), value: "100", hex: "0x64" },
				];
	const width = parts.length * BOX_W + (parts.length - 1) * GAP;

	return (
		<Box
			component="svg"
			viewBox={`0 0 ${width} 100`}
			role="img"
			aria-label={parts
				.map((p) => `${p.label}: ${p.value}${p.sub ? `, ${p.sub}` : ""}`)
				.join(", ")}
			sx={{ display: "block", width: "100%", maxWidth: 520, my: 2 }}
		>
			{parts.map((part, index) => {
				const x = index * (BOX_W + GAP);
				const status = index === 0;
				return (
					<g key={part.hex + part.label} fontFamily={font}>
						<rect
							x={x + 1}
							y={1}
							width={BOX_W - 2}
							height={70}
							rx={8}
							fill={
								status
									? theme.palette.secondary.main
									: theme.palette.background.paper
							}
							fillOpacity={status ? 0.15 : 1}
							stroke={
								status ? theme.palette.secondary.main : theme.palette.divider
							}
							strokeWidth={1.5}
						/>
						<text
							x={x + BOX_W / 2}
							y={24}
							textAnchor="middle"
							fontSize={12}
							fill={theme.palette.text.secondary}
						>
							{part.label}
						</text>
						<text
							x={x + BOX_W / 2}
							y={status ? 45 : 52}
							textAnchor="middle"
							fontSize={status ? 13 : 18}
							fontWeight={600}
							fill={theme.palette.text.primary}
						>
							{part.value}
						</text>
						{part.sub && (
							<text
								x={x + BOX_W / 2}
								y={61}
								textAnchor="middle"
								fontSize={12}
								fill={theme.palette.text.secondary}
							>
								{part.sub}
							</text>
						)}
						<text
							x={x + BOX_W / 2}
							y={92}
							textAnchor="middle"
							fontSize={13}
							fontFamily="monospace"
							fill={theme.palette.text.secondary}
						>
							{part.hex}
						</text>
					</g>
				);
			})}
		</Box>
	);
};

const WHITE = [
	{ name: "C4", note: 60 },
	{ name: "D", note: 62 },
	{ name: "E", note: 64 },
	{ name: "F", note: 65 },
	{ name: "G", note: 67 },
	{ name: "A", note: 69 },
	{ name: "B", note: 71 },
	{ name: "C5", note: 72 },
];
// Black keys sit after these white key indices
const BLACK = [
	{ after: 0, note: 61 },
	{ after: 1, note: 63 },
	{ after: 3, note: 66 },
	{ after: 4, note: 68 },
	{ after: 5, note: 70 },
];
const KEY_W = 50;
const KEY_H = 150;
const PRESSED = 60;

/** One octave with MIDI note numbers; middle C is highlighted. */
export const Keyboard = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const font = theme.typography.fontFamily;
	const accent = theme.palette.secondary.main;

	return (
		<Box
			component="svg"
			viewBox={`0 0 ${WHITE.length * KEY_W + 2} ${KEY_H + 30}`}
			role="img"
			aria-label={t("tutorial_midi_keyboard_label")}
			sx={{ display: "block", width: "100%", maxWidth: 440, my: 2 }}
		>
			<g fontFamily={font}>
				{WHITE.map((key, index) => {
					const pressed = key.note === PRESSED;
					return (
						<g key={key.note}>
							<rect
								x={index * KEY_W + 1}
								y={1}
								width={KEY_W}
								height={KEY_H}
								rx={4}
								fill={pressed ? accent : "#ffffff"}
								stroke="#555555"
								strokeWidth={1.5}
							/>
							<text
								x={index * KEY_W + KEY_W / 2 + 1}
								y={KEY_H - 28}
								textAnchor="middle"
								fontSize={11}
								fill={pressed ? "#ffffff" : "#666666"}
							>
								{key.name}
							</text>
							<text
								x={index * KEY_W + KEY_W / 2 + 1}
								y={KEY_H - 10}
								textAnchor="middle"
								fontSize={15}
								fontWeight={600}
								fill={pressed ? "#ffffff" : "#222222"}
							>
								{key.note}
							</text>
						</g>
					);
				})}
				{BLACK.map((key) => {
					const x = (key.after + 1) * KEY_W + 1 - 15;
					return (
						<g key={key.note}>
							<rect x={x} y={1} width={30} height={92} rx={3} fill="#222222" />
							<text
								x={x + 15}
								y={82}
								textAnchor="middle"
								fontSize={11}
								fill="#ffffff"
							>
								{key.note}
							</text>
						</g>
					);
				})}
				<text
					x={KEY_W / 2 + 1}
					y={KEY_H + 22}
					textAnchor="start"
					fontSize={12}
					fill={theme.palette.text.secondary}
				>
					{t("tutorial_midi_keyboard_caption")}
				</text>
			</g>
		</Box>
	);
};
