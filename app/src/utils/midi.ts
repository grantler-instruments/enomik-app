const typeToLabel = (type: number) => {
	switch (type) {
		case MIDI_STATUS.NOTE_OFF:
			return "Note Off";
		case MIDI_STATUS.NOTE_ON:
			return "Note On";
		case MIDI_STATUS.CONTROL_CHANGE:
			return "Control Change";
		case MIDI_STATUS.PROGRAM_CHANGE:
			return "Program Change";
		case MIDI_STATUS.PITCH_BEND:
			return "Pitch Bend";
		case MIDI_STATUS.SYSEX_START:
			return "SysEx";
		case MIDI_STATUS.START:
			return "Start";
		case MIDI_STATUS.STOP:
			return "Stop";
		case MIDI_STATUS.CONTINUE:
			return "Continue";
		case MIDI_STATUS.CHANNEL_PRESSURE:
			return "Aftertouch";
		case MIDI_STATUS.POLY_PRESSURE:
			return "Polyphonic Aftertouch";
		case MIDI_STATUS.TIMING_CLOCK:
			return "Clock";
		case MIDI_STATUS.ACTIVE_SENSING:
			return "Active Sensing";
		case MIDI_STATUS.RESET:
			return "Reset";
		case MIDI_STATUS.TUNE_REQUEST:
			return "Tune Request";
		case MIDI_STATUS.SONG_POSITION:
			return "Song Position";
		case MIDI_STATUS.SONG_SELECT:
			return "Song Select";
		case MIDI_STATUS.MTC_QUARTER:
			return "MTC Quarter Frame";

		default:
			return "Unknown";
	}
};

export { typeToLabel };

// midi-constants.ts

export const MIDI_MASK = {
	STATUS: 0xf0,
	CHANNEL: 0x0f,
} as const;

export const MIDI_STATUS = {
	NOTE_OFF: 0x80,
	NOTE_ON: 0x90,
	POLY_PRESSURE: 0xa0,
	CONTROL_CHANGE: 0xb0,
	PROGRAM_CHANGE: 0xc0,
	CHANNEL_PRESSURE: 0xd0,
	PITCH_BEND: 0xe0,

	SYSEX_START: 0xf0,
	MTC_QUARTER: 0xf1,
	SONG_POSITION: 0xf2,
	SONG_SELECT: 0xf3,
	TUNE_REQUEST: 0xf6,
	SYSEX_END: 0xf7,

	TIMING_CLOCK: 0xf8,
	START: 0xfa,
	CONTINUE: 0xfb,
	STOP: 0xfc,
	ACTIVE_SENSING: 0xfe,
	RESET: 0xff,
} as const;

export const MIDI_CC = {
	MOD_WHEEL: 1,
	BREATH: 2,
	FOOT: 4,
	PORTAMENTO_TIME: 5,
	DATA_ENTRY: 6,
	VOLUME: 7,
	BALANCE: 8,
	PAN: 10,
	EXPRESSION: 11,

	GENERAL_1: 16,
	GENERAL_2: 17,
	GENERAL_3: 18,
	GENERAL_4: 19,

	SUSTAIN: 64,
	PORTAMENTO: 65,
	SOSTENUTO: 66,
	SOFT: 67,
	LEGATO: 68,
	HOLD_2: 69,
} as const;

// Utility functions

export function isStatus(byte: number): boolean {
	return byte >= 0x80;
}

export function getStatus(byte: number): number {
	return byte & MIDI_MASK.STATUS;
}

export function getChannel(byte: number): number {
	return byte & MIDI_MASK.CHANNEL;
}

export function isNoteOn(status: number, velocity: number): boolean {
	return status === MIDI_STATUS.NOTE_ON && velocity > 0;
}

export function isNoteOff(status: number, velocity: number): boolean {
	return (
		status === MIDI_STATUS.NOTE_OFF ||
		(status === MIDI_STATUS.NOTE_ON && velocity === 0)
	);
}

/** Hex digits only: separators, spaces and other characters dropped. */
export const hexDigits = (text: string) =>
	text.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();

/** "43 12 00" -> [0x43, 0x12, 0x00]: non-hex characters ignored, two hex digits per byte. */
export function hexStringToBytes(hex: string): number[] {
	const clean = hexDigits(hex);
	const result: number[] = [];

	for (let i = 0; i < clean.length; i += 2) {
		result.push(parseInt(clean.slice(i, i + 2), 16));
	}

	return result;
}

/**
 * Why hex text can't go into a SysEx message, or null if it can:
 * every byte needs two digits, and data bytes are 7-bit (00–7F).
 */
export function sysexHexError(hex: string): "incomplete" | "not_7bit" | null {
	if (hexDigits(hex).length % 2 !== 0) return "incomplete";
	if (hexStringToBytes(hex).some((byte) => byte > 0x7f)) return "not_7bit";
	return null;
}

/** The fields of a monitored message that end up on the wire. */
type WireMessage = {
	type: number;
	channel?: number;
	note?: number;
	velocity?: number;
	controller?: number;
	value?: number;
	/** 14-bit, 0–16383, 8192 = centre. */
	pitchBendValue?: number;
	/** Complete SysEx, F0 … F7. */
	data?: number[];
};

/**
 * Raw MIDI bytes of a message, status byte including the channel. Same
 * layout the store sends; missing fields count as 0.
 */
export const messageToBytes = (msg: WireMessage): number[] => {
	const status =
		msg.type < MIDI_STATUS.SYSEX_START
			? msg.type | ((msg.channel ?? 1) - 1)
			: msg.type;
	switch (msg.type) {
		case MIDI_STATUS.NOTE_OFF:
		case MIDI_STATUS.NOTE_ON:
			return [status, msg.note ?? 0, msg.velocity ?? 0];
		case MIDI_STATUS.POLY_PRESSURE:
			return [status, msg.note ?? 0, msg.value ?? 0];
		case MIDI_STATUS.CONTROL_CHANGE:
			return [status, msg.controller ?? 0, msg.value ?? 0];
		case MIDI_STATUS.PROGRAM_CHANGE:
			return [status, msg.controller ?? 0];
		case MIDI_STATUS.CHANNEL_PRESSURE:
			return [status, msg.value ?? 0];
		case MIDI_STATUS.PITCH_BEND: {
			const bend = msg.pitchBendValue ?? 8192;
			return [status, bend & 0x7f, (bend >> 7) & 0x7f];
		}
		case MIDI_STATUS.SYSEX_START:
			return msg.data ?? [MIDI_STATUS.SYSEX_START, 0xf7];
		default:
			// System real-time and common messages: status byte only.
			return [status];
	}
};
