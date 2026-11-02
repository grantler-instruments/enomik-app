// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useIOStore } from "../store/io";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
	sysexPinModePWMOut,
} from "../store/midi.config";
import { renderWithProviders } from "../test/render";
import Outputs from "./Outputs";

afterEach(() => useIOStore.getState().loadFromFile({}));

const addButton = () => {
	const button = screen.getByTestId("AddIcon").closest("button");
	if (!button) throw new Error("add button not found");
	return button;
};

describe("Outputs add row", () => {
	it("adds a PWM output on the next free pin, with the pin number as CC", async () => {
		// Pin 0 taken by an input: outputs share the pin space.
		useIOStore.getState().loadFromFile({
			inputs: [
				{
					pin: 0,
					mode: sysexPinModeAnalogIn,
					channel: 1,
					midiType: MIDI_CONTROL_CHANGE,
					midiMin: 0,
					midiMax: 127,
					pinMin: 0,
					pinMax: 1023,
					controller: 0,
				},
			],
		});
		const user = userEvent.setup();
		renderWithProviders(<Outputs />);

		await user.click(addButton());
		await user.click(addButton());

		expect(useIOStore.getState().outputs).toMatchObject([
			{ pin: 1, controller: 1, mode: sysexPinModePWMOut },
			{ pin: 2, controller: 2, mode: sysexPinModePWMOut },
		]);
	});

	it("keeps an edited controller", async () => {
		const user = userEvent.setup();
		renderWithProviders(<Outputs />);
		await user.click(addButton());

		const cc = screen.getByRole("textbox", { name: "Controller" });
		expect(cc).toHaveValue("0");
		await user.clear(cc);
		await user.type(cc, "74");

		expect(useIOStore.getState().outputs[0]).toMatchObject({
			pin: 0,
			controller: 74,
		});
	});
});
