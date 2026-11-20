import { describe, expect, it } from "vitest";
import {
	ALL_DEVICES,
	buildDataPacket,
	buildHandshake,
	buildHeader,
	createHandshakeQueue,
	encode7in8,
	fileDumpType,
	HANDSHAKE,
	type Handshake,
	orderFiles,
	parseHandshake,
	RAW_PER_PACKET,
	UploadError,
	uploadFile,
	validFileName,
} from "./pd";

/** Inverse of encode7in8, as the firmware decodes (patch_upload.cpp). */
const decode7in8 = (encoded: number[]): number[] => {
	const out: number[] = [];
	for (let g = 0; g < encoded.length; g += 8) {
		const msbs = encoded[g];
		for (let j = 1; j < 8 && g + j < encoded.length; j++)
			out.push(encoded[g + j] | (((msbs >> (7 - j)) & 1) << 7));
	}
	return out;
};

describe("encoding", () => {
	it("round-trips every byte value", () => {
		const bytes = Array.from({ length: 256 }, (_, i) => i);
		const encoded = encode7in8(bytes);
		expect(encoded.every((b) => b <= 0x7f)).toBe(true);
		expect(decode7in8(encoded)).toEqual(bytes);
	});

	it("packs a partial last group", () => {
		expect(encode7in8([0x80, 0x01])).toEqual([0b1000000, 0x00, 0x01]);
	});

	// Golden bytes from components/enomik_pd/tools/pd_upload.py, which the
	// firmware was tested against.
	it("builds the header like the reference sender", () => {
		expect(buildHeader(5, "main.pd", 200000)).toEqual([
			0xf0, 0x7e, 0x05, 0x07, 0x01, 0x00, 0x54, 0x45, 0x58, 0x54, 0x40, 0x1a,
			0x0c, 0x00, 0x6d, 0x61, 0x69, 0x6e, 0x2e, 0x70, 0x64, 0xf7,
		]);
	});

	it("builds a data packet like the reference sender", () => {
		const data = [0x00, 0x7f, 0x80, 0xff, 0x41, 0x42, 0x43, 0x44, 0xc3];
		expect(buildDataPacket(5, 3, data)).toEqual([
			0xf0, 0x7e, 0x05, 0x07, 0x02, 0x03, 0x0a, 0x18, 0x00, 0x7f, 0x00, 0x7f,
			0x41, 0x42, 0x43, 0x20, 0x44, 0x43, 0x08, 0xf7,
		]);
	});

	it("fits a full packet in 128 encoded bytes", () => {
		const packet = buildDataPacket(0, 0, new Uint8Array(RAW_PER_PACKET));
		expect(packet[6]).toBe(127); // byte count - 1
	});
});

describe("helpers", () => {
	it("picks File Dump types", () => {
		expect(fileDumpType("main.pd")).toBe("TEXT");
		expect(fileDumpType("notes.TXT")).toBe("TEXT");
		expect(fileDumpType("song.mid")).toBe("MIDI");
		expect(fileDumpType("kick.wav")).toBe("BIN ");
		expect(fileDumpType("noext")).toBe("BIN ");
	});

	it("validates names like the firmware", () => {
		expect(validFileName("main.pd")).toBe(true);
		expect(validFileName("my-voice_2~.pd")).toBe(true);
		expect(validFileName(".hidden")).toBe(false);
		expect(validFileName("../evil")).toBe(false);
		expect(validFileName("a b.pd")).toBe(false);
		expect(validFileName("ä.pd")).toBe(false);
		expect(validFileName("x".repeat(41))).toBe(false);
		expect(validFileName("")).toBe(false);
	});

	it("sends the main file last", () => {
		const files = [
			{ name: "main.pd" },
			{ name: "voice.pd" },
			{ name: "a.wav" },
		];
		expect(orderFiles(files).map((f) => f.name)).toEqual([
			"voice.pd",
			"a.wav",
			"main.pd",
		]);
	});

	it("parses answers", () => {
		expect(parseHandshake([0xf0, 0x7e, 0x03, 0x7f, 0x05, 0xf7])).toEqual({
			kind: "ack",
			device: 3,
			packet: 5,
		});
		expect(parseHandshake(buildHandshake(1, HANDSHAKE.NAK, 2))?.kind).toBe(
			"nak",
		);
		expect(parseHandshake(buildHandshake(1, HANDSHAKE.CANCEL, 0))?.kind).toBe(
			"cancel",
		);
		expect(parseHandshake(buildHandshake(1, HANDSHAKE.EOF, 0))).toBeNull();
		expect(parseHandshake([0xf0, 0x7d, 0x00, 0x7f, 0x00, 0xf7])).toBeNull();
	});
});

/**
 * Receiver with the firmware's behaviour, answering synchronously through
 * a handshake queue. `faults` alters its answers to test the sender.
 */
const fakeClient = (
	clientDevice: number,
	faults: {
		nakFirstPacket?: number;
		dropAnswerToPacket?: number;
		cancelAtPacket?: number;
	} = {},
) => {
	const queue = createHandshakeQueue();
	const files: Record<string, number[]> = {};
	let name = "";
	let expected = 0;
	let data: number[] = [];
	let next = 0;
	let naked = false;
	let dropped = false;
	const sent: number[][] = [];
	const answer = (sub: number, packet: number) =>
		queue.push(
			parseHandshake(buildHandshake(clientDevice, sub, packet)) as Handshake,
		);

	const send = (msg: number[]) => {
		sent.push(msg);
		const [, , dev, sub] = msg;
		if (dev !== clientDevice && dev !== ALL_DEVICES) return true;
		if (sub === 0x07 && msg[4] === 0x01) {
			expected = msg[10] | (msg[11] << 7) | (msg[12] << 14) | (msg[13] << 21);
			name = String.fromCharCode(...msg.slice(14, -1));
			data = [];
			next = 0;
			answer(HANDSHAKE.ACK, 0);
		} else if (sub === 0x07 && msg[4] === 0x02) {
			const packet = msg[5];
			if (packet === faults.cancelAtPacket) {
				answer(HANDSHAKE.CANCEL, packet);
				return true;
			}
			if (packet === faults.nakFirstPacket && !naked) {
				naked = true;
				answer(HANDSHAKE.NAK, packet);
				return true;
			}
			if (packet === next - 1 && data.length) {
				answer(HANDSHAKE.ACK, packet); // repeat: don't store twice
				return true;
			}
			if (packet !== next) {
				answer(HANDSHAKE.NAK, next);
				return true;
			}
			const count = msg[6] + 1;
			const body = msg.slice(1, 7 + count);
			const sum = body.reduce((s, b) => s ^ b, 0) & 0x7f;
			if (sum !== msg[7 + count]) {
				answer(HANDSHAKE.NAK, packet);
				return true;
			}
			data.push(...decode7in8(msg.slice(7, 7 + count)));
			data = data.slice(0, expected);
			next = (next + 1) & 0x7f;
			if (packet === faults.dropAnswerToPacket && !dropped) {
				dropped = true; // stored, but the ACK gets lost
				return true;
			}
			answer(HANDSHAKE.ACK, packet);
		} else if (sub === HANDSHAKE.EOF) {
			if (data.length !== expected) {
				answer(HANDSHAKE.CANCEL, msg[4]);
				return true;
			}
			files[name] = data;
			answer(HANDSHAKE.ACK, msg[4]);
		}
		return true;
	};
	return { queue, files, send, sent };
};

const randomBytes = (n: number) =>
	Uint8Array.from({ length: n }, (_, i) => (i * 131 + 7) & 0xff);

describe("uploadFile", () => {
	const upload = (
		client: ReturnType<typeof fakeClient>,
		bytes: Uint8Array,
		device = 0,
		extra: Partial<Parameters<typeof uploadFile>[0]> = {},
	) =>
		uploadFile({
			name: "test.bin",
			bytes,
			device,
			send: client.send,
			nextHandshake: client.queue.next,
			timeoutMs: 20,
			...extra,
		});

	it("uploads a file byte for byte", async () => {
		const client = fakeClient(0);
		const bytes = randomBytes(3000);
		const progress: number[] = [];
		await upload(client, bytes, 0, { onProgress: (s) => progress.push(s) });
		expect(client.files["test.bin"]).toEqual(Array.from(bytes));
		expect(progress.at(-1)).toBe(3000);
	});

	it("uploads an empty file", async () => {
		const client = fakeClient(0);
		await upload(client, new Uint8Array(0));
		expect(client.files["test.bin"]).toEqual([]);
	});

	it("addresses all clients with 127", async () => {
		const client = fakeClient(4);
		await upload(client, randomBytes(500), ALL_DEVICES);
		expect(client.files["test.bin"]).toHaveLength(500);
	});

	it("resends after a NAK", async () => {
		const client = fakeClient(0, { nakFirstPacket: 2 });
		await upload(client, randomBytes(1000));
		expect(client.files["test.bin"]).toEqual(Array.from(randomBytes(1000)));
		const packet2 = client.sent.filter((m) => m[4] === 0x02 && m[5] === 2);
		expect(packet2).toHaveLength(2);
	});

	it("resends after a lost answer, without storing twice", async () => {
		const client = fakeClient(0, { dropAnswerToPacket: 1 });
		await upload(client, randomBytes(1000));
		expect(client.files["test.bin"]).toEqual(Array.from(randomBytes(1000)));
	});

	it("ignores answers from other clients", async () => {
		const client = fakeClient(0);
		// Another client (device 9) behind the same dongle cancels everything.
		const send = (msg: number[]) => {
			client.queue.push({ kind: "cancel", device: 9, packet: 0 });
			return client.send(msg);
		};
		await uploadFile({
			name: "x.pd",
			bytes: randomBytes(300),
			device: 0,
			send,
			nextHandshake: client.queue.next,
			timeoutMs: 20,
		});
		expect(client.files["x.pd"]).toEqual(Array.from(randomBytes(300)));
	});

	it("stops when the client cancels", async () => {
		const client = fakeClient(0, { cancelAtPacket: 1 });
		await expect(upload(client, randomBytes(1000))).rejects.toMatchObject({
			reason: "cancelled",
		});
	});

	it("gives up when nobody answers", async () => {
		const queue = createHandshakeQueue();
		const sent: number[][] = [];
		await expect(
			uploadFile({
				name: "x.pd",
				bytes: randomBytes(10),
				device: 0,
				send: (m) => {
					sent.push(m);
					return true;
				},
				nextHandshake: queue.next,
				timeoutMs: 5,
				retries: 3,
			}),
		).rejects.toBeInstanceOf(UploadError);
		expect(sent).toHaveLength(3); // the header, 3 times
	});

	it("aborts and tells the client", async () => {
		const client = fakeClient(0);
		const controller = new AbortController();
		controller.abort();
		await expect(
			upload(client, randomBytes(100), 0, { signal: controller.signal }),
		).rejects.toMatchObject({ reason: "aborted" });
		expect(client.sent.at(-1)?.[3]).toBe(HANDSHAKE.CANCEL);
	});
});
