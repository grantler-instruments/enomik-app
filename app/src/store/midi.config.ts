const MIDI_NOTE_OFF = 0x80;
const MIDI_NOTE_ON = 0x90;
const MIDI_POLY_AFTERTOUCH = 0xa0;
const MIDI_CONTROL_CHANGE = 0xb0;
const MIDI_PROGRAM_CHANGE = 0xc0;
const MIDI_CHANNEL_AFTERTOUCH = 0xd0;
const MIDI_PITCH_BEND = 0xe0;
const MIDI_SYSEX_START = 0xf0;
const MIDI_MIDI_TIME_CODE = 0xf1;
const MIDI_SONG_POSITION_POINTER = 0xf2;
const MIDI_SONG_SELECT = 0xf3;
const MIDI_TUNE_REQUEST = 0xf6;
const MIDI_SYSEX_END = 0xf7;
const MIDI_TIMING_CLOCK = 0xf8;
const MIDI_START = 0xfa;
const MIDI_CONTINUE = 0xfb;
const MIDI_STOP = 0xfc;
const MIDI_ACTIVE_SENSING = 0xfe;
const MIDI_SYSTEM_RESET = 0xff;

const sysexManufacturerId = 0x7d;
const sysexStart = 0xf0;
const sysexEnd = 0xf7;
const sysexInput = 0x01;
const sysexOutput = 0x02;
const sysexPinModeDigitalIn = 0x00;
const sysexPinModeDigitalOut = 0x01;
const sysexPinModeDigitalInPullup = 0x02;
const sysexPinModeAnalogIn = 0x03;
const sysexPinModePWMOut = 0x04;
const sysexPinModeTouch = 0x05;

/** Keep in sync with ESP-NOW-MIDI version.h */
const ESP_NOW_VERSION_MAJOR = 0;
const ESP_NOW_VERSION_MINOR = 19;

/** Enomik SysEx request commands (enomik::SysExCommand) */
const ENOMIK_COMMAND_SET_PIN_CONFIG = 0x01;
const ENOMIK_COMMAND_GET_PIN_CONFIG = 0x02;
const ENOMIK_COMMAND_CLEAR_PIN_CONFIGS = 0x03;
const ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS = 0x04;
const ENOMIK_COMMAND_DELETE_PIN_CONFIG = 0x05;
const ENOMIK_COMMAND_GET_MAC = 0x06;
const ENOMIK_COMMAND_ADD_PEER = 0x07;
const ENOMIK_COMMAND_GET_ALL_PEERS = 0x08;
const ENOMIK_COMMAND_RESET = 0x09;
const ENOMIK_COMMAND_GET_VERSION = 0x0a;
const ENOMIK_COMMAND_GET_PEER = 0x0b;
const ENOMIK_COMMAND_GET_CONFIG = 0x0c;
const ENOMIK_COMMAND_SET_MIDI_LOOPBACK = 0x0d;
const ENOMIK_COMMAND_GET_MIDI_LOOPBACK = 0x0e;
const ENOMIK_COMMAND_SET_POWER_SAVE = 0x0f;
const ENOMIK_COMMAND_GET_POWER_SAVE = 0x10;
const ENOMIK_COMMAND_SET_NAME = 0x11;
const ENOMIK_COMMAND_GET_NAME = 0x12;
const ENOMIK_COMMAND_SET_RAW_STREAM = 0x16;
/** Notification, never answered: live reading of an input pin (device → host). */
const ENOMIK_COMMAND_RAW_VALUE = 0x17;
const ENOMIK_COMMAND_GET_FEATURES = 0x18;
const ENOMIK_COMMAND_SET_FEATURE_CONFIG = 0x19;
const ENOMIK_COMMAND_GET_FEATURE_SETTINGS = 0x1a;

/** Success responses = request + 0x40 */
const ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE = 0x41;
const ENOMIK_COMMAND_GET_PIN_CONFIG_RESPONSE = 0x42;
const ENOMIK_COMMAND_CLEAR_PIN_CONFIGS_RESPONSE = 0x43;
const ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS_RESPONSE = 0x44;
const ENOMIK_COMMAND_DELETE_PIN_CONFIG_RESPONSE = 0x45;
const ENOMIK_COMMAND_GET_MAC_RESPONSE = 0x46;
const ENOMIK_COMMAND_ADD_PEER_RESPONSE = 0x47;
const ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE = 0x48;
const ENOMIK_COMMAND_RESET_RESPONSE = 0x49;
const ENOMIK_COMMAND_GET_VERSION_RESPONSE = 0x4a;
const ENOMIK_COMMAND_GET_PEER_RESPONSE = 0x4b;
const ENOMIK_COMMAND_GET_CONFIG_RESPONSE = 0x4c;
const ENOMIK_COMMAND_SET_MIDI_LOOPBACK_RESPONSE = 0x4d;
const ENOMIK_COMMAND_GET_MIDI_LOOPBACK_RESPONSE = 0x4e;
const ENOMIK_COMMAND_SET_POWER_SAVE_RESPONSE = 0x4f;
const ENOMIK_COMMAND_GET_POWER_SAVE_RESPONSE = 0x50;
const ENOMIK_COMMAND_SET_NAME_RESPONSE = 0x51;
const ENOMIK_COMMAND_GET_NAME_RESPONSE = 0x52;
const ENOMIK_COMMAND_SET_RAW_STREAM_RESPONSE = 0x56;
const ENOMIK_COMMAND_GET_FEATURES_RESPONSE = 0x58;
const ENOMIK_COMMAND_SET_FEATURE_CONFIG_RESPONSE = 0x59;
const ENOMIK_COMMAND_GET_FEATURE_SETTINGS_RESPONSE = 0x5a;
const ENOMIK_COMMAND_ERROR_RESPONSE = 0x7f;

const ENOMIK_PEER_ENTRY_PAYLOAD_SIZE = 13; // index + 12 MAC nibbles
const ENOMIK_PIN_CONFIG_PAYLOAD_SIZE = 8;
/** pin + mode + raw/baseline/peak (5 septets each) + percent + norm + threshold + active */
const ENOMIK_RAW_VALUE_PAYLOAD_SIZE = 21;
/** SET_RAW_STREAM pin value that selects every configured input pin. */
const ENOMIK_RAW_STREAM_ALL_PINS = 0x7f;

/** Client name: printable ASCII (0x20–0x7E), sent as raw 7-bit SysEx bytes. */
const ENOMIK_MAX_NAME_LENGTH = 16;
const ENOMIK_MAX_FEATURE_SETTINGS = 4;
const ENOMIK_FEATURE_CONFIG_PAYLOAD_SIZE = 46;

export type FeatureDirection = 1 | 2;
export type FeatureMappingMode = 0 | 1 | 2;
export type FeatureSettingType = 0 | 1 | 2;
export type FeatureSettingRole = 0 | 1 | 2;

export interface FeatureDescriptor {
	id: number;
	moduleId: number;
	direction: FeatureDirection;
	scale: number;
	minValue: number;
	maxValue: number;
	mappingModes: number;
	moduleName: string;
	name: string;
	unit: string;
}

export interface FeatureSettingDescriptor {
	id: number;
	type: FeatureSettingType;
	role: FeatureSettingRole;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	optionCount: number;
	name: string;
	unit: string;
	options: string[];
}

export interface FeatureSettingInfo {
	featureId: number;
	descriptor: FeatureSettingDescriptor;
	value: number;
}

export interface FeatureSettingValue {
	id: number;
	value: number;
}

export interface FeatureConfig {
	featureId: number;
	enabled: boolean;
	mode: FeatureMappingMode;
	midiChannel: number;
	midiType: number;
	midiNumber: number;
	midiMin: number;
	midiMax: number;
	threshold: number;
	hysteresis: number;
	settings: FeatureSettingValue[];
}

export interface FeatureInfo {
	descriptor: FeatureDescriptor;
	config: FeatureConfig;
	hasConfig: boolean;
}

function encodeSeptets32(value: number): number[] {
	let remaining = value >>> 0;
	const out = [0, 0, 0, 0, 0];
	for (let i = out.length - 1; i >= 0; i--) {
		out[i] = remaining & 0x7f;
		remaining >>>= 7;
	}
	return out;
}

function decodeSignedSeptets32(
	bytes: ArrayLike<number>,
	offset: number,
): number {
	return decodeSeptets32(bytes, offset) | 0;
}

function encodeFeatureId(id: number): number[] {
	return [(id >> 7) & 0x7f, id & 0x7f];
}

function decodeFeatureId(bytes: ArrayLike<number>, offset: number): number {
	return ((bytes[offset] & 0x7f) << 7) | (bytes[offset + 1] & 0x7f);
}

function encodeFeatureConfigPayload(config: FeatureConfig): number[] {
	const settings = config.settings.slice(0, ENOMIK_MAX_FEATURE_SETTINGS);
	const payload = [
		...encodeFeatureId(config.featureId),
		config.enabled ? 1 : 0,
		config.mode,
		config.midiChannel,
		config.midiType / 2,
		config.midiNumber & 0x7f,
		(config.midiMin >> 7) & 0x7f,
		config.midiMin & 0x7f,
		(config.midiMax >> 7) & 0x7f,
		config.midiMax & 0x7f,
		...encodeSeptets32(config.threshold),
		...encodeSeptets32(config.hysteresis),
		settings.length,
	];
	for (let i = 0; i < ENOMIK_MAX_FEATURE_SETTINGS; i++) {
		const setting = settings[i];
		payload.push(setting?.id ?? 0, ...encodeSeptets32(setting?.value ?? 0));
	}
	return payload;
}

function decodeFeatureConfigPayload(
	payload: ArrayLike<number>,
): FeatureConfig | null {
	if (payload.length !== ENOMIK_FEATURE_CONFIG_PAYLOAD_SIZE) return null;
	const bytes = Array.from(payload);
	if (bytes.some((byte) => byte < 0 || byte > 0x7f)) return null;
	const featureId = decodeFeatureId(bytes, 0);
	const enabled = bytes[2];
	const mode = bytes[3];
	const midiChannel = bytes[4];
	const midiType = bytes[5] * 2;
	const midiNumber = bytes[6];
	const midiMin = (bytes[7] << 7) | bytes[8];
	const midiMax = (bytes[9] << 7) | bytes[10];
	const threshold = decodeSignedSeptets32(bytes, 11);
	const hysteresis = decodeSeptets32(bytes, 16);
	const settingCount = bytes[21];
	if (
		enabled > 1 ||
		mode > 2 ||
		midiChannel < 1 ||
		midiChannel > 16 ||
		![MIDI_NOTE_ON, MIDI_CONTROL_CHANGE, MIDI_PITCH_BEND].includes(midiType) ||
		settingCount > ENOMIK_MAX_FEATURE_SETTINGS
	)
		return null;
	const settings: FeatureSettingValue[] = [];
	let offset = 22;
	for (let i = 0; i < ENOMIK_MAX_FEATURE_SETTINGS; i++) {
		const id = bytes[offset++];
		const value = decodeSignedSeptets32(bytes, offset);
		offset += 5;
		if (i < settingCount) settings.push({ id, value });
		else if (id !== 0 || value !== 0) return null;
	}
	return {
		featureId,
		enabled: enabled !== 0,
		mode: mode as FeatureMappingMode,
		midiChannel,
		midiType,
		midiNumber,
		midiMin,
		midiMax,
		threshold,
		hysteresis,
		settings,
	};
}

function readFeatureText(
	bytes: number[],
	cursor: { value: number },
	maxLength: number,
) {
	if (cursor.value >= bytes.length) return null;
	const length = bytes[cursor.value++];
	if (length > maxLength || cursor.value + length > bytes.length) return null;
	const chars = bytes.slice(cursor.value, cursor.value + length);
	if (chars.some((byte) => byte < 0x20 || byte > 0x7e)) return null;
	cursor.value += length;
	return String.fromCharCode(...chars);
}

function decodeFeatureInfo(payload: ArrayLike<number>): FeatureInfo | null {
	const bytes = Array.from(payload);
	if (bytes.length < 23 || bytes.some((byte) => byte < 0 || byte > 0x7f))
		return null;
	const cursor = { value: 0 };
	const id = decodeFeatureId(bytes, cursor.value);
	cursor.value += 2;
	const moduleId = decodeFeatureId(bytes, cursor.value);
	cursor.value += 2;
	const direction = bytes[cursor.value++];
	const scale = bytes[cursor.value++];
	const minValue = decodeSignedSeptets32(bytes, cursor.value);
	cursor.value += 5;
	const maxValue = decodeSignedSeptets32(bytes, cursor.value);
	cursor.value += 5;
	const mappingModes = bytes[cursor.value++];
	const moduleName = readFeatureText(bytes, cursor, 16);
	const name = readFeatureText(bytes, cursor, 16);
	const unit = readFeatureText(bytes, cursor, 8);
	if (
		moduleName === null ||
		name === null ||
		unit === null ||
		cursor.value >= bytes.length ||
		(direction !== 1 && direction !== 2) ||
		scale > 9 ||
		minValue > maxValue
	)
		return null;
	const hasConfig = bytes[cursor.value++];
	if (hasConfig > 1) return null;
	let config: FeatureConfig = {
		featureId: id,
		enabled: false,
		mode: 0,
		midiChannel: 1,
		midiType: MIDI_CONTROL_CHANGE,
		midiNumber: 0,
		midiMin: 0,
		midiMax: 127,
		threshold: 0,
		hysteresis: 0,
		settings: [],
	};
	if (hasConfig) {
		const decoded = decodeFeatureConfigPayload(bytes.slice(cursor.value));
		if (!decoded || decoded.featureId !== id) return null;
		config = decoded;
		cursor.value += ENOMIK_FEATURE_CONFIG_PAYLOAD_SIZE;
	}
	if (cursor.value !== bytes.length) return null;
	return {
		descriptor: {
			id,
			moduleId,
			direction: direction as FeatureDirection,
			scale,
			minValue,
			maxValue,
			mappingModes,
			moduleName,
			name,
			unit,
		},
		config,
		hasConfig: hasConfig !== 0,
	};
}

function decodeFeatureSettingInfo(
	payload: ArrayLike<number>,
): FeatureSettingInfo | null {
	const bytes = Array.from(payload);
	if (bytes.length < 27 || bytes.some((byte) => byte < 0 || byte > 0x7f))
		return null;
	const cursor = { value: 0 };
	const featureId = decodeFeatureId(bytes, cursor.value);
	cursor.value += 2;
	const id = bytes[cursor.value++];
	const type = bytes[cursor.value++];
	const role = bytes[cursor.value++];
	const minValue = decodeSignedSeptets32(bytes, cursor.value);
	cursor.value += 5;
	const maxValue = decodeSignedSeptets32(bytes, cursor.value);
	cursor.value += 5;
	const defaultValue = decodeSignedSeptets32(bytes, cursor.value);
	cursor.value += 5;
	const value = decodeSignedSeptets32(bytes, cursor.value);
	cursor.value += 5;
	const name = readFeatureText(bytes, cursor, 16);
	const unit = readFeatureText(bytes, cursor, 8);
	if (
		name === null ||
		unit === null ||
		cursor.value >= bytes.length ||
		type > 2 ||
		role > 2 ||
		minValue > maxValue ||
		value < minValue ||
		value > maxValue
	)
		return null;
	const optionCount = bytes[cursor.value++];
	if (optionCount > 4) return null;
	const options: string[] = [];
	for (let i = 0; i < optionCount; i++) {
		const option = readFeatureText(bytes, cursor, 8);
		if (option === null) return null;
		options.push(option);
	}
	if (cursor.value !== bytes.length) return null;
	return {
		featureId,
		value,
		descriptor: {
			id,
			type: type as FeatureSettingType,
			role: role as FeatureSettingRole,
			minValue,
			maxValue,
			defaultValue,
			optionCount,
			name,
			unit,
			options,
		},
	};
}

/** Drop characters the firmware rejects and cap at ENOMIK_MAX_NAME_LENGTH. */
function sanitizeClientName(name: string): string {
	return name.replace(/[^\x20-\x7e]/g, "").slice(0, ENOMIK_MAX_NAME_LENGTH);
}

const ENOMIK_ERROR_BAD_VERSION = 0x01;
const ENOMIK_ERROR_UNKNOWN_COMMAND = 0x02;
const ENOMIK_ERROR_DECODE_FAILED = 0x03;
const ENOMIK_ERROR_PIN_NOT_FOUND = 0x04;
const ENOMIK_ERROR_NOT_READY = 0x05;
const ENOMIK_ERROR_OPERATION_FAILED = 0x06;
const ENOMIK_ERROR_PEER_NOT_FOUND = 0x07;
const ENOMIK_ERROR_PEER_TABLE_FULL = 0x08;
const ENOMIK_ERROR_PEER_ALREADY_EXISTS = 0x09;
const ENOMIK_ERROR_FEATURE_NOT_FOUND = 0x0a;
const ENOMIK_ERROR_INVALID_FEATURE_CONFIG = 0x0b;

const ENOMIK_ERROR_NAMES: Record<number, string> = {
	[ENOMIK_ERROR_BAD_VERSION]: "bad_version",
	[ENOMIK_ERROR_UNKNOWN_COMMAND]: "unknown_command",
	[ENOMIK_ERROR_DECODE_FAILED]: "decode_failed",
	[ENOMIK_ERROR_PIN_NOT_FOUND]: "pin_not_found",
	[ENOMIK_ERROR_NOT_READY]: "not_ready",
	[ENOMIK_ERROR_OPERATION_FAILED]: "operation_failed",
	[ENOMIK_ERROR_PEER_NOT_FOUND]: "peer_not_found",
	[ENOMIK_ERROR_PEER_TABLE_FULL]: "peer_table_full",
	[ENOMIK_ERROR_PEER_ALREADY_EXISTS]: "peer_already_exists",
	[ENOMIK_ERROR_FEATURE_NOT_FOUND]: "feature_not_found",
	[ENOMIK_ERROR_INVALID_FEATURE_CONFIG]: "invalid_feature_config",
};

/** Build a full enomik SysEx packet including F0/F7. */
function buildEnomikSysex(command: number, payload: number[] = []): number[] {
	return [
		sysexStart,
		sysexManufacturerId,
		ESP_NOW_VERSION_MAJOR,
		ESP_NOW_VERSION_MINOR,
		command,
		...payload,
		sysexEnd,
	];
}

function buildFeatureConfig(config: FeatureConfig): number[] {
	return buildEnomikSysex(
		ENOMIK_COMMAND_SET_FEATURE_CONFIG,
		encodeFeatureConfigPayload(config),
	);
}

function buildFeatureSettingsRequest(featureId: number): number[] {
	return buildEnomikSysex(
		ENOMIK_COMMAND_GET_FEATURE_SETTINGS,
		encodeFeatureId(featureId),
	);
}

/** Decode 12 MAC nibbles (each 0–15) into a colon-separated MAC string. */
function nibblesToMacString(nibbles: ArrayLike<number>): string {
	const macBytes: number[] = [];
	for (let j = 0; j < 12; j += 2) {
		macBytes.push(((nibbles[j] & 0x0f) << 4) | (nibbles[j + 1] & 0x0f));
	}
	return macBytes
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(":")
		.toUpperCase();
}

/** Decode a 32-bit value sent as 5 septets, most significant first. */
function decodeSeptets32(bytes: ArrayLike<number>, offset: number): number {
	let value = 0;
	for (let i = 0; i < 5; i++) {
		value = (value * 128 + (bytes[offset + i] & 0x7f)) >>> 0;
	}
	return value;
}

function isOutputPinMode(mode: number): boolean {
	return mode === sysexPinModeDigitalOut || mode === sysexPinModePWMOut;
}

export {
	buildEnomikSysex,
	buildFeatureConfig,
	buildFeatureSettingsRequest,
	decodeFeatureConfigPayload,
	decodeFeatureInfo,
	decodeFeatureSettingInfo,
	decodeSeptets32,
	ENOMIK_COMMAND_ADD_PEER,
	ENOMIK_COMMAND_ADD_PEER_RESPONSE,
	ENOMIK_COMMAND_CLEAR_PIN_CONFIGS,
	ENOMIK_COMMAND_CLEAR_PIN_CONFIGS_RESPONSE,
	ENOMIK_COMMAND_DELETE_PIN_CONFIG,
	ENOMIK_COMMAND_DELETE_PIN_CONFIG_RESPONSE,
	ENOMIK_COMMAND_ERROR_RESPONSE,
	ENOMIK_COMMAND_GET_ALL_PEERS,
	ENOMIK_COMMAND_GET_ALL_PEERS_RESPONSE,
	ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS,
	ENOMIK_COMMAND_GET_ALL_PIN_CONFIGS_RESPONSE,
	ENOMIK_COMMAND_GET_CONFIG,
	ENOMIK_COMMAND_GET_CONFIG_RESPONSE,
	ENOMIK_COMMAND_GET_FEATURE_SETTINGS,
	ENOMIK_COMMAND_GET_FEATURE_SETTINGS_RESPONSE,
	ENOMIK_COMMAND_GET_FEATURES,
	ENOMIK_COMMAND_GET_FEATURES_RESPONSE,
	ENOMIK_COMMAND_GET_MAC,
	ENOMIK_COMMAND_GET_MAC_RESPONSE,
	ENOMIK_COMMAND_GET_MIDI_LOOPBACK,
	ENOMIK_COMMAND_GET_MIDI_LOOPBACK_RESPONSE,
	ENOMIK_COMMAND_GET_NAME,
	ENOMIK_COMMAND_GET_NAME_RESPONSE,
	ENOMIK_COMMAND_GET_PEER,
	ENOMIK_COMMAND_GET_PEER_RESPONSE,
	ENOMIK_COMMAND_GET_PIN_CONFIG,
	ENOMIK_COMMAND_GET_PIN_CONFIG_RESPONSE,
	ENOMIK_COMMAND_GET_POWER_SAVE,
	ENOMIK_COMMAND_GET_POWER_SAVE_RESPONSE,
	ENOMIK_COMMAND_GET_VERSION,
	ENOMIK_COMMAND_GET_VERSION_RESPONSE,
	ENOMIK_COMMAND_RAW_VALUE,
	ENOMIK_COMMAND_RESET,
	ENOMIK_COMMAND_RESET_RESPONSE,
	ENOMIK_COMMAND_SET_FEATURE_CONFIG,
	ENOMIK_COMMAND_SET_FEATURE_CONFIG_RESPONSE,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK,
	ENOMIK_COMMAND_SET_MIDI_LOOPBACK_RESPONSE,
	ENOMIK_COMMAND_SET_NAME,
	ENOMIK_COMMAND_SET_NAME_RESPONSE,
	ENOMIK_COMMAND_SET_PIN_CONFIG,
	ENOMIK_COMMAND_SET_PIN_CONFIG_RESPONSE,
	ENOMIK_COMMAND_SET_POWER_SAVE,
	ENOMIK_COMMAND_SET_POWER_SAVE_RESPONSE,
	ENOMIK_COMMAND_SET_RAW_STREAM,
	ENOMIK_COMMAND_SET_RAW_STREAM_RESPONSE,
	ENOMIK_ERROR_FEATURE_NOT_FOUND,
	ENOMIK_ERROR_INVALID_FEATURE_CONFIG,
	ENOMIK_ERROR_NAMES,
	ENOMIK_ERROR_NOT_READY,
	ENOMIK_ERROR_PEER_ALREADY_EXISTS,
	ENOMIK_ERROR_UNKNOWN_COMMAND,
	ENOMIK_MAX_NAME_LENGTH,
	ENOMIK_PEER_ENTRY_PAYLOAD_SIZE,
	ENOMIK_PIN_CONFIG_PAYLOAD_SIZE,
	ENOMIK_RAW_STREAM_ALL_PINS,
	ENOMIK_RAW_VALUE_PAYLOAD_SIZE,
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
	isOutputPinMode,
	MIDI_ACTIVE_SENSING,
	MIDI_CHANNEL_AFTERTOUCH,
	MIDI_CONTINUE,
	MIDI_CONTROL_CHANGE,
	MIDI_MIDI_TIME_CODE,
	MIDI_NOTE_OFF,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
	MIDI_POLY_AFTERTOUCH,
	MIDI_PROGRAM_CHANGE,
	MIDI_SONG_POSITION_POINTER,
	MIDI_SONG_SELECT,
	MIDI_START,
	MIDI_STOP,
	MIDI_SYSEX_END,
	MIDI_SYSEX_START,
	MIDI_SYSTEM_RESET,
	MIDI_TIMING_CLOCK,
	MIDI_TUNE_REQUEST,
	nibblesToMacString,
	sanitizeClientName,
	sysexEnd,
	sysexInput,
	sysexManufacturerId,
	sysexOutput,
	sysexPinModeAnalogIn,
	sysexPinModeDigitalIn,
	sysexPinModeDigitalInPullup,
	sysexPinModeDigitalOut,
	sysexPinModePWMOut,
	sysexPinModeTouch,
	sysexStart,
};

const MIDI_TYPE_LABELS: Record<number, string> = {
	[MIDI_CONTROL_CHANGE]: "Control Change",
	[MIDI_NOTE_ON]: "Note On",
	[MIDI_PITCH_BEND]: "Pitch Bend",
	[MIDI_PROGRAM_CHANGE]: "Program Change",
	[MIDI_POLY_AFTERTOUCH]: "Aftertouch",
};

export { MIDI_TYPE_LABELS };
