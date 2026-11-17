// @vitest-environment jsdom
import {
	screen,
	waitForElementToBeRemoved,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { lightTheme } from "../../muiTheme";
import { type ConfigFile, useIOStore } from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModeTouch,
} from "../../store/midi.config";
import { renderWithProviders } from "../../test/render";
import BoardDiagram from "./BoardDiagram";
import type { Board } from "./boards";

const board: Board = {
	id: "test",
	name: "Test board",
	descriptionKey: "",
	width: 40,
	height: 20,
	cornerRadius: 1,
	outlines: [],
	groups: [],
	pins: [
		{ x: 5, y: 5, label: "1", gpio: 1, type: "analog" },
		{ x: 10, y: 5, label: "2", gpio: 2, type: "touch" },
		{ x: 15, y: 5, label: "3", gpio: 3, type: "led" },
		{ x: 20, y: 5, label: "4", gpio: 4, type: "button" },
		{ x: 25, y: 5, label: "GND", type: "gnd" },
	],
};

const input = {
	mode: sysexPinModeAnalogIn,
	channel: 1,
	midiType: MIDI_CONTROL_CHANGE,
	midiMin: 0,
	midiMax: 127,
	pinMin: 0,
	pinMax: 1023,
	controller: 20,
} as const;

const renderBoard = (config: ConfigFile = {}, interactive = true) => {
	useIOStore.getState().loadFromFile(config);
	return {
		user: userEvent.setup(),
		...renderWithProviders(
			<BoardDiagram board={board} interactive={interactive} />,
		),
	};
};

const pad = (name: string) => screen.getByRole("button", { name });
const editor = () => screen.getByRole("dialog");
const addInput = () => screen.queryByRole("button", { name: "Add as input" });
const addOutput = () => screen.queryByRole("button", { name: "Add as output" });

/** Stroke colour of the ring drawn around a configured pad, if any. */
const ringStroke = (name: string) =>
	pad(name).querySelector("circle:not(.pad)")?.getAttribute("stroke");

afterEach(() => useIOStore.getState().loadFromFile({}));

describe("BoardDiagram pads", () => {
	it("marks fixed pins as not editable", () => {
		renderBoard();
		expect(pad("GND · GND")).toHaveAttribute("aria-disabled", "true");
		expect(pad("GPIO 1 · Analog")).toHaveAttribute("aria-disabled", "false");
	});

	it("opens nothing for a fixed pin", async () => {
		const { user } = renderBoard();
		await user.click(pad("GND · GND"));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens nothing when not interactive", async () => {
		const { user } = renderBoard({}, false);
		await user.click(pad("GPIO 1 · Analog"));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens the editor with the keyboard", async () => {
		const { user } = renderBoard();
		pad("GPIO 1 · Analog").focus();
		await user.keyboard("{Enter}");
		expect(within(editor()).getByText("GPIO 1 · Analog")).toBeInTheDocument();
	});

	it("rings a configured pad, in the error colour on a pin conflict", () => {
		renderBoard({
			inputs: [
				{ ...input, pin: 1 },
				{ ...input, pin: 2 },
			],
			outputs: [
				{
					...input,
					pin: 2,
					mode: sysexPinModeDigitalOut,
					pinMax: 1024,
				},
			],
		});
		const { error, text } = lightTheme.palette;
		expect(ringStroke("GPIO 1 · Analog")).toBe(text.primary);
		expect(ringStroke("GPIO 2 · Capacitive touch")).toBe(error.main);
	});

	it("does not flag a conflict with a muted row", () => {
		renderBoard({
			inputs: [
				{ ...input, pin: 2 },
				{ ...input, pin: 2, muted: true },
			],
		});
		expect(ringStroke("GPIO 2 · Capacitive touch")).toBe(
			lightTheme.palette.text.primary,
		);
	});
});

describe("PinEditor (from the board)", () => {
	it("adds an input with the mode the pin is wired for", async () => {
		const { user } = renderBoard();

		await user.click(pad("GPIO 1 · Analog"));
		expect(within(editor()).getByText("Not configured")).toBeInTheDocument();
		await user.click(addInput() as HTMLElement);

		expect(useIOStore.getState().inputs).toMatchObject([
			{ pin: 1, mode: sysexPinModeAnalogIn, controller: 1 },
		]);
	});

	it("uses the pin number as controller until it is changed", async () => {
		const { user } = renderBoard();

		await user.click(pad("GPIO 3 · Onboard LED"));
		await user.click(addOutput() as HTMLElement);
		expect(useIOStore.getState().outputs[0].controller).toBe(3);

		const cc = within(editor()).getByRole("textbox", { name: "Controller" });
		expect(cc).toHaveValue("3");
		await user.clear(cc);
		await user.type(cc, "64");

		expect(useIOStore.getState().outputs[0]).toMatchObject({
			pin: 3,
			controller: 64,
		});
	});

	it("adds a touch input with a % threshold on a touch pad", async () => {
		const { user } = renderBoard();

		await user.click(pad("GPIO 2 · Capacitive touch"));
		await user.click(addInput() as HTMLElement);

		expect(useIOStore.getState().inputs[0]).toMatchObject({
			pin: 2,
			mode: sysexPinModeTouch,
			thresholdUnit: "percent",
		});
	});

	it("only offers output for the onboard LED", async () => {
		const { user } = renderBoard();

		await user.click(pad("GPIO 3 · Onboard LED"));
		expect(addInput()).not.toBeInTheDocument();
		await user.click(addOutput() as HTMLElement);

		expect(useIOStore.getState().outputs).toMatchObject([
			{ pin: 3, mode: sysexPinModeDigitalOut },
		]);
	});

	it("only offers a pull-up input for a button", async () => {
		const { user } = renderBoard();

		await user.click(pad("GPIO 4 · Button"));
		expect(addOutput()).not.toBeInTheDocument();
		await user.click(addInput() as HTMLElement);

		expect(useIOStore.getState().inputs[0].mode).toBe(
			sysexPinModeDigitalInPullup,
		);
	});

	it("shows the pin's config instead of add buttons, and deletes it", async () => {
		const { user } = renderBoard({ inputs: [{ ...input, pin: 1 }] });

		await user.click(pad("GPIO 1 · Analog"));
		expect(addInput()).not.toBeInTheDocument();
		expect(within(editor()).getByText("Input")).toBeInTheDocument();

		await user.click(within(editor()).getByRole("button", { name: "Delete" }));

		expect(useIOStore.getState().inputs).toEqual([]);
		expect(within(editor()).getByText("Not configured")).toBeInTheDocument();
	});
});

describe("pin dialog actions", () => {
	it("doesn't put focus back on a clicked pad when the dialog closes", async () => {
		const { user } = renderBoard({ inputs: [{ ...input, pin: 1 }] });
		await user.click(pad("GPIO 1 · Analog"));
		await user.click(within(editor()).getByRole("button", { name: "Close" }));
		await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
		expect(pad("GPIO 1 · Analog")).not.toHaveFocus();
	});

	it("puts focus back on the pad for keyboard users", async () => {
		const { user } = renderBoard({ inputs: [{ ...input, pin: 1 }] });
		pad("GPIO 1 · Analog").focus();
		await user.keyboard("{Enter}");
		await user.keyboard("{Escape}");
		await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
		expect(pad("GPIO 1 · Analog")).toHaveFocus();
	});

	it("shows mute and delete together in the config's header, not in the row", async () => {
		const { user } = renderBoard({ inputs: [{ ...input, pin: 1 }] });
		await user.click(pad("GPIO 1 · Analog"));

		const mute = within(editor()).getAllByRole("button", { name: /^Mute/ });
		expect(mute).toHaveLength(1);
		const del = within(editor()).getByRole("button", { name: "Delete" });
		// Same header line: siblings in one group.
		expect(mute[0].parentElement).toBe(del.parentElement);
		expect(
			within(editor()).queryByRole("button", { name: "more options" }),
		).not.toBeInTheDocument();
	});

	it("mutes and unmutes the pin's config from the dialog", async () => {
		const { user } = renderBoard({
			outputs: [{ ...input, pin: 1, mode: sysexPinModeDigitalOut }],
		});
		await user.click(pad("GPIO 1 · Analog"));

		await user.click(within(editor()).getByRole("button", { name: /^Mute/ }));
		expect(useIOStore.getState().outputs[0].muted).toBe(true);

		await user.click(within(editor()).getByRole("button", { name: /^Unmute/ }));
		expect(useIOStore.getState().outputs[0].muted).toBe(false);
	});
});

describe("BoardDiagram selection (onSelect)", () => {
	const renderSelectable = (config: ConfigFile, selectedGpio?: number) => {
		useIOStore.getState().loadFromFile(config);
		const selected: number[] = [];
		const result = renderWithProviders(
			<BoardDiagram
				board={board}
				interactive
				selectedGpio={selectedGpio}
				onSelect={(gpio) => selected.push(gpio)}
			/>,
		);
		return { user: userEvent.setup(), selected, ...result };
	};

	it("opens the config dialog for a configured pin and selects it", async () => {
		const { user, selected } = renderSelectable({
			inputs: [{ ...input, pin: 1 }],
		});
		await user.click(pad("GPIO 1 · Analog"));
		expect(selected).toEqual([1]);
		expect(
			screen.getByRole("dialog", { name: "GPIO 1 · Analog" }),
		).toBeInTheDocument();
		expect(within(editor()).getByText("Input")).toBeInTheDocument();
	});

	it("opens the dialog for a free pin, keeps it open after adding, selects on close", async () => {
		const { user, selected } = renderSelectable({});
		await user.click(pad("GPIO 1 · Analog"));
		expect(selected).toEqual([]);
		const add = addInput();
		expect(add).toBeInTheDocument();
		if (add) await user.click(add);
		expect(useIOStore.getState().inputs.map((i) => i.pin)).toEqual([1]);
		// The new config is right there to edit.
		expect(within(editor()).getByText("Input")).toBeInTheDocument();
		expect(selected).toEqual([]);

		await user.click(within(editor()).getByRole("button", { name: "Close" }));
		expect(selected).toEqual([1]);
		await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
	});

	it("selects nothing when the dialog closes on a pin still free", async () => {
		const { user, selected } = renderSelectable({});
		await user.click(pad("GPIO 1 · Analog"));
		await user.keyboard("{Escape}");
		expect(selected).toEqual([]);
	});

	it("marks the selected pad as pressed", () => {
		renderSelectable({ inputs: [{ ...input, pin: 1 }] }, 1);
		expect(pad("GPIO 1 · Analog")).toHaveAttribute("aria-pressed", "true");
		expect(pad("GPIO 2 · Capacitive touch")).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});
});
