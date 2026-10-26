/**
 * Rules for configuring a board's pins from the pinout diagram: which pins can
 * be assigned, in which direction, and the config a new assignment starts with.
 */

import type { BoardPin } from "../components/kits/boards";
import { INPUT_MODES, OUTPUT_MODES } from "../components/pinmapping/modes";
import type { InputPinConfig, OutputPinConfig } from "../store/io";
import {
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_TYPE_LABELS,
	sysexPinModeAnalogIn,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModeTouch,
} from "../store/midi.config";
import { TOUCH_THRESHOLD } from "./tester";

export type GpioPin = BoardPin & { gpio: number };

/** Pin types the configurator can set up; the rest are fixed (power, I2C). */
export const isConfigurable = (pin: BoardPin): pin is GpioPin =>
	pin.gpio !== undefined &&
	(pin.type === "touch" ||
		pin.type === "button" ||
		pin.type === "neopixel" ||
		pin.type === "led" ||
		pin.type === "digital" ||
		pin.type === "analog");

/**
 * NeoPixel data goes through a one-way 5V level shifter and the onboard LED
 * only lights up: output only.
 */
export const canAddInput = (pin: BoardPin) =>
	isConfigurable(pin) && pin.type !== "neopixel" && pin.type !== "led";

/** Buttons are wired to GND: input pull-up only. */
export const canAddOutput = (pin: BoardPin) =>
	isConfigurable(pin) && pin.type !== "button";

const MIDI_DEFAULTS = {
	channel: 1,
	midiType: MIDI_CONTROL_CHANGE,
	midiMin: 0,
	midiMax: 127,
	controller: 20,
} as const;

/** New input for the pin, its mode picked from what the pin is wired for. */
export const defaultInput = (pin: GpioPin): Omit<InputPinConfig, "uuid"> => {
	const base = { ...MIDI_DEFAULTS, pin: pin.gpio, pinMin: 0, pinMax: 1023 };
	if (pin.type === "touch")
		return {
			...base,
			mode: sysexPinModeTouch,
			threshold: TOUCH_THRESHOLD,
			thresholdUnit: "percent",
		};
	return {
		...base,
		mode:
			pin.type === "analog"
				? sysexPinModeAnalogIn
				: sysexPinModeDigitalInPullup,
	};
};

export const defaultOutput = (pin: GpioPin): Omit<OutputPinConfig, "uuid"> => ({
	...MIDI_DEFAULTS,
	pin: pin.gpio,
	mode: sysexPinModeDigitalOut,
	pinMin: 0,
	pinMax: 1024,
});

/** One line per config, e.g. "INPUT_TOUCH · ch 1 · Control Change 20". */
export const configSummary = (config: InputPinConfig | OutputPinConfig) => {
	const mode = [...INPUT_MODES, ...OUTPUT_MODES].find(
		(m) => m.value === config.mode,
	);
	const number =
		config.midiType === MIDI_CONTROL_CHANGE
			? ` ${config.controller}`
			: config.midiType === MIDI_NOTE_ON
				? ` ${config.note ?? 60}`
				: "";
	return `${mode?.label ?? ""} · ch ${config.channel} · ${MIDI_TYPE_LABELS[config.midiType] ?? ""}${number}`;
};
