/**
 * Protocol helpers for the hidden tester page: enomik SysEx requests to a board
 * running the client sketch, and recognising the MIDI its pins send.
 */

import {
	buildEnomikSysex,
	ENOMIK_COMMAND_ADD_PEER,
	ENOMIK_COMMAND_ADD_PEER_RESPONSE,
	ENOMIK_COMMAND_ERROR_RESPONSE,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK_RESPONSE,
	ENOMIK_COMMAND_SET_PIN_CONFIG,
	ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE,
	ENOMIK_ERROR_PEER_ALREADY_EXISTS,
	ENOMIK_PIN_CONFIG_PAYLOAD_SIZE,
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_OFF,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
	sysexEnd,
	sysexManufacturerId,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModeTouch,
	sysexStart,
} from "../store/midi.config";

/** Highest GPIO on the ESP32-S2/S3. */
const PIN_MAX = 48;

/** Button pins, wired to GND. Note/CC number = pin, channel 1. */
export const BUTTON_PINS = [16, 17];
export const IO_CHANNEL = 1;

/** Onboard LED (GPIO 15 on the Lolin S2 mini). Lit by note on <pin>. */
export const DEFAULT_LED_PIN = 15;

/** Touch pads (touch-capable GPIOs on the ESP32-S2/S3). Send CC <pin>. */
export const DEFAULT_TOUCH_PINS = [1, 2];
/** On at this change from the untouched reading, in percent. */
export const TOUCH_THRESHOLD = 20;

/** Steps through every type a pin can send, one per press. */
export const CYCLE_PIN = 16;
/** Every MIDI type the firmware sends from an input pin. */
export const MIDI_TYPES = [
	{ status: MIDI_NOTE_ON, label: "Note on" },
	{ status: MIDI_NOTE_OFF, label: "Note off" },
	{ status: MIDI_CONTROL_CHANGE, label: "Control change" },
	{ status: MIDI_PITCH_BEND, label: "Pitch bend" },
];

const macToNibbles = (mac: number[]) =>
	mac.flatMap((byte) => [(byte >> 4) & 0x0f, byte & 0x0f]);

/** SET_PIN_CONFIG on channel 1, MIDI values 0–127. */
const pinConfig = (
	pin: number,
	mode: number,
	threshold: number,
	status: number,
	number: number,
) =>
	buildEnomikSysex(ENOMIK_COMMAND_SET_PIN_CONFIG, [
		pin,
		mode,
		threshold,
		IO_CHANNEL,
		status / 2,
		number,
		0,
		127,
	]);

// Builders return the full SysEx packet (with F0/F7).
export const sysex = {
	addPeer: (mac: number[]) =>
		buildEnomikSysex(ENOMIK_COMMAND_ADD_PEER, macToNibbles(mac)),
	/** Input pull-up sending <status> with note/CC <number> (default: the pin):
	 * max value while pressed, min value when released. */
	buttonConfig: (pin: number, status = MIDI_CONTROL_CHANGE, number = pin) =>
		pinConfig(pin, sysexPinModeDigitalInPullup, 0, status, number),
	/** The client also handles the MIDI it sends itself. Saved on the device. */
	setMidiLoopback: (on: boolean) =>
		buildEnomikSysex(ENOMIK_COMMAND_SET_MIDI_LOOPBACK, [on ? 1 : 0]),
	/** Touch pad in threshold mode: CC <pin> 127 on touch, 0 on release. */
	touchConfig: (pin: number) =>
		pinConfig(
			pin,
			sysexPinModeTouch,
			TOUCH_THRESHOLD,
			MIDI_CONTROL_CHANGE,
			pin,
		),
	/** Output switched by note on/off <pin>. */
	ledConfig: (pin: number) =>
		pinConfig(pin, sysexPinModeDigitalOut, 0, MIDI_NOTE_ON, pin),
};

export type Reply =
	| { cmd: "pin_config"; pin: number }
	| { cmd: "add_peer_ok" }
	| { cmd: "midi_loopback"; enabled: boolean }
	| { cmd: "error"; failedRequest: number; errorCode: number };

/** Parse the inner data of an enomik SysEx reply, null if not one we use. */
export function parseReply(data: number[]): Reply | null {
	if (data.length < 4 || data[0] !== sysexManufacturerId) return null;
	const cmd = data[3];
	const p = data.slice(4);
	if (
		cmd === ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE &&
		p.length >= ENOMIK_PIN_CONFIG_PAYLOAD_SIZE
	)
		return { cmd: "pin_config", pin: p[0] };
	if (cmd === ENOMIK_COMMAND_ADD_PEER_RESPONSE && p[0] === 1)
		return { cmd: "add_peer_ok" };
	if (cmd === ENOMIK_COMMAND_SET_MIDI_LOOPBACK_RESPONSE && p.length >= 1)
		return { cmd: "midi_loopback", enabled: p[0] !== 0 };
	if (cmd === ENOMIK_COMMAND_ERROR_RESPONSE && p.length >= 2)
		return { cmd: "error", failedRequest: p[0], errorCode: p[1] };
	return null;
}

export type ButtonEvent = { pin: number; status: number; down: boolean };

/** Button press or release in this message, or null. */
export function buttonEvent(
	bytes: ArrayLike<number>,
	touchPins: number[] = [],
): ButtonEvent | null {
	if (bytes.length < 3 || (bytes[0] & 0x0f) !== IO_CHANNEL - 1) return null;
	const status = bytes[0] & 0xf0;
	// Pitch bend carries no pin; only the cycling pin sends it.
	if (status === MIDI_PITCH_BEND)
		return {
			pin: CYCLE_PIN,
			status,
			down: (bytes[1] | (bytes[2] << 7)) > 8192,
		};
	if (
		![MIDI_NOTE_ON, MIDI_NOTE_OFF, MIDI_CONTROL_CHANGE].includes(status) ||
		!(BUTTON_PINS.includes(bytes[1]) || touchPins.includes(bytes[1]))
	)
		return null;
	return { pin: bytes[1], status, down: bytes[2] > 0 };
}

/** Note on/off <note> on channel 1: pressed (true), released (false), or null. */
export function noteDown(
	bytes: ArrayLike<number>,
	note: number,
): boolean | null {
	if (bytes.length < 3 || bytes[1] !== note) return null;
	if (bytes[0] === (MIDI_NOTE_ON | (IO_CHANNEL - 1))) return bytes[2] > 0;
	if (bytes[0] === (MIDI_NOTE_OFF | (IO_CHANNEL - 1))) return false;
	return null;
}

/** Comma or space separated pin numbers. */
export const parsePins = (text: string) =>
	text
		.split(/[\s,]+/)
		.filter(Boolean)
		.map(Number);

/** Validation message for a pin number, "" when valid. */
export const pinError = (pin: number) =>
	Number.isInteger(pin) && pin >= 0 && pin <= PIN_MAX ? "" : `0 to ${PIN_MAX}`;

export function macFromString(text: string): number[] {
	const parts = text.trim().replace(/-/g, ":").split(":");
	if (parts.length !== 6 || parts.some((p) => !/^[0-9a-f]{1,2}$/i.test(p)))
		throw new Error("MAC must have 6 octets, e.g. 84:F7:03:F2:54:62");
	return parts.map((p) => Number.parseInt(p, 16));
}

export type Port = { input: MIDIInput; output: MIDIOutput };

/** Position of the command in a packet: F0, manufacturer, major, minor, command. */
const COMMAND_INDEX = 4;

/**
 * Send a SysEx request and wait for the first reply the predicate accepts, or
 * an error reply for this request's command. Errors for other commands are
 * ignored: requests can overlap (e.g. pin 16 reconfig while loopback switches).
 */
export function request(
	{ input, output }: Port,
	data: number[],
	accept: (reply: Reply) => boolean,
	timeoutMs = 2000,
): Promise<Reply | null> {
	return new Promise((resolve) => {
		const finish = (reply: Reply | null) => {
			clearTimeout(timer);
			input.removeEventListener("midimessage", listener);
			resolve(reply);
		};
		const listener = (event: MIDIMessageEvent) => {
			const bytes = event.data;
			if (bytes?.[0] !== sysexStart) return;
			const end = bytes[bytes.length - 1] === sysexEnd ? -1 : undefined;
			const reply = parseReply(Array.from(bytes).slice(1, end));
			if (!reply) return;
			if (
				reply.cmd === "error"
					? reply.failedRequest === data[COMMAND_INDEX]
					: accept(reply)
			)
				finish(reply);
		};
		const timer = setTimeout(() => finish(null), timeoutMs);
		input.addEventListener("midimessage", listener);
		void input.open();
		output.send(data);
	});
}

/** Send a SET_PIN_CONFIG built by sysex.*Config(pin); true when acknowledged. */
export async function configurePin(port: Port, pin: number, data: number[]) {
	const reply = await request(
		port,
		data,
		(r) => r.cmd === "pin_config" && r.pin === pin,
	);
	return reply?.cmd === "pin_config";
}

/** Add a peer; one that already exists counts as success. */
export async function addPeer(port: Port, mac: number[]) {
	const reply = await request(
		port,
		sysex.addPeer(mac),
		(r) => r.cmd === "add_peer_ok",
	);
	return (
		reply?.cmd === "add_peer_ok" ||
		(reply?.cmd === "error" &&
			reply.errorCode === ENOMIK_ERROR_PEER_ALREADY_EXISTS)
	);
}

export async function setMidiLoopback(port: Port, on: boolean) {
	const reply = await request(
		port,
		sysex.setMidiLoopback(on),
		(r) => r.cmd === "midi_loopback",
	);
	return reply?.cmd === "midi_loopback" && reply.enabled === on;
}
