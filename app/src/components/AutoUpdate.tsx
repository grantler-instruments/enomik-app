import { useRegisterSW } from "virtual:pwa-register/react";
import { useApplyUpdateWhenSafe } from "../hooks/useApplyUpdateWhenSafe";

/** Browsers only look for a new version on navigation; open tabs check too. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Installs new versions in the background and switches to them when safe. */
function AutoUpdate() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_url, registration) {
			if (registration)
				setInterval(() => void registration.update(), CHECK_INTERVAL_MS);
		},
	});
	useApplyUpdateWhenSafe(needRefresh, () => void updateServiceWorker(true));
	return null;
}

export default AutoUpdate;
