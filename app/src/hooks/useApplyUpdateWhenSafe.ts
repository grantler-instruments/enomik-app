import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSerialStore } from "../store/serial";

/** A reload now would cut a firmware upload or an open serial session. */
export const isBusy = () => {
	const { isFlashing, isConnected } = useSerialStore.getState();
	return isFlashing || isConnected;
};

/**
 * Once a new version is waiting, applies it (activate and reload) at the next
 * moment the user won't notice: a route change or the tab going hidden. Never
 * while the serial port is in use; it retries on the next such moment.
 */
export const useApplyUpdateWhenSafe = (
	needRefresh: boolean,
	apply: () => void,
) => {
	const { pathname } = useLocation();
	const lastPath = useRef(pathname);
	const applied = useRef(false);

	const tryApply = useRef(() => {});
	tryApply.current = () => {
		if (!needRefresh || applied.current || isBusy()) return;
		applied.current = true;
		apply();
	};

	useEffect(() => {
		if (pathname === lastPath.current) return;
		lastPath.current = pathname;
		tryApply.current();
	}, [pathname]);

	useEffect(() => {
		const onVisibility = () => {
			if (document.visibilityState === "hidden") tryApply.current();
		};
		document.addEventListener("visibilitychange", onVisibility);
		return () => document.removeEventListener("visibilitychange", onVisibility);
	}, []);
};
