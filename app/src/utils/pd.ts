/**
 * Patch upload to Pd clients (ESP-NOW-MIDI components/enomik_pd) over SysEx.
 *
 * Standard MIDI File Dump (universal non-real-time 0x7E, sub-ID 0x07) with
 * the Sample Dump handshake. Spec: ESP-NOW-MIDI components/enomik_pd/README.md,
 * "Patch upload (SysEx)". Reference sender: components/enomik_pd/tools/pd_upload.py.
 */

export const UNIVERSAL_NON_REALTIME = 0x7e;
export const FILE_DUMP = 0x07;
export const FILE_DUMP_HEADER = 0x01;
export const FILE_DUMP_DATA = 0x02;

export const HANDSHAKE = {
	EOF: 0x7b,
	WAIT: 0x7c,
	CANCEL: 0x7d,
	NAK: 0x7e,
	ACK: 0x7f,
} as const;

/** Device ID that addresses every client. */
export const ALL_DEVICES = 0x7f;
/** 16 groups of 7 bytes = 128 encoded bytes, the File Dump maximum. */
export const RAW_PER_PACKET = 112;
/** Limits of the firmware (patch_upload.cpp). */
export const MAX_FILE_SIZE = 1024 * 1024;
export const MAX_NAME_LENGTH = 40;
/** The file whose arrival makes the client reload the patch. */
export const DEFAULT_MAIN_FILE = "main.pd";

const TEXT_EXTENSIONS = new Set([".pd", ".txt", ".json", ".cfg", ".md"]);

const extension = (name: string) => {
	const dot = name.lastIndexOf(".");
	return dot > 0 ? name.slice(dot).toLowerCase() : "";
};

/** File Dump type: `TEXT`, `MIDI` or `BIN ` (4 ASCII characters). */
export function fileDumpType(name: string): "TEXT" | "MIDI" | "BIN " {
	const ext = extension(name);
	if (TEXT_EXTENSIONS.has(ext)) return "TEXT";
	if (ext === ".mid" || ext === ".midi") return "MIDI";
	return "BIN ";
}

/** Names the client accepts: letters, digits, `. _ - ~`, no leading dot. */
export function validFileName(name: string): boolean {
	return (
		name.length > 0 &&
		name.length <= MAX_NAME_LENGTH &&
		/^[A-Za-z0-9_~-][A-Za-z0-9._~-]*$/.test(name)
	);
}

/** Each group of up to 7 bytes: one byte with their top bits, then their low 7 bits. */
export function encode7in8(bytes: ArrayLike<number>): number[] {
	const out: number[] = [];
	for (let i = 0; i < bytes.length; i += 7) {
		const groupEnd = Math.min(i + 7, bytes.length);
		let msbs = 0;
		for (let j = i; j < groupEnd; j++)
			msbs |= ((bytes[j] >> 7) & 1) << (6 - (j - i));
		out.push(msbs);
		for (let j = i; j < groupEnd; j++) out.push(bytes[j] & 0x7f);
	}
	return out;
}

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0) & 0x7f);

export function buildHeader(
	device: number,
	name: string,
	size: number,
): number[] {
	const length = [0, 7, 14, 21].map((shift) => (size >> shift) & 0x7f);
	return [
		0xf0,
		UNIVERSAL_NON_REALTIME,
		device & 0x7f,
		FILE_DUMP,
		FILE_DUMP_HEADER,
		0x00, // sender ID
		...ascii(fileDumpType(name)),
		...length,
		...ascii(name),
		0xf7,
	];
}

export function buildDataPacket(
	device: number,
	packet: number,
	chunk: ArrayLike<number>,
): number[] {
	const encoded = encode7in8(chunk);
	const body = [
		UNIVERSAL_NON_REALTIME,
		device & 0x7f,
		FILE_DUMP,
		FILE_DUMP_DATA,
		packet & 0x7f,
		encoded.length - 1,
		...encoded,
	];
	const checksum = body.reduce((sum, b) => sum ^ b, 0) & 0x7f;
	return [0xf0, ...body, checksum, 0xf7];
}

export function buildHandshake(
	device: number,
	subId: number,
	packet: number,
): number[] {
	return [
		0xf0,
		UNIVERSAL_NON_REALTIME,
		device & 0x7f,
		subId,
		packet & 0x7f,
		0xf7,
	];
}

export type HandshakeKind = "ack" | "nak" | "cancel" | "wait";

export interface Handshake {
	kind: HandshakeKind;
	/** Device ID of the client that answered. */
	device: number;
	packet: number;
}

const HANDSHAKE_KINDS: Record<number, HandshakeKind> = {
	[HANDSHAKE.ACK]: "ack",
	[HANDSHAKE.NAK]: "nak",
	[HANDSHAKE.CANCEL]: "cancel",
	[HANDSHAKE.WAIT]: "wait",
};

/** An answer from a client (`F0 7E dd sub pp F7`), or null for anything else. */
export function parseHandshake(data: ArrayLike<number>): Handshake | null {
	if (
		data.length !== 6 ||
		data[0] !== 0xf0 ||
		data[1] !== UNIVERSAL_NON_REALTIME ||
		data[5] !== 0xf7
	)
		return null;
	const kind = HANDSHAKE_KINDS[data[3]];
	return kind ? { kind, device: data[2], packet: data[4] } : null;
}

/** Same order, but the main file last: receiving it reloads the patch. */
export function orderFiles<T extends { name: string }>(
	files: T[],
	mainFile = DEFAULT_MAIN_FILE,
): T[] {
	return [
		...files.filter((f) => f.name !== mainFile),
		...files.filter((f) => f.name === mainFile),
	];
}

export type UploadFailure = "timeout" | "cancelled" | "aborted" | "send_failed";

export class UploadError extends Error {
	readonly reason: UploadFailure;

	constructor(reason: UploadFailure, message: string) {
		super(message);
		this.reason = reason;
	}
}

export interface UploadOptions {
	name: string;
	bytes: Uint8Array;
	/** Client device ID, or ALL_DEVICES. */
	device: number;
	/** Sends one SysEx message; false if it could not be sent. */
	send: (data: number[]) => boolean;
	/**
	 * Waits for the next answer from any client. Resolves null after
	 * `timeoutMs` without one.
	 */
	nextHandshake: (timeoutMs: number) => Promise<Handshake | null>;
	timeoutMs?: number;
	retries?: number;
	/** Bytes acknowledged so far. */
	onProgress?: (sent: number, total: number) => void;
	signal?: AbortSignal;
}

/**
 * Sends one file and waits for the client to store it: header, data packets
 * (each acknowledged before the next), end of file. Throws UploadError.
 */
export async function uploadFile({
	name,
	bytes,
	device,
	send,
	nextHandshake,
	timeoutMs = 2000,
	retries = 5,
	onProgress,
	signal,
}: UploadOptions): Promise<void> {
	const fromOurClient = (h: Handshake) =>
		device === ALL_DEVICES || h.device === device;

	const exchange = async (message: number[], what: string) => {
		for (let attempt = 0; attempt < retries; attempt++) {
			if (signal?.aborted) {
				send(buildHandshake(device, HANDSHAKE.CANCEL, 0));
				throw new UploadError("aborted", `${name}: aborted`);
			}
			if (!send(message))
				throw new UploadError("send_failed", `${name}: could not send`);
			// Wait for our client's answer; WAIT restarts the clock.
			for (;;) {
				const answer = await nextHandshake(timeoutMs);
				if (!answer) break; // timeout: resend
				if (!fromOurClient(answer)) continue;
				if (answer.kind === "wait") continue;
				if (answer.kind === "ack") return;
				if (answer.kind === "cancel")
					throw new UploadError(
						"cancelled",
						`${name}: ${what} cancelled by the client`,
					);
				break; // nak: resend
			}
		}
		throw new UploadError("timeout", `${name}: no answer to ${what}`);
	};

	await exchange(buildHeader(device, name, bytes.length), "header");
	const packets = Math.ceil(bytes.length / RAW_PER_PACKET);
	for (let n = 0; n < packets; n++) {
		const chunk = bytes.subarray(n * RAW_PER_PACKET, (n + 1) * RAW_PER_PACKET);
		await exchange(buildDataPacket(device, n, chunk), `packet ${n}`);
		onProgress?.(
			Math.min((n + 1) * RAW_PER_PACKET, bytes.length),
			bytes.length,
		);
	}
	await exchange(buildHandshake(device, HANDSHAKE.EOF, packets), "end of file");
	onProgress?.(bytes.length, bytes.length);
}

/**
 * Queue of answers from the MIDI input, awaited one at a time by uploadFile.
 * `push` from the input listener, `next` from the upload.
 */
export function createHandshakeQueue() {
	const pending: Handshake[] = [];
	let waiter: ((h: Handshake | null) => void) | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;

	return {
		push(h: Handshake) {
			if (waiter) {
				clearTimeout(timer);
				const w = waiter;
				waiter = null;
				w(h);
			} else {
				pending.push(h);
			}
		},
		next(timeoutMs: number): Promise<Handshake | null> {
			const queued = pending.shift();
			if (queued) return Promise.resolve(queued);
			return new Promise((resolve) => {
				waiter = resolve;
				timer = setTimeout(() => {
					waiter = null;
					resolve(null);
				}, timeoutMs);
			});
		},
		/** Drops stale answers, e.g. before a new upload. */
		clear() {
			pending.length = 0;
		},
	};
}
