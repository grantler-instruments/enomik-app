import { describe, expect, it } from "vitest";
import { buttonPin, macFromString, parseReply, sysex } from "./tester";

const reply = (cmd: number, payload: number[]) => [
	0x7d,
	0,
	19,
	cmd,
	...payload,
];

describe("tester", () => {
	it("configures a button as input pull-up sending CC <pin>", () => {
		expect(sysex.buttonConfig(16)).toEqual([
			0x7d, 0, 19, 0x01, 16, 0x02, 0, 1, 0x58, 16, 0, 127,
		]);
	});

	it("sends the typed MAC as nibbles in ADD_PEER", () => {
		expect(sysex.addPeer(macFromString("84:f7:03:F2:54:6")).slice(4)).toEqual([
			8, 4, 15, 7, 0, 3, 15, 2, 5, 4, 0, 6,
		]);
	});

	it("rejects malformed MACs", () => {
		expect(() => macFromString("84:F7:03")).toThrow();
		expect(() => macFromString("84:F7:03:F2:54:XX")).toThrow();
	});

	it("parses pin config acks and errors", () => {
		expect(parseReply(reply(0x41, [17, 2, 0, 1, 0x58, 17, 0, 127]))).toEqual({
			cmd: "pin_config",
			pin: 17,
		});
		expect(parseReply(reply(0x7f, [0x07, 0x09]))).toEqual({
			cmd: "error",
			failedRequest: 0x07,
			errorCode: 0x09,
		});
	});

	it("detects button CCs on channel 1 only", () => {
		expect(buttonPin([0xb0, 16, 127])).toBe(16);
		expect(buttonPin([0xb0, 17, 0])).toBe(17);
		expect(buttonPin([0xb1, 16, 127])).toBeNull();
		expect(buttonPin([0xb0, 18, 127])).toBeNull();
	});
});
