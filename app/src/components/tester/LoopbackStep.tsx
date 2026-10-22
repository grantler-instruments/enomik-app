import { ThumbDown, ThumbUp } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { CYCLE_PIN } from "../../utils/tester";
import type { Path, TesterState } from "../../utils/testerState";
import PathChips from "./PathChips";

const LoopbackStep = ({
	state,
	paths,
	onBack,
	onAnswer,
}: {
	state: TesterState;
	paths: Path[];
	onBack: () => void;
	onAnswer: (lit: boolean) => void;
}) => {
	const { ledPin, loopNote, loopbackOn } = state;
	return (
		<>
			<Typography variant="body2" color="text.secondary">
				Hold the pin {CYCLE_PIN} button: the LED on pin {ledPin} should light
				while pressed and go off on release. The note also goes out over USB and
				wirelessly (loopback is on during this step).
			</Typography>
			<Box display="flex" gap={1} alignItems="center" mt={1}>
				<Typography
					width={140}
					fontWeight={loopNote.held && !loopNote.released ? "bold" : undefined}
				>
					Note {ledPin}
				</Typography>
				<PathChips paths={paths} seen={loopNote} />
			</Box>
			{loopNote.released && (
				<Typography mt={2}>Did the LED light while pressed?</Typography>
			)}
			<Box display="flex" gap={1} mt={1} alignItems="center">
				<Button disabled={!loopbackOn} onClick={onBack}>
					Back
				</Button>
				{loopNote.released && (
					<>
						<IconButton
							color="success"
							aria-label="LED lit"
							disabled={!loopbackOn}
							onClick={() => onAnswer(true)}
						>
							<ThumbUp />
						</IconButton>
						<IconButton
							color="error"
							aria-label="LED not lit"
							disabled={!loopbackOn}
							onClick={() => onAnswer(false)}
						>
							<ThumbDown />
						</IconButton>
					</>
				)}
			</Box>
		</>
	);
};

export default LoopbackStep;
