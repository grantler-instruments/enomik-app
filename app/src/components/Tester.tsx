import { CheckCircle, ThumbDown, ThumbUp } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Chip,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Step,
	StepContent,
	StepLabel,
	Stepper,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useDevice } from "../hooks/useDevice";
import { useRawStream } from "../hooks/useRawStream";
import { supportsLiveValues } from "../store/device";
import { deviceInputId, useMIDIStore } from "../store/midi";
import { useRawStreamStore } from "../store/rawStream";
import {
	BUTTON_PINS,
	buttonEvent,
	CYCLE_PIN,
	DEFAULT_LED_PIN,
	DEFAULT_TOUCH_PINS,
	ERR_PEER_ALREADY_EXISTS,
	IO_CHANNEL,
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_TYPES,
	macFromString,
	noteDown,
	parsePins,
	request,
	sysex,
	TOUCH_THRESHOLD,
} from "../utils/tester";
import InitMidi from "./InitMidi";
import { LiveCell, RawStreamToggle } from "./inspector/RawValues";

type Role = "client" | "dongle";
type Path = "usb" | "wireless";
type Port = { input: MIDIInput; output: MIDIOutput };
type LogLine = { text: string; ok: boolean };

// Pin 16 gets one row per MIDI type; the other pins stay on CC.
const ROWS = BUTTON_PINS.flatMap((pin) =>
	pin === CYCLE_PIN
		? MIDI_TYPES.map((type) => ({ pin, ...type }))
		: [{ pin, status: MIDI_CONTROL_CHANGE, label: "Control change" }],
);
const rowKey = (pin: number, status: number) => `${pin}:${status}`;

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
		ROWS.map((row) => [
			rowKey(row.pin, row.status),
			{ usb: false, wireless: false },
		]),
	) as Record<string, Record<Path, boolean>>;

/**
 * Live touch readings (same bars as the configurator) plus where each touch's
 * CC arrived. Mounted only on its step: unmounting stops the raw stream.
 */
const TouchPads = ({
	device,
	pins,
	paths,
	seen,
}: {
	device: string;
	pins: number[];
	paths: Path[];
	seen: Record<number, Record<Path, boolean>>;
}) => {
	const values = useRawStreamStore((state) => state.values);
	const streaming = useRawStreamStore((state) => state.active);
	useRawStream(device);
	// On by default, once the device's version is known: useRawStream switches
	// the stream off again while the device can't stream (yet).
	const info = useDevice(device);
	const supported =
		info?.status === "ready" && supportsLiveValues(info.version);
	useEffect(() => {
		if (!supported) return;
		useRawStreamStore.getState().clear();
		useRawStreamStore.getState().setActive(true);
	}, [supported]);
	// Pads whose live reading crossed the threshold at least once.
	const [reached, setReached] = useState<number[]>([]);
	useEffect(() => {
		const touched = pins.filter(
			(pin) => values[pin]?.active && !reached.includes(pin),
		);
		if (touched.length) setReached((prev) => [...prev, ...touched]);
	}, [values, pins, reached]);
	return (
		<>
			<RawStreamToggle device={device} />
			{pins.map((pin) => (
				<Box key={pin} display="flex" gap={1} alignItems="center" mb={1}>
					<Typography width={60}>Pin {pin}</Typography>
					<Box width={200}>
						{streaming && values[pin] ? (
							<LiveCell value={values[pin]} />
						) : (
							<Typography variant="caption" color="text.secondary">
								no live value
							</Typography>
						)}
					</Box>
					<Box width={24} display="flex">
						{reached.includes(pin) && (
							<CheckCircle
								color="success"
								fontSize="small"
								titleAccess="threshold reached"
							/>
						)}
					</Box>
					{paths.map((path) => (
						<Chip
							key={path}
							size="small"
							label={path === "usb" ? "USB" : "Wireless"}
							color={seen[pin]?.[path] ? "success" : "default"}
						/>
					))}
				</Box>
			))}
		</>
	);
};

/**
 * Hidden page (not in the menu, open #/tester) for boards running the client
 * sketch: sets up buttons on pins 16 and 17, then checks that presses arrive
 * over the client's USB port and wirelessly (ESP-NOW) at the dongle. Pin 16
 * switches to the next MIDI type after every release.
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
	const [log, setLog] = useState<LogLine[]>([]);
	const [busy, setBusy] = useState(false);
	const [listening, setListening] = useState(false);
	const [seen, setSeen] = useState(emptySeen);
	const [pressed, setPressed] = useState<Record<number, boolean>>({});
	const [step, setStep] = useState(0);
	// Wizard: 0 connect, 1 buttons, 2 LED loopback, 3 touch, 4 finished.
	const [activeStep, setActiveStep] = useState(0);
	const [ledPin, setLedPin] = useState(DEFAULT_LED_PIN);
	const [touchText, setTouchText] = useState(DEFAULT_TOUCH_PINS.join(", "));
	const touchPins = parsePins(touchText);
	const touchPinsRef = useRef(touchPins);
	touchPinsRef.current = touchPins;
	const [touchSeen, setTouchSeen] = useState<
		Record<number, Record<Path, boolean>>
	>({});
	const [loopback, setLoopback] = useState<"off" | "busy" | "on">("off");
	const [loopbackSeen, setLoopbackSeen] = useState<boolean | null>(null);
	// The loopback note as it arrives: per path, and held/released over USB.
	const emptyLoopNote = {
		usb: false,
		wireless: false,
		held: false,
		released: false,
	};
	const [loopNote, setLoopNote] = useState(emptyLoopNote);
	const loopbackRef = useRef(false);
	const ledPinRef = useRef(ledPin);
	ledPinRef.current = ledPin;
	// The MIDI listener outlives renders; it reads these instead of state.
	const stepRef = useRef(0);
	const clientRef = useRef<Port | null>(null);
	// Set by a press of pin 16's current type. A fresh pin config reports the
	// released state right away, which must not count as a release.
	const armedRef = useRef(false);
	const autoAdvancedRef = useRef(false);

	const resolve = (role: Role, exclude?: Port | null): Port | null => {
		const id = choice[role];
		if (id === NONE) return null;
		const output =
			id === AUTO
				? NEEDLES[role]
						.map((needle) =>
							outputs.find(
								(o) =>
									o.state !== "disconnected" &&
									o.id !== exclude?.output.id &&
									(o.name ?? "").toLowerCase().includes(needle),
							),
						)
						.find(Boolean)
				: outputs.find((o) => o.id === id);
		if (!output) return null;
		// deviceInputId gives up when board names overlap (e.g. "enomik" and
		// "enomik client"); then take the one input with the exact same name.
		const inputId =
			deviceInputId(output.id) ??
			(() => {
				const same = inputs.filter(
					(i) =>
						i.state !== "disconnected" &&
						i.id !== exclude?.input.id &&
						i.name === output.name,
				);
				return same.length === 1 ? same[0].id : undefined;
			})();
		const input = inputs.find((i) => i.id === inputId);
		return input ? { input, output } : null;
	};
	const client = resolve("client");
	const dongle = resolve("dongle", client);
	const clientInputId = client?.input.id;
	const dongleInputId = dongle?.input.id;
	clientRef.current = client;

	const add = (line: LogLine) => setLog((prev) => [...prev, line]);

	const configureCyclePin = async (port: Port, index: number) => {
		const type = MIDI_TYPES[index];
		const reply = await request(
			port.input,
			port.output,
			sysex.buttonConfig(CYCLE_PIN, type.status),
			(r) =>
				(r.cmd === "pin_config" && r.pin === CYCLE_PIN) || r.cmd === "error",
		);
		return reply?.cmd === "pin_config";
	};

	// After a release, switch pin 16 to the next MIDI type. Read via ref so
	// the MIDI listener needn't re-subscribe on every render.
	const advance = async () => {
		const port = clientRef.current;
		if (!port) return;
		const next = (stepRef.current + 1) % MIDI_TYPES.length;
		stepRef.current = next;
		armedRef.current = false;
		setStep(next);
		if (!(await configureCyclePin(port, next)))
			add({ text: `pin ${CYCLE_PIN} → ${MIDI_TYPES[next].label}`, ok: false });
	};
	const advanceRef = useRef(advance);
	advanceRef.current = advance;

	const ledPinError =
		!Number.isInteger(ledPin) || ledPin < 0 || ledPin > 48
			? "0 to 48"
			: BUTTON_PINS.includes(ledPin)
				? "used by a button"
				: "";

	const touchError = touchPins.some(
		(pin) => !Number.isInteger(pin) || pin < 0 || pin > 48,
	)
		? "pins 0 to 48, comma separated"
		: touchPins.some(
					(pin, i) =>
						BUTTON_PINS.includes(pin) ||
						pin === ledPin ||
						touchPins.indexOf(pin) !== i,
				)
			? "used twice or by a button/LED"
			: "";

	const setMidiLoopback = async (port: Port, on: boolean) => {
		const reply = await request(
			port.input,
			port.output,
			sysex.setMidiLoopback(on),
			(r) => r.cmd === "midi_loopback" || r.cmd === "error",
		);
		const ok = reply?.cmd === "midi_loopback" && reply.enabled === on;
		if (!ok) add({ text: `MIDI loopback ${on ? "on" : "off"}`, ok });
		return ok;
	};

	// Loopback on, pin 16 sends note on <LED pin>: the client handles its own
	// note, so the LED lights while the button is held.
	const startLoopback = async () => {
		if (!client) return;
		setLoopback("busy");
		const reply = await request(
			client.input,
			client.output,
			sysex.buttonConfig(CYCLE_PIN, MIDI_NOTE_ON, ledPin),
			(r) =>
				(r.cmd === "pin_config" && r.pin === CYCLE_PIN) || r.cmd === "error",
		);
		if (reply?.cmd !== "pin_config")
			add({ text: `pin ${CYCLE_PIN} → note ${ledPin}`, ok: false });
		await setMidiLoopback(client, true);
		loopbackRef.current = true;
		setLoopback("on");
	};

	// Loopback is saved on the device: switch it off, give pin 16 its type back.
	const stopLoopback = async () => {
		loopbackRef.current = false;
		if (!client) return;
		setLoopback("busy");
		await setMidiLoopback(client, false);
		armedRef.current = false;
		if (!(await configureCyclePin(client, stepRef.current)))
			add({
				text: `pin ${CYCLE_PIN} → ${MIDI_TYPES[stepRef.current].label}`,
				ok: false,
			});
		setLoopback("off");
	};

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
				if (!event.data) return;
				if (loopbackRef.current) {
					const down = noteDown(event.data, ledPinRef.current);
					if (down === null) return;
					setLoopNote((prev) => {
						if (down)
							return {
								...prev,
								[path]: true,
								held: prev.held || path === "usb",
							};
						// The fresh pin config reports a release before any press.
						return path === "usb" && prev.held
							? { ...prev, released: true }
							: prev;
					});
					return;
				}
				const ev = buttonEvent(event.data, touchPinsRef.current);
				if (!ev) return;
				if (touchPinsRef.current.includes(ev.pin)) {
					if (ev.down)
						setTouchSeen((prev) => ({
							...prev,
							[ev.pin]: { ...prev[ev.pin], [path]: true },
						}));
					return;
				}
				const key = rowKey(ev.pin, ev.status);
				if (path === "usb")
					setPressed((prev) => ({ ...prev, [ev.pin]: ev.down }));
				if (ev.down)
					setSeen((prev) =>
						prev[key]
							? { ...prev, [key]: { ...prev[key], [path]: true } }
							: prev,
					);
				if (
					path !== "usb" ||
					ev.pin !== CYCLE_PIN ||
					ev.status !== MIDI_TYPES[stepRef.current].status
				)
					return;
				if (ev.down) armedRef.current = true;
				else if (armedRef.current) void advanceRef.current();
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
		setBusy(true);
		setListening(false);
		setSeen(emptySeen());
		setPressed({});
		setLoopbackSeen(null);
		setTouchSeen({});
		autoAdvancedRef.current = false;
		setLog([]);
		stepRef.current = 0;
		armedRef.current = false;
		setStep(0);
		let allOk = true;
		const check = (line: LogLine) => {
			add(line);
			allOk &&= line.ok;
		};
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
				check({
					text: `add dongle ${dongleMac.trim().toUpperCase()} as peer`,
					ok,
				});
			}
			for (const pin of BUTTON_PINS) {
				if (pin === CYCLE_PIN) {
					check({
						text: `pin ${pin}: input pull-up → ${MIDI_TYPES[0].label} ${pin}`,
						ok: await configureCyclePin(client, 0),
					});
					continue;
				}
				const reply = await request(
					client.input,
					client.output,
					sysex.buttonConfig(pin),
					(r) => (r.cmd === "pin_config" && r.pin === pin) || r.cmd === "error",
				);
				check({
					text: `pin ${pin}: input pull-up → CC ${pin}`,
					ok: reply?.cmd === "pin_config",
				});
			}
			const led = await request(
				client.input,
				client.output,
				sysex.ledConfig(ledPin),
				(r) =>
					(r.cmd === "pin_config" && r.pin === ledPin) || r.cmd === "error",
			);
			check({
				text: `pin ${ledPin}: output ← note ${ledPin} (LED)`,
				ok: led?.cmd === "pin_config",
			});
			for (const pin of touchPins) {
				const reply = await request(
					client.input,
					client.output,
					sysex.touchConfig(pin),
					(r) => (r.cmd === "pin_config" && r.pin === pin) || r.cmd === "error",
				);
				check({
					text: `pin ${pin}: touch (${TOUCH_THRESHOLD} %) → CC ${pin}`,
					ok: reply?.cmd === "pin_config",
				});
			}
			setListening(true);
			if (allOk) setActiveStep(1);
		} finally {
			setBusy(false);
		}
	};

	const paths: Path[] = dongle ? ["usb", "wireless"] : ["usb"];
	const buttonsDone = ROWS.every((row) =>
		paths.every((p) => seen[rowKey(row.pin, row.status)][p]),
	);
	const loopbackDone = loopbackSeen === true && paths.every((p) => loopNote[p]);

	// Loopback stays on only while its step is open.
	const openLoopbackStep = async () => {
		setLoopbackSeen(null);
		setLoopNote(emptyLoopNote);
		setActiveStep(2);
		await startLoopback();
	};
	const leaveLoopbackStep = async (lit: boolean | null) => {
		if (lit !== null) setLoopbackSeen(lit);
		await stopLoopback();
		setActiveStep(lit === null ? 1 : 3);
	};
	const touchDone = touchPins.every((pin) =>
		paths.every((p) => touchSeen[pin]?.[p]),
	);

	// All buttons passed: move on to loopback once per setup (Back stays put).
	// The short pause lets the last chip show and the button be released.
	const openLoopbackRef = useRef(openLoopbackStep);
	openLoopbackRef.current = openLoopbackStep;
	useEffect(() => {
		if (activeStep !== 1 || !buttonsDone || autoAdvancedRef.current) return;
		autoAdvancedRef.current = true;
		const timer = setTimeout(() => void openLoopbackRef.current(), 800);
		return () => clearTimeout(timer);
	}, [activeStep, buttonsDone]);

	return (
		<Box display="flex" flexDirection="column" gap={2} padding={2}>
			<Typography variant="h5">Tester</Typography>
			<Alert severity="info">
				Flash the <code>client</code> sketch on the board under test and the{" "}
				<code>dongle</code> sketch on a dongle. Wire buttons from pins{" "}
				{BUTTON_PINS.join(" and ")} to GND. Setup overwrites those pin configs
				(note/CC = pin number, channel {IO_CHANNEL}). Pin {CYCLE_PIN} sends a
				different MIDI type on every press. Connect the dongle too: presses must
				arrive over the client's USB and wirelessly at the dongle.
			</Alert>
			<InitMidi />
			{initialized && (
				<Stepper activeStep={activeStep} orientation="vertical">
					<Step>
						<StepLabel>Connect client and dongle</StepLabel>
						<StepContent>
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
												[AUTO, NONE].includes(choice[role]) ||
												outputs.some((o) => o.id === choice[role])
													? choice[role]
													: AUTO
											}
											disabled={busy}
											onChange={(e) =>
												setChoice((prev) => ({
													...prev,
													[role]: e.target.value,
												}))
											}
										>
											<MenuItem value={AUTO}>Auto-detect</MenuItem>
											{role === "dongle" && (
												<MenuItem value={NONE}>None</MenuItem>
											)}
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
								<TextField
									size="small"
									type="number"
									label="LED pin"
									value={ledPin}
									disabled={busy}
									error={!!ledPinError}
									helperText={ledPinError || "onboard LED"}
									onChange={(e) => setLedPin(Number(e.target.value))}
									sx={{ width: 120 }}
								/>
								<TextField
									size="small"
									label="Touch pins"
									value={touchText}
									disabled={busy}
									error={!!touchError}
									helperText={touchError || "comma separated"}
									onChange={(e) => setTouchText(e.target.value)}
									sx={{ width: 160 }}
								/>
							</Box>
							<Box mt={1}>
								{(
									[
										["Client", client, "Client port not found"],
										[
											"Dongle",
											dongle,
											"Dongle port not found, wireless not checked",
										],
									] as const
								).map(([label, port, missing]) => (
									<Typography
										key={label}
										variant="body2"
										color={port ? "text.secondary" : "error"}
									>
										{port
											? `${label}: out ${port.output.name} / in ${port.input.name}`
											: missing}
									</Typography>
								))}
							</Box>
							<Box display="flex" gap={1} mt={2}>
								<Button
									variant="contained"
									disabled={
										!client ||
										busy ||
										!!macError ||
										!!ledPinError ||
										!!touchError
									}
									onClick={setup}
								>
									Set up and continue
								</Button>
								{log.some((line) => !line.ok) && (
									<Button onClick={() => setActiveStep(1)}>
										Continue anyway
									</Button>
								)}
							</Box>
						</StepContent>
					</Step>
					<Step>
						<StepLabel>Press the buttons</StepLabel>
						<StepContent>
							<Typography variant="body2" color="text.secondary" mb={1}>
								Press each button. Pin {CYCLE_PIN} sends the next MIDI type
								after every release.
							</Typography>
							{ROWS.map((row) => {
								const key = rowKey(row.pin, row.status);
								const next =
									row.pin === CYCLE_PIN &&
									MIDI_TYPES[step].status === row.status;
								return (
									<Box
										key={key}
										display="flex"
										gap={1}
										alignItems="center"
										mb={1}
									>
										<Typography
											width={60}
											fontWeight={pressed[row.pin] ? "bold" : undefined}
										>
											Pin {row.pin}
										</Typography>
										<Typography
											width={140}
											color={next ? "primary" : "text.secondary"}
										>
											{row.label}
											{next && " ←"}
										</Typography>
										{paths.map((path) => (
											<Chip
												key={path}
												size="small"
												label={path === "usb" ? "USB" : "Wireless"}
												color={seen[key][path] ? "success" : "default"}
											/>
										))}
									</Box>
								);
							})}
							<Box display="flex" gap={1} mt={2}>
								<Button onClick={() => setActiveStep(0)}>Back</Button>
								<Button variant="contained" onClick={openLoopbackStep}>
									{buttonsDone ? "Next" : "Skip"}
								</Button>
							</Box>
						</StepContent>
					</Step>
					<Step>
						<StepLabel>LED loopback</StepLabel>
						<StepContent>
							<Typography variant="body2" color="text.secondary">
								Hold the pin {CYCLE_PIN} button: the LED on pin {ledPin} should
								light while pressed and go off on release. The note also goes
								out over USB and wirelessly (loopback is on during this step).
							</Typography>
							<Box display="flex" gap={1} alignItems="center" mt={1}>
								<Typography
									width={140}
									fontWeight={
										loopNote.held && !loopNote.released ? "bold" : undefined
									}
								>
									Note {ledPin}
								</Typography>
								{paths.map((path) => (
									<Chip
										key={path}
										size="small"
										label={path === "usb" ? "USB" : "Wireless"}
										color={loopNote[path] ? "success" : "default"}
									/>
								))}
							</Box>
							{loopNote.released && (
								<Typography mt={2}>Did the LED light while pressed?</Typography>
							)}
							<Box display="flex" gap={1} mt={1} alignItems="center">
								<Button
									disabled={loopback !== "on"}
									onClick={() => leaveLoopbackStep(null)}
								>
									Back
								</Button>
								{loopNote.released && (
									<>
										<IconButton
											color="success"
											aria-label="LED lit"
											disabled={loopback !== "on"}
											onClick={() => leaveLoopbackStep(true)}
										>
											<ThumbUp />
										</IconButton>
										<IconButton
											color="error"
											aria-label="LED not lit"
											disabled={loopback !== "on"}
											onClick={() => leaveLoopbackStep(false)}
										>
											<ThumbDown />
										</IconButton>
									</>
								)}
							</Box>
						</StepContent>
					</Step>
					<Step>
						<StepLabel>Touch pins</StepLabel>
						<StepContent>
							<Typography variant="body2" color="text.secondary" mb={1}>
								Turn the board around and touch the solder joints of the touch
								pins – lick your fingers first :) The bar shows the change from
								the untouched reading; at {TOUCH_THRESHOLD} % it sends CC (pin
								number).
							</Typography>
							{client && activeStep === 3 && (
								<TouchPads
									device={client.output.id}
									pins={touchPins}
									paths={paths}
									seen={touchSeen}
								/>
							)}
							<Box display="flex" gap={1} mt={2}>
								<Button onClick={openLoopbackStep}>Back</Button>
								<Button variant="contained" onClick={() => setActiveStep(4)}>
									{touchDone ? "Finish" : "Skip"}
								</Button>
							</Box>
						</StepContent>
					</Step>
				</Stepper>
			)}
			{activeStep === 4 && (
				<Alert
					severity={
						buttonsDone && loopbackDone && touchDone ? "success" : "error"
					}
					action={<Button onClick={() => setActiveStep(0)}>Start over</Button>}
				>
					{buttonsDone ? "Buttons passed" : "Buttons failed"},{" "}
					{loopbackDone ? "LED loopback passed" : "LED loopback failed"},{" "}
					{touchDone ? "touch passed" : "touch failed"}
				</Alert>
			)}
			{log.length > 0 && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					{log.map((line, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: append-only log
						<Box key={index} display="flex" gap={1} alignItems="center">
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
		</Box>
	);
};

export default Tester;
