import { create } from "zustand";

export type ThresholdUnit = "raw" | "percent";
export interface Firmware {
	major: number;
	minor: number;
	patch?: number;
}
export interface DeviceInfo {
	status: "checking" | "ready" | "timeout" | "incompatible" | "unpaired";
	version?: Firmware;
}

export function isCompatibleFirmware(version?: Firmware): boolean {
	return !!version && version.major === 0;
}

export function supportsInspection(version?: Firmware): boolean {
	return !!version && isCompatibleFirmware(version) && version.minor >= 13;
}

export function supportsGlobals(version?: Firmware): boolean {
	return !!version && isCompatibleFirmware(version) && version.minor >= 14;
}

export function supportsLiveValues(version?: Firmware): boolean {
	return !!version && supportsInspection(version) && version.minor >= 19;
}

export function thresholdUnit(version?: Firmware): ThresholdUnit | undefined {
	if (!isCompatibleFirmware(version)) return undefined;
	return supportsLiveValues(version) ? "percent" : "raw";
}

type Port = { id: string; name?: string | null; state?: string };
const normalizedName = (port: Port) => (port.name ?? "").trim().toLowerCase();
const connected = (port: Port) => port.state !== "disconnected";

/** Never guess between two boards with indistinguishable MIDI port names. */
export function pairedInputId(
	outputId: string,
	inputs: Port[],
	outputs: Port[],
): string | undefined {
	const output = outputs.find(
		(port) => port.id === outputId && connected(port),
	);
	if (!output) return undefined;
	const candidates = (out: Port) => {
		const name = normalizedName(out);
		if (!name) return [];
		const available = inputs.filter(connected);
		const exact = available.filter((port) => normalizedName(port) === name);
		if (exact.length) return exact;
		return available.filter((port) => {
			const other = normalizedName(port);
			return other && (other.startsWith(name) || name.startsWith(other));
		});
	};
	const matches = candidates(output);
	// Some drivers use different product strings for the same board. This
	// fallback is safe only with exactly one enomik input and output present.
	if (matches.length === 0 && /enomik/i.test(output.name ?? "")) {
		const enomikInputs = inputs.filter(
			(port) => connected(port) && /enomik/i.test(port.name ?? ""),
		);
		const enomikOutputs = outputs.filter(
			(port) => connected(port) && /enomik/i.test(port.name ?? ""),
		);
		if (enomikInputs.length === 1 && enomikOutputs.length === 1)
			return enomikInputs[0].id;
	}
	if (matches.length !== 1) return undefined;
	const inputId = matches[0].id;
	return outputs
		.filter(connected)
		.filter((port) => candidates(port).some((input) => input.id === inputId))
		.length === 1
		? inputId
		: undefined;
}

export const useDeviceStore = create<{
	devices: Record<string, DeviceInfo>;
	setDevice: (id: string, info: DeviceInfo) => void;
	removeDevice: (id: string) => void;
}>()((set) => ({
	devices: {},
	setDevice: (id, info) =>
		set((state) => ({ devices: { ...state.devices, [id]: info } })),
	removeDevice: (id) =>
		set((state) => {
			const devices = { ...state.devices };
			delete devices[id];
			return { devices };
		}),
}));
