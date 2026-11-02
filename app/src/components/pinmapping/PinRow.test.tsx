// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { type ConfigFile, useIOStore } from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
	sysexPinModeAnalogIn,
	sysexPinModeDigitalOut,
	sysexPinModePWMOut,
} from "../../store/midi.config";
import { renderWithProviders } from "../../test/render";
import PinRow from "./PinRow";

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

const output = {
	mode: sysexPinModePWMOut,
	channel: 1,
	midiType: MIDI_CONTROL_CHANGE,
	midiMin: 0,
	midiMax: 127,
	pinMin: 0,
	pinMax: 1024,
	controller: 20,
} as const;

/** Like Inputs.tsx / Outputs.tsx: rows re-render from the store. */
const StoreRows = ({ readOnly }: { readOnly?: boolean }) => {
	const inputs = useIOStore((state) => state.inputs);
	const outputs = useIOStore((state) => state.outputs);
	return (
		<>
			{inputs.map((config, index) => (
				<PinRow
					key={config.uuid}
					config={config}
					type="input"
					index={index}
					readOnly={readOnly}
				/>
			))}
			{outputs.map((config, index) => (
				<PinRow
					key={config.uuid}
					config={config}
					type="output"
					index={index}
					readOnly={readOnly}
				/>
			))}
		</>
	);
};

const renderRows = (
	inputs: NonNullable<ConfigFile["inputs"]>,
	readOnly?: boolean,
	outputs: NonNullable<ConfigFile["outputs"]> = [],
) => {
	useIOStore.getState().loadFromFile({ inputs, outputs });
	return renderWithProviders(<StoreRows readOnly={readOnly} />);
};

const renderOutputs = (outputs: NonNullable<ConfigFile["outputs"]>) =>
	renderRows([], false, outputs);

/** Open an MUI select by its label and pick an option. */
const choose = async (
	user: ReturnType<typeof userEvent.setup>,
	label: string,
	option: string,
) => {
	// MUI names the combobox after its label plus the current value.
	await user.click(
		screen.getByRole("combobox", { name: new RegExp(`^${label}\\b`) }),
	);
	await user.click(
		within(screen.getByRole("listbox")).getByRole("option", { name: option }),
	);
};

const muteButton = () => screen.getByRole("button", { name: /^Mute:/ });
const unmuteButton = () => screen.getByRole("button", { name: /^Unmute:/ });

afterEach(() => useIOStore.getState().loadFromFile({}));

describe("PinRow mute toggle", () => {
	it("mutes the row in the store and flips the button", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 1 }]);

		expect(muteButton()).toHaveAttribute("aria-pressed", "false");
		await user.click(muteButton());

		expect(useIOStore.getState().inputs[0].muted).toBe(true);
		expect(unmuteButton()).toHaveAttribute("aria-pressed", "true");
	});

	it("unmutes a muted row", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 1, muted: true }]);

		await user.click(unmuteButton());

		expect(useIOStore.getState().inputs[0].muted).toBe(false);
		expect(muteButton()).toHaveAttribute("aria-pressed", "false");
	});

	it("keeps the row's other settings when muting", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 7, controller: 42 }]);

		await user.click(muteButton());

		expect(useIOStore.getState().inputs[0]).toMatchObject({
			pin: 7,
			controller: 42,
			muted: true,
		});
	});

	it("has no mute button when read-only", () => {
		renderRows([{ ...input, pin: 1 }], true);

		expect(
			screen.queryByRole("button", { name: /mute/i }),
		).not.toBeInTheDocument();
	});
});

describe("PinRow pin conflicts", () => {
	const pinFields = () => screen.getAllByRole("textbox", { name: "Pin" });

	it("marks both rows when two active rows share a pin", () => {
		renderRows([
			{ ...input, pin: 4 },
			{ ...input, pin: 4 },
		]);

		for (const field of pinFields())
			expect(field).toHaveAttribute("aria-invalid", "true");
	});

	it("does not mark a pin shared with a muted row", () => {
		renderRows([
			{ ...input, pin: 4 },
			{ ...input, pin: 4, muted: true },
		]);

		for (const field of pinFields())
			expect(field).toHaveAttribute("aria-invalid", "false");
	});
});

describe("PinRow MIDI type", () => {
	it("shows the controller field for Control Change", () => {
		renderRows([{ ...input, pin: 1, controller: 33 }]);
		expect(screen.getByRole("textbox", { name: "Controller" })).toHaveValue(
			"33",
		);
		expect(
			screen.queryByRole("textbox", { name: "Note" }),
		).not.toBeInTheDocument();
	});

	it("swaps to the note field when switching to Note On", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 1 }]);

		await choose(user, "MIDI Type", "Note On");

		expect(useIOStore.getState().inputs[0].midiType).toBe(MIDI_NOTE_ON);
		expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("60");
		expect(
			screen.queryByRole("textbox", { name: "Controller" }),
		).not.toBeInTheDocument();
	});

	it("has neither controller nor note for Pitch Bend", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 1 }]);

		await choose(user, "MIDI Type", "Pitch Bend");

		expect(useIOStore.getState().inputs[0].midiType).toBe(MIDI_PITCH_BEND);
		expect(
			screen.queryByRole("textbox", { name: /Controller|Note/ }),
		).not.toBeInTheDocument();
	});

	it("writes note 60 into the store when a Note On row has none", () => {
		// Otherwise deploy sends note 0 while the field shows 60.
		renderRows([{ ...input, pin: 1, midiType: MIDI_NOTE_ON }]);
		expect(useIOStore.getState().inputs[0].note).toBe(60);
	});

	it("keeps an existing note", () => {
		renderRows([{ ...input, pin: 1, midiType: MIDI_NOTE_ON, note: 36 }]);
		expect(useIOStore.getState().inputs[0].note).toBe(36);
		expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("36");
	});

	it("does not touch the store for a read-only Note On row", () => {
		renderRows([{ ...input, pin: 1, midiType: MIDI_NOTE_ON }], true);
		expect(useIOStore.getState().inputs[0].note).toBeUndefined();
	});

	it("writes edited fields to the store", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 1 }]);

		const pin = screen.getByRole("textbox", { name: "Pin" });
		await user.clear(pin);
		await user.type(pin, "12");
		await choose(user, "Channel", "10");

		expect(useIOStore.getState().inputs[0]).toMatchObject({
			pin: 12,
			channel: 10,
		});
	});
});

describe("PinRow PWM range", () => {
	// Mobile layout (jsdom has no matchMedia): ranges render as labelled Min/Max pairs.
	const minFields = () => screen.queryAllByRole("textbox", { name: "Min" });

	it("shows a PWM range next to the MIDI range for PWM outputs", () => {
		renderOutputs([{ ...output, pin: 1, pinMin: 10, pinMax: 900 }]);
		const mins = minFields();
		expect(mins).toHaveLength(2);
		expect(mins[1]).toHaveValue("10");
		expect(screen.getAllByRole("textbox", { name: "Max" })[1]).toHaveValue(
			"900",
		);
	});

	it("has only the MIDI range for digital outputs", () => {
		renderOutputs([{ ...output, pin: 1, mode: sysexPinModeDigitalOut }]);
		expect(minFields()).toHaveLength(1);
	});

	it("drops the PWM range when switching to digital out", async () => {
		const user = userEvent.setup();
		renderOutputs([{ ...output, pin: 1 }]);

		await choose(user, "Mode", "OUTPUT (digital)");

		expect(useIOStore.getState().outputs[0].mode).toBe(sysexPinModeDigitalOut);
		expect(minFields()).toHaveLength(1);
	});
});

describe("PinRow menu", () => {
	const openMenu = async (user: ReturnType<typeof userEvent.setup>) =>
		user.click(screen.getByRole("button", { name: "more options" }));

	it("duplicates a row onto the next free pin, with that pin as CC", async () => {
		const user = userEvent.setup();
		renderRows([
			{ ...input, pin: 1, controller: 42 },
			{ ...input, pin: 2 },
		]);

		await user.click(
			screen.getAllByRole("button", { name: "more options" })[0],
		);
		await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));

		const inputs = useIOStore.getState().inputs;
		expect(inputs).toHaveLength(3);
		// Settings copied, but the CC follows the new pin like any new row.
		expect(inputs[2]).toMatchObject({ pin: 3, controller: 3, channel: 1 });
		expect(inputs[2].uuid).not.toBe(inputs[0].uuid);
	});

	it("duplicates an output the same way and keeps its other settings", async () => {
		const user = userEvent.setup();
		renderOutputs([
			{ ...output, pin: 5, controller: 99, channel: 7, pinMax: 512 },
		]);

		await openMenu(user);
		await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));

		expect(useIOStore.getState().outputs[1]).toMatchObject({
			pin: 6,
			controller: 6,
			channel: 7,
			pinMax: 512,
			mode: sysexPinModePWMOut,
		});
	});

	it("deletes the row", async () => {
		const user = userEvent.setup();
		renderOutputs([{ ...output, pin: 5 }]);

		await openMenu(user);
		await user.click(screen.getByRole("menuitem", { name: "Delete" }));

		expect(useIOStore.getState().outputs).toEqual([]);
	});

	it("has no menu when read-only", () => {
		renderRows([{ ...input, pin: 1 }], true);
		expect(
			screen.queryByRole("button", { name: "more options" }),
		).not.toBeInTheDocument();
	});
});

describe("PinRow number fields", () => {
	it("does not write pin 0 when the pin field is emptied", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 4 }]);
		const pin = screen.getByRole("textbox", { name: "Pin" });

		await user.clear(pin);

		expect(pin).toHaveValue("");
		expect(useIOStore.getState().inputs[0].pin).toBe(4);

		await user.type(pin, "5");
		expect(pin).toHaveValue("5");
		expect(useIOStore.getState().inputs[0].pin).toBe(5);
	});

	it("never shows a leading zero in the pin field", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 0 }]);
		const pin = screen.getByRole("textbox", { name: "Pin" });

		await user.click(pin);
		await user.keyboard("{End}7");

		expect(pin).toHaveValue("7");
		expect(useIOStore.getState().inputs[0].pin).toBe(7);
	});

	it("clamps the controller to 127", async () => {
		const user = userEvent.setup();
		renderRows([{ ...input, pin: 1 }]);
		const cc = screen.getByRole("textbox", { name: "Controller" });

		await user.clear(cc);
		await user.type(cc, "300");

		expect(cc).toHaveValue("127");
		expect(useIOStore.getState().inputs[0].controller).toBe(127);
	});
});
