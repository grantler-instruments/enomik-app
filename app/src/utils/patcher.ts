/**
 * Patcher engine: a minimal Pure Data. Objects are typed as text ("+ 5",
 * "ctlin 7 1"), have inlets and outlets and pass numbers along their
 * connections. Inlet 0 is hot (computes and outputs), the others are cold
 * (store a value for the next hot one). Objects with several outlets fire
 * them right to left, so "notein" sets noteout's velocity before its note.
 */

type Binary = (a: number, b: number) => number;

/** A bang: "do it now", without a number. */
export const BANG = "bang";

/**
 * What travels along connections: a number, a bang or a list of numbers.
 * A list spreads over an object's inlets, right to left: "60 100" into
 * noteout sets velocity 100, then plays note 60.
 */
export type Message = number | typeof BANG | number[];

const MATH: Record<string, Binary> = {
	"+": (a, b) => a + b,
	"-": (a, b) => a - b,
	"*": (a, b) => a * b,
	"/": (a, b) => (b === 0 ? 0 : a / b),
	"%": (a, b) => (b === 0 ? 0 : a % b),
	min: Math.min,
	max: Math.max,
	"==": (a, b) => Number(a === b),
	"!=": (a, b) => Number(a !== b),
	">": (a, b) => Number(a > b),
	"<": (a, b) => Number(a < b),
	">=": (a, b) => Number(a >= b),
	"<=": (a, b) => Number(a <= b),
};

/** What each object has, and its default arguments. */
const OBJECTS = {
	midiin: { inlets: 0, outlets: 1, midi: "in", defaults: [] },
	notein: { inlets: 0, outlets: 3, midi: "in", defaults: [0] },
	ctlin: { inlets: 0, outlets: 3, midi: "in", defaults: [-1, 0] },
	midiout: { inlets: 1, outlets: 0, midi: "out", defaults: [] },
	noteout: { inlets: 3, outlets: 0, midi: "out", defaults: [1] },
	ctlout: { inlets: 3, outlets: 0, midi: "out", defaults: [0, 1] },
	number: { inlets: 1, outlets: 1, midi: null, defaults: [] },
	print: { inlets: 1, outlets: 0, midi: null, defaults: [] },
	scale: { inlets: 1, outlets: 1, midi: null, defaults: [0, 127, 0, 127] },
	clip: { inlets: 3, outlets: 1, midi: null, defaults: [0, 127] },
	// trigger's outlets come from its arguments, see parseObject.
	trigger: { inlets: 1, outlets: 2, midi: null, defaults: [] },
	t: { inlets: 1, outlets: 2, midi: null, defaults: [] },
	spigot: { inlets: 2, outlets: 1, midi: null, defaults: [0] },
	moses: { inlets: 2, outlets: 2, midi: null, defaults: [64] },
	bng: { inlets: 1, outlets: 1, midi: null, defaults: [] },
	tgl: { inlets: 1, outlets: 1, midi: null, defaults: [] },
	...Object.fromEntries(
		Object.keys(MATH).map((op) => [
			op,
			{ inlets: 2, outlets: 1, midi: null, defaults: [0] },
		]),
	),
} as Record<
	string,
	{
		inlets: number;
		outlets: number;
		midi: "in" | "out" | null;
		defaults: number[];
	}
>;

/** Object names, for the toolbar and the docs. */
export const OBJECT_NAMES = Object.keys(OBJECTS);

const MATH_PORTS = { inlets: ["value", "argument"], outlets: ["result"] };
const COMPARE = new Set(["==", "!=", ">", "<", ">=", "<="]);

/** Names of the inlets and outlets, shown on hover (i18n: patcher_port_*). */
const PORTS: Record<string, { inlets?: string[]; outlets?: string[] }> = {
	...Object.fromEntries(
		Object.keys(MATH).map((op) => [
			op,
			COMPARE.has(op)
				? { inlets: MATH_PORTS.inlets, outlets: ["truth"] }
				: MATH_PORTS,
		]),
	),
	number: { inlets: ["value"], outlets: ["value"] },
	print: { inlets: ["value"] },
	scale: { inlets: ["value"], outlets: ["result"] },
	midiin: { outlets: ["byte"] },
	notein: { outlets: ["note", "velocity", "channel"] },
	ctlin: { outlets: ["value", "controller", "channel"] },
	midiout: { inlets: ["byte"] },
	noteout: { inlets: ["note", "velocity", "channel"] },
	ctlout: { inlets: ["value", "controller", "channel"] },
	clip: { inlets: ["value", "low", "high"], outlets: ["value"] },
	spigot: { inlets: ["value", "open"], outlets: ["value"] },
	moses: { inlets: ["value", "split"], outlets: ["below", "above"] },
	bng: { inlets: ["bang"], outlets: ["bang"] },
	tgl: { inlets: ["toggle"], outlets: ["state"] },
};

/** trigger's argument types, by their short name. */
const TRIGGER_TYPES: Record<string, "f" | "b" | "a"> = {
	f: "f",
	float: "f",
	b: "b",
	bang: "b",
	a: "a",
	anything: "a",
};
const isTrigger = (name: string) => name === "trigger" || name === "t";

export interface ObjectSpec {
	/** Object name, "" when the text names no object. */
	kind: string;
	args: number[];
	inlets: number;
	outlets: number;
	/** Whether it talks to a MIDI input or output (and picks a device). */
	midi: "in" | "out" | null;
	inletNames: string[];
	outletNames: string[];
	/** print's label: its text after the name, "print" without one. */
	label: string;
	/** trigger's outlet types: f (number), b (bang), a (as it came). */
	types: ("f" | "b" | "a")[];
	/** A message box's content: numbers, "bang" or "$1"… */
	tokens: string[];
}

/** What a box is: an object ("+ 5") or a message box ("60 100"). */
export type BoxKind = "object" | "message";

const MESSAGE_TOKEN = /^(bang|\$[1-9])$/;

/**
 * Reads a message box's content: numbers and $1…$9 (the incoming
 * numbers), or "bang" alone. Anything else makes it unknown.
 */
export const parseMessage = (text: string): ObjectSpec => {
	const tokens = text.trim().split(/\s+/).filter(Boolean);
	const valid =
		tokens.length > 0 &&
		tokens.every(
			(token) => MESSAGE_TOKEN.test(token) || Number.isFinite(Number(token)),
		) &&
		(!tokens.includes("bang") || tokens.length === 1);
	return {
		...UNKNOWN,
		...(valid && {
			kind: "msg",
			inlets: 1,
			outlets: 1,
			inletNames: ["message"],
			outletNames: ["content"],
			tokens,
		}),
	};
};

/** Reads a box's text as what it is. */
export const parseBox = (text: string, box: BoxKind = "object") =>
	box === "message" ? parseMessage(text) : parseObject(text);

const UNKNOWN: ObjectSpec = {
	kind: "",
	args: [],
	inlets: 0,
	outlets: 0,
	midi: null,
	inletNames: [],
	outletNames: [],
	label: "",
	types: [],
	tokens: [],
};

/**
 * Reads an object box's text: its name, then numbers (print: any text,
 * trigger: one type per outlet, f, b or a).
 */
export const parseObject = (text: string): ObjectSpec => {
	const [name = "", ...rest] = text.trim().split(/\s+/);
	const spec = OBJECTS[name];
	const label = name === "print" ? rest.join(" ") || "print" : "";
	const trigger = isTrigger(name);
	const args = label || trigger ? [] : rest.map(Number);
	if (
		!spec ||
		args.some((n) => !Number.isFinite(n)) ||
		(trigger && rest.some((type) => !TRIGGER_TYPES[type]))
	)
		return UNKNOWN;
	return {
		kind: name,
		args: spec.defaults.map((d, i) => args[i] ?? d),
		inlets: spec.inlets,
		outlets: spec.outlets,
		midi: spec.midi,
		inletNames: PORTS[name]?.inlets ?? [],
		outletNames: PORTS[name]?.outlets ?? [],
		label,
		types: [],
		tokens: [],
		...(trigger && {
			outlets: rest.length || spec.outlets,
			inletNames: ["value"],
			outletNames: Array(rest.length || spec.outlets).fill("value"),
			types: rest.length ? rest.map((type) => TRIGGER_TYPES[type]) : ["f", "f"],
		}),
	};
};

export interface PatchObject {
	id: string;
	text: string;
	/** MIDI port id; "" for an input: every device. */
	device?: string;
	box?: BoxKind;
}

export interface PatchConnection {
	source: string;
	outlet: number;
	target: string;
	inlet: number;
}

export interface PatchIO {
	/** Sends bytes to a MIDI output. */
	send: (device: string, bytes: number[]) => void;
	/** A number box got a value. */
	display?: (id: string, value: number) => void;
	/** A print object got a message. */
	print?: (label: string, message: Message) => void;
	/** A bng was banged: it lights up. */
	flash?: (id: string) => void;
}

/** Kept between rebuilds of a patch, by object id. */
export type PatchState = Map<string, { text: string; cold: number[] }>;

/** Bytes in a message starting with this status byte; 0: until 0xf7. */
const messageLength = (status: number) => {
	if (status >= 0xf8) return 1;
	switch (status) {
		case 0xf0:
			return 0;
		case 0xf1:
		case 0xf3:
			return 2;
		case 0xf2:
			return 3;
	}
	if (status >= 0xf4) return 1;
	const type = status & 0xf0;
	return type === 0xc0 || type === 0xd0 ? 2 : 3;
};

const byte = (n: number) => Math.min(127, Math.max(0, Math.round(n)));
const channel = (n: number) => Math.min(16, Math.max(1, Math.round(n))) - 1;

/**
 * A message box's output: its tokens, with $1… replaced by the incoming
 * numbers (0 when missing, e.g. on a click).
 */
const compose = (tokens: string[], incoming: Message): Message => {
	if (tokens[0] === BANG) return BANG;
	const args =
		incoming === BANG ? [] : Array.isArray(incoming) ? incoming : [incoming];
	const out = tokens.map((token) =>
		token.startsWith("$")
			? (args[Number(token.slice(1)) - 1] ?? 0)
			: Number(token),
	);
	return out.length === 1 ? out[0] : out;
};

/** Deeper than this, a connection loop is cut. */
const MAX_DEPTH = 256;

/**
 * A running patch. Rebuilt when objects or connections change; pass the
 * previous patch's `state` so unchanged objects keep their cold inlets.
 */
export class Patch {
	readonly state: PatchState;
	private specs = new Map<string, ObjectSpec>();
	private devices = new Map<string, string>();
	/** Connections by source object, then outlet. */
	private wires = new Map<string, PatchConnection[][]>();
	/** midiout's message so far. */
	private buffers = new Map<string, number[]>();
	private depth = 0;
	private io: PatchIO;

	constructor(
		objects: PatchObject[],
		connections: PatchConnection[],
		io: PatchIO,
		state: PatchState = new Map(),
	) {
		this.io = io;
		this.state = new Map();
		for (const object of objects) {
			const spec = parseBox(object.text, object.box);
			this.specs.set(object.id, spec);
			this.devices.set(object.id, object.device ?? "");
			const kept = state.get(object.id);
			const text = `${object.box ?? "object"}:${object.text}`;
			this.state.set(
				object.id,
				kept && kept.text === text
					? kept
					: { text, cold: this.initialCold(spec) },
			);
		}
		for (const c of connections) {
			const source = this.specs.get(c.source);
			const target = this.specs.get(c.target);
			if (!source || !target) continue;
			if (c.outlet >= source.outlets || c.inlet >= target.inlets) continue;
			let outlets = this.wires.get(c.source);
			if (!outlets) {
				outlets = Array.from({ length: source.outlets }, () => []);
				this.wires.set(c.source, outlets);
			}
			outlets[c.outlet].push(c);
		}
	}

	/** Cold inlet values (index = inlet) before anything arrives. */
	private initialCold(spec: ObjectSpec): number[] {
		const [a = 0, b = 0] = spec.args;
		switch (spec.kind) {
			case "noteout":
				return [0, 0, a];
			case "ctlout":
				return [0, a, b];
			case "clip":
				return [0, a, b];
			default:
				return [0, a];
		}
	}

	/** Feeds a message from a MIDI input to the objects listening to it. */
	receive(device: string, data: ArrayLike<number>) {
		if (data.length === 0) return;
		const status = data[0];
		const type = status & 0xf0;
		const ch = (status & 0x0f) + 1;
		for (const [id, spec] of this.specs) {
			if (spec.midi !== "in") continue;
			const wanted = this.devices.get(id);
			if (wanted && wanted !== device) continue;
			if (spec.kind === "midiin") {
				for (let i = 0; i < data.length; i++) this.out(id, 0, data[i]);
			} else if (status < 0xf0 && data.length >= 3) {
				const d1 = data[1];
				const d2 = data[2];
				if (spec.kind === "notein") {
					if (type !== 0x90 && type !== 0x80) continue;
					if (spec.args[0] && spec.args[0] !== ch) continue;
					this.out(id, 2, ch);
					this.out(id, 1, type === 0x80 ? 0 : d2);
					this.out(id, 0, d1);
				} else if (spec.kind === "ctlin") {
					if (type !== 0xb0) continue;
					const [cc, wantedCh] = spec.args;
					if (cc >= 0 && cc !== d1) continue;
					if (wantedCh && wantedCh !== ch) continue;
					this.out(id, 2, ch);
					this.out(id, 1, d1);
					this.out(id, 0, d2);
				}
			}
		}
	}

	/**
	 * Sends a message into an object's inlet. A bang on a hot inlet repeats
	 * the last number there; cold inlets ignore bangs.
	 */
	inlet(id: string, inlet: number, message: Message) {
		const spec = this.specs.get(id);
		const state = this.state.get(id);
		if (!spec || !state || inlet >= spec.inlets) return;
		const { cold } = state;
		if (inlet > 0) {
			const first = Array.isArray(message) ? message[0] : message;
			if (first !== BANG) cold[inlet] = first;
			return;
		}
		// Objects that take a bang or a list as it is.
		switch (spec.kind) {
			case "msg":
				this.io.flash?.(id);
				this.out(id, 0, compose(spec.tokens, message));
				return;
			case "bng":
				this.io.flash?.(id);
				this.out(id, 0, BANG);
				return;
			case "print":
				this.io.print?.(spec.label, message);
				return;
			case "spigot":
				if (cold[1] !== 0) this.out(id, 0, message);
				return;
			case "trigger":
			case "t":
				for (let i = spec.outlets - 1; i >= 0; i--) {
					const type = spec.types[i];
					this.out(
						id,
						i,
						type === "b"
							? BANG
							: type === "a"
								? message
								: message === BANG
									? 0
									: Array.isArray(message)
										? message[0]
										: message,
					);
				}
				return;
			case "midiout":
				if (message === BANG) return;
				for (const n of Array.isArray(message) ? message : [message])
					this.midiByte(id, Math.round(n));
				return;
		}
		// A list: the rest go to the cold inlets, right to left, the first
		// one to the hot inlet.
		if (Array.isArray(message)) {
			for (let i = Math.min(message.length, spec.inlets) - 1; i > 0; i--)
				cold[i] = message[i];
			message = message[0];
		}
		if (spec.kind === "tgl") {
			const on = message === BANG ? Number(!cold[0]) : Number(message !== 0);
			cold[0] = on;
			this.io.display?.(id, on);
			this.out(id, 0, on);
			return;
		}
		const value = message === BANG ? cold[0] : message;
		cold[0] = value;
		const [a = 0, b = 0, c = 0, d = 0] = spec.args;
		const math = MATH[spec.kind];
		if (math) {
			this.out(id, 0, math(value, cold[1]));
			return;
		}
		switch (spec.kind) {
			case "number":
				this.io.display?.(id, value);
				this.out(id, 0, value);
				break;
			case "scale":
				this.out(id, 0, b === a ? c : c + ((value - a) * (d - c)) / (b - a));
				break;
			case "clip":
				this.out(id, 0, Math.min(Math.max(value, cold[1]), cold[2]));
				break;
			case "moses":
				this.out(id, value < cold[1] ? 0 : 1, value);
				break;
			case "noteout":
				this.send(id, [0x90 | channel(cold[2]), byte(value), byte(cold[1])]);
				break;
			case "ctlout":
				this.send(id, [0xb0 | channel(cold[2]), byte(cold[1]), byte(value)]);
				break;
		}
	}

	/** Collects bytes into whole messages; data bytes without status are dropped. */
	private midiByte(id: string, value: number) {
		if (value < 0 || value > 0xff) return;
		let buffer = this.buffers.get(id) ?? [];
		if (value >= 0xf8) {
			// Real-time messages may come between any bytes.
			this.send(id, [value]);
			return;
		}
		if (value >= 0x80 && value !== 0xf7) buffer = [value];
		else if (buffer.length === 0) return;
		else buffer.push(value);
		const length = messageLength(buffer[0]);
		if (
			(length === 0 && value === 0xf7) ||
			(length > 0 && buffer.length >= length)
		) {
			this.send(id, buffer);
			buffer = [];
		}
		this.buffers.set(id, buffer);
	}

	private send(id: string, bytes: number[]) {
		const device = this.devices.get(id);
		if (device) this.io.send(device, bytes);
	}

	private out(id: string, outlet: number, value: Message) {
		if (this.depth >= MAX_DEPTH) return;
		const wires = this.wires.get(id)?.[outlet];
		if (!wires) return;
		this.depth++;
		try {
			for (const wire of wires) this.inlet(wire.target, wire.inlet, value);
		} finally {
			this.depth--;
		}
	}
}
