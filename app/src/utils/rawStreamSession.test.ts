import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRawStreamStore } from "../store/rawStream";
import { startRawStreamSession } from "./rawStreamSession";

describe("bounded live stream sessions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		useRawStreamStore.getState().setActive(true);
	});
	afterEach(() => {
		useRawStreamStore.getState().setActive(false);
		vi.useRealTimers();
	});
	it("stops a silent device without sending keepalives", () => {
		const send = vi.fn();
		startRawStreamSession("a", send);
		vi.advanceTimersByTime(20000);
		expect(send.mock.calls).toEqual([[true], [false]]);
		expect(useRawStreamStore.getState()).toMatchObject({
			active: false,
			error: "timeout",
			values: {},
		});
	});
	it("starts keepalives after acknowledgement but still times out without readings", () => {
		const send = vi.fn();
		startRawStreamSession("a", send);
		useRawStreamStore.getState().acknowledge();
		vi.advanceTimersByTime(5000);
		expect(send.mock.calls).toEqual([[true], [true], [false]]);
		expect(useRawStreamStore.getState().error).toBe("no_readings");
	});
	it("stops immediately on unknown_command without sending the unsupported stop command", () => {
		const send = vi.fn();
		startRawStreamSession("a", send);
		useRawStreamStore.getState().setError("unknown_command");
		useRawStreamStore.getState().setActive(false);
		vi.advanceTimersByTime(20000);
		expect(send.mock.calls).toEqual([[true]]);
	});
	it("keeps a healthy stream alive and clears stale readings after it stops", () => {
		const send = vi.fn();
		const stop = startRawStreamSession("a", send);
		for (let i = 0; i < 12; i++) {
			useRawStreamStore.getState().setValue({
				pin: 4,
				mode: 5,
				raw: 200,
				baseline: 100,
				peak: 100,
				percent: 100,
				norm: 127,
				threshold: 20,
				active: true,
				timestamp: Date.now(),
			});
			vi.advanceTimersByTime(1000);
		}
		expect(useRawStreamStore.getState().active).toBe(true);
		expect(send.mock.calls.filter(([on]) => on)).toHaveLength(4);
		vi.advanceTimersByTime(5000);
		expect(useRawStreamStore.getState()).toMatchObject({
			active: false,
			values: {},
			error: "no_readings",
		});
		stop();
		expect(send.mock.calls.filter(([on]) => !on)).toHaveLength(1);
	});
});
