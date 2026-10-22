import {
	Alert,
	Box,
	Chip,
	Paper,
	Step,
	StepContent,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useMIDIStore } from "../store/midi";
import { MIDI_NOTE_ON } from "../store/midi.config";
import {
	addPeer,
	BUTTON_PINS,
	CYCLE_PIN,
	configurePin,
	DEFAULT_LED_PIN,
	DEFAULT_TOUCH_PINS,
	IO_CHANNEL,
	MIDI_TYPES,
	macFromString,
	parsePins,
	setMidiLoopback,
	sysex,
	TOUCH_THRESHOLD,
} from "../utils/tester";
import {
	buttonsPassed,
	initialState,
	loopbackPassed,
	type Path,
	testerReducer,
	touchPassed,
} from "../utils/testerState";
import InitMidi from "./InitMidi";
import ButtonsStep from "./tester/ButtonsStep";
import ConnectStep, { type Settings } from "./tester/ConnectStep";
import LoopbackStep from "./tester/LoopbackStep";
import Results from "./tester/Results";
import TouchStep from "./tester/TouchStep";
import { AUTO, usePorts } from "./tester/usePorts";

const STEPS = ["connect", "buttons", "loopback", "touch", "done"] as const;
type StepName = (typeof STEPS)[number];
type LogLine = { text: string; ok: boolean };

/** Lets the last chip show and the button be released before moving on. */
const AUTO_ADVANCE_MS = 800;

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

/**
 * Hidden page (not in the menu, open #/tester) for boards running the client
 * sketch, step by step: set up the pins, press the buttons (over USB and
 * wirelessly at the dongle), light the LED through MIDI loopback, touch the pads.
 */
const Tester = () => {
	const initialized = useMIDIStore((s) => s.initialized);
	const [settings, setSettings] = useState<Settings>(() => ({
		client: AUTO,
		dongle: AUTO,
		dongleMac: getStoredDongleMac(),
		ledPin: DEFAULT_LED_PIN,
		touchText: DEFAULT_TOUCH_PINS.join(", "),
	}));
	const { client, dongle, outputs } = usePorts(settings);
	const [step, setStep] = useState<StepName>("connect");
	const [state, dispatch] = useReducer(
		testerReducer,
		initialState(DEFAULT_LED_PIN, DEFAULT_TOUCH_PINS),
	);
	const [log, setLog] = useState<LogLine[]>([]);
	const [busy, setBusy] = useState(false);
	/** The last setup had failures: offer to go on anyway. */
	const [setupFailed, setSetupFailed] = useState(false);
	/** Pins are set up: listen and keep pin 16 configured. */
	const [configured, setConfigured] = useState(false);
	const fail = useCallback(
		(text: string) => setLog((prev) => [...prev, { text, ok: false }]),
		[],
	);

	const update = (patch: Partial<Settings>) => {
		if (patch.dongleMac !== undefined) storeDongleMac(patch.dongleMac);
		setSettings((prev) => ({ ...prev, ...patch }));
	};

	const paths: Path[] = dongle ? ["usb", "wireless"] : ["usb"];
	const buttonsDone = buttonsPassed(state, paths);
	const loopbackDone = loopbackPassed(state, paths);
	const touchDone = touchPassed(state, paths);

	// Every message from the client (USB) and the dongle (wireless).
	useEffect(() => {
		if (!configured) return;
		const sources = [
			[client?.input, "usb"],
			[dongle?.input, "wireless"],
		] as const;
		const stops = sources.map(([input, path]) => {
			if (!input) return () => {};
			const listener = (event: MIDIMessageEvent) => {
				if (event.data) dispatch({ type: "midi", path, bytes: event.data });
			};
			input.addEventListener("midimessage", listener);
			void input.open();
			return () => input.removeEventListener("midimessage", listener);
		});
		return () => {
			for (const stop of stops) stop();
		};
	}, [configured, client, dongle]);

	// Pin 16 follows the state: the current MIDI type, or the LED note during
	// loopback. Only changes are sent (setup sends the first one itself); a
	// config the board didn't acknowledge is retried once, then forgotten so
	// the next change sends it again.
	const { loopbackOn, typeIndex, ledPin } = state;
	const cyclePinSent = useRef("");
	useEffect(() => {
		if (!configured || !client) return;
		const [data, label] = loopbackOn
			? [sysex.buttonConfig(CYCLE_PIN, MIDI_NOTE_ON, ledPin), `note ${ledPin}`]
			: [
					sysex.buttonConfig(CYCLE_PIN, MIDI_TYPES[typeIndex].status),
					MIDI_TYPES[typeIndex].label,
				];
		const key = data.join();
		if (cyclePinSent.current === key) return;
		cyclePinSent.current = key;
		const send = () => configurePin(client, CYCLE_PIN, data);
		void (async () => {
			try {
				if ((await send()) || (await send())) return;
			} catch {
				// e.g. the port disconnected while sending
			}
			if (cyclePinSent.current === key) cyclePinSent.current = "";
			fail(`pin ${CYCLE_PIN} → ${label}`);
		})();
	}, [configured, client, loopbackOn, typeIndex, ledPin, fail]);

	// MIDI loopback is saved on the device: on only while its step is open.
	// Requests run in order, so a quick leave can't overtake the switch-on.
	const loopbackQueue = useRef(Promise.resolve());
	useEffect(() => {
		if (step !== "loopback" || !client) return;
		const enqueue = (on: boolean) => {
			loopbackQueue.current = loopbackQueue.current.then(async () => {
				if (!on) dispatch({ type: "loopback", on });
				// A throw (e.g. port disconnected) must not break the queue.
				const ok = await setMidiLoopback(client, on).catch(() => false);
				if (!ok) fail(`MIDI loopback ${on ? "on" : "off"}`);
				if (on) dispatch({ type: "loopback", on });
			});
		};
		enqueue(true);
		return () => enqueue(false);
	}, [step, client, fail]);

	// A step whose test passed moves on by itself, once per setup (Back stays put):
	// all buttons → loopback, all touch pads → results.
	const autoNext: Partial<Record<StepName, [boolean, StepName]>> = {
		buttons: [buttonsDone, "loopback"],
		touch: [touchDone, "done"],
	};
	const [ready, next] = autoNext[step] ?? [false, step];
	const autoAdvanced = useRef(new Set<StepName>());
	useEffect(() => {
		if (!ready || autoAdvanced.current.has(step)) return;
		const timer = setTimeout(() => {
			autoAdvanced.current.add(step);
			setStep(next);
		}, AUTO_ADVANCE_MS);
		return () => clearTimeout(timer);
	}, [step, ready, next]);

	const setup = async () => {
		if (!client) return;
		const touchPins = parsePins(settings.touchText);
		const lines: LogLine[] = [];
		const check = (text: string, ok: boolean) => {
			lines.push({ text, ok });
			setLog([...lines]);
		};
		setBusy(true);
		setConfigured(false);
		setSetupFailed(false);
		setLog([]);
		autoAdvanced.current.clear();
		dispatch({ type: "reset", ledPin: settings.ledPin, touchPins });
		try {
			const mac = settings.dongleMac.trim();
			if (mac)
				check(
					`add dongle ${mac.toUpperCase()} as peer`,
					await addPeer(client, macFromString(mac)),
				);
			const firstType = MIDI_TYPES[0];
			const cycleConfig = sysex.buttonConfig(CYCLE_PIN, firstType.status);
			cyclePinSent.current = cycleConfig.join();
			check(
				`pin ${CYCLE_PIN}: input pull-up → ${firstType.label} ${CYCLE_PIN}`,
				await configurePin(client, CYCLE_PIN, cycleConfig),
			);
			for (const pin of BUTTON_PINS.filter((p) => p !== CYCLE_PIN))
				check(
					`pin ${pin}: input pull-up → CC ${pin}`,
					await configurePin(client, pin, sysex.buttonConfig(pin)),
				);
			check(
				`pin ${settings.ledPin}: output ← note ${settings.ledPin} (LED)`,
				await configurePin(
					client,
					settings.ledPin,
					sysex.ledConfig(settings.ledPin),
				),
			);
			for (const pin of touchPins)
				check(
					`pin ${pin}: touch (${TOUCH_THRESHOLD} %) → CC ${pin}`,
					await configurePin(client, pin, sysex.touchConfig(pin)),
				);
			setConfigured(true);
			if (lines.every((line) => line.ok)) setStep("buttons");
		} catch (error) {
			// e.g. the port disconnected while sending
			check(`setup stopped: ${(error as Error).message}`, false);
		} finally {
			setSetupFailed(lines.some((line) => !line.ok));
			setBusy(false);
		}
	};

	const steps: { name: StepName; label: string; content: React.ReactNode }[] = [
		{
			name: "connect",
			label: "Connect client and dongle",
			content: (
				<ConnectStep
					settings={settings}
					update={update}
					outputs={outputs}
					client={client}
					dongle={dongle}
					busy={busy}
					failed={setupFailed}
					onSetup={setup}
					onContinue={() => setStep("buttons")}
				/>
			),
		},
		{
			name: "buttons",
			label: "Press the buttons",
			content: (
				<ButtonsStep
					state={state}
					paths={paths}
					passed={buttonsDone}
					onBack={() => setStep("connect")}
					onNext={() => setStep("loopback")}
				/>
			),
		},
		{
			name: "loopback",
			label: "LED loopback",
			content: (
				<LoopbackStep
					state={state}
					paths={paths}
					onBack={() => setStep("buttons")}
					onAnswer={(lit) => {
						dispatch({ type: "lit", lit });
						setStep("touch");
					}}
				/>
			),
		},
		{
			name: "touch",
			label: "Touch pins",
			content: client && step === "touch" && (
				<TouchStep
					device={client.output.id}
					state={state}
					paths={paths}
					passed={touchDone}
					onBack={() => setStep("loopback")}
					onNext={() => setStep("done")}
				/>
			),
		},
	];

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
				<Stepper activeStep={STEPS.indexOf(step)} orientation="vertical">
					{steps.map(({ name, label, content }) => (
						<Step key={name}>
							<StepLabel>{label}</StepLabel>
							<StepContent>{content}</StepContent>
						</Step>
					))}
				</Stepper>
			)}
			{step === "done" && (
				<Results
					results={[
						{ label: "Buttons (USB and wireless)", passed: buttonsDone },
						{ label: "LED loopback", passed: loopbackDone },
						{ label: "Touch pins", passed: touchDone },
					]}
					onRestart={() => setStep("connect")}
				/>
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
