import { useEffect } from "react";
import { pairedInputId, useDeviceStore } from "../store/device";
import { inspectDeviceVersion, useMIDIStore } from "../store/midi";

export function useDevice(deviceId: string) {
	const inputs = useMIDIStore((state) => state.inputs);
	const outputs = useMIDIStore((state) => state.outputs);
	const inputId = pairedInputId(deviceId, inputs, outputs);
	const info = useDeviceStore((state) => state.devices[deviceId]);
	useEffect(() => {
		if (!inputId && info?.status === "unpaired") return;
		if (
			outputs.some(
				(port) => port.id === deviceId && port.state !== "disconnected",
			)
		) {
			inspectDeviceVersion(deviceId);
		}
	}, [deviceId, inputId, outputs, info?.status]);
	return info;
}
