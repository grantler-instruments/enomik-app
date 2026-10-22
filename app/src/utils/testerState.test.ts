import { describe, expect, it } from "vitest";
import {
	buttonsPassed,
	initialState,
	loopbackPassed,
	type Path,
	ROWS,
	type TesterAction,
	type TesterState,
	testerReducer,
	touchPassed,
} from "./testerState";

const midi = (path: Path, ...bytes: number[]): TesterAction => ({
	type: "midi",
	path,
	bytes,
});

const run = (state: TesterState, ...actions: TesterAction[]) =>
	actions.reduce(testerReducer, state);

const start = () => initialState(15, [1, 2]);

describe("tester state", () => {
	it("marks a button press per path", () => {
		const state = run(
			start(),
			midi("usb", 0xb0, 17, 127),
			midi("wireless", 0xb0, 17, 127),
		);
		expect(state.buttons["17:176"]).toEqual({ usb: true, wireless: true });
		expect(state.pressed[17]).toBe(true);
	});

	it("moves pin 16 to the next type after a press and release over USB", () => {
		const state = run(
			start(),
			midi("usb", 0x90, 16, 127),
			midi("usb", 0x90, 16, 0),
		);
		expect(state.typeIndex).toBe(1);
		expect(state.buttons["16:144"].usb).toBe(true);
	});

	it("ignores the release a fresh pin config reports", () => {
		// After switching to note off, the board reports note off released at once.
		const switched = run(
			start(),
			midi("usb", 0x90, 16, 127),
			midi("usb", 0x90, 16, 0),
		);
		const state = run(switched, midi("usb", 0x80, 16, 0));
		expect(state.typeIndex).toBe(1);
	});

	it("does not advance on wireless messages or other types", () => {
		const state = run(
			start(),
			midi("wireless", 0x90, 16, 127),
			midi("wireless", 0x90, 16, 0),
			midi("usb", 0xb0, 16, 127),
			midi("usb", 0xb0, 16, 0),
		);
		expect(state.typeIndex).toBe(0);
	});

	it("passes the buttons once every row arrived on every path", () => {
		let state = start();
		for (const row of ROWS)
			for (const path of ["usb", "wireless"] as const)
				state = testerReducer(state, {
					type: "midi",
					path,
					bytes:
						row.status === 0xe0
							? [0xe0, 0x7f, 0x7f]
							: [row.status, row.pin, 127],
				});
		expect(buttonsPassed(state, ["usb", "wireless"])).toBe(true);
		expect(buttonsPassed(start(), ["usb"])).toBe(false);
	});

	it("tracks the loopback note and needs a press before the release", () => {
		let state = run(
			start(),
			{ type: "loopback", on: true },
			midi("usb", 0x90, 15, 0),
		);
		expect(state.loopNote.released).toBe(false);
		state = run(
			state,
			midi("usb", 0x90, 15, 127),
			midi("wireless", 0x90, 15, 127),
			midi("usb", 0x90, 15, 0),
			{ type: "lit", lit: true },
		);
		expect(state.loopNote).toEqual({
			usb: true,
			wireless: true,
			held: true,
			released: true,
		});
		expect(loopbackPassed(state, ["usb", "wireless"])).toBe(true);
	});

	it("leaves buttons alone while loopback is on", () => {
		const state = run(
			start(),
			{ type: "loopback", on: true },
			midi("usb", 0x90, 16, 127),
			midi("usb", 0x90, 16, 0),
		);
		expect(state.typeIndex).toBe(0);
		expect(state.buttons["16:144"].usb).toBe(false);
	});

	it("marks touches per pad", () => {
		const state = run(
			start(),
			midi("usb", 0xb0, 1, 127),
			midi("wireless", 0xb0, 1, 127),
			midi("usb", 0xb0, 2, 127),
		);
		expect(touchPassed(state, ["usb"])).toBe(true);
		expect(touchPassed(state, ["usb", "wireless"])).toBe(false);
	});
});
