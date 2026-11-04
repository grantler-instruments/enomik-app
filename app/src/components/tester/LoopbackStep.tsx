import { ThumbDown, ThumbUp } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
	const { ledPin, loopNote, loopbackOn } = state;
	return (
		<>
			<Typography variant="body2" color="text.secondary">
				{t("tester_loopback_text", { pin: CYCLE_PIN, ledPin })}
			</Typography>
			<Box display="flex" gap={1} alignItems="center" mt={1}>
				<Typography
					width={140}
					fontWeight={loopNote.held && !loopNote.released ? "bold" : undefined}
				>
					{t("tester_note", { note: ledPin })}
				</Typography>
				<PathChips paths={paths} seen={loopNote} />
			</Box>
			{loopNote.released && (
				<Typography mt={2}>{t("tester_led_question")}</Typography>
			)}
			<Box display="flex" gap={1} mt={1} alignItems="center">
				<Button disabled={!loopbackOn} onClick={onBack}>
					{t("tester_back")}
				</Button>
				{loopNote.released && (
					<>
						<IconButton
							color="success"
							aria-label={t("tester_led_lit")}
							disabled={!loopbackOn}
							onClick={() => onAnswer(true)}
						>
							<ThumbUp />
						</IconButton>
						<IconButton
							color="error"
							aria-label={t("tester_led_not_lit")}
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
