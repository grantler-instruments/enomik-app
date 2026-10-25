/**
 * Wraps an async job that always works from the latest state, so it never
 * needs to run once per request: while it runs, any number of requests fold
 * into a single follow-up run. At most one run is in flight, and the last
 * request is always followed by a run that starts after it.
 */
export function coalesce(run: () => Promise<void>) {
	let running = false;
	let again = false;
	return async () => {
		if (running) {
			again = true;
			return;
		}
		running = true;
		try {
			do {
				again = false;
				await run();
			} while (again);
		} finally {
			running = false;
		}
	};
}
