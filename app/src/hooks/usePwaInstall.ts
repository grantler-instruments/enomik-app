import { useEffect, useState } from "react";
import { detectBrowser } from "../utils/browser";

const INSTALLED_STORAGE_KEY = "enomik-pwa-installed";
const META_CACHE = "enomik-pwa-meta";
const MARKER_PATH = "__pwa_installed";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface RelatedApplication {
	platform: string;
	url?: string;
	id?: string;
}

function hasRequiredApis(): boolean {
	return "serial" in navigator && "requestMIDIAccess" in navigator;
}

function isStandaloneDisplay(): boolean {
	if (window.matchMedia("(display-mode: standalone)").matches) {
		return true;
	}
	const nav = navigator as Navigator & { standalone?: boolean };
	return nav.standalone === true;
}

function markerUrl(): string {
	const base = import.meta.env.BASE_URL || "/";
	const normalized = base.endsWith("/") ? base : `${base}/`;
	return new URL(`${normalized}${MARKER_PATH}`, window.location.origin).href;
}

function readInstalledFlag(): boolean {
	try {
		return localStorage.getItem(INSTALLED_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}

function writeInstalledFlag(installed: boolean) {
	try {
		if (installed) {
			localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
		} else {
			localStorage.removeItem(INSTALLED_STORAGE_KEY);
		}
	} catch {
		// ignore quota / private mode
	}
}

async function readInstalledMarker(): Promise<boolean> {
	if (!("caches" in window)) return false;
	try {
		const cache = await caches.open(META_CACHE);
		return (await cache.match(markerUrl())) != null;
	} catch {
		return false;
	}
}

async function writeInstalledMarker(installed: boolean) {
	if (!("caches" in window)) return;
	try {
		const cache = await caches.open(META_CACHE);
		const url = markerUrl();
		if (installed) {
			await cache.put(
				url,
				new Response("1", {
					headers: { "Content-Type": "text/plain" },
				}),
			);
		} else {
			await cache.delete(url);
		}
	} catch {
		// ignore
	}
}

async function persistInstalled(installed: boolean) {
	writeInstalledFlag(installed);
	await writeInstalledMarker(installed);
}

async function isRelatedPwaInstalled(): Promise<boolean | null> {
	const nav = navigator as Navigator & {
		getInstalledRelatedApps?: () => Promise<RelatedApplication[]>;
	};
	if (typeof nav.getInstalledRelatedApps !== "function") {
		return null;
	}
	try {
		const apps = await nav.getInstalledRelatedApps();
		return apps.some((app) => app.platform === "webapp");
	} catch {
		return null;
	}
}

function trustsRelatedAppsNegative(): boolean {
	const browser = detectBrowser();
	return browser === "chrome" || browser === "edge";
}

export function usePwaInstall() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [canInstall, setCanInstall] = useState(false);
	const [isInstalled, setIsInstalled] = useState(() =>
		typeof window !== "undefined"
			? isStandaloneDisplay() || readInstalledFlag()
			: false,
	);

	useEffect(() => {
		let cancelled = false;

		const markInstalled = (installed: boolean) => {
			if (cancelled) return;
			void persistInstalled(installed);
			setIsInstalled(installed);
			if (installed) {
				setCanInstall(false);
				setDeferredPrompt(null);
			}
		};

		const refreshInstalledState = async () => {
			if (isStandaloneDisplay()) {
				markInstalled(true);
				return;
			}

			const [related, marker] = await Promise.all([
				isRelatedPwaInstalled(),
				readInstalledMarker(),
			]);
			if (cancelled) return;

			if (related === true || marker || readInstalledFlag()) {
				markInstalled(true);
				return;
			}

			// Brave and others often return [] even when installed. Only trust a
			// negative related-apps result on Chrome/Edge.
			if (related === false && trustsRelatedAppsNegative()) {
				markInstalled(false);
				return;
			}

			setIsInstalled(false);
		};

		void refreshInstalledState();

		const media = window.matchMedia("(display-mode: standalone)");
		const onDisplayModeChange = () => {
			void refreshInstalledState();
		};
		media.addEventListener("change", onDisplayModeChange);

		const onAppInstalled = () => {
			markInstalled(true);
		};
		window.addEventListener("appinstalled", onAppInstalled);

		const onBeforeInstallPrompt = (event: Event) => {
			// Keep the browser's native prompt if we are not going to show ours.
			if (!hasRequiredApis()) return;
			event.preventDefault();
			const promptEvent = event as BeforeInstallPromptEvent;
			markInstalled(false);
			setDeferredPrompt(promptEvent);
			setCanInstall(true);
		};
		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

		const onVisibility = () => {
			if (document.visibilityState === "visible") {
				void refreshInstalledState();
			}
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			cancelled = true;
			media.removeEventListener("change", onDisplayModeChange);
			window.removeEventListener("appinstalled", onAppInstalled);
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	const install = async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const choice = await deferredPrompt.userChoice;
		setDeferredPrompt(null);
		setCanInstall(false);
		if (choice.outcome === "accepted") {
			void persistInstalled(true);
			setIsInstalled(true);
		}
	};

	return { canInstall, isInstalled, install };
}
