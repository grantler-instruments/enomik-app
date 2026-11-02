// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	sysexPinModeAnalogIn,
	sysexPinModeTouch,
} from "../../store/midi.config";
import type { RawValue } from "../../store/rawStream";
import { renderWithProviders } from "../../test/render";
import { LiveCell } from "./RawValues";

const touch = (patch: Partial<RawValue> = {}): RawValue => ({
	pin: 2,
	mode: sysexPinModeTouch,
	raw: 1234,
	baseline: 1000,
	peak: 400,
	percent: 40,
	norm: 0,
	threshold: 30,
	active: false,
	timestamp: 0,
	...patch,
});

const renderCell = (value: RawValue, threshold?: number) =>
	renderWithProviders(<LiveCell value={value} threshold={threshold} />);

const bar = () => screen.getByRole("progressbar");

/** Marker lines sit next to the bar; `left` places them on it. */
const markers = () =>
	[...(bar().parentElement?.children ?? [])]
		.filter((el) => el !== bar())
		.map((el) => getComputedStyle(el).left);

describe("LiveCell", () => {
	it("shows a touch reading in percent of 100", () => {
		renderCell(touch({ percent: 40 }));
		expect(screen.getByText("40%")).toBeInTheDocument();
		expect(bar()).toHaveAttribute("aria-valuenow", "40");
		expect(screen.getByTitle("touched")).toBeInTheDocument();
	});

	it("shows other inputs as 0..127 without a unit", () => {
		renderCell(touch({ mode: sysexPinModeAnalogIn, norm: 127, percent: 0 }));
		expect(screen.getByText("127")).toBeInTheDocument();
		expect(bar()).toHaveAttribute("aria-valuenow", "100");
		expect(markers()).toEqual([]);
		expect(screen.queryByTitle("touched")).not.toBeInTheDocument();
	});

	it("caps the bar at 100% for touch readings above 100%", () => {
		renderCell(touch({ percent: 127 }));
		expect(screen.getByText("127%")).toBeInTheDocument();
		expect(bar()).toHaveAttribute("aria-valuenow", "100");
	});

	it("marks the device's threshold when nothing is edited", () => {
		renderCell(touch({ threshold: 30 }));
		expect(markers()).toEqual(["30%"]);
	});

	it("marks the edited threshold and fades the device's one", () => {
		renderCell(touch({ threshold: 30 }), 50);
		expect(markers()).toEqual(["30%", "50%"]);
	});

	it("has one marker when the edited threshold matches the device", () => {
		renderCell(touch({ threshold: 30 }), 30);
		expect(markers()).toEqual(["30%"]);
	});

	it("has no marker without a threshold", () => {
		renderCell(touch({ threshold: 0 }));
		expect(markers()).toEqual([]);
	});

	it("puts the raw reading in the tooltip", () => {
		renderCell(touch({ raw: 4321 }));
		expect(screen.getByTitle("Raw: 4321")).toBeInTheDocument();
	});
});
