import {
	Alert,
	Box,
	Paper,
	Step,
	StepContent,
	StepLabel,
	Stepper,
} from "@mui/material";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useMIDIStore } from "../store/midi";
import { MIDI_NOTE_ON } from "../store/midi.config";
import {
	addPeer,
	BUTTON_PINS,
	type CheckLine,
	CYCLE_PIN,
	configurePin,
	DEFAULT_LED_PIN,
	DEFAULT_TOUCH_PINS,
	IO_CHANNEL,
	MIDI_TYPES,
	macToString,
	parsePins,
	setMidiLoopback,
	sysex,
	TOUCH_THRESHOLD,
	writeDefaultConfig,
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
import PageLayout from "./layout/PageLayout";
import ButtonsStep from "./tester/ButtonsStep";
import CheckLines from "./tester/CheckLines";
import ConnectStep, { type Settings } from "./tester/ConnectStep";
import DefaultConfig, { type DefaultConfigState } from "./tester/DefaultConfig";
import LoopbackStep from "./tester/LoopbackStep";
import Results from "./tester/Results";
import TouchStep from "./tester/TouchStep";
import { useBoardInfo } from "./tester/useBoardInfo";
import { AUTO, usePorts } from "./tester/usePorts";

const STEPS = ["connect", "buttons", "loopback", "touch", "done"] as const;
type StepName = (typeof STEPS)[number];

/** Lets the last chip show and the button be released before moving on. */
const AUTO_ADVANCE_MS = 800;

/**
 * Hidden page (not in the menu, open #/tester) for boards running the client
 * sketch, step by step: set up the pins, press the buttons (over USB and
 * wirelessly at the dongle), light the LED through MIDI loopback, touch the pads.
 */
/** The tester itself, without page chrome (also embedded in the tutorial). */
export const TesterContent = () => {
	const { t, i18n } = useTranslation();
	const initialized = useMIDIStore((s) => s.initialized);
	const [settings, setSettings] = useState<Settings>(() => ({
		client: AUTO,
		dongle: AUTO,
		ledPin: DEFAULT_LED_PIN,
		touchText: DEFAULT_TOUCH_PINS.join(", "),
	}));
	const { client, dongle, outputs } = usePorts(settings);
	const clientInfo = useBoardInfo(client);
	const dongleInfo = useBoardInfo(dongle);
	const [step, setStep] = useState<StepName>("connect");
	const [state, dispatch] = useReducer(
		testerReducer,
		initialState(DEFAULT_LED_PIN, DEFAULT_TOUCH_PINS),
	);
	const [log, setLog] = useState<CheckLine[]>([]);
	const [busy, setBusy] = useState(false);
	/** The last setup had failures: offer to go on anyway. */
	const [setupFailed, setSetupFailed] = useState(false);
	/** Pins are set up: listen and keep pin 16 configured. */
	const [configured, setConfigured] = useState(false);
	const [defaultConfig, setDefaultConfig] = useState<DefaultConfigState>({
		status: "ask",
	});
	const fail = useCallback(
		(id: CheckLine["id"], values?: CheckLine["values"]) =>
			setLog((prev) => [...prev, { id, values, ok: false }]),
		[],
	);

	const update = (patch: Partial<Settings>) => {
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
		const type = MIDI_TYPES[typeIndex];
		const data = loopbackOn
			? sysex.buttonConfig(CYCLE_PIN, MIDI_NOTE_ON, ledPin)
			: sysex.buttonConfig(CYCLE_PIN, type.status);
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
			if (loopbackOn) fail("cycle_note", { pin: CYCLE_PIN, note: ledPin });
			else fail("cycle_type", { pin: CYCLE_PIN, type: type.label });
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
				if (!ok) fail(on ? "loopback_on" : "loopback_off");
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
		const lines: CheckLine[] = [];
		const check = (
			id: CheckLine["id"],
			ok: boolean,
			values?: CheckLine["values"],
		) => {
			lines.push({ id, values, ok });
			setLog([...lines]);
		};
		setBusy(true);
		setConfigured(false);
		setSetupFailed(false);
		setLog([]);
		setDefaultConfig({ status: "ask" });
		autoAdvanced.current.clear();
		dispatch({ type: "reset", ledPin: settings.ledPin, touchPins });
		try {
			// The dongle's own MAC, read when its port was found
			const mac = dongle && dongleInfo?.mac;
			if (mac)
				check("add_peer", await addPeer(client, mac), {
					mac: macToString(mac),
				});
			else if (dongle) check("no_dongle_mac", false);
			const firstType = MIDI_TYPES[0];
			const cycleConfig = sysex.buttonConfig(CYCLE_PIN, firstType.status);
			cyclePinSent.current = cycleConfig.join();
			check(
				"cycle_button",
				await configurePin(client, CYCLE_PIN, cycleConfig),
				{ pin: CYCLE_PIN, type: firstType.label },
			);
			for (const pin of BUTTON_PINS.filter((p) => p !== CYCLE_PIN))
				check(
					"button",
					await configurePin(client, pin, sysex.buttonConfig(pin)),
					{ pin },
				);
			check(
				"led_note",
				await configurePin(
					client,
					settings.ledPin,
					sysex.ledConfig(settings.ledPin),
				),
				{ pin: settings.ledPin },
			);
			for (const pin of touchPins)
				check(
					"touch",
					await configurePin(client, pin, sysex.touchConfig(pin)),
					{ pin, threshold: TOUCH_THRESHOLD },
				);
			setConfigured(true);
			if (lines.every((line) => line.ok)) setStep("buttons");
		} catch (error) {
			// e.g. the port disconnected while sending
			check("setup_stopped", false, { error: (error as Error).message });
		} finally {
			setSetupFailed(lines.some((line) => !line.ok));
			setBusy(false);
		}
	};

	// The tested dongle stays a peer of the board
	const dongleMac = (dongle && dongleInfo?.mac) || null;
	const writeDefault = async () => {
		if (!client) return;
		setDefaultConfig({ status: "writing" });
		// Stop following presses: pin 16 must not be reconfigured over the default
		setConfigured(false);
		await loopbackQueue.current;
		const lines = await writeDefaultConfig(client, {
			ledPin: settings.ledPin,
			dongleMac,
		}).catch((error: Error): CheckLine[] => [
			{ id: "stopped", values: { error: error.message }, ok: false },
		]);
		setDefaultConfig({ status: "done", lines });
	};

	const steps: { name: StepName; label: string; content: React.ReactNode }[] = [
		{
			name: "connect",
			label: t("tester_step_connect"),
			content: (
				<ConnectStep
					settings={settings}
					update={update}
					outputs={outputs}
					client={client}
					dongle={dongle}
					clientInfo={clientInfo}
					dongleInfo={dongleInfo}
					busy={busy}
					failed={setupFailed}
					onSetup={setup}
					onContinue={() => setStep("buttons")}
				/>
			),
		},
		{
			name: "buttons",
			label: t("tester_step_buttons"),
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
			label: t("tester_led_loopback"),
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
			label: t("tester_touch_pins"),
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
		<Box display="flex" flexDirection="column" gap={2}>
			<Alert severity="info">
				<Trans
					i18nKey="tester_intro"
					values={{
						pins: new Intl.ListFormat(i18n.language).format(
							BUTTON_PINS.map(String),
						),
						channel: IO_CHANNEL,
						cyclePin: CYCLE_PIN,
					}}
					components={{ code: <code /> }}
				/>
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
						{ label: t("tester_result_buttons"), passed: buttonsDone },
						{ label: t("tester_led_loopback"), passed: loopbackDone },
						{ label: t("tester_touch_pins"), passed: touchDone },
					]}
					onRestart={() => {
						setDefaultConfig({ status: "ask" });
						setStep("connect");
					}}
				/>
			)}
			{step === "done" && client && (
				<DefaultConfig
					state={defaultConfig}
					ledPin={settings.ledPin}
					dongleMac={dongleMac && macToString(dongleMac)}
					onWrite={writeDefault}
					onSkip={() => setDefaultConfig({ status: "skipped" })}
				/>
			)}
			{log.length > 0 && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<CheckLines lines={log} />
				</Paper>
			)}
		</Box>
	);
};

const Tester = () => {
	const { t } = useTranslation();
	return (
		<PageLayout title={t("tester_title")} maxWidth={false}>
			<TesterContent />
		</PageLayout>
	);
};

export default Tester;
