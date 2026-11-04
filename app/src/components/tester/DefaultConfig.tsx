import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
	BUTTON_PINS,
	type CheckLine,
	DEFAULT_LED_SOURCE,
} from "../../utils/tester";
import CheckLines from "./CheckLines";

export type DefaultConfigState =
	| { status: "ask" | "writing" | "skipped" }
	| { status: "done"; lines: CheckLine[] };

/** After the tests: offer to write the config the board ships with. */
const DefaultConfig = ({
	state,
	ledPin,
	dongleMac,
	onWrite,
	onSkip,
}: {
	state: DefaultConfigState;
	ledPin: number;
	/** The tested dongle, kept as peer; null if unknown. */
	dongleMac: string | null;
	onWrite: () => void;
	onSkip: () => void;
}) => {
	const { t, i18n } = useTranslation();
	if (state.status === "skipped") return null;
	const failed = state.status === "done" && state.lines.some((l) => !l.ok);
	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Typography variant="h6" mb={1}>
				{t("tester_default_title")}
			</Typography>
			<Typography variant="body2" mb={2}>
				{t("tester_default_text", {
					pins: new Intl.ListFormat(i18n.language).format(
						BUTTON_PINS.map(String),
					),
					ledPin,
					source: DEFAULT_LED_SOURCE,
				})}{" "}
				{dongleMac
					? t("tester_default_dongle", { mac: dongleMac })
					: t("tester_default_no_dongle")}
			</Typography>
			{state.status === "done" ? (
				<>
					<CheckLines lines={state.lines} />
					<Alert
						severity={failed ? "error" : "success"}
						sx={{ mt: 1 }}
						action={
							failed && (
								<Button onClick={onWrite}>{t("tester_try_again")}</Button>
							)
						}
					>
						{failed
							? t("tester_default_incomplete")
							: t("tester_default_written")}
					</Alert>
				</>
			) : (
				<Box display="flex" gap={1}>
					<Button
						variant="contained"
						disabled={state.status === "writing"}
						onClick={onWrite}
					>
						{state.status === "writing"
							? t("tester_writing")
							: t("tester_default_write")}
					</Button>
					<Button disabled={state.status === "writing"} onClick={onSkip}>
						{t("tester_skip")}
					</Button>
				</Box>
			)}
		</Paper>
	);
};

export default DefaultConfig;
