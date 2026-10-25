import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	base: "/enomik-app",
	// Only the lazy grantulator route imports these: pre-bundle them so the
	// dev server doesn't re-optimize (504 Outdated Optimize Dep) on first visit.
	optimizeDeps: {
		include: ["@elemaudio/core", "@elemaudio/web-renderer"],
	},
});
