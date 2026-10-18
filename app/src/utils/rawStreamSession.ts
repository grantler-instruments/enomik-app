import { useRawStreamStore } from "../store/rawStream";

/** One bounded attempt; no keepalives until this device acknowledges or sends data. */
export function startRawStreamSession(
	deviceId: string,
	send: (enable: boolean) => void,
) {
	const store = useRawStreamStore.getState();
	store.begin(deviceId);
	const startedAt = Date.now();
	let lastSentAt = startedAt;
	let stopped = false;
	const stop = () => {
		if (stopped) return;
		stopped = true;
		clearInterval(timer);
		unsubscribe();
		if (useRawStreamStore.getState().error !== "unknown_command") send(false);
	};
	const unsubscribe = useRawStreamStore.subscribe((state) => {
		if (!state.active || state.deviceId !== deviceId) stop();
	});
	const timer = setInterval(() => {
		const state = useRawStreamStore.getState();
		if (Date.now() - (state.lastFrameAt ?? startedAt) >= 5000) {
			state.setError(state.confirmed ? "no_readings" : "timeout");
			state.setActive(false);
			return;
		}
		if (state.confirmed && Date.now() - lastSentAt >= 4000) {
			send(true);
			lastSentAt = Date.now();
		}
	}, 500);
	send(true);
	return stop;
}
