import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "prompt",
			// Keep the hand-written public/manifest.webmanifest
			manifest: false,
			// Register the service worker in dev too, so the app is installable there
			devOptions: { enabled: true },
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
				// Firmware is ~300MB: never precache it, always hit the network
				globIgnores: ["firmware/**", "samples/**"],
				navigateFallback: "/enomik-app/index.html",
				cleanupOutdatedCaches: true,
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.includes("/samples/"),
						handler: "CacheFirst",
						options: { cacheName: "enomik-samples" },
					},
				],
			},
		}),
	],
	base: "/enomik-app",
	// Only the lazy grantulator route imports these: pre-bundle them so the
	// dev server doesn't re-optimize (504 Outdated Optimize Dep) on first visit.
	optimizeDeps: {
		include: ["@elemaudio/core", "@elemaudio/web-renderer"],
	},
});
