// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/render";
import ErrorBoundary from "./ErrorBoundary";

let shouldThrow = true;
const Bomb = () => {
	if (shouldThrow) throw new Error("boom");
	return <p>all good</p>;
};

beforeEach(() => {
	shouldThrow = true;
	// React logs caught render errors; keep the test output clean.
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("ErrorBoundary", () => {
	it("renders children when nothing throws", () => {
		shouldThrow = false;
		renderWithProviders(
			<ErrorBoundary>
				<Bomb />
			</ErrorBoundary>,
		);
		expect(screen.getByText("all good")).toBeTruthy();
	});

	it("shows the error instead of crashing, siblings stay", () => {
		renderWithProviders(
			<>
				<p>outside</p>
				<ErrorBoundary>
					<Bomb />
				</ErrorBoundary>
			</>,
		);
		expect(screen.getByText("Something went wrong")).toBeTruthy();
		expect(screen.getByText("boom")).toBeTruthy();
		expect(screen.getByText("outside")).toBeTruthy();
	});

	it("renders the children again on Try again", async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ErrorBoundary>
				<Bomb />
			</ErrorBoundary>,
		);
		shouldThrow = false;
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(screen.getByText("all good")).toBeTruthy();
	});

	it("clears the error when the reset key changes", () => {
		const { rerender } = renderWithProviders(
			<ErrorBoundary resetKey="/a">
				<Bomb />
			</ErrorBoundary>,
		);
		expect(screen.getByText("Something went wrong")).toBeTruthy();

		shouldThrow = false;
		rerender(
			<ErrorBoundary resetKey="/b">
				<Bomb />
			</ErrorBoundary>,
		);
		expect(screen.getByText("all good")).toBeTruthy();
	});
});
