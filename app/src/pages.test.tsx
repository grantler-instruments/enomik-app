/// <reference types="node" />
// @vitest-environment jsdom
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import App from "./App";
import { PAGES } from "./components/tutorial/chapters";
import i18n from "./i18n";

/**
 * Smoke test: every route and every tutorial page renders, in the whole app,
 * without crashing or React errors. Catches broken imports, lazy pages that
 * fail to load and components that throw on mount. No hardware: Web MIDI,
 * Web Serial and audio stay untouched until a button is clicked.
 */

// The service worker module only exists in Vite builds.
vi.mock("virtual:pwa-register/react", () => ({
	useRegisterSW: () => ({
		needRefresh: [false, () => {}],
		offlineReady: [false, () => {}],
		updateServiceWorker: async () => {},
	}),
}));

const PUBLIC = join(import.meta.dirname, "../public");

const ROUTES = [
	"/",
	"/getting-started",
	"/configurator",
	"/inspector",
	"/debugger",
	"/uploader",
	"/tester",
	"/kits",
	"/nfc",
	"/grantulator",
	"/mpc",
	"/does-not-exist",
];

let errors: unknown[][] = [];

beforeAll(async () => {
	await i18n.changeLanguage("en");
	// Browser APIs jsdom lacks, as a desktop browser would answer.
	vi.stubGlobal(
		"matchMedia",
		(query: string) =>
			({
				matches: false,
				media: query,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
			}) as unknown as MediaQueryList,
	);
	Element.prototype.scrollIntoView = () => {};
	// Enough for the MPC's built-in sounds; nothing plays without a click.
	vi.stubGlobal(
		"AudioBuffer",
		class {
			length: number;
			sampleRate: number;
			numberOfChannels: number;
			private channels: Float32Array[];
			constructor(o: {
				length: number;
				sampleRate: number;
				numberOfChannels: number;
			}) {
				this.length = o.length;
				this.sampleRate = o.sampleRate;
				this.numberOfChannels = o.numberOfChannels;
				this.channels = Array.from(
					{ length: o.numberOfChannels },
					() => new Float32Array(o.length),
				);
			}
			get duration() {
				return this.length / this.sampleRate;
			}
			getChannelData(channel: number) {
				return this.channels[channel];
			}
			copyToChannel(source: Float32Array, channel: number) {
				this.channels[channel].set(source);
			}
		},
	);
	// Serve public/ like the dev server does, under the app's base path.
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const path = new URL(String(input), "http://localhost").pathname;
			if (!path.startsWith("/enomik-app/"))
				return new Response("", { status: 404 });
			try {
				const file = path.slice("/enomik-app/".length);
				return new Response(await readFile(join(PUBLIC, file)));
			} catch {
				return new Response("", { status: 404 });
			}
		}),
	);
	vi.spyOn(console, "error").mockImplementation((...args) => {
		errors.push(args);
	});
	vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
	errors = [];
});

afterAll(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const renderAt = (path: string) =>
	render(
		<MemoryRouter initialEntries={[path]}>
			<App />
		</MemoryRouter>,
	);

describe("every route renders", () => {
	it.each(ROUTES)("%s", async (path) => {
		renderAt(path);
		expect(
			await screen.findByRole("heading", { level: 1 }, { timeout: 5000 }),
		).toBeInTheDocument();
		expect(errors.map((e) => e.map(String).join(" ").slice(0, 400))).toEqual(
			[],
		);
	});
});

describe("every tutorial page renders", () => {
	it.each(PAGES.map((page) => page.path))("%s", async (path) => {
		renderAt(path);
		expect(
			await screen.findByRole("heading", { level: 1 }, { timeout: 5000 }),
		).toBeInTheDocument();
		expect(errors.map((e) => e.map(String).join(" ").slice(0, 400))).toEqual(
			[],
		);
	});
});
