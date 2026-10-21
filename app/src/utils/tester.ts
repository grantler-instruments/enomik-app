/**
 * Helpers for the hidden tester page: configures buttons on a board running the
 * client sketch and checks that presses arrive over USB and via the dongle.
 */

export const PROTOCOL_MAJOR = 0;
export const PROTOCOL_MINOR = 19;
const MANUFACTURER_ID = 0x7d;

const CMD = {
	SET_PIN_CONFIG: 0x01,
	ADD_PEER: 0x07,
} as const;

const RESP = (cmd: number) => cmd + 0x40;
const RESP_ERROR = 0x7f;
export const ERR_PEER_ALREADY_EXISTS = 0x09;

const MODE_INPUT_PULLUP = 0x02;
const MIDI_CONTROL_CHANGE = 0xb0;

/** Button pins, wired to GND. Each sends CC <pin> on channel 1. */
export const BUTTON_PINS = [16, 17];
export const IO_CHANNEL = 1;

const header = (cmd: number) => [
	MANUFACTURER_ID,
	PROTOCOL_MAJOR,
	PROTOCOL_MINOR,
	cmd,
];

const macToNibbles = (mac: number[]) =>
	mac.flatMap((byte) => [(byte >> 4) & 0x0f, byte & 0x0f]);

// Builders return the inner data (without F0/F7).
export const sysex = {
	addPeer: (mac: number[]) => [...header(CMD.ADD_PEER), ...macToNibbles(mac)],
	/** Input pull-up sending CC <pin>: 127 while pressed, 0 when released. */
	buttonConfig: (pin: number) => [
		...header(CMD.SET_PIN_CONFIG),
		pin,
		MODE_INPUT_PULLUP,
		0,
		IO_CHANNEL,
		MIDI_CONTROL_CHANGE / 2,
		pin,
		0,
		127,
	],
};

export type Reply =
	| { cmd: "pin_config"; pin: number }
	| { cmd: "add_peer_ok" }
	| { cmd: "error"; failedRequest: number; errorCode: number };

/** Parse the inner data of an enomik SysEx reply, null if not one we use. */
export function parseReply(data: number[]): Reply | null {
	if (data.length < 4 || data[0] !== MANUFACTURER_ID) return null;
	const cmd = data[3];
	const p = data.slice(4);
	if (cmd === RESP(CMD.SET_PIN_CONFIG) && p.length >= 8)
		return { cmd: "pin_config", pin: p[0] };
	if (cmd === RESP(CMD.ADD_PEER) && p[0] === 1) return { cmd: "add_peer_ok" };
	if (cmd === RESP_ERROR && p.length >= 2)
		return { cmd: "error", failedRequest: p[0], errorCode: p[1] };
	return null;
}

/** Pin whose button sent this message, or null. */
export function buttonPin(bytes: ArrayLike<number>): number | null {
	if (bytes.length < 3) return null;
	if (bytes[0] !== (MIDI_CONTROL_CHANGE | (IO_CHANNEL - 1))) return null;
	return BUTTON_PINS.includes(bytes[1]) ? bytes[1] : null;
}

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
