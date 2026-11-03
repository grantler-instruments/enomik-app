export type PinType =
	| "touch"
	| "button"
	| "neopixel"
	| "led"
	| "digital"
	| "analog"
	| "i2c_sda"
	| "i2c_scl"
	| "power_5v"
	| "power_3v3"
	| "gnd"
	| "nc";

export type LabelSide = "top" | "bottom" | "left" | "right";

/** Pad position in mm from the board's top left corner (top view). */
export interface BoardPin {
	x: number;
	y: number;
	/** Text next to the pad, e.g. the GPIO number or "5V". Empty: none. */
	label: string;
	gpio?: number;
	type: PinType;
	labelSide?: LabelSide;
}

/** Outline around a connector or part, with its silkscreen name. */
export interface BoardOutline {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	/** Parts on the board (not connectors) are drawn dashed. */
	part?: boolean;
	/** i18n key of a tooltip on the name explaining the connector. */
	infoKey?: string;
}

/** Frame around pins that share a capability, labelled on one side. */
export interface PinGroup {
	kind: "digital" | "analog";
	x: number;
	y: number;
	width: number;
	height: number;
	labelSide: LabelSide;
}

export interface Board {
	id: string;
	name: string;
	/** i18n key */
	descriptionKey: string;
	/** Board size in mm. */
	width: number;
	height: number;
	cornerRadius: number;
	pins: BoardPin[];
	outlines: BoardOutline[];
	groups: PinGroup[];
	mountingHoles?: { x: number; y: number; diameter: number }[];
}

type PinSpec = Omit<BoardPin, "x" | "y">;

/** Pins at the given x positions, same y. */
const row = (xs: number[], y: number, pins: PinSpec[]): BoardPin[] =>
	pins.map((pin, i) => ({ ...pin, x: xs[i], y }));

/** Pins at the given y positions, same x. */
const column = (x: number, ys: number[], pins: PinSpec[]): BoardPin[] =>
	pins.map((pin, i) => ({ ...pin, x, y: ys[i] }));

const gpio = (n: number, type: PinType, labelSide?: LabelSide): PinSpec => ({
	label: String(n),
	gpio: n,
	type,
	labelSide,
});
const pin = (label: string, type: PinType, labelSide?: LabelSide): PinSpec => ({
	label,
	type,
	labelSide,
});

const GND = pin("GND", "gnd");
const VCC = pin("VCC", "power_3v3");
const V5 = pin("+5V", "power_5v");
const NC = pin("NC", "nc");
// I2C keeps its bus name as label; the GPIO shows in the tooltip
const SDA: PinSpec = { ...pin("SDA", "i2c_sda"), gpio: 33 };
const SCL: PinSpec = { ...pin("SCL", "i2c_scl"), gpio: 35 };

// From the gerber files of enomik 3000 client v0.5 (EasyEDA), board origin top left.
const JST_LEFT = [40, 42, 44, 46];
const JST_RIGHT = [52, 54, 56, 58];
const HEADER_3PIN = [62.46, 65, 67.54];
const T18 = [30.61, 33.15, 35.69, 38.23];
const IDC = [11.11, 13.65, 16.19, 18.73, 21.27, 23.81, 26.35, 28.89];

// From the gerber files of enomik 3000 extender v0.5.1, board origin top left.
const EXT_IDC = [7.239, 9.779, 12.319, 14.859, 17.399, 19.939, 22.479, 25.019];
const EXT_ROWS = [6, 13, 20, 27];
const EXT_I2C = [19.5, 21.5, 23.5, 25.5];
const EXT_A = [31.5, 33.5, 35.5, 37.5];
/** A2–A5: GPIO and row. */
const EXT_ANALOG: [number, number][] = [
	[11, 6],
	[12, 13],
	[13, 20],
	[14, 27],
];
/** D2–D7: GPIO, first pad x and row. */
const EXT_DIGITAL: [number, number, number][] = [
	[34, 43.5, 6.096],
	[36, 43.5, 13],
	[37, 43.5, 20],
	[38, 43.5, 27],
	[39, 55.5, 13],
	[40, 55.5, 20],
];

/** JST connector outline around 4 pads at y, with room for the labels above. */
const jst = (
	name: string,
	x: number,
	y: number,
	infoKey?: string,
): BoardOutline => ({
	name,
	infoKey,
	x: x - 1.5,
	y: y - 2.3,
	width: 9,
	height: 3.6,
});

/** 3-pin header: signal, VCC, GND. */
const header3 = (y: number, n: number, type: PinType) =>
	row(HEADER_3PIN, y, [
		gpio(n, type, "left"),
		{ ...VCC, label: "" },
		{ ...GND, label: "" },
	]);

const sideColumn = (
	x: number,
	ys: number[],
	specs: PinSpec[],
	side: LabelSide,
) =>
	column(
		x,
		ys,
		specs.map((spec) => ({ ...spec, labelSide: side })),
	);

export const BOARDS: Board[] = [
	{
		id: "client_v0_5",
		name: "enomik 3000 client v0.5",
		descriptionKey: "kits_board_client_desc",
		width: 80,
		height: 40.13,
		cornerRadius: 0.5,
		mountingHoles: [
			{ x: 3, y: 3, diameter: 3.1 },
			{ x: 3, y: 37, diameter: 3.1 },
			{ x: 77, y: 2.92, diameter: 3.1 },
			{ x: 77, y: 37, diameter: 3.1 },
		],
		outlines: [
			{
				name: "LOLIN S2 mini",
				x: 7.7,
				y: 4.5,
				width: 20.4,
				height: 25.5,
				part: true,
				infoKey: "kits_info_module",
			},
			{
				name: "I2C",
				x: 12.9,
				y: 0.3,
				width: 10.2,
				height: 2.4,
				infoKey: "kits_info_i2c",
			},
			{
				name: "POWER",
				x: 37.9,
				y: 0.4,
				width: 10.2,
				height: 5.2,
				infoKey: "kits_info_power",
			},
			jst("NEOPIXEL", 40, 8.8, "kits_info_neopixel"),
			jst("TOUCH 1–4", 40, 15.8, "kits_info_touch"),
			jst("TOUCH 5–8", 40, 22.8, "kits_info_touch"),
			jst("I2C GROVE", 40, 29.8, "kits_info_grove"),
			jst("I2C GROVE", 40, 36.8, "kits_info_grove"),
			jst("D1", 52, 15.8),
			jst("D0", 52, 22.8),
			jst("A1", 52, 29.8),
			jst("A0", 52, 36.8),
			{
				name: "T1–8",
				x: 62.6,
				y: 29.3,
				width: 5.1,
				height: 10.2,
				infoKey: "kits_info_touch_header",
			},
			{
				name: "IDC16",
				x: 72.4,
				y: 9.8,
				width: 5.2,
				height: 20.4,
				infoKey: "kits_info_idc",
			},
			{
				name: "BUTTON A",
				x: 9,
				y: 34.2,
				width: 6,
				height: 3.6,
				infoKey: "kits_info_button",
			},
			{
				name: "BUTTON B",
				x: 21,
				y: 34.2,
				width: 6,
				height: 3.6,
				infoKey: "kits_info_button",
			},
		],
		groups: [
			// JST D1/D0 and A1/A0
			{
				kind: "digital",
				x: 50,
				y: 12.9,
				width: 9.8,
				height: 12.6,
				labelSide: "top",
			},
			{
				kind: "analog",
				x: 50,
				y: 26.9,
				width: 9.8,
				height: 13,
				labelSide: "top",
			},
			// 3-pin headers
			{
				kind: "digital",
				x: 60.1,
				y: 16.8,
				width: 8.7,
				height: 5.2,
				labelSide: "top",
			},
			{
				kind: "analog",
				x: 60.1,
				y: 22.1,
				width: 8.7,
				height: 5.2,
				labelSide: "bottom",
			},
			// IDC16 GPIO rows
			{
				kind: "digital",
				x: 70.7,
				y: 12.5,
				width: 9,
				height: 12.5,
				labelSide: "right",
			},
		],
		pins: [
			...row([14.19, 16.73, 19.27, 21.81], 1.5, [GND, VCC, SCL, SDA]),
			// Onboard LED of the LOLIN S2 mini, not on the client's gerber
			{ ...gpio(15, "led", "right"), x: 17.9, y: 21 },
			// Tactile switches to GND, centered between their pads
			...row([12, 24], 36, [gpio(16, "button"), gpio(17, "button")]),
			...row([39.19, 41.73, 44.27, 46.81], 1.73, [VCC, VCC, V5, V5]),
			...row([39.19, 41.73, 44.27, 46.81], 4.27, [
				{ ...GND, label: "", labelSide: "bottom" },
				{ ...GND, label: "", labelSide: "bottom" },
				{ ...GND, label: "", labelSide: "bottom" },
				{ ...GND, label: "", labelSide: "bottom" },
			]),
			...row(JST_LEFT, 8.8, [gpio(40, "neopixel"), NC, V5, GND]),
			...row(
				JST_LEFT,
				15.8,
				[1, 2, 3, 4].map((n) => gpio(n, "touch")),
			),
			...row(
				JST_LEFT,
				22.8,
				[5, 6, 7, 8].map((n) => gpio(n, "touch")),
			),
			...row(JST_LEFT, 29.8, [SCL, SDA, VCC, GND]),
			...row(JST_LEFT, 36.8, [SCL, SDA, VCC, GND]),
			...row(JST_RIGHT, 15.8, [gpio(21, "digital"), NC, VCC, GND]),
			...row(JST_RIGHT, 22.8, [gpio(18, "digital"), NC, VCC, GND]),
			...row(JST_RIGHT, 29.8, [gpio(10, "analog"), NC, VCC, GND]),
			...row(JST_RIGHT, 36.8, [gpio(9, "analog"), NC, VCC, GND]),
			...header3(18, 21, "digital"),
			...header3(20.7, 18, "digital"),
			...header3(23.4, 10, "analog"),
			...header3(26.1, 9, "analog"),
			...sideColumn(
				63.88,
				T18,
				[1, 3, 5, 7].map((n) => gpio(n, "touch")),
				"left",
			),
			...sideColumn(
				66.42,
				T18,
				[2, 4, 6, 8].map((n) => gpio(n, "touch")),
				"right",
			),
			...sideColumn(
				73.73,
				IDC,
				[
					GND,
					gpio(40, "digital"),
					gpio(38, "digital"),
					gpio(36, "digital"),
					gpio(14, "digital"),
					gpio(12, "digital"),
					SCL,
					VCC,
				],
				"left",
			),
			...sideColumn(
				76.27,
				IDC,
				[
					VCC,
					gpio(39, "digital"),
					gpio(37, "digital"),
					gpio(34, "digital"),
					gpio(13, "digital"),
					gpio(11, "digital"),
					SDA,
					GND,
				],
				"right",
			),
		],
	},
	{
		id: "extender_v0_5_1",
		name: "enomik 3000 extender v0.5.1",
		descriptionKey: "kits_board_extender_desc",
		width: 64,
		height: 32,
		cornerRadius: 0,
		mountingHoles: [
			{ x: 3, y: 3, diameter: 3.1 },
			{ x: 3, y: 29, diameter: 3.1 },
			{ x: 61, y: 3, diameter: 3.1 },
			{ x: 61, y: 29, diameter: 3.1 },
		],
		outlines: [
			{
				name: "IDC16",
				x: 6.5,
				y: 1.9,
				width: 9.1,
				height: 28.5,
				infoKey: "kits_info_idc_extender",
			},
			...EXT_ROWS.map((y) =>
				jst("I2C GROVE", EXT_I2C[0], y, "kits_info_grove"),
			),
			...EXT_ANALOG.map(([, y], i) => jst(`A${i + 2}`, EXT_A[0], y)),
			...EXT_DIGITAL.map(([, x, y], i) => jst(`D${i + 2}`, x, y)),
		],
		groups: [
			{
				kind: "analog",
				x: 29.5,
				y: 3.1,
				width: 9.8,
				height: 26.6,
				labelSide: "top",
			},
			{
				kind: "digital",
				x: 41.5,
				y: 3.1,
				width: 21.8,
				height: 26.6,
				labelSide: "top",
			},
		],
		pins: [
			// Mirror of the client's IDC16 through the ribbon cable
			...sideColumn(
				9.779,
				EXT_IDC,
				[
					GND,
					SDA,
					gpio(11, "analog"),
					gpio(13, "analog"),
					gpio(34, "digital"),
					gpio(37, "digital"),
					gpio(39, "digital"),
					VCC,
				],
				"left",
			),
			...sideColumn(
				12.319,
				EXT_IDC,
				[
					VCC,
					SCL,
					gpio(12, "analog"),
					gpio(14, "analog"),
					gpio(36, "digital"),
					gpio(38, "digital"),
					gpio(40, "digital"),
					GND,
				],
				"right",
			),
			...EXT_ROWS.flatMap((y) => row(EXT_I2C, y, [SCL, SDA, VCC, GND])),
			...EXT_ANALOG.flatMap(([n, y]) =>
				row(EXT_A, y, [gpio(n, "analog"), NC, VCC, GND]),
			),
			...EXT_DIGITAL.flatMap(([n, x, y]) =>
				row([x, x + 2, x + 4, x + 6], y, [gpio(n, "digital"), NC, VCC, GND]),
			),
		],
	},
];

// LOLIN S2 mini v1.0.0, top view, USB-C at the bottom. Size, mounting holes and
// header grid from the wemos.cc dimension drawing (dim_s2_mini_v1.0.0.pdf) and
// pinout (s2_mini_v1.0.0_4_16x9.jpg): two double 2.54 mm headers, the outer
// columns 22.86 mm apart like the D1 mini.
const S2_ROWS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => 7.62 + i * 2.54);
/** GPIO 1–10 are on ADC1, which still works while the radio is on. */
const adc1Gpio = (n: number, side: LabelSide) =>
	gpio(n, n >= 1 && n <= 10 ? "analog" : "digital", side);

export const LOLIN_S2_MINI: Board = {
	id: "lolin_s2_mini",
	name: "LOLIN S2 mini",
	descriptionKey: "kits_board_s2_mini_desc",
	width: 25.4,
	height: 34.3,
	cornerRadius: 1.5,
	mountingHoles: [
		{ x: 2.5, y: 3.2, diameter: 2 },
		{ x: 22.9, y: 3.2, diameter: 2 },
	],
	outlines: [
		{
			name: "ESP32-S2",
			x: 10.6,
			y: 12.7,
			width: 7.3,
			height: 7.5,
			part: true,
		},
		{ name: "USB-C", x: 8.1, y: 27, width: 9.2, height: 7.3 },
		{ name: "RST", x: 1.4, y: 28.3, width: 3.2, height: 5 },
		{ name: "BOOT", x: 22.2, y: 28.3, width: 3.2, height: 5 },
	],
	groups: [],
	pins: [
		...sideColumn(
			1.27,
			S2_ROWS,
			[
				pin("EN", "nc"),
				...[3, 5, 7, 9, 11, 12].map((n) => adc1Gpio(n, "left")),
				pin("3V3", "power_3v3"),
			],
			"left",
		),
		...column(
			3.81,
			S2_ROWS,
			[1, 2, 4, 6, 8, 10, 13, 14].map((n) => adc1Gpio(n, "right")),
		),
		...column(21.59, S2_ROWS, [
			...[40, 38, 36, 34, 21, 17].map((n) => adc1Gpio(n, "left")),
			{ ...GND, labelSide: "left" },
			// Shared with the blue onboard LED
			gpio(15, "led", "left"),
		]),
		...sideColumn(
			24.13,
			S2_ROWS,
			[
				...[39, 37, 35, 33, 18, 16].map((n) => adc1Gpio(n, "right")),
				GND,
				pin("VBUS", "power_5v"),
			],
			"right",
		),
		// Onboard BOOT button to GND
		{ ...gpio(0, "button", "left"), x: 23.8, y: 30.8 },
	],
};

// Espressif ESP32-S2-DevKitC-1 and ESP32-S3-DevKitC-1 share one PCB outline,
// top view, USB ports at the bottom. Size, pads and parts from Espressif's
// dimension drawings (DXF_ESP32-S2-DevKitC-1_V1_20210511.dxf,
// DXF_ESP32-S3-DevKitC-1_V1.1_20220429.dxf) and the user guide pinouts: two
// 22-pin headers, 2.54 mm pitch, 1.27 mm from the long edges. The module's
// antenna overhangs the top edge by 6.3 mm; only the part on the board is drawn.
const DEVKITC_ROWS = Array.from({ length: 22 }, (_, i) => 1.44 + i * 2.54);
const DEVKITC_J1 = [
	4, 5, 6, 7, 15, 16, 17, 18, 8, 3, 46, 9, 10, 11, 12, 13, 14,
];

interface DevkitCSpec {
	id: string;
	name: string;
	descriptionKey: string;
	module: string;
	/** J3 GPIOs between TX/RX and the bottom GNDs, top to bottom. */
	j3: number[];
	/** GPIO of the addressable RGB LED. */
	rgb: number;
	/** Header GPIOs that must stay unassigned. */
	reserved: number[];
}

/** GPIO 1–10 are on ADC1, which still works while the radio is on. */
const devkitC = ({
	rgb,
	reserved,
	j3,
	module,
	...rest
}: DevkitCSpec): Board => {
	const io = (n: number, side: LabelSide) =>
		gpio(
			n,
			n === rgb
				? "neopixel"
				: reserved.includes(n)
					? "nc"
					: n >= 1 && n <= 10
						? "analog"
						: "digital",
			side,
		);
	return {
		...rest,
		width: 25.4,
		height: 62.74,
		cornerRadius: 0.5,
		outlines: [
			{ name: module, x: 3.75, y: 0, width: 18, height: 19.09, part: true },
			{
				name: "RGB",
				x: 11.96,
				y: 40.72,
				width: 3.25,
				height: 3.75,
				part: true,
			},
			{ name: "BOOT", x: 6, y: 47.68, width: 3.05, height: 2.2 },
			{ name: "RST", x: 16.38, y: 47.68, width: 3.05, height: 2.2 },
			{ name: "UART", x: 1.89, y: 56.44, width: 8.22, height: 5.27 },
			{ name: "USB", x: 15.29, y: 56.44, width: 8.22, height: 5.27 },
		],
		groups: [],
		pins: [
			...sideColumn(
				1.27,
				DEVKITC_ROWS,
				[
					pin("3V3", "power_3v3"),
					pin("3V3", "power_3v3"),
					pin("RST", "nc"),
					...DEVKITC_J1.map((n) => io(n, "left")),
					pin("5V", "power_5v"),
					GND,
				],
				"left",
			),
			...sideColumn(
				24.13,
				DEVKITC_ROWS,
				[GND, ...[43, 44, ...j3].map((n) => io(n, "right")), GND, GND],
				"right",
			),
			// Onboard BOOT button to GND
			{ ...gpio(0, "button", "top"), x: 7.53, y: 48.78 },
		],
	};
};

/** 19/20 are the native USB port on every DevKitC-1. */
const S2_DEVKITC_J3 = [
	1, 2, 42, 41, 40, 39, 38, 37, 36, 35, 0, 45, 34, 33, 21, 20, 19,
];
const S3_DEVKITC_J3 = [
	1, 2, 42, 41, 40, 39, 38, 37, 36, 35, 0, 45, 48, 47, 21, 20, 19,
];

export const ESP32_S2_DEVKITC = devkitC({
	id: "esp32_s2_devkitc",
	name: "ESP32-S2-DevKitC-1",
	descriptionKey: "kits_board_s2_devkitc_desc",
	module: "ESP32-S2-SOLO-2",
	j3: S2_DEVKITC_J3,
	rgb: 18,
	reserved: [19, 20],
});

// v1.0 and v1.1 differ only in the RGB LED's GPIO. 35–37 carry the octal
// PSRAM on R8 modules.
const s3DevkitC = (version: "1.0" | "1.1", rgb: 48 | 38) =>
	devkitC({
		id: `esp32_s3_devkitc_v${version.replace(".", "_")}`,
		name: `ESP32-S3-DevKitC-1 v${version}`,
		descriptionKey: `kits_board_s3_devkitc_v${version.replace(".", "_")}_desc`,
		module: "ESP32-S3-WROOM-1",
		j3: S3_DEVKITC_J3,
		rgb,
		reserved: [19, 20, 35, 36, 37],
	});

export const ESP32_S3_DEVKITC_V1_0 = s3DevkitC("1.0", 48);
export const ESP32_S3_DEVKITC_V1_1 = s3DevkitC("1.1", 38);

// LOLIN S3 mini v1.0.0, top view, USB-C at the bottom. Same outline, mounting
// holes and header grid as the S2 mini (dim_s3_mini_v1.0.0.pdf), pinout from
// s3_mini_v1.0.0_4_16x9.jpg. The ESP32-S3FH4R2's PSRAM is in the package, so
// no header pins are taken. The RGB LED (GPIO 47) is onboard only.
export const LOLIN_S3_MINI: Board = {
	id: "lolin_s3_mini",
	name: "LOLIN S3 mini",
	descriptionKey: "kits_board_s3_mini_desc",
	width: 25.4,
	height: 34.3,
	cornerRadius: 1.5,
	mountingHoles: [
		{ x: 2.5, y: 3.2, diameter: 2 },
		{ x: 22.9, y: 3.2, diameter: 2 },
	],
	outlines: [
		{
			name: "ESP32-S3",
			x: 7,
			y: 10.9,
			width: 7.1,
			height: 7.1,
			part: true,
		},
		{ name: "USB-C", x: 8.2, y: 26.6, width: 9, height: 7.6 },
		{ name: "RST", x: 1.4, y: 28.3, width: 3.2, height: 5 },
		{ name: "BOOT", x: 22.2, y: 28.3, width: 3.2, height: 5 },
	],
	groups: [],
	pins: [
		...sideColumn(
			1.27,
			S2_ROWS,
			[
				pin("EN", "nc"),
				...[2, 4, 12, 13, 11, 10].map((n) => adc1Gpio(n, "left")),
				pin("3V3", "power_3v3"),
			],
			"left",
		),
		...column(
			3.81,
			S2_ROWS,
			[1, 3, 5, 6, 7, 8, 9, 14].map((n) => adc1Gpio(n, "right")),
		),
		...column(21.59, S2_ROWS, [
			...[33, 37, 38, 34, 21, 17].map((n) => adc1Gpio(n, "left")),
			{ ...GND, labelSide: "left" },
			adc1Gpio(15, "left"),
		]),
		...sideColumn(
			24.13,
			S2_ROWS,
			[
				...[43, 44, 36, 35, 18, 16].map((n) => adc1Gpio(n, "right")),
				GND,
				pin("VBUS", "power_5v"),
			],
			"right",
		),
		// Onboard RGB LED and BOOT button to GND
		{ ...gpio(47, "neopixel", "left"), x: 19.5, y: 32.4 },
		{ ...gpio(0, "button", "left"), x: 23.8, y: 30.8 },
	],
};

/** What the configurator can show: our kit, or a bare dev board. */
export const BOARD_SETS: { id: string; name: string; boards: Board[] }[] = [
	{ id: "enomik_3000", name: "enomik 3000 client + extender", boards: BOARDS },
	...[
		LOLIN_S2_MINI,
		ESP32_S2_DEVKITC,
		LOLIN_S3_MINI,
		ESP32_S3_DEVKITC_V1_0,
		ESP32_S3_DEVKITC_V1_1,
	].map((board) => ({ id: board.id, name: board.name, boards: [board] })),
];
