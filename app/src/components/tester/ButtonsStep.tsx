import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
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
}) => {
	const { t } = useTranslation();
	return (
		<>
			<Typography variant="body2" color="text.secondary" mb={1}>
				{t("tester_buttons_text", { pin: CYCLE_PIN })}
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
							{t("tester_pin", { pin: row.pin })}
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
				<Button onClick={onBack}>{t("tester_back")}</Button>
				<Button variant="contained" onClick={onNext}>
					{passed ? t("tester_next") : t("tester_skip")}
				</Button>
			</Box>
		</>
	);
};

export default ButtonsStep;
