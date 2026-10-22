import { describe, expect, it } from "vitest";
import { configFromFile, findDuplicatePins, nextFreePin } from "./io";

describe("findDuplicatePins", () => {
	it("flags a pin used twice within inputs", () => {
		// e.g. touch on 4 and analog on 4
		expect(findDuplicatePins([{ pin: 4 }, { pin: 4 }, { pin: 5 }], [])).toEqual(
			new Set([4]),
		);
	});

	it("flags a pin used by an input and an output", () => {
		expect(findDuplicatePins([{ pin: 2 }], [{ pin: 2 }, { pin: 3 }])).toEqual(
			new Set([2]),
		);
	});

	it("is empty when every pin is unique", () => {
		expect(findDuplicatePins([{ pin: 1 }, { pin: 2 }], [{ pin: 3 }]).size).toBe(
			0,
		);
	});
});

describe("nextFreePin", () => {
	it("skips pins used by inputs and outputs", () => {
		expect(nextFreePin([{ pin: 0 }, { pin: 1 }], [{ pin: 2 }])).toBe(3);
	});

	it("starts searching at `from`", () => {
		expect(nextFreePin([{ pin: 4 }, { pin: 5 }], [], 5)).toBe(6);
		expect(nextFreePin([{ pin: 4 }], [], 7)).toBe(7);
	});
});

describe("configFromFile", () => {
	const peers = [{ macAddress: "12:34:56:78:9A:BC" }];
	const clientFile = {
		kind: "client" as const,
		inputs: [],
		outputs: [],
		peers,
		powerSave: true,
		name: "board",
	};

	it("loads a client file into the client config as is", () => {
		expect(configFromFile(clientFile, "client")).toEqual({
			config: clientFile,
		});
	});

	it("loads only the peers of a dongle file", () => {
		expect(configFromFile({ kind: "dongle", peers }, "dongle")).toEqual({
			config: { peers },
		});
	});

	it("refuses a file saved for the other kind", () => {
		expect(configFromFile(clientFile, "dongle")).toEqual({
			mismatch: "client",
		});
		expect(configFromFile({ kind: "dongle", peers }, "client")).toEqual({
			mismatch: "dongle",
		});
	});

	it("imports files without kind, taking only peers into a dongle", () => {
		const { kind: _, ...legacy } = clientFile;
		expect(configFromFile(legacy, "client")).toEqual({ config: legacy });
		expect(configFromFile(legacy, "dongle")).toEqual({ config: { peers } });
	});

	it("treats an unknown kind like a file without kind", () => {
		const file = { ...clientFile, kind: "mixer" } as unknown as Parameters<
			typeof configFromFile
		>[0];
		expect(configFromFile(file, "dongle")).toEqual({ config: { peers } });
	});
});
