import {
	Box,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/app";
import { useIOStore } from "../../store/io";
import Inputs from "../Inputs";
import { BOARD_SETS } from "../kits/boards";
import Outputs from "../Outputs";
import SectionHeader from "../SectionHeader";
import { MidiToPinIcon, PinToMidiIcon } from "../SectionIcons";
import BoardView from "./BoardView";

type Filter = "all" | "input" | "output";

/**
 * Board on the left, input and output mappings on the right (stacked on
 * smaller screens). Picking a pin on either side marks it on the other.
 */
const PinsPanel = () => {
	const { t } = useTranslation();
	const [selectedGpio, setSelectedGpio] = useState<number | null>(null);
	const [filter, setFilter] = useState<Filter>("all");
	const boardSetId = useAppStore((state) => state.configuratorBoard);
	// Several boards (e.g. client + extender) sit side by side above the
	// lists; a single board gets its own column next to them.
	const besideList =
		(BOARD_SETS.find((set) => set.id === boardSetId) ?? BOARD_SETS[0]).boards
			.length === 1;
	const inputCount = useIOStore((state) => state.inputs.length);
	const outputCount = useIOStore((state) => state.outputs.length);

	// From the board: show the pin's row, even if the filter hid it.
	const selectFromBoard = useCallback((gpio: number) => {
		setSelectedGpio(gpio);
		const { inputs, outputs } = useIOStore.getState();
		const isInput = inputs.some((input) => input.pin === gpio);
		const isOutput = outputs.some((output) => output.pin === gpio);
		setFilter((current) =>
			(current === "input" && !isInput) || (current === "output" && !isOutput)
				? "all"
				: current,
		);
		// After the filter change has rendered
		requestAnimationFrame(() =>
			document
				.querySelector(`[data-pin-row="${gpio}"]`)
				?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
		);
	}, []);

	return (
		<Box
			display="grid"
			gridTemplateColumns={{
				xs: "minmax(0, 1fr)",
				...(besideList && { xl: "minmax(320px, 2fr) minmax(0, 3fr)" }),
			}}
			gap={4}
			alignItems="start"
		>
			<Box
				sx={
					besideList
						? {
								position: { xl: "sticky" },
								// Below the sticky page toolbar
								top: { xl: 96 },
								maxHeight: { xl: "calc(100vh - 112px)" },
								overflowY: { xl: "auto" },
							}
						: undefined
				}
			>
				<BoardView
					sideBySide={!besideList}
					selectedGpio={selectedGpio}
					onSelect={selectFromBoard}
				/>
			</Box>
			<Stack spacing={3} minWidth={0}>
				<ToggleButtonGroup
					size="small"
					exclusive
					value={filter}
					onChange={(_, value: Filter | null) => value && setFilter(value)}
					aria-label={t("configurator_tab_pins")}
				>
					<ToggleButton value="all">{t("pins_filter_all")}</ToggleButton>
					<ToggleButton value="input">
						{t("kits_input")}
						<Count n={inputCount} />
					</ToggleButton>
					<ToggleButton value="output">
						{t("kits_output")}
						<Count n={outputCount} />
					</ToggleButton>
				</ToggleButtonGroup>
				{filter !== "output" && (
					<Box component="section">
						<SectionHeader
							title={t("section_input_pin_to_midi")}
							icon={<PinToMidiIcon />}
							tooltipKey="tooltip_pin_to_midi"
						/>
						<Inputs selectedGpio={selectedGpio} onSelect={setSelectedGpio} />
					</Box>
				)}
				{filter !== "input" && (
					<Box component="section">
						<SectionHeader
							title={t("section_midi_to_output_pin")}
							icon={<MidiToPinIcon />}
							tooltipKey="tooltip_midi_to_pin"
						/>
						<Outputs selectedGpio={selectedGpio} onSelect={setSelectedGpio} />
					</Box>
				)}
			</Stack>
		</Box>
	);
};

const Count = ({ n }: { n: number }) => (
	<Typography
		component="span"
		variant="caption"
		color="text.secondary"
		sx={{ ml: 0.75 }}
	>
		{n}
	</Typography>
);

export default PinsPanel;
