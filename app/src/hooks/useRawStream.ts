import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supportsLiveValues, useDeviceStore } from "../store/device";
import { type MidiMessage, useMIDIStore } from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_SET_RAW_STREAM,
	ENOMIK_RAW_STREAM_ALL_PINS,
} from "../store/midi.config";
import { useRawStreamStore } from "../store/rawStream";
import { startRawStreamSession } from "../utils/rawStreamSession";
import { useDevice } from "./useDevice";

/** SET_RAW_STREAM for every configured input pin. */
export const sendRawStream = (deviceId: string, enable: boolean) => {
	const info = useDeviceStore.getState().devices[deviceId];
	if (
		enable &&
		(info?.status !== "ready" || !supportsLiveValues(info.version))
	) {
		useRawStreamStore.getState().setActive(false);
		return;
	}
	if (
		!deviceId ||
		deviceId === "-1" ||
		!useMIDIStore
			.getState()
			.outputs.some(
				(out) => out.id === deviceId && out.state !== "disconnected",
			)
	)
		return;
	const msg: MidiMessage = {
		id: uuidv4(),
		type: 240,
		channel: 1,
		// interval 0 = firmware default (50 ms)
		data: buildEnomikSysex(ENOMIK_COMMAND_SET_RAW_STREAM, [
			ENOMIK_RAW_STREAM_ALL_PINS,
			enable ? 1 : 0,
			0,
		]),
		timestamp: Date.now(),
	};
	if (!useMIDIStore.getState().sendMessage(msg, deviceId) && enable) {
		useRawStreamStore.getState().setError("connection");
		useRawStreamStore.getState().setActive(false);
	}
};

/**
 * Runs the raw stream on `device` while the store's `active` flag is set:
 * start + keepalive, stop on toggle off, device change or unmount.
 * Unmounting the caller switches the stream off.
 */
export const useRawStream = (device: string) => {
	const info = useDevice(device);
	const active = useRawStreamStore((state) => state.active);
	const setActive = useRawStreamStore((state) => state.setActive);
	const supported =
		info?.status === "ready" && supportsLiveValues(info.version);
	useEffect(() => {
		if (!active || !useRawStreamStore.getState().active) return;
		if (!supported) {
			setActive(false);
			return;
		}
		const stop = startRawStreamSession(device, (enable) =>
			sendRawStream(device, enable),
		);
		const onPageHide = () => {
			stop();
			setActive(false);
		};
		window.addEventListener("pagehide", onPageHide);
		return () => {
			stop();
			setActive(false);
			window.removeEventListener("pagehide", onPageHide);
		};
	}, [active, device, supported, setActive]);
	useEffect(() => () => setActive(false), [setActive]);
};
