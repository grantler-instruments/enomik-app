/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { firmwareFileName } from "./firmware";

/**
 * The firmware repo's release bot commits new versions to public/firmware/.
 * Some came without a manifest.json, which broke the uploader with a 404
 * until fixed by hand: these checks fail the bot's commit in CI instead.
 */
const FIRMWARE = join(import.meta.dirname, "../../public/firmware");

/**
 * Binaries a manifest names that never existed. 0.10.5 shipped an S3 Mini
 * client instead of the S2 Mini one: choosing that one in the uploader 404s.
 */
const KNOWN_MISSING: Record<string, string[]> = {
	"0-10-5": ["lolin_s2_mini_client_client.ino.bin"],
};

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

const { versions } = readJson(join(FIRMWARE, "versions.json")) as {
	versions: string[];
};

/** "0-19-0" as numbers, for comparing. */
const parts = (version: string) => version.split("-").map(Number);
const newer = (a: string, b: string) => {
	const [x, y] = [parts(a), parts(b)];
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
	}
	return false;
};

describe("versions.json", () => {
	it("lists versions", () => {
		expect(versions.length).toBeGreaterThan(0);
	});

	it("lists them newest first, once each", () => {
		// The uploader preselects the first one.
		for (let i = 1; i < versions.length; i++) {
			expect(
				newer(versions[i - 1], versions[i]),
				`${versions[i - 1]} before ${versions[i]}`,
			).toBe(true);
		}
	});

	it("lists every version folder", () => {
		const folders = readdirSync(FIRMWARE, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
		expect(folders.filter((f) => !versions.includes(f))).toEqual([]);
	});
});

describe.each(versions)("firmware %s", (version) => {
	const folder = join(FIRMWARE, version);
	const manifestPath = join(folder, "manifest.json");

	it("has a manifest.json", () => {
		expect(existsSync(manifestPath)).toBe(true);
	});

	it("has a binary for every board and role in its manifest", () => {
		if (!existsSync(manifestPath)) return;
		const manifest = readJson(manifestPath) as {
			boards?: { id: string; label: string }[];
			roles?: { label: string; sketch: string }[];
		};
		expect(manifest.boards?.length, "boards").toBeGreaterThan(0);
		expect(manifest.roles?.length, "roles").toBeGreaterThan(0);
		const missing = (manifest.boards ?? []).flatMap((board) =>
			(manifest.roles ?? [])
				.map((role) => firmwareFileName(board.id, role.sketch))
				.filter((file) => !existsSync(join(folder, file))),
		);
		expect(missing).toEqual(KNOWN_MISSING[version] ?? []);
	});
});
