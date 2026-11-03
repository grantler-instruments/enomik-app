// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSerialStore } from "../store/serial";
import { useApplyUpdateWhenSafe } from "./useApplyUpdateWhenSafe";

const wrapper = ({ children }: { children: ReactNode }) => (
	<MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
);

const setup = (needRefresh: boolean) => {
	const apply = vi.fn();
	const hook = renderHook(
		({ needRefresh }) => {
			useApplyUpdateWhenSafe(needRefresh, apply);
			return useNavigate();
		},
		{ wrapper, initialProps: { needRefresh } },
	);
	const navigate = (to: string) => act(() => hook.result.current(to));
	return { apply, navigate, rerender: hook.rerender };
};

const hideTab = () => {
	Object.defineProperty(document, "visibilityState", {
		value: "hidden",
		configurable: true,
	});
	act(() => {
		document.dispatchEvent(new Event("visibilitychange"));
	});
};

let original: ReturnType<typeof useSerialStore.getState>;
beforeEach(() => {
	original = useSerialStore.getState();
	useSerialStore.setState({ isFlashing: false, isConnected: false });
});
afterEach(() => {
	useSerialStore.setState(original, true);
	Object.defineProperty(document, "visibilityState", {
		value: "visible",
		configurable: true,
	});
});

describe("useApplyUpdateWhenSafe", () => {
	it("does nothing without a waiting update", () => {
		const { apply, navigate } = setup(false);
		navigate("/configurator");
		hideTab();
		expect(apply).not.toHaveBeenCalled();
	});

	it("waits for a route change, not just the update arriving", () => {
		const { apply, navigate } = setup(true);
		expect(apply).not.toHaveBeenCalled();
		navigate("/configurator");
		expect(apply).toHaveBeenCalledOnce();
	});

	it("applies when the tab goes hidden", () => {
		const { apply } = setup(true);
		hideTab();
		expect(apply).toHaveBeenCalledOnce();
	});

	it("applies an update that arrives later on the next route change", () => {
		const { apply, navigate, rerender } = setup(false);
		rerender({ needRefresh: true });
		expect(apply).not.toHaveBeenCalled();
		navigate("/kits");
		expect(apply).toHaveBeenCalledOnce();
	});

	it("holds off while flashing or connected, then retries", () => {
		const { apply, navigate } = setup(true);
		useSerialStore.setState({ isFlashing: true, isConnected: true });
		navigate("/uploader");
		hideTab();
		expect(apply).not.toHaveBeenCalled();

		useSerialStore.setState({ isFlashing: false, isConnected: true });
		navigate("/configurator");
		expect(apply).not.toHaveBeenCalled();

		useSerialStore.setState({ isConnected: false });
		navigate("/kits");
		expect(apply).toHaveBeenCalledOnce();
	});

	it("applies only once", () => {
		const { apply, navigate } = setup(true);
		navigate("/configurator");
		navigate("/kits");
		hideTab();
		expect(apply).toHaveBeenCalledOnce();
	});
});
