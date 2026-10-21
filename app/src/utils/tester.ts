/**
 * Helpers for the hidden tester page: configures buttons on a board running the
 * client sketch and checks that presses arrive over USB and via the dongle.
 */

import {
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
} from "../store/midi.config";

const MANUFACTURER_ID = 0x7d;

const CMD = {
	SET_PIN_CONFIG: 0x01,
	ADD_PEER: 0x07,
	SET_MIDI_LOOPBACK: 0x0d,
} as const;

const RESP = (cmd: number) => cmd + 0x40;
const RESP_ERROR = 0x7f;
export const ERR_PEER_ALREADY_EXISTS = 0x09;

const MODE_OUTPUT = 0x01;
const MODE_INPUT_PULLUP = 0x02;
const MODE_TOUCH = 0x05;
export const MIDI_NOTE_OFF = 0x80;
export const MIDI_NOTE_ON = 0x90;
export const MIDI_CONTROL_CHANGE = 0xb0;
export const MIDI_PITCH_BEND = 0xe0;

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

const header = (cmd: number) => [
	MANUFACTURER_ID,
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
	cmd,
];

const macToNibbles = (mac: number[]) =>
	mac.flatMap((byte) => [(byte >> 4) & 0x0f, byte & 0x0f]);

// Builders return the inner data (without F0/F7).
export const sysex = {
	addPeer: (mac: number[]) => [...header(CMD.ADD_PEER), ...macToNibbles(mac)],
	/** Input pull-up sending <status> with note/CC <number> (default: the pin):
	 * max value while pressed, min value when released. */
	buttonConfig: (pin: number, status = MIDI_CONTROL_CHANGE, number = pin) => [
		...header(CMD.SET_PIN_CONFIG),
		pin,
		MODE_INPUT_PULLUP,
		0,
		IO_CHANNEL,
		status / 2,
		number,
		0,
		127,
	],
	/** The client also handles the MIDI it sends itself. Saved on the device. */
	setMidiLoopback: (on: boolean) => [
		...header(CMD.SET_MIDI_LOOPBACK),
		on ? 1 : 0,
	],
	/** Touch pad in threshold mode: CC <pin> 127 on touch, 0 on release. */
	touchConfig: (pin: number) => [
		...header(CMD.SET_PIN_CONFIG),
		pin,
		MODE_TOUCH,
		TOUCH_THRESHOLD,
		IO_CHANNEL,
		MIDI_CONTROL_CHANGE / 2,
		pin,
		0,
		127,
	],
	/** Output switched by note on/off <pin>. */
	ledConfig: (pin: number) => [
		...header(CMD.SET_PIN_CONFIG),
		pin,
		MODE_OUTPUT,
		0,
		IO_CHANNEL,
		MIDI_NOTE_ON / 2,
		pin,
		0,
		127,
	],
};

export type Reply =
	| { cmd: "pin_config"; pin: number }
	| { cmd: "add_peer_ok" }
	| { cmd: "midi_loopback"; enabled: boolean }
	| { cmd: "error"; failedRequest: number; errorCode: number };

/** Parse the inner data of an enomik SysEx reply, null if not one we use. */
export function parseReply(data: number[]): Reply | null {
	if (data.length < 4 || data[0] !== MANUFACTURER_ID) return null;
	const cmd = data[3];
	const p = data.slice(4);
	if (cmd === RESP(CMD.SET_PIN_CONFIG) && p.length >= 8)
		return { cmd: "pin_config", pin: p[0] };
	if (cmd === RESP(CMD.ADD_PEER) && p[0] === 1) return { cmd: "add_peer_ok" };
	if (cmd === RESP(CMD.SET_MIDI_LOOPBACK) && p.length >= 1)
		return { cmd: "midi_loopback", enabled: p[0] !== 0 };
	if (cmd === RESP_ERROR && p.length >= 2)
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

export function macFromString(text: string): number[] {
	const parts = text.trim().replace(/-/g, ":").split(":");
	if (parts.length !== 6 || parts.some((p) => !/^[0-9a-f]{1,2}$/i.test(p)))
		throw new Error("MAC must have 6 octets, e.g. 84:F7:03:F2:54:62");
	return parts.map((p) => Number.parseInt(p, 16));
}

/** Send a SysEx request and wait for the first reply the predicate accepts. */
export function request(
	input: MIDIInput,
	output: MIDIOutput,
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
			if (bytes?.[0] !== 0xf0) return;
			const end = bytes[bytes.length - 1] === 0xf7 ? -1 : undefined;
			const reply = parseReply(Array.from(bytes).slice(1, end));
			if (reply && accept(reply)) finish(reply);
		};
		const timer = setTimeout(() => finish(null), timeoutMs);
		input.addEventListener("midimessage", listener);
		void input.open();
		output.send([0xf0, ...data, 0xf7]);
	});
}
