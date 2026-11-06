import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import {
	BANG,
	type Message,
	OBJECT_NAMES,
	Patch,
	type PatchConnection,
	type PatchObject,
	parseMessage,
	parseObject,
} from "./patcher";

const wire = (
	source: string,
	outlet: number,
	target: string,
	inlet: number,
): PatchConnection => ({ source, outlet, target, inlet });

const build = (objects: PatchObject[], connections: PatchConnection[]) => {
	const sent: [string, number[]][] = [];
	const shown: [string, number][] = [];
	const patch = new Patch(objects, connections, {
		send: (device, bytes) => sent.push([device, bytes]),
		display: (id, value) => shown.push([id, value]),
	});
	return { patch, sent, shown };
};

describe("parseObject", () => {
	it("reads name and arguments, filling defaults", () => {
		expect(parseObject("ctlin 7")).toMatchObject({
			kind: "ctlin",
			args: [7, 0],
			inlets: 0,
			outlets: 3,
			midi: "in",
		});
		expect(parseObject("  +   5 ")).toMatchObject({
			kind: "+",
			args: [5],
			inlets: 2,
			outlets: 1,
		});
	});

	it("takes any text as print's label", () => {
		expect(parseObject("print my knob")).toMatchObject({
			kind: "print",
			label: "my knob",
			inlets: 1,
			outlets: 0,
		});
		expect(parseObject("print").label).toBe("print");
	});

	it("knows no unknown objects or bad arguments", () => {
		expect(parseObject("osc~ 440").kind).toBe("");
		expect(parseObject("+ five").kind).toBe("");
		expect(parseObject("").kind).toBe("");
	});
});

describe("Patch", () => {
	it("transposes notes, keeping velocity (outlets fire right to left)", () => {
		const { patch, sent } = build(
			[
				{ id: "in", text: "notein" },
				{ id: "plus", text: "+ 12" },
				{ id: "out", text: "noteout 2", device: "synth" },
			],
			[
				wire("in", 0, "plus", 0),
				wire("plus", 0, "out", 0),
				wire("in", 1, "out", 1),
			],
		);
		patch.receive("keys", [0x90, 60, 100]);
		patch.receive("keys", [0x80, 60, 64]);
		expect(sent).toEqual([
			["synth", [0x91, 72, 100]],
			["synth", [0x91, 72, 0]],
		]);
	});

	it("filters inputs by device, controller and channel", () => {
		const { patch, sent } = build(
			[
				{ id: "in", text: "ctlin 7 2", device: "knobs" },
				{ id: "out", text: "ctlout 10", device: "synth" },
			],
			[wire("in", 0, "out", 0)],
		);
		patch.receive("knobs", [0xb1, 7, 50]);
		patch.receive("other", [0xb1, 7, 51]);
		patch.receive("knobs", [0xb0, 7, 52]);
		patch.receive("knobs", [0xb1, 8, 53]);
		expect(sent).toEqual([["synth", [0xb0, 10, 50]]]);
	});

	it("uses the right inlet as the argument", () => {
		const { patch, shown } = build(
			[
				{ id: "times", text: "* 2" },
				{ id: "n", text: "number" },
			],
			[wire("times", 0, "n", 0)],
		);
		patch.inlet("times", 0, 3);
		patch.inlet("times", 1, 10);
		patch.inlet("times", 0, 3);
		expect(shown).toEqual([
			["n", 6],
			["n", 30],
		]);
	});

	it("scales, clips and clamps what it sends", () => {
		const { patch, sent } = build(
			[
				{ id: "scale", text: "scale 0 127 127 0" },
				{ id: "clip", text: "clip 0 200" },
				{ id: "out", text: "ctlout 1", device: "d" },
			],
			[wire("scale", 0, "out", 0), wire("clip", 0, "out", 0)],
		);
		patch.inlet("scale", 0, 27);
		patch.inlet("clip", 0, 300);
		expect(sent).toEqual([
			["d", [0xb0, 1, 100]],
			["d", [0xb0, 1, 127]],
		]);
	});

	it("passes raw bytes from midiin to midiout as whole messages", () => {
		const { patch, sent } = build(
			[
				{ id: "in", text: "midiin" },
				{ id: "out", text: "midiout", device: "d" },
			],
			[wire("in", 0, "out", 0)],
		);
		patch.receive("x", [0xc0, 5]);
		patch.receive("x", [0xf0, 0x7d, 1, 0xf7]);
		patch.receive("x", [0xf8]);
		expect(sent).toEqual([
			["d", [0xc0, 5]],
			["d", [0xf0, 0x7d, 1, 0xf7]],
			["d", [0xf8]],
		]);
	});

	it("prints with its label", () => {
		const printed: [string, Message][] = [];
		const patch = new Patch(
			[
				{ id: "in", text: "ctlin" },
				{ id: "p", text: "print knob" },
			],
			[wire("in", 0, "p", 0)],
			{ send: () => {}, print: (label, value) => printed.push([label, value]) },
		);
		patch.receive("x", [0xb0, 1, 42]);
		expect(printed).toEqual([["knob", 42]]);
	});

	it("triggers right to left, one outlet per type", () => {
		expect(parseObject("t f f f").outlets).toBe(3);
		expect(parseObject("trigger").outlets).toBe(2);
		expect(parseObject("t b f").types).toEqual(["b", "f"]);
		expect(parseObject("t x").kind).toBe("");
		const printed: string[] = [];
		const patch = new Patch(
			[
				{ id: "t", text: "t f f" },
				{ id: "a", text: "print left" },
				{ id: "b", text: "print right" },
			],
			[wire("t", 0, "a", 0), wire("t", 1, "b", 0)],
			{ send: () => {}, print: (l, v) => printed.push(`${l} ${v}`) },
		);
		patch.inlet("t", 0, 7);
		expect(printed).toEqual(["right 7", "left 7"]);
	});

	it("passes through a spigot only while it's open", () => {
		const { patch, shown } = build(
			[
				{ id: "s", text: "spigot" },
				{ id: "n", text: "number" },
			],
			[wire("s", 0, "n", 0)],
		);
		patch.inlet("s", 0, 1);
		patch.inlet("s", 1, 1);
		patch.inlet("s", 0, 2);
		patch.inlet("s", 1, 0);
		patch.inlet("s", 0, 3);
		expect(shown).toEqual([["n", 2]]);
	});

	it("splits at moses' argument", () => {
		const { patch, shown } = build(
			[
				{ id: "m", text: "moses 10" },
				{ id: "lo", text: "number" },
				{ id: "hi", text: "number" },
			],
			[wire("m", 0, "lo", 0), wire("m", 1, "hi", 0)],
		);
		patch.inlet("m", 0, 9);
		patch.inlet("m", 0, 10);
		patch.inlet("m", 1, 5);
		patch.inlet("m", 0, 7);
		expect(shown).toEqual([
			["lo", 9],
			["hi", 10],
			["hi", 7],
		]);
	});

	it("bangs: bng outputs a bang, a bang repeats the last number", () => {
		const printed: string[] = [];
		let flashes = 0;
		const patch = new Patch(
			[
				{ id: "b", text: "bng" },
				{ id: "plus", text: "+ 1" },
				{ id: "p", text: "print" },
				{ id: "pb", text: "print b" },
			],
			[wire("b", 0, "plus", 0), wire("plus", 0, "p", 0), wire("b", 0, "pb", 0)],
			{
				send: () => {},
				print: (l, v) => printed.push(`${l} ${v}`),
				flash: () => flashes++,
			},
		);
		patch.inlet("plus", 0, 4);
		patch.inlet("b", 0, 99);
		expect(printed).toEqual(["print 5", "print 5", "b bang"]);
		expect(flashes).toBe(1);
	});

	it("toggles: a bang flips, a number sets", () => {
		const { patch, shown } = build(
			[
				{ id: "t", text: "tgl" },
				{ id: "n", text: "number" },
			],
			[wire("t", 0, "n", 0)],
		);
		patch.inlet("t", 0, BANG);
		patch.inlet("t", 0, BANG);
		patch.inlet("t", 0, 5);
		patch.inlet("t", 0, 0);
		expect(shown.filter(([id]) => id === "n").map(([, v]) => v)).toEqual([
			1, 0, 1, 0,
		]);
	});

	it("triggers bangs and numbers by type", () => {
		const printed: string[] = [];
		const patch = new Patch(
			[
				{ id: "t", text: "t b f" },
				{ id: "a", text: "print left" },
				{ id: "b", text: "print right" },
			],
			[wire("t", 0, "a", 0), wire("t", 1, "b", 0)],
			{ send: () => {}, print: (l, v) => printed.push(`${l} ${v}`) },
		);
		patch.inlet("t", 0, 3);
		expect(printed).toEqual(["right 3", "left bang"]);
	});

	it("reads message boxes", () => {
		expect(parseMessage("60 100")).toMatchObject({
			kind: "msg",
			tokens: ["60", "100"],
			inlets: 1,
			outlets: 1,
		});
		expect(parseMessage("$1 64").kind).toBe("msg");
		expect(parseMessage("bang").kind).toBe("msg");
		expect(parseMessage("bang 1").kind).toBe("");
		expect(parseMessage("hello").kind).toBe("");
		expect(parseMessage("").kind).toBe("");
		for (const name of [
			...parseMessage("1").inletNames,
			...parseMessage("1").outletNames,
		])
			expect(i18n.exists(`patcher_port_${name}`), name).toBe(true);
	});

	it("sends a list from a message box, spread over noteout's inlets", () => {
		const { patch, sent } = build(
			[
				{ id: "m", text: "60 100", box: "message" },
				{ id: "out", text: "noteout 3", device: "synth" },
			],
			[wire("m", 0, "out", 0)],
		);
		patch.inlet("m", 0, BANG);
		expect(sent).toEqual([["synth", [0x92, 60, 100]]]);
	});

	it("fills $1 with what comes in", () => {
		const printed: string[] = [];
		const patch = new Patch(
			[
				{ id: "m", text: "$1 $2 7", box: "message" },
				{ id: "p", text: "print" },
			],
			[wire("m", 0, "p", 0)],
			{ send: () => {}, print: (_, v) => printed.push(JSON.stringify(v)) },
		);
		patch.inlet("m", 0, 5);
		patch.inlet("m", 0, [1, 2]);
		patch.inlet("m", 0, BANG);
		expect(printed).toEqual(["[5,0,7]", "[1,2,7]", "[0,0,7]"]);
	});

	it("sends a list to midiout as bytes", () => {
		const { patch, sent } = build(
			[
				{ id: "m", text: "176 7 99", box: "message" },
				{ id: "out", text: "midiout", device: "d" },
			],
			[wire("m", 0, "out", 0)],
		);
		patch.inlet("m", 0, BANG);
		expect(sent).toEqual([["d", [0xb0, 7, 99]]]);
	});

	it("sends nothing without a device", () => {
		const { patch, sent } = build(
			[
				{ id: "in", text: "notein" },
				{ id: "out", text: "noteout" },
			],
			[wire("in", 0, "out", 0)],
		);
		patch.receive("x", [0x90, 60, 1]);
		expect(sent).toEqual([]);
	});

	it("survives a feedback loop", () => {
		const { patch, shown } = build(
			[
				{ id: "plus", text: "+ 1" },
				{ id: "n", text: "number" },
			],
			[wire("plus", 0, "n", 0), wire("n", 0, "plus", 0)],
		);
		patch.inlet("plus", 0, 0);
		expect(shown.length).toBeGreaterThan(10);
		expect(shown.length).toBeLessThan(300);
	});

	it("keeps cold inlets of unchanged objects across rebuilds", () => {
		const io = { send: () => {} };
		const shown: number[] = [];
		const first = new Patch([{ id: "p", text: "+ 1" }], [], io);
		first.inlet("p", 1, 5);
		const objects = [
			{ id: "p", text: "+ 1" },
			{ id: "n", text: "number" },
		];
		const second = new Patch(
			objects,
			[wire("p", 0, "n", 0)],
			{ ...io, display: (_, v) => shown.push(v) },
			first.state,
		);
		second.inlet("p", 0, 1);
		expect(shown).toEqual([6]);
	});
});

describe("port names", () => {
	it("names every inlet and outlet of every object", () => {
		for (const name of OBJECT_NAMES) {
			const spec = parseObject(name);
			expect(spec.inletNames, name).toHaveLength(spec.inlets);
			expect(spec.outletNames, name).toHaveLength(spec.outlets);
		}
	});

	it("has a translation for every name", () => {
		const names = OBJECT_NAMES.flatMap((name) => {
			const spec = parseObject(name);
			return [...spec.inletNames, ...spec.outletNames];
		});
		for (const name of new Set(names))
			expect(i18n.exists(`patcher_port_${name}`), name).toBe(true);
	});
});
