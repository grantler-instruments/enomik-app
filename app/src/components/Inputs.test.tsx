// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDeviceStore } from "../store/device";
import { type ConfigFile, useIOStore } from "../store/io";
import { useMIDIStore } from "../store/midi";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
	sysexPinModeTouch,
} from "../store/midi.config";
import { type RawValue, useRawStreamStore } from "../store/rawStream";
import { renderWithProviders } from "../test/render";
import Inputs from "./Inputs";

const DEVICE = "test-device";

const analog = {
	mode: sysexPinModeAnalogIn,
	channel: 1,
	midiType: MIDI_CONTROL_CHANGE,
	midiMin: 0,
	midiMax: 127,
	pinMin: 0,
	pinMax: 1023,
	controller: 20,
} as const;
const touch = {
	...analog,
	mode: sysexPinModeTouch,
	threshold: 30,
	thresholdUnit: "percent",
} as const;

const reading = (pin: number, patch: Partial<RawValue> = {}): RawValue => ({
	pin,
	mode: sysexPinModeTouch,
	raw: 1234,
	baseline: 1000,
	peak: 400,
	percent: 55,
	norm: 70,
	threshold: 30,
	active: true,
	timestamp: Date.now(),
	...patch,
});

/** A configurator pointed at a firmware 0.19 device (live values, % thresholds). */
const selectDevice = (id: string | undefined = DEVICE) => {
	useMIDIStore.setState({
		initialized: true,
		selectedConfiguratorOutputDevice: id,
	});
	useDeviceStore
		.getState()
		.setDevice(DEVICE, { status: "ready", version: { major: 0, minor: 19 } });
};

const renderInputs = (inputs: NonNullable<ConfigFile["inputs"]>) => {
	useIOStore.getState().loadFromFile({ inputs });
	return renderWithProviders(<Inputs />);
};

/** Turn the stream on, then feed it readings (starting a session clears values). */
const stream = (...values: RawValue[]) => {
	act(() => useRawStreamStore.getState().setActive(true));
	act(() => {
		for (const value of values) useRawStreamStore.getState().setValue(value);
	});
};

const streamSwitch = () =>
	screen.queryByRole("switch", { name: "Stream raw input values" }) ??
	screen.queryByRole("checkbox", { name: "Stream raw input values" });

beforeEach(() => selectDevice());

afterEach(() => {
	act(() => useRawStreamStore.getState().setActive(false));
	useRawStreamStore.getState().clear();
	useIOStore.getState().loadFromFile({});
	useDeviceStore.getState().removeDevice(DEVICE);
	useMIDIStore.setState({
		initialized: false,
		selectedConfiguratorOutputDevice: undefined,
	});
});

describe("Inputs touch columns", () => {
	it("has no threshold or live stream without a touch input", () => {
		renderInputs([{ ...analog, pin: 1 }]);
		expect(streamSwitch()).not.toBeInTheDocument();
		expect(
			screen.queryByRole("textbox", { name: "Threshold" }),
		).not.toBeInTheDocument();
	});

	it("offers the threshold and the live stream for a touch input", () => {
		renderInputs([
			{ ...analog, pin: 1 },
			{ ...touch, pin: 2 },
		]);
		expect(streamSwitch()).toBeEnabled();
		expect(screen.getByRole("textbox", { name: "Threshold" })).toHaveValue(
			"30",
		);
	});

	it("disables the stream on broadcast and says why", () => {
		selectDevice("-1");
		renderInputs([{ ...touch, pin: 2 }]);
		expect(streamSwitch()).toBeDisabled();
		expect(
			screen.getByText(
				"Select a device (not broadcast) to stream live values.",
			),
		).toBeInTheDocument();
	});

	it("stops the stream once the last touch input is gone", () => {
		renderInputs([{ ...touch, pin: 2 }]);
		stream();
		expect(useRawStreamStore.getState().active).toBe(true);

		act(() =>
			useIOStore.getState().updateInput(useIOStore.getState().inputs[0].uuid, {
				mode: sysexPinModeAnalogIn,
			}),
		);

		expect(useRawStreamStore.getState().active).toBe(false);
	});
});

describe("Inputs threshold review", () => {
	const warning = () => screen.queryByText(/^Review touch thresholds/);

	it("warns about a threshold in other units and converts on request", async () => {
		const user = userEvent.setup();
		renderInputs([{ ...touch, pin: 2, thresholdUnit: "raw" }]);
		expect(warning()).toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Keep numbers as percentages" }),
		);

		expect(useIOStore.getState().inputs[0]).toMatchObject({
			threshold: 30,
			thresholdUnit: "percent",
		});
		expect(warning()).not.toBeInTheDocument();
	});

	it("does not warn when units match", () => {
		renderInputs([{ ...touch, pin: 2 }]);
		expect(warning()).not.toBeInTheDocument();
	});

	it("does not warn about a muted touch input", () => {
		renderInputs([{ ...touch, pin: 2, thresholdUnit: "raw", muted: true }]);
		expect(warning()).not.toBeInTheDocument();
	});
});

describe("Inputs live values", () => {
	it("shows a live value for a deployed pin and a placeholder otherwise", () => {
		renderInputs([
			{ ...touch, pin: 2 },
			{ ...touch, pin: 3 },
		]);
		stream(reading(2, { percent: 55 }));

		expect(screen.getByText("55%")).toBeInTheDocument();
		expect(screen.getAllByText("after deploy")).toHaveLength(1);
		expect(
			screen.getByText(
				"Live values are only shown after this pin is deployed.",
			),
		).toBeInTheDocument();
	});

	it("treats a pin the device runs in another mode as not deployed", () => {
		renderInputs([{ ...touch, pin: 2 }]);
		stream(reading(2, { mode: sysexPinModeAnalogIn }));

		expect(screen.getByText("after deploy")).toBeInTheDocument();
	});

	it("shows nothing for muted inputs", () => {
		renderInputs([
			{ ...touch, pin: 2 },
			{ ...touch, pin: 3, muted: true },
		]);
		stream(reading(2));

		expect(screen.queryByText("after deploy")).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				"Live values are only shown after this pin is deployed.",
			),
		).not.toBeInTheDocument();
	});

	it("shows no live values while the stream is off", () => {
		renderInputs([{ ...touch, pin: 2 }]);
		expect(screen.queryByText("after deploy")).not.toBeInTheDocument();
	});
});

describe("Inputs add row", () => {
	it("adds an analog input on the next free pin, with the pin number as CC", async () => {
		const user = userEvent.setup();
		renderInputs([
			{ ...analog, pin: 0 },
			{ ...analog, pin: 1 },
		]);

		const add = screen.getByTestId("AddIcon").closest("button");
		if (!add) throw new Error("add button not found");
		await user.click(add);

		expect(useIOStore.getState().inputs[2]).toMatchObject({
			pin: 2,
			mode: sysexPinModeAnalogIn,
			midiType: MIDI_CONTROL_CHANGE,
			controller: 2,
		});
	});
});
