import { useEffect, useState } from "react";
import { type BoardInfo, type Port, readBoardInfo } from "../../utils/tester";

/** null while reading. */
export type BoardInfoState = BoardInfo | null;

/** MAC and firmware version, read again whenever the port changes. */
export function useBoardInfo(port: Port | null): BoardInfoState {
	const [read, setRead] = useState<{ port: Port; info: BoardInfo } | null>(
		null,
	);
	useEffect(() => {
		if (!port) return;
		let cancelled = false;
		readBoardInfo(port)
			// e.g. the port disconnected while sending
			.catch((): BoardInfo => ({ mac: null, version: null }))
			.then((info) => {
				if (!cancelled) setRead({ port, info });
			});
		return () => {
			cancelled = true;
		};
	}, [port]);
	return read?.port === port ? read.info : null;
}
