import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { type MidiMessage, useMIDIStore } from "../store/midi";
import {
	buildEnomikSysex,
	ENOMIK_COMMAND_SET_RAW_STREAM,
	ENOMIK_RAW_STREAM_ALL_PINS,
} from "../store/midi.config";
import { useRawStreamStore } from "../store/rawStream";

/** Firmware stops the stream after 10 s without SysEx from the host. */
const KEEPALIVE_INTERVAL_MS = 4000;

/** SET_RAW_STREAM for every configured input pin. */
export const sendRawStream = (deviceId: string, enable: boolean) => {
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
	useMIDIStore.getState().sendMessage(msg, deviceId);
};

/**
 * Runs the raw stream on `device` while the store's `active` flag is set:
 * start + keepalive, stop on toggle off, device change or unmount.
 * Unmounting the caller switches the stream off.
 */
export const useRawStream = (device: string) => {
	const active = useRawStreamStore((state) => state.active);
	const setActive = useRawStreamStore((state) => state.setActive);

	useEffect(() => {
		if (!active) return;
		sendRawStream(device, true);
		const timer = setInterval(
			() => sendRawStream(device, true),
			KEEPALIVE_INTERVAL_MS,
		);
		return () => {
			clearInterval(timer);
			sendRawStream(device, false);
		};
	}, [active, device]);

	// Closing or reloading the page unmounts nothing: stop the stream explicitly.
	useEffect(() => {
		if (!active) return;
		const stop = () => sendRawStream(device, false);
		window.addEventListener("pagehide", stop);
		return () => window.removeEventListener("pagehide", stop);
	}, [active, device]);

	// Leaving the page (Inspector, Configurator) switches the stream off.
	useEffect(() => () => setActive(false), [setActive]);
};
