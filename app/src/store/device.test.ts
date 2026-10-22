import { describe, expect, it } from "vitest";
import {
	dongleConfigBlocker,
	guessDeviceKind,
	isCompatibleFirmware,
	pairedInputId,
	supportsGlobals,
	supportsInspection,
	supportsLiveValues,
	thresholdUnit,
	useDeviceStore,
} from "./device";

describe("firmware compatibility", () => {
	it.each([10, 11, 12])(
		"allows basic configuration and raw touch thresholds on 0.%i",
		(minor) => {
			const version = { major: 0, minor };
			expect(isCompatibleFirmware(version)).toBe(true);
			expect(supportsInspection(version)).toBe(false);
			expect(supportsGlobals(version)).toBe(false);
			expect(supportsLiveValues(version)).toBe(false);
			expect(thresholdUnit(version)).toBe("raw");
		},
	);
	it("enables global settings starting at 0.14", () => {
		expect(supportsGlobals({ major: 0, minor: 13 })).toBe(false);
		expect(supportsGlobals({ major: 0, minor: 14 })).toBe(true);
	});

	it.each([13, 14, 15, 16, 18])(
		"keeps inspection and raw thresholds on 0.%i",
		(minor) => {
			const version = { major: 0, minor };
			expect(supportsInspection(version)).toBe(true);
			expect(supportsLiveValues(version)).toBe(false);
			expect(thresholdUnit(version)).toBe("raw");
		},
	);
	it.each([19, 20, 99])("allows compatible newer firmware 0.%i", (minor) => {
		const version = { major: 0, minor, patch: 3 };
		expect(supportsInspection(version)).toBe(true);
		expect(supportsLiveValues(version)).toBe(true);
		expect(thresholdUnit(version)).toBe("percent");
	});
	it.each([undefined, { major: 1, minor: 19 }])(
		"does not guess capabilities for unsupported or unknown firmware",
		(version) => {
			expect(supportsInspection(version)).toBe(false);
			expect(supportsLiveValues(version)).toBe(false);
			expect(thresholdUnit(version)).toBeUndefined();
		},
	);
});

describe("MIDI device pairing", () => {
	it("pairs different named boards independently", () => {
		const inputs = [
			{ id: "in-a", name: "enomik A" },
			{ id: "in-b", name: "enomik B" },
		];
		const outputs = [
			{ id: "out-a", name: "enomik A" },
			{ id: "out-b", name: "enomik B" },
		];
		expect(pairedInputId("out-b", inputs, outputs)).toBe("in-b");
	});
	it("accepts a unique input/output name prefix", () => {
		expect(
			pairedInputId(
				"out",
				[{ id: "in", name: "enomik USB MIDI" }],
				[{ id: "out", name: "enomik USB" }],
			),
		).toBe("in");
	});
	it("does not guess between identical names or broadcast", () => {
		const outputs = [
			{ id: "a", name: "enomik" },
			{ id: "b", name: "enomik" },
		];
		expect(
			pairedInputId("a", [{ id: "in", name: "enomik" }], outputs),
		).toBeUndefined();
		expect(
			pairedInputId("-1", [{ id: "in", name: "enomik" }], outputs),
		).toBeUndefined();
	});
});

describe("device kind", () => {
	it.each([
		["enomik3000_dongle", "dongle"],
		["Enomik3000_Dongle MIDI 1", "dongle"],
		["enomik3000_client", "client"],
		["my custom board", "client"],
		[undefined, "client"],
		["", "client"],
		[null, "client"],
	])("guesses %s as %s", (name, kind) => {
		expect(guessDeviceKind(name)).toBe(kind);
	});

	it("keeps overrides per port and clears one without the others", () => {
		const store = useDeviceStore.getState();
		store.setKind("out-A", "dongle");
		store.setKind("out-B", "client");
		store.setKind("out-A", "client");
		expect(useDeviceStore.getState().kinds).toEqual({
			"out-A": "client",
			"out-B": "client",
		});
		useDeviceStore.getState().clearKind("out-A");
		useDeviceStore.getState().clearKind("unknown");
		expect(useDeviceStore.getState().kinds).toEqual({ "out-B": "client" });
	});

	it("does not touch detected device info when the kind changes", () => {
		useDeviceStore.getState().setDevice("out-C", { status: "ready" });
		useDeviceStore.getState().setKind("out-C", "dongle");
		useDeviceStore.getState().clearKind("out-C");
		expect(useDeviceStore.getState().devices["out-C"]).toEqual({
			status: "ready",
		});
	});
});

describe("dongleConfigBlocker", () => {
	it.each([
		[undefined, "compat_checking"],
		[{ status: "checking" }, "compat_checking"],
		[{ status: "unpaired" }, "compat_unpaired"],
		[
			{ status: "incompatible", version: { major: 1, minor: 0 } },
			"compat_incompatible",
		],
		[{ status: "timeout" }, "compat_dongle_unsupported"],
		[
			{ status: "ready", version: { major: 0, minor: 12 } },
			"compat_dongle_unsupported",
		],
		[
			{ status: "ready", version: { major: 0, minor: 18 } },
			"compat_dongle_unsupported",
		],
		[{ status: "ready" }, "compat_dongle_unsupported"],
		[{ status: "ready", version: { major: 0, minor: 19 } }, null],
		[{ status: "ready", version: { major: 0, minor: 25, patch: 3 } }, null],
	] as const)("%j -> %s", (info, blocker) => {
		expect(dongleConfigBlocker(info)).toBe(blocker);
	});
});
