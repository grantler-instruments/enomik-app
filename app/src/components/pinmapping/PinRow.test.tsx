// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { type ConfigFile, useIOStore } from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
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

/** Like Inputs.tsx: rows re-render from the store. */
const StoreRows = ({ readOnly }: { readOnly?: boolean }) => {
	const inputs = useIOStore((state) => state.inputs);
	return inputs.map((config, index) => (
		<PinRow
			key={config.uuid}
			config={config}
			type="input"
			index={index}
			readOnly={readOnly}
		/>
	));
};

const renderRows = (
	inputs: NonNullable<ConfigFile["inputs"]>,
	readOnly?: boolean,
) => {
	useIOStore.getState().loadFromFile({ inputs });
	return renderWithProviders(<StoreRows readOnly={readOnly} />);
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
	const pinFields = () => screen.getAllByRole("spinbutton", { name: "Pin" });

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
