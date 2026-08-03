/* Minimal service worker: installable PWA shell, no firmware precache. */
const CACHE_NAME = "enomik-shell-v1";
const META_CACHE = "enomik-pwa-meta";
const PRECACHE_URLS = [
	"/enomik-app/",
	"/enomik-app/index.html",
	"/enomik-app/favicon.svg",
	"/enomik-app/icons/icon-192.png",
	"/enomik-app/icons/icon-512.png",
	"/enomik-app/manifest.webmanifest",
];

function isFirmwareRequest(url) {
	return url.pathname.includes("/firmware/");
}

function isSameOriginShell(url) {
	return (
		url.origin === self.location.origin &&
		url.pathname.startsWith("/enomik-app/") &&
		!isFirmwareRequest(url)
	);
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME && key !== META_CACHE)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (!isSameOriginShell(url)) return;

	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok) {
					const copy = response.clone();
					void caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(request, copy));
				}
				return response;
			})
			.catch(() =>
				caches
					.match(request)
					.then((cached) => cached || caches.match("/enomik-app/index.html")),
			),
	);
});
