/**
 * SysEx protocol of the client_nfc example (ESP-NOW-MIDI/examples/client_nfc).
 * Manufacturer 0x7D, then 7F 7F to keep it apart from enomik config SysEx,
 * then 4E ("N") and a command byte.
 */

import { nfcTranslations } from "../i18n.nfc";

const nfcEn = nfcTranslations.en;

export const NFC_SYSEX_HEADER = [0xf0, 0x7d, 0x7f, 0x7f, 0x4e] as const;

export const NFC_COMMAND = {
	MAPPING_OFF: 0x00,
	MAPPING_ON: 0x01,
	CLEAR: 0x02,
	GET_MAPPINGS: 0x03,
	TAG_PLACED: 0x10,
	TAG_REMOVED: 0x11,
	MAPPING_STATE: 0x12,
	TAG_MAPPED: 0x13,
	MAPPING_COUNT: 0x14,
} as const;

/** MIDI status high nibble, as the client stores it. */
export type NfcMessageType = 0x8 | 0x9 | 0xb | 0xc;

export const NFC_MESSAGE_TYPES: NfcMessageType[] = [0x9, 0x8, 0xb, 0xc];

export interface NfcMapping {
	/** UID as hex bytes, "04 A2 3B 1C". */
	uid: string;
	type: NfcMessageType;
	/** 1..16 */
	channel: number;
	data1: number;
	data2: number;
}

export type NfcEvent =
	| { kind: "placed" | "removed"; uid: string }
	| { kind: "mapping_state"; on: boolean }
	| ({ kind: "mapped" } & NfcMapping)
	| { kind: "count"; count: number };

export function buildNfcSysex(command: number): number[] {
	return [...NFC_SYSEX_HEADER, command & 0x7f, 0xf7];
}

/** <uid> = length n (4 or 7), then 2n nibbles, high nibble first. */
export function decodeUid(
	data: ArrayLike<number>,
	offset: number,
): { uid: string; next: number } | null {
	const length = data[offset];
	if (length === undefined || length < 1 || length > 10) return null;
	const end = offset + 1 + length * 2;
	if (end > data.length) return null;
	const bytes: string[] = [];
	for (let i = offset + 1; i < end; i += 2) {
		const high = data[i];
		const low = data[i + 1];
		if (high > 0x0f || low > 0x0f) return null;
		bytes.push(((high << 4) | low).toString(16).toUpperCase().padStart(2, "0"));
	}
	return { uid: bytes.join(" "), next: end };
}

const isMessageType = (value: number): value is NfcMessageType =>
	(NFC_MESSAGE_TYPES as number[]).includes(value);

/** Parses a SysEx sent by client_nfc; null for anything else. */
export function parseNfcSysex(data: ArrayLike<number>): NfcEvent | null {
	const h = NFC_SYSEX_HEADER.length;
	if (data.length < h + 2 || data[data.length - 1] !== 0xf7) return null;
	for (let i = 0; i < h; i++) if (data[i] !== NFC_SYSEX_HEADER[i]) return null;
	const command = data[h];
	const body = h + 1;
	const bodyEnd = data.length - 1;

	switch (command) {
		case NFC_COMMAND.TAG_PLACED:
		case NFC_COMMAND.TAG_REMOVED: {
			const tag = decodeUid(data, body);
			if (!tag || tag.next !== bodyEnd) return null;
			return {
				kind: command === NFC_COMMAND.TAG_PLACED ? "placed" : "removed",
				uid: tag.uid,
			};
		}
		case NFC_COMMAND.MAPPING_STATE:
			if (bodyEnd - body < 1) return null;
			return { kind: "mapping_state", on: data[body] === 1 };
		case NFC_COMMAND.TAG_MAPPED: {
			const tag = decodeUid(data, body);
			if (!tag || bodyEnd - tag.next < 4) return null;
			const type = data[tag.next];
			const channel = data[tag.next + 1];
			if (!isMessageType(type) || channel < 1 || channel > 16) return null;
			return {
				kind: "mapped",
				uid: tag.uid,
				type,
				channel,
				data1: data[tag.next + 2],
				data2: data[tag.next + 3],
			};
		}
		case NFC_COMMAND.MAPPING_COUNT:
			if (bodyEnd - body < 1) return null;
			return { kind: "count", count: data[body] };
		default:
			return null;
	}
}

/** Translation key of each message type's name, in i18n.nfc.ts. */
export const NFC_TYPE_KEYS: Record<NfcMessageType, keyof typeof nfcEn> = {
	8: "nfc_type_note_off",
	9: "nfc_type_note_on",
	11: "nfc_type_control_change",
	12: "nfc_type_program_change",
};

export type NfcTranslate = (
	key: keyof typeof nfcEn,
	values?: Record<string, string | number>,
) => string;

/** English, for callers without i18next (tests, logs). */
const englishNfc: NfcTranslate = (key, values = {}) =>
	nfcEn[key].replace(/{{(\w+)}}/g, (_, name: string) => String(values[name]));

/** "Note on 60 vel 100 · ch 1", in the language of `t`. */
export function describeNfcMapping(
	m: Omit<NfcMapping, "uid">,
	t: NfcTranslate = englishNfc,
): string {
	const values = {
		type: t(NFC_TYPE_KEYS[m.type]),
		channel: m.channel,
		data1: m.data1,
		data2: m.data2,
	};
	switch (m.type) {
		case 0x8:
		case 0x9:
			return t("nfc_describe_note", values);
		case 0xb:
			return t("nfc_describe_cc", values);
		case 0xc:
			return t("nfc_describe_program", values);
	}
}

export const sameNfcMapping = (a: NfcMapping, b?: NfcMapping) =>
	!!b &&
	a.uid === b.uid &&
	a.type === b.type &&
	a.channel === b.channel &&
	a.data1 === b.data1 &&
	a.data2 === b.data2;

export interface NfcFile {
	kind: "nfc";
	mappings: Array<NfcMapping & { label?: string }>;
}

export function nfcFile(
	mappings: NfcMapping[],
	labels: Record<string, string>,
): NfcFile {
	return {
		kind: "nfc",
		mappings: mappings.map((m) =>
			labels[m.uid] ? { ...m, label: labels[m.uid] } : m,
		),
	};
}

const UID_PATTERN = /^[0-9A-F]{2}( [0-9A-F]{2}){0,9}$/;
const isByte = (v: unknown, min = 0, max = 127): v is number =>
	Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

/** Mappings and labels from a saved file; null when it isn't one. */
export function parseNfcFile(
	json: unknown,
): { mappings: NfcMapping[]; labels: Record<string, string> } | null {
	if (!json || typeof json !== "object") return null;
	const file = json as Partial<NfcFile>;
	if (file.kind !== "nfc" || !Array.isArray(file.mappings)) return null;
	const mappings: NfcMapping[] = [];
	const labels: Record<string, string> = {};
	for (const m of file.mappings) {
		if (
			!m ||
			typeof m.uid !== "string" ||
			!UID_PATTERN.test(m.uid.toUpperCase()) ||
			!isMessageType(m.type) ||
			!isByte(m.channel, 1, 16) ||
			!isByte(m.data1) ||
			!isByte(m.data2)
		)
			return null;
		const uid = m.uid.toUpperCase();
		mappings.push({
			uid,
			type: m.type,
			channel: m.channel,
			data1: m.data1,
			data2: m.data2,
		});
		if (typeof m.label === "string" && m.label) labels[uid] = m.label;
	}
	return { mappings, labels };
}
