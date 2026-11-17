// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/render";
import Debugger from "./Debugger";

// A monitor that crashes on render, as a broken device report could.
vi.mock("./MessageList", () => ({
	default: () => {
		throw new Error("monitor exploded");
	},
}));

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const renderDebugger = () =>
	renderWithProviders(
		<MemoryRouter>
			<Debugger />
		</MemoryRouter>,
	);

describe("Debugger", () => {
	it("keeps the composer and tabs usable when a tab crashes", async () => {
		const user = userEvent.setup();
		renderDebugger();

		expect(screen.getByText("monitor exploded")).toBeTruthy();
		expect(screen.getByText("MIDI Composer")).toBeTruthy();

		await user.click(screen.getByRole("tab", { name: "Serial" }));
		expect(
			screen.getByText(
				"View serial output from the connected microcontroller for debugging purposes",
			),
		).toBeTruthy();
	});

	it("has three tabs and links to the other tools", () => {
		renderDebugger();
		expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
			"Monitor",
			"Patcher",
			"Serial",
		]);
		expect(
			screen.getByRole("link", { name: "Board tester" }).getAttribute("href"),
		).toBe("/tester");
	});
});
