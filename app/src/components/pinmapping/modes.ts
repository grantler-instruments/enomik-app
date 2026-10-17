import {
	sysexPinModeAnalogIn,
	sysexPinModeDigitalIn,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModePWMOut,
	sysexPinModeTouch,
} from "../../store/midi.config";

export const INPUT_MODES = [
	{ label: "ANALOG", value: sysexPinModeAnalogIn },
	{ label: "INPUT (digital)", value: sysexPinModeDigitalIn },
	{ label: "INPUT_PULLUP (digital)", value: sysexPinModeDigitalInPullup },
	{ label: "INPUT_TOUCH", value: sysexPinModeTouch },
];

export const OUTPUT_MODES = [
	{ label: "OUTPUT (digital)", value: sysexPinModeDigitalOut },
	{ label: "PWM (analog)", value: sysexPinModePWMOut },
];

/** i18n key of the description shown as tooltip on the mode select. */
export const MODE_DESCRIPTION_KEYS: Record<number, string> = {
	[sysexPinModeAnalogIn]: "pin_mode_analog_desc",
	[sysexPinModeDigitalIn]: "pin_mode_digital_in_desc",
	[sysexPinModeDigitalInPullup]: "pin_mode_digital_in_pullup_desc",
	[sysexPinModeTouch]: "pin_mode_touch_desc",
	[sysexPinModeDigitalOut]: "pin_mode_digital_out_desc",
	[sysexPinModePWMOut]: "pin_mode_pwm_desc",
};
