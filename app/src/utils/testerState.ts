/**
 * Test results for the tester page as a pure reducer: every incoming MIDI
 * message is one action, so the page needs no refs to read the latest state.
 */

import { MIDI_CONTROL_CHANGE } from "../store/midi.config";
import {
	BUTTON_PINS,
	buttonEvent,
	CYCLE_PIN,
	MIDI_TYPES,
	noteDown,
} from "./tester";

/** How a message reached the page: from the client directly, or the dongle. */
export type Path = "usb" | "wireless";
export type Seen = Record<Path, boolean>;

const NOT_SEEN: Seen = { usb: false, wireless: false };
const NO_LOOP_NOTE = { ...NOT_SEEN, held: false, released: false };

/** Pin 16 gets one row per MIDI type; the other buttons stay on CC. */
export const ROWS = BUTTON_PINS.flatMap((pin) =>
	MIDI_TYPES.filter(
		(type) => pin === CYCLE_PIN || type.status === MIDI_CONTROL_CHANGE,
	).map((type) => ({ pin, ...type })),
);
export const rowKey = (pin: number, status: number) => `${pin}:${status}`;

export type TesterState = {
	ledPin: number;
	touchPins: number[];
	/** Per button row (rowKey): where a press arrived. */
	buttons: Record<string, Seen>;
	/** Buttons held right now (USB). */
	pressed: Record<number, boolean>;
	/** Index into MIDI_TYPES that pin 16 sends now. */
	typeIndex: number;
	/** Set by a press of the current type. A fresh pin config reports the
	 * released state right away, which must not count as a release. */
	armed: boolean;
	touch: Record<number, Seen>;
	/** Pin 16 sends note <LED pin> and the client handles its own MIDI. */
	loopbackOn: boolean;
	loopNote: Seen & { held: boolean; released: boolean };
	/** The user's answer: did the LED light? */
	lit: boolean | null;
};

export type TesterAction =
	| { type: "reset"; ledPin: number; touchPins: number[] }
	| { type: "midi"; path: Path; bytes: ArrayLike<number> }
	| { type: "loopback"; on: boolean }
	| { type: "lit"; lit: boolean };

export const initialState = (
	ledPin: number,
	touchPins: number[],
): TesterState => ({
	ledPin,
	touchPins,
	buttons: Object.fromEntries(
		ROWS.map((row) => [rowKey(row.pin, row.status), NOT_SEEN]),
	),
	pressed: {},
	typeIndex: 0,
	armed: false,
	touch: {},
	loopbackOn: false,
	loopNote: NO_LOOP_NOTE,
	lit: null,
});

const mark = (seen: Seen | undefined, path: Path): Seen => ({
	...NOT_SEEN,
	...seen,
	[path]: true,
});

function onLoopbackNote(
	state: TesterState,
	path: Path,
	bytes: ArrayLike<number>,
): TesterState {
	const down = noteDown(bytes, state.ledPin);
	if (down === null) return state;
	const note = state.loopNote;
	if (down)
		return {
			...state,
			loopNote: { ...note, [path]: true, held: note.held || path === "usb" },
		};
	// The fresh pin config reports a release before any press.
	return path === "usb" && note.held
		? { ...state, loopNote: { ...note, released: true } }
		: state;
}

function onPinMessage(
	state: TesterState,
	path: Path,
	bytes: ArrayLike<number>,
): TesterState {
	const ev = buttonEvent(bytes, state.touchPins);
	if (!ev) return state;
	if (state.touchPins.includes(ev.pin))
		return ev.down
			? {
					...state,
					touch: { ...state.touch, [ev.pin]: mark(state.touch[ev.pin], path) },
				}
			: state;

	const key = rowKey(ev.pin, ev.status);
	let next = state;
	if (path === "usb")
		next = { ...next, pressed: { ...next.pressed, [ev.pin]: ev.down } };
	if (ev.down && next.buttons[key])
		next = {
			...next,
			buttons: { ...next.buttons, [key]: mark(next.buttons[key], path) },
		};

	const current =
		ev.pin === CYCLE_PIN && ev.status === MIDI_TYPES[next.typeIndex].status;
	if (path !== "usb" || !current) return next;
	if (ev.down) return { ...next, armed: true };
	if (!next.armed) return next;
	return {
		...next,
		typeIndex: (next.typeIndex + 1) % MIDI_TYPES.length,
		armed: false,
	};
}

export function testerReducer(
	state: TesterState,
	action: TesterAction,
): TesterState {
	switch (action.type) {
		case "reset":
			return initialState(action.ledPin, action.touchPins);
		case "midi":
			return state.loopbackOn
				? onLoopbackNote(state, action.path, action.bytes)
				: onPinMessage(state, action.path, action.bytes);
		case "loopback":
			// Either way pin 16 gets a fresh config, which reports a release.
			return action.on
				? {
						...state,
						loopbackOn: true,
						armed: false,
						loopNote: NO_LOOP_NOTE,
						lit: null,
					}
				: { ...state, loopbackOn: false, armed: false };
		case "lit":
			return { ...state, lit: action.lit };
	}
}

export const buttonsPassed = (state: TesterState, paths: Path[]) =>
	ROWS.every((row) =>
		paths.every((p) => state.buttons[rowKey(row.pin, row.status)][p]),
	);

export const loopbackPassed = (state: TesterState, paths: Path[]) =>
	state.lit === true && paths.every((p) => state.loopNote[p]);

export const touchPassed = (state: TesterState, paths: Path[]) =>
	state.touchPins.every((pin) => paths.every((p) => state.touch[pin]?.[p]));
