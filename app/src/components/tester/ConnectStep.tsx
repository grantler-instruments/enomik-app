import {
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import {
	BUTTON_PINS,
	boardInfoText,
	type Port,
	parsePins,
	pinError,
} from "../../utils/tester";
import type { BoardInfoState } from "./useBoardInfo";
import { AUTO, NONE, type Role } from "./usePorts";

export type Settings = Record<Role, string> & {
	ledPin: number;
	touchText: string;
};

/** Validation messages per field, "" when valid. */
export function settingsErrors({ ledPin, touchText }: Settings) {
	const touchPins = parsePins(touchText);
	const taken = (pin: number, i: number) =>
		BUTTON_PINS.includes(pin) || pin === ledPin || touchPins.indexOf(pin) !== i;
	const badPin = touchPins.find((pin) => pinError(pin));
	return {
		led:
			pinError(ledPin) ||
			(BUTTON_PINS.includes(ledPin) ? "used by a button" : ""),
		touch:
			badPin !== undefined
				? `pins ${pinError(badPin)}, comma separated`
				: touchPins.some(taken)
					? "used twice or by a button/LED"
					: "",
	};
}

const ConnectStep = ({
	settings,
	update,
	outputs,
	client,
	dongle,
	clientInfo,
	dongleInfo,
	busy,
	failed,
	onSetup,
	onContinue,
}: {
	settings: Settings;
	update: (patch: Partial<Settings>) => void;
	outputs: MIDIOutput[];
	client: Port | null;
	dongle: Port | null;
	clientInfo: BoardInfoState;
	dongleInfo: BoardInfoState;
	busy: boolean;
	/** Setup ran with failures: offer to go on anyway. */
	failed: boolean;
	onSetup: () => void;
	onContinue: () => void;
}) => {
	const errors = settingsErrors(settings);
	const invalid = Object.values(errors).some(Boolean);
	const reading = (client && !clientInfo) || (dongle && !dongleInfo);
	return (
		<>
			<Box
				display="flex"
				flexWrap="wrap"
				gap={2}
				alignItems="flex-start"
				pt={1}
			>
				{(["client", "dongle"] as const).map((role) => (
					<FormControl key={role} size="small" sx={{ minWidth: 220 }}>
						<InputLabel>{`${role} port`}</InputLabel>
						<Select
							label={`${role} port`}
							value={
								[AUTO, NONE].includes(settings[role]) ||
								outputs.some((o) => o.id === settings[role])
									? settings[role]
									: AUTO
							}
							disabled={busy}
							onChange={(e) => update({ [role]: e.target.value })}
						>
							<MenuItem value={AUTO}>Auto-detect</MenuItem>
							{role === "dongle" && <MenuItem value={NONE}>None</MenuItem>}
							{outputs.map((out) => (
								<MenuItem key={out.id} value={out.id}>
									{out.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				))}
				<TextField
					size="small"
					type="number"
					label="LED pin"
					value={settings.ledPin}
					disabled={busy}
					error={!!errors.led}
					helperText={errors.led || "onboard LED"}
					onChange={(e) => update({ ledPin: Number(e.target.value) })}
					sx={{ width: 120 }}
				/>
				<TextField
					size="small"
					label="Touch pins"
					value={settings.touchText}
					disabled={busy}
					error={!!errors.touch}
					helperText={errors.touch || "comma separated"}
					onChange={(e) => update({ touchText: e.target.value })}
					sx={{ width: 160 }}
				/>
			</Box>
			<Box mt={1}>
				{(
					[
						["Client", client, clientInfo, "Client port not found"],
						[
							"Dongle",
							dongle,
							dongleInfo,
							"Dongle port not found, wireless not checked",
						],
					] as const
				).map(([label, port, info, missing]) => (
					<Typography
						key={label}
						variant="body2"
						color={
							!port
								? "error"
								: info && !info.mac
									? "warning.main"
									: "text.secondary"
						}
					>
						{port
							? `${label}: out ${port.output.name} / in ${port.input.name} · ${boardInfoText(info)}`
							: missing}
					</Typography>
				))}
				{dongle && dongleInfo && !dongleInfo.mac && (
					<Typography variant="body2" color="warning.main">
						The dongle did not report its MAC (dongle firmware before 0.19?), so
						it can't be added as a peer: wireless presses won't arrive.
					</Typography>
				)}
			</Box>
			<Box display="flex" gap={1} mt={2}>
				<Button
					variant="contained"
					disabled={!client || busy || invalid || !!reading}
					onClick={onSetup}
				>
					Set up and continue
				</Button>
				{failed && <Button onClick={onContinue}>Continue anyway</Button>}
			</Box>
		</>
	);
};

export default ConnectStep;
