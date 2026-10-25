import { describe, expect, it } from "vitest";
import { BOARDS, type BoardPin, type PinType } from "../components/kits/boards";
import type { InputPinConfig, OutputPinConfig } from "../store/io";
import {
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
	sysexPinModeAnalogIn,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModeTouch,
} from "../store/midi.config";
import {
	canAddInput,
	canAddOutput,
	configSummary,
	defaultInput,
	defaultOutput,
	isConfigurable,
} from "./pinout";
import { TOUCH_THRESHOLD } from "./tester";

const pin = (type: PinType, gpio?: number): BoardPin => ({
	x: 0,
	y: 0,
	label: gpio === undefined ? "" : String(gpio),
	gpio,
	type,
});

const ASSIGNABLE: PinType[] = [
	"touch",
	"button",
	"neopixel",
	"digital",
	"analog",
];
const FIXED: PinType[] = [
	"i2c_sda",
	"i2c_scl",
	"power_5v",
	"power_3v3",
	"gnd",
	"nc",
];

describe("isConfigurable", () => {
	it.each(ASSIGNABLE)("allows %s pins with a GPIO", (type) => {
		expect(isConfigurable(pin(type, 5))).toBe(true);
	});

	it.each(FIXED)("rejects %s pins", (type) => {
		expect(isConfigurable(pin(type, 5))).toBe(false);
	});

	it("rejects pins without a GPIO", () => {
		expect(isConfigurable(pin("digital"))).toBe(false);
	});
});

describe("allowed directions", () => {
	it("allows input and output on GPIO pins", () => {
		for (const type of ["touch", "digital", "analog"] as const) {
			expect(canAddInput(pin(type, 5))).toBe(true);
			expect(canAddOutput(pin(type, 5))).toBe(true);
		}
	});

	it("keeps hardwired buttons input only", () => {
		expect(canAddInput(pin("button", 16))).toBe(true);
		expect(canAddOutput(pin("button", 16))).toBe(false);
	});

	it("keeps the level-shifted NeoPixel pin output only", () => {
		expect(canAddInput(pin("neopixel", 40))).toBe(false);
		expect(canAddOutput(pin("neopixel", 40))).toBe(true);
	});

	it("allows neither on fixed pins", () => {
		for (const type of FIXED) {
			expect(canAddInput(pin(type, 5))).toBe(false);
			expect(canAddOutput(pin(type, 5))).toBe(false);
		}
	});
});

describe("defaultInput", () => {
	it("sets up touch pins as touch with a percent threshold", () => {
		expect(defaultInput({ ...pin("touch", 3), gpio: 3 })).toMatchObject({
			pin: 3,
			mode: sysexPinModeTouch,
			threshold: TOUCH_THRESHOLD,
			thresholdUnit: "percent",
		});
	});

	it("sets up analog pins as analog input", () => {
		expect(defaultInput({ ...pin("analog", 9), gpio: 9 })).toMatchObject({
			pin: 9,
			mode: sysexPinModeAnalogIn,
		});
	});

	it.each(["digital", "button"] as const)(
		"sets up %s pins as input pull-up",
		(type) => {
			const config = defaultInput({ ...pin(type, 16), gpio: 16 });
			expect(config.mode).toBe(sysexPinModeDigitalInPullup);
			expect(config.threshold).toBeUndefined();
		},
	);

	it("sends CC 20 on channel 1 over the full MIDI range", () => {
		expect(defaultInput({ ...pin("digital", 21), gpio: 21 })).toMatchObject({
			channel: 1,
			midiType: MIDI_CONTROL_CHANGE,
			controller: 20,
			midiMin: 0,
			midiMax: 127,
		});
	});
});

describe("defaultOutput", () => {
	it("sets up a digital output on the pin", () => {
		expect(defaultOutput({ ...pin("neopixel", 40), gpio: 40 })).toMatchObject({
			pin: 40,
			mode: sysexPinModeDigitalOut,
			channel: 1,
			midiType: MIDI_CONTROL_CHANGE,
			controller: 20,
		});
	});
});

describe("configSummary", () => {
	const base = {
		uuid: "x",
		pin: 1,
		channel: 2,
		midiMin: 0,
		midiMax: 127,
		pinMin: 0,
		pinMax: 1023,
	};

	it("names mode, channel, type and controller", () => {
		const config: InputPinConfig = {
			...base,
			mode: sysexPinModeTouch,
			midiType: MIDI_CONTROL_CHANGE,
			controller: 20,
		};
		expect(configSummary(config)).toBe(
			"INPUT_TOUCH · ch 2 · Control Change 20",
		);
	});

	it("names the note, defaulting to 60", () => {
		const config: OutputPinConfig = {
			...base,
			mode: sysexPinModeDigitalOut,
			midiType: MIDI_NOTE_ON,
		};
		expect(configSummary(config)).toBe("OUTPUT (digital) · ch 2 · Note On 60");
		expect(configSummary({ ...config, note: 64 })).toBe(
			"OUTPUT (digital) · ch 2 · Note On 64",
		);
	});

	it("has no number for pitch bend", () => {
		const config: InputPinConfig = {
			...base,
			mode: sysexPinModeAnalogIn,
			midiType: MIDI_PITCH_BEND,
		};
		expect(configSummary(config)).toBe("ANALOG · ch 2 · Pitch Bend");
	});
});

describe.each(BOARDS)("board $name", (board) => {
	const inside = (x: number, y: number) =>
		x >= 0 && x <= board.width && y >= 0 && y <= board.height;

	it("has every pad on the board", () => {
		for (const p of board.pins) expect(inside(p.x, p.y), p.label).toBe(true);
	});

	it("has no two pads at the same spot", () => {
		const spots = board.pins.map((p) => `${p.x},${p.y}`);
		expect(new Set(spots).size).toBe(spots.length);
	});

	it("labels GPIO pads with their GPIO number, I2C with the bus line", () => {
		for (const p of board.pins)
			if (p.gpio !== undefined) {
				expect(p.label).toBe(
					p.type === "i2c_sda"
						? "SDA"
						: p.type === "i2c_scl"
							? "SCL"
							: String(p.gpio),
				);
				// ESP32-S2 GPIOs
				expect(p.gpio).toBeGreaterThanOrEqual(0);
				expect(p.gpio).toBeLessThanOrEqual(46);
			}
	});

	it("gives a GPIO to every assignable pad", () => {
		for (const p of board.pins)
			if (ASSIGNABLE.includes(p.type)) expect(p.gpio, p.label).toBeDefined();
	});

	it("puts touch pads on touch-capable GPIOs", () => {
		// ESP32-S2 touch channels are GPIO 1–14
		for (const p of board.pins)
			if (p.type === "touch") {
				expect(p.gpio).toBeGreaterThanOrEqual(1);
				expect(p.gpio).toBeLessThanOrEqual(14);
			}
	});

	it("frames only pins of the group's kind, and at least one", () => {
		for (const group of board.groups) {
			const framed = board.pins.filter(
				(p) =>
					p.x >= group.x &&
					p.x <= group.x + group.width &&
					p.y >= group.y &&
					p.y <= group.y + group.height &&
					p.gpio !== undefined,
			);
			expect(framed.length).toBeGreaterThan(0);
			for (const p of framed) expect(p.type).toBe(group.kind);
		}
	});

	it("keeps outlines and groups on the board", () => {
		for (const r of [...board.outlines, ...board.groups]) {
			expect(inside(r.x, r.y)).toBe(true);
			expect(inside(r.x + r.width, r.y + r.height)).toBe(true);
		}
	});
});

describe("enomik 3000 client v0.5", () => {
	const board = BOARDS.find((b) => b.id === "client_v0_5");
	const gpios = (type: PinType) =>
		[
			...new Set(board?.pins.filter((p) => p.type === type).map((p) => p.gpio)),
		].sort((a, b) => (a ?? 0) - (b ?? 0));

	it("has touch 1–8, buttons 16/17 and NeoPixel on 40", () => {
		expect(gpios("touch")).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(gpios("button")).toEqual([16, 17]);
		expect(gpios("neopixel")).toEqual([40]);
	});

	it("has analog inputs on 9 and 10", () => {
		expect(gpios("analog")).toEqual([9, 10]);
	});

	it("has I2C on SDA 33 and SCL 35", () => {
		expect(gpios("i2c_sda")).toEqual([33]);
		expect(gpios("i2c_scl")).toEqual([35]);
	});
});

describe("enomik 3000 extender v0.5.1", () => {
	const client = BOARDS.find((b) => b.id === "client_v0_5");
	const board = BOARDS.find((b) => b.id === "extender_v0_5_1");
	const gpios = (type: PinType) =>
		[
			...new Set(board?.pins.filter((p) => p.type === type).map((p) => p.gpio)),
		].sort((a, b) => (a ?? 0) - (b ?? 0));

	it("has analog A2–A5 on 11–14 and digital D2–D7", () => {
		expect(gpios("analog")).toEqual([11, 12, 13, 14]);
		expect(gpios("digital")).toEqual([34, 36, 37, 38, 39, 40]);
	});

	it("has I2C on SDA 33 and SCL 35", () => {
		expect(gpios("i2c_sda")).toEqual([33]);
		expect(gpios("i2c_scl")).toEqual([35]);
	});

	it("only uses GPIOs the client's IDC16 carries", () => {
		const idc = new Set(
			client?.pins.filter((p) => p.x > 70).map((p) => p.gpio),
		);
		for (const p of board?.pins ?? [])
			if (p.gpio !== undefined) expect(idc.has(p.gpio), p.label).toBe(true);
	});
});
