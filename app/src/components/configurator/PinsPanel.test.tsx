// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIOStore } from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeTouch,
} from "../../store/midi.config";
import { renderWithProviders } from "../../test/render";
import PinsPanel from "./PinsPanel";

afterEach(() => {
	useIOStore.getState().loadFromFile({});
	vi.restoreAllMocks();
});

describe("PinsPanel", () => {
	it("opens the pin dialog without scrolling the page", async () => {
		const scrollIntoView = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoView;
		const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
		useIOStore.getState().loadFromFile({
			inputs: [
				{
					pin: 1,
					mode: sysexPinModeTouch,
					channel: 1,
					midiType: MIDI_CONTROL_CHANGE,
					midiMin: 0,
					midiMax: 127,
					pinMin: 0,
					pinMax: 1023,
					controller: 20,
				},
			],
		});
		const user = userEvent.setup();
		renderWithProviders(<PinsPanel />);

		await user.click(screen.getAllByRole("button", { name: /^GPIO 1 ·/ })[0]);
		await new Promise((resolve) => requestAnimationFrame(resolve));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(scrollIntoView).not.toHaveBeenCalled();
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("drops the board's selection ring when the pin's config is deleted", async () => {
		useIOStore.getState().loadFromFile({
			inputs: [
				{
					pin: 1,
					mode: sysexPinModeTouch,
					channel: 1,
					midiType: MIDI_CONTROL_CHANGE,
					midiMin: 0,
					midiMax: 127,
					pinMin: 0,
					pinMax: 1023,
					controller: 20,
				},
			],
		});
		const user = userEvent.setup();
		renderWithProviders(<PinsPanel />);
		// The open dialog hides the board from the accessibility tree.
		const pad = () =>
			screen.getAllByRole("button", { name: /^GPIO 1 ·/, hidden: true })[0];

		await user.click(pad());
		expect(pad()).toHaveAttribute("aria-pressed", "true");

		await user.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: "Delete",
			}),
		);
		expect(useIOStore.getState().inputs).toEqual([]);
		expect(pad()).toHaveAttribute("aria-pressed", "false");
	});
});
