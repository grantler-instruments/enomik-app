/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			// New versions wait until AutoUpdate applies them at a safe moment
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
	test: {
		// Environment stays node; component tests opt into jsdom per file.
		setupFiles: ["./src/test/setup.ts"],
		// npm run coverage: report in coverage/ (open index.html).
		coverage: {
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/types/**"],
			reporter: ["text-summary", "html"],
		},
	},
	// Only the lazy grantulator route imports these: pre-bundle them so the
	// dev server doesn't re-optimize (504 Outdated Optimize Dep) on first visit.
	optimizeDeps: {
		include: ["@elemaudio/core", "@elemaudio/web-renderer"],
	},
});
