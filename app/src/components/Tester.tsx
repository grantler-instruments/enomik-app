import {
	Alert,
	Box,
	Button,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { deviceInputId, useMIDIStore } from "../store/midi";
import {
	BUTTON_PINS,
	buttonPin,
	ERR_PEER_ALREADY_EXISTS,
	IO_CHANNEL,
	macFromString,
	request,
	sysex,
} from "../utils/tester";
import InitMidi from "./InitMidi";

type Role = "client" | "dongle";
type Path = "usb" | "wireless";
type Port = { input: MIDIInput; output: MIDIOutput };

const AUTO = "auto";
const DONGLE_MAC_STORAGE_KEY = "enomik-tester-dongle-mac";

const getStoredDongleMac = () => {
	try {
		return localStorage.getItem(DONGLE_MAC_STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
};

const storeDongleMac = (mac: string) => {
	try {
		localStorage.setItem(DONGLE_MAC_STORAGE_KEY, mac);
	} catch {
		// ignore persistence errors (e.g. storage disabled)
	}
};
const NONE = "none";

const NEEDLES: Record<Role, string[]> = {
	client: ["client", "enomik"],
	dongle: ["dongle", "enomik"],
};

const emptySeen = () =>
	Object.fromEntries(
		BUTTON_PINS.map((pin) => [pin, { usb: false, wireless: false }]),
	) as Record<number, Record<Path, boolean>>;

/**
 * Hidden page (not in the menu, open #/tester) for boards running the client
 * sketch: sets up buttons on pins 16 and 17, then checks that presses arrive
 * over the client's USB port and wirelessly (ESP-NOW) at the dongle.
 */
const Tester = () => {
	const initialized = useMIDIStore((state) => state.initialized);
	const outputs = useMIDIStore((state) => state.outputs) as MIDIOutput[];
	const inputs = useMIDIStore((state) => state.inputs) as MIDIInput[];
	const [choice, setChoice] = useState<Record<Role, string>>({
		client: AUTO,
		dongle: AUTO,
	});
	const [dongleMac, setDongleMac] = useState(getStoredDongleMac);
	const [log, setLog] = useState<{ text: string; ok: boolean }[]>([]);
	const [busy, setBusy] = useState(false);
	const [listening, setListening] = useState(false);
	const [seen, setSeen] = useState(emptySeen);
	const [pressed, setPressed] = useState<Record<number, boolean>>({});

	const resolve = (role: Role, exclude?: string): Port | null => {
		const id = choice[role];
		if (id === NONE) return null;
		const output =
			id === AUTO
				? NEEDLES[role]
						.map((needle) =>
							outputs.find(
								(o) =>
									o.state !== "disconnected" &&
									o.id !== exclude &&
									(o.name ?? "").toLowerCase().includes(needle),
							),
						)
						.find(Boolean)
				: outputs.find((o) => o.id === id);
		if (!output) return null;
		const inputId = deviceInputId(output.id);
		const input = inputs.find((i) => i.id === inputId);
		return input ? { input, output } : null;
	};
	const client = resolve("client");
	const dongle = resolve("dongle", client?.output.id);
	const clientInputId = client?.input.id;
	const dongleInputId = dongle?.input.id;

	let macError = "";
	try {
		if (dongleMac.trim()) macFromString(dongleMac);
	} catch (error) {
		macError = (error as Error).message;
	}

	// Mark each button press by the path it arrived on.
	useEffect(() => {
		if (!listening) return;
		const listen = (inputId: string | undefined, path: Path) => {
			const input = inputs.find((i) => i.id === inputId);
			if (!input) return () => {};
			const listener = (event: MIDIMessageEvent) => {
				const pin = event.data && buttonPin(event.data);
				if (pin === null || !event.data) return;
				const down = event.data[2] > 0;
				if (path === "usb") setPressed((prev) => ({ ...prev, [pin]: down }));
				if (down)
					setSeen((prev) => ({
						...prev,
						[pin]: { ...prev[pin], [path]: true },
					}));
			};
			input.addEventListener("midimessage", listener);
			void input.open();
			return () => input.removeEventListener("midimessage", listener);
		};
		const stopUsb = listen(clientInputId, "usb");
		const stopDongle = listen(dongleInputId, "wireless");
		return () => {
			stopUsb();
			stopDongle();
		};
	}, [listening, clientInputId, dongleInputId, inputs]);

	const setup = async () => {
		if (!client) return;
		const lines: { text: string; ok: boolean }[] = [];
		const add = (text: string, ok: boolean) => {
			lines.push({ text, ok });
			setLog([...lines]);
		};
		setBusy(true);
		setListening(false);
		setSeen(emptySeen());
		setPressed({});
		setLog([]);
		try {
			if (dongleMac.trim()) {
				const added = await request(
					client.input,
					client.output,
					sysex.addPeer(macFromString(dongleMac)),
					(r) => r.cmd === "add_peer_ok" || r.cmd === "error",
				);
				const ok =
					added?.cmd === "add_peer_ok" ||
					(added?.cmd === "error" &&
						added.errorCode === ERR_PEER_ALREADY_EXISTS);
				add(`add dongle ${dongleMac.trim().toUpperCase()} as peer`, ok);
			}
			for (const pin of BUTTON_PINS) {
				const reply = await request(
					client.input,
					client.output,
					sysex.buttonConfig(pin),
					(r) => (r.cmd === "pin_config" && r.pin === pin) || r.cmd === "error",
				);
				add(
					`pin ${pin}: input pull-up → CC ${pin}`,
					reply?.cmd === "pin_config",
				);
			}
			setListening(true);
		} finally {
			setBusy(false);
		}
	};

	const paths: Path[] = dongle ? ["usb", "wireless"] : ["usb"];
	const done = BUTTON_PINS.every((pin) => paths.every((p) => seen[pin][p]));

	return (
		<Box display="flex" flexDirection="column" gap={2} padding={2}>
			<Typography variant="h5">Tester</Typography>
			<Alert severity="info">
				Flash the <code>client</code> sketch on the board under test and the{" "}
				<code>dongle</code> sketch on a dongle. Wire buttons from pins{" "}
				{BUTTON_PINS.join(" and ")} to GND. Setup overwrites those pin configs
				(CC = pin number, channel {IO_CHANNEL}). Connect the dongle too: presses
				must arrive over the client's USB and wirelessly at the dongle.
			</Alert>
			<InitMidi />
			{initialized && (
				<Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
					{(["client", "dongle"] as const).map((role) => (
						<FormControl key={role} size="small" sx={{ minWidth: 220 }}>
							<InputLabel>{`${role} port`}</InputLabel>
							<Select
								label={`${role} port`}
								value={
									[AUTO, NONE].includes(choice[role]) ||
									outputs.some((o) => o.id === choice[role])
										? choice[role]
										: AUTO
								}
								disabled={busy}
								onChange={(e) =>
									setChoice((prev) => ({ ...prev, [role]: e.target.value }))
								}
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
						label="Dongle MAC"
						placeholder="84:F7:03:F2:54:62"
						value={dongleMac}
						disabled={busy}
						error={!!macError}
						helperText={macError || "added as peer on setup, blank skips"}
						onChange={(e) => {
							setDongleMac(e.target.value);
							storeDongleMac(e.target.value);
						}}
						sx={{ width: 240 }}
					/>
					<Button
						variant="contained"
						disabled={!client || busy || !!macError}
						onClick={setup}
					>
						Setup
					</Button>
					{!client && (
						<Typography variant="body2" color="error">
							Client port not found
						</Typography>
					)}
				</Box>
			)}
			{log.length > 0 && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					{log.map((line) => (
						<Box key={line.text} display="flex" gap={1} alignItems="center">
							<Chip
								size="small"
								label={line.ok ? "OK" : "FAIL"}
								color={line.ok ? "success" : "error"}
							/>
							<Typography variant="body2">{line.text}</Typography>
						</Box>
					))}
				</Paper>
			)}
			{listening && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Typography variant="subtitle1" mb={1}>
						Press each button
					</Typography>
					{BUTTON_PINS.map((pin) => (
						<Box key={pin} display="flex" gap={1} alignItems="center" mb={1}>
							<Typography
								width={60}
								fontWeight={pressed[pin] ? "bold" : undefined}
							>
								Pin {pin}
							</Typography>
							{paths.map((path) => (
								<Chip
									key={path}
									size="small"
									label={path === "usb" ? "USB" : "Wireless"}
									color={seen[pin][path] ? "success" : "default"}
								/>
							))}
						</Box>
					))}
					{done && (
						<Alert severity="success" sx={{ mt: 1 }}>
							All buttons passed
						</Alert>
					)}
				</Paper>
			)}
		</Box>
	);
};

export default Tester;
