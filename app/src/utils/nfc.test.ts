import { describe, expect, it } from "vitest";
import {
	buildNfcSysex,
	decodeUid,
	describeNfcMapping,
	NFC_COMMAND,
	nfcFile,
	parseNfcFile,
	parseNfcSysex,
	sameNfcMapping,
} from "./nfc";

const H = [0xf0, 0x7d, 0x7f, 0x7f, 0x4e];
// UID 04 A2 3B 1C
const UID = [0x04, 0x00, 0x04, 0x0a, 0x02, 0x03, 0x0b, 0x01, 0x0c];

describe("buildNfcSysex", () => {
	it("frames commands", () => {
		expect(buildNfcSysex(NFC_COMMAND.MAPPING_ON)).toEqual([...H, 0x01, 0xf7]);
		expect(buildNfcSysex(NFC_COMMAND.CLEAR)).toEqual([...H, 0x02, 0xf7]);
	});
});

describe("decodeUid", () => {
	it("decodes nibbles, high first", () => {
		expect(decodeUid(UID, 0)).toEqual({ uid: "04 A2 3B 1C", next: 9 });
	});
	it("rejects short or non-nibble data", () => {
		expect(decodeUid(UID.slice(0, 5), 0)).toBeNull();
		expect(decodeUid([1, 0x10, 0], 0)).toBeNull();
		expect(decodeUid([0], 0)).toBeNull();
	});
});

describe("parseNfcSysex", () => {
	it("parses tag placed and removed", () => {
		expect(parseNfcSysex([...H, 0x10, ...UID, 0xf7])).toEqual({
			kind: "placed",
			uid: "04 A2 3B 1C",
		});
		expect(parseNfcSysex(new Uint8Array([...H, 0x11, ...UID, 0xf7]))).toEqual({
			kind: "removed",
			uid: "04 A2 3B 1C",
		});
	});

	it("parses 7 byte UIDs", () => {
		const uid7 = [7, 0, 4, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0xa, 0xb, 0xc];
		expect(parseNfcSysex([...H, 0x10, ...uid7, 0xf7])).toEqual({
			kind: "placed",
			uid: "04 12 34 56 78 9A BC",
		});
	});

	it("parses mapping state and count", () => {
		expect(parseNfcSysex([...H, 0x12, 1, 0xf7])).toEqual({
			kind: "mapping_state",
			on: true,
		});
		expect(parseNfcSysex([...H, 0x12, 0, 0xf7])).toEqual({
			kind: "mapping_state",
			on: false,
		});
		expect(parseNfcSysex([...H, 0x14, 32, 0xf7])).toEqual({
			kind: "count",
			count: 32,
		});
	});

	it("parses tag mapped", () => {
		expect(parseNfcSysex([...H, 0x13, ...UID, 0x09, 3, 60, 100, 0xf7])).toEqual(
			{
				kind: "mapped",
				uid: "04 A2 3B 1C",
				type: 0x9,
				channel: 3,
				data1: 60,
				data2: 100,
			},
		);
	});

	it("ignores other SysEx and broken packets", () => {
		expect(parseNfcSysex([0xf0, 0x7d, 0, 20, 0x10, 0xf7])).toBeNull();
		expect(parseNfcSysex([...H, 0x10, ...UID])).toBeNull();
		expect(parseNfcSysex([...H, 0x13, ...UID, 0x0a, 1, 1, 1, 0xf7])).toBeNull();
		expect(parseNfcSysex([...H, 0x13, ...UID, 0x09, 0, 1, 1, 0xf7])).toBeNull();
		expect(parseNfcSysex([...H, 0x7e, 0xf7])).toBeNull();
	});
});

describe("describeNfcMapping", () => {
	it("labels messages", () => {
		expect(
			describeNfcMapping({ type: 0xc, channel: 2, data1: 5, data2: 0 }),
		).toBe("Program change 5 · ch 2");
	});
});

describe("nfc file", () => {
	const m = {
		uid: "04 A2 3B 1C",
		type: 0x9,
		channel: 1,
		data1: 60,
		data2: 100,
	} as const;

	it("round-trips mappings and labels", () => {
		const file = nfcFile([m, { ...m, uid: "AA BB CC DD" }], {
			[m.uid]: "drums",
		});
		expect(parseNfcFile(JSON.parse(JSON.stringify(file)))).toEqual({
			mappings: [m, { ...m, uid: "AA BB CC DD" }],
			labels: { [m.uid]: "drums" },
		});
	});

	it("rejects other files and bad entries", () => {
		expect(parseNfcFile({ kind: "client", inputs: [] })).toBeNull();
		expect(parseNfcFile(null)).toBeNull();
		expect(
			parseNfcFile({ kind: "nfc", mappings: [{ ...m, channel: 0 }] }),
		).toBeNull();
		expect(
			parseNfcFile({ kind: "nfc", mappings: [{ ...m, type: 0xe }] }),
		).toBeNull();
		expect(
			parseNfcFile({ kind: "nfc", mappings: [{ ...m, uid: "xyz" }] }),
		).toBeNull();
		expect(
			parseNfcFile({ kind: "nfc", mappings: [{ ...m, data1: 128 }] }),
		).toBeNull();
	});

	it("compares mappings", () => {
		expect(sameNfcMapping(m, { ...m })).toBe(true);
		expect(sameNfcMapping(m, { ...m, data2: 1 })).toBe(false);
		expect(sameNfcMapping(m, undefined)).toBe(false);
	});
});
