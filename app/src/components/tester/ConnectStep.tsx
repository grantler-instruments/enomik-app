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
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
	type BoardInfo,
	BUTTON_PINS,
	macToString,
	PIN_MAX,
	type Port,
	parsePins,
	pinError,
	versionToString,
} from "../../utils/tester";
import IntegerField from "../IntegerField";
import type { BoardInfoState } from "./useBoardInfo";
import { AUTO, NONE, type Role } from "./usePorts";

export type Settings = Record<Role, string> & {
	ledPin: number;
	touchText: string;
};

/** Validation messages per field, "" when valid. */
export function settingsErrors({ ledPin, touchText }: Settings, t: TFunction) {
	const touchPins = parsePins(touchText);
	const taken = (pin: number, i: number) =>
		BUTTON_PINS.includes(pin) || pin === ledPin || touchPins.indexOf(pin) !== i;
	const badPin = touchPins.find((pin) => pinError(pin));
	return {
		led: pinError(ledPin)
			? t("tester_error_pin_range", { max: PIN_MAX })
			: BUTTON_PINS.includes(ledPin)
				? t("tester_error_led_taken")
				: "",
		touch:
			badPin !== undefined
				? t("tester_error_touch_range", { max: PIN_MAX })
				: touchPins.some(taken)
					? t("tester_error_touch_taken")
					: "",
	};
}

/** "firmware 0.19.0 · MAC 84:F7:…", or what is still missing. */
function boardInfoText(info: BoardInfo | null, t: TFunction) {
	if (!info) return t("tester_board_reading");
	return t("tester_board_info", {
		version: info.version ? versionToString(info.version) : t("tester_unknown"),
		mac: info.mac ? macToString(info.mac) : t("tester_unknown"),
	});
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
	const { t } = useTranslation();
	const errors = settingsErrors(settings, t);
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
						<InputLabel>{t(`tester_port_${role}`)}</InputLabel>
						<Select
							label={t(`tester_port_${role}`)}
							value={
								[AUTO, NONE].includes(settings[role]) ||
								outputs.some((o) => o.id === settings[role])
									? settings[role]
									: AUTO
							}
							disabled={busy}
							onChange={(e) => update({ [role]: e.target.value })}
						>
							<MenuItem value={AUTO}>{t("tester_auto_detect")}</MenuItem>
							{role === "dongle" && (
								<MenuItem value={NONE}>{t("none")}</MenuItem>
							)}
							{outputs.map((out) => (
								<MenuItem key={out.id} value={out.id}>
									{out.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				))}
				<IntegerField
					size="small"
					label={t("tester_led_pin")}
					value={settings.ledPin}
					disabled={busy}
					error={!!errors.led}
					helperText={errors.led || t("tester_led_pin_help")}
					onChange={(ledPin) => update({ ledPin })}
					sx={{ width: 120 }}
				/>
				<TextField
					size="small"
					label={t("tester_touch_pins")}
					value={settings.touchText}
					disabled={busy}
					error={!!errors.touch}
					helperText={errors.touch || t("tester_comma_separated")}
					onChange={(e) => update({ touchText: e.target.value })}
					sx={{ width: 160 }}
				/>
			</Box>
			<Box mt={1}>
				{(
					[
						[
							t("device_kind_client"),
							client,
							clientInfo,
							t("tester_client_missing"),
						],
						[
							t("device_kind_dongle"),
							dongle,
							dongleInfo,
							t("tester_dongle_missing"),
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
							? t("tester_port_info", {
									label,
									output: port.output.name,
									input: port.input.name,
									info: boardInfoText(info, t),
								})
							: missing}
					</Typography>
				))}
				{dongle && dongleInfo && !dongleInfo.mac && (
					<Typography variant="body2" color="warning.main">
						{t("tester_dongle_no_mac")}
					</Typography>
				)}
			</Box>
			<Box display="flex" gap={1} mt={2}>
				<Button
					variant="contained"
					disabled={!client || busy || invalid || !!reading}
					onClick={onSetup}
				>
					{t("tester_setup")}
				</Button>
				{failed && (
					<Button onClick={onContinue}>{t("tester_continue_anyway")}</Button>
				)}
			</Box>
		</>
	);
};

export default ConnectStep;
