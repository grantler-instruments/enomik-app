export type BrowserName =
	| "chrome"
	| "brave"
	| "edge"
	| "opera"
	| "chromium"
	| "firefox"
	| "safari"
	| "unknown";

declare global {
	interface Navigator {
		brave?: { isBrave: () => Promise<boolean> };
		userAgentData?: {
			brands: { brand: string; version: string }[];
		};
	}
	interface Window {
		opr?: unknown;
	}
}

export function detectBrowser(): BrowserName {
	const ua = navigator.userAgent;
	const brands = navigator.userAgentData?.brands?.map((b) => b.brand) ?? [];

	if (navigator.userAgentData) {
		const isChrome = brands.some((b) => b === "Google Chrome");
		const isBrave = navigator.brave?.isBrave !== undefined;
		const isEdge = brands.some((b) => b === "Microsoft Edge");
		const isOpera = brands.some((b) => b === "Opera") || !!window.opr;

		if (isBrave) return "brave";
		if (isEdge) return "edge";
		if (isOpera) return "opera";
		if (isChrome) return "chrome";
		return "chromium";
	}

	if (ua.includes("Firefox")) return "firefox";
	if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
	if (ua.includes("Edg/")) return "edge";
	if (ua.includes("OPR/") || ua.includes("Opera")) return "opera";
	if (ua.includes("Brave")) return "brave";
	if (ua.includes("Chrome")) return "chromium";

	return "unknown";
}

/** Browser-internal apps manager URL for Chromium-based browsers. */
export function getInstalledAppsPageUrl(
	browser = detectBrowser(),
): string | null {
	switch (browser) {
		case "edge":
			return "edge://apps";
		case "brave":
			return "brave://apps";
		case "opera":
			return "opera://apps";
		case "chrome":
		case "chromium":
			return "chrome://apps";
		default:
			return null;
	}
}

/**
 * Try to open the browser apps page. Web pages usually cannot navigate to
 * chrome:// / edge:// / brave:// URLs, so callers should handle failure
 * (e.g. copy the URL for the user to paste).
 */
export function openInstalledAppsPage(): {
	url: string | null;
	opened: boolean;
} {
	const url = getInstalledAppsPageUrl();
	if (!url) {
		return { url: null, opened: false };
	}

	const popup = window.open(url, "_blank", "noopener,noreferrer");
	const opened = popup != null && !popup.closed;
	return { url, opened };
}
