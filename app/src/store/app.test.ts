import { afterEach, describe, expect, it } from "vitest";
import { useAppStore } from "./app";

const original = useAppStore.getState();
afterEach(() => useAppStore.setState(original, true));

describe("setShowHints", () => {
	it("turning hints on brings back hints closed per page", () => {
		useAppStore.setState({
			accordions: { "hint-dismissed:#/debugger": true, "some-section": true },
		});

		useAppStore.getState().setShowHints(false);
		expect(useAppStore.getState().accordions).toHaveProperty(
			"hint-dismissed:#/debugger",
		);

		useAppStore.getState().setShowHints(true);
		expect(useAppStore.getState().accordions).toEqual({ "some-section": true });
	});
});
