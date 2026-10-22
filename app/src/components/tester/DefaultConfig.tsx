import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import { BUTTON_PINS, DEFAULT_LED_SOURCE } from "../../utils/tester";

export type DefaultConfigState =
	| { status: "ask" | "writing" | "skipped" }
	| { status: "done"; lines: { text: string; ok: boolean }[] };

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
	if (state.status === "skipped") return null;
	const failed = state.status === "done" && state.lines.some((l) => !l.ok);
	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Typography variant="h6" mb={1}>
				Default configuration
			</Typography>
			<Typography variant="body2" mb={2}>
				Clears the test setup and leaves the board ready to use: pins{" "}
				{BUTTON_PINS.join(" and ")} send CC {BUTTON_PINS.join(" and ")} (channel
				1), MIDI loopback is on and the LED (pin {ledPin}) lights while the pin{" "}
				{DEFAULT_LED_SOURCE} button is held.{" "}
				{dongleMac
					? `The dongle ${dongleMac} stays paired.`
					: "No dongle MAC is known, so no dongle is paired."}
			</Typography>
			{state.status === "done" ? (
				<>
					{state.lines.map((line) => (
						<Box key={line.text} display="flex" gap={1} alignItems="center">
							<Chip
								size="small"
								label={line.ok ? "OK" : "FAIL"}
								color={line.ok ? "success" : "error"}
							/>
							<Typography variant="body2">{line.text}</Typography>
						</Box>
					))}
					<Alert
						severity={failed ? "error" : "success"}
						sx={{ mt: 1 }}
						action={failed && <Button onClick={onWrite}>Try again</Button>}
					>
						{failed
							? "Default configuration incomplete"
							: "Default configuration written"}
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
							? "Writing…"
							: "Write default configuration"}
					</Button>
					<Button disabled={state.status === "writing"} onClick={onSkip}>
						Skip
					</Button>
				</Box>
			)}
		</Paper>
	);
};

export default DefaultConfig;
