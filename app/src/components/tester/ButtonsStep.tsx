import { Box, Button, Typography } from "@mui/material";
import { CYCLE_PIN, MIDI_TYPES } from "../../utils/tester";
import {
	type Path,
	ROWS,
	rowKey,
	type TesterState,
} from "../../utils/testerState";
import PathChips from "./PathChips";

const ButtonsStep = ({
	state,
	paths,
	passed,
	onBack,
	onNext,
}: {
	state: TesterState;
	paths: Path[];
	passed: boolean;
	onBack: () => void;
	onNext: () => void;
}) => (
	<>
		<Typography variant="body2" color="text.secondary" mb={1}>
			Press each button. Pin {CYCLE_PIN} sends the next MIDI type after every
			release.
		</Typography>
		{ROWS.map((row) => {
			const key = rowKey(row.pin, row.status);
			const next =
				row.pin === CYCLE_PIN &&
				MIDI_TYPES[state.typeIndex].status === row.status;
			return (
				<Box key={key} display="flex" gap={1} alignItems="center" mb={1}>
					<Typography
						width={60}
						fontWeight={state.pressed[row.pin] ? "bold" : undefined}
					>
						Pin {row.pin}
					</Typography>
					<Typography width={140} color={next ? "primary" : "text.secondary"}>
						{row.label}
						{next && " ←"}
					</Typography>
					<PathChips paths={paths} seen={state.buttons[key]} />
				</Box>
			);
		})}
		<Box display="flex" gap={1} mt={2}>
			<Button onClick={onBack}>Back</Button>
			<Button variant="contained" onClick={onNext}>
				{passed ? "Next" : "Skip"}
			</Button>
		</Box>
	</>
);

export default ButtonsStep;
