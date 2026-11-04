import { describe, expect, it } from "vitest";
import i18n from "./i18n";

type Strings = Record<string, unknown>;

const resources = i18n.options.resources as Record<
	string,
	{ translation: Strings }
>;
const languages = Object.keys(resources);
const keys = (language: string) =>
	Object.keys(resources[language].translation).sort();

/** Placeholders like {{name}}: a translation must keep them all. */
const placeholders = (value: unknown) =>
	[...JSON.stringify(value).matchAll(/{{\s*(\w+)\s*}}/g)]
		.map((m) => m[1])
		.sort();

describe("translations", () => {
	it("has English", () => {
		expect(languages).toContain("en");
	});

	describe.each(languages.filter((l) => l !== "en"))("%s", (language) => {
		it("has the same keys as English", () => {
			const own = new Set(keys(language));
			const en = new Set(keys("en"));
			expect({
				missing: [...en].filter((k) => !own.has(k)),
				extra: [...own].filter((k) => !en.has(k)),
			}).toEqual({ missing: [], extra: [] });
		});

		it("keeps the placeholders", () => {
			const en = resources.en.translation;
			const translated = resources[language].translation;
			for (const key of keys("en")) {
				if (!(key in translated)) continue;
				expect(placeholders(translated[key]), key).toEqual(
					placeholders(en[key]),
				);
			}
		});

		it("has no empty strings", () => {
			const translated = resources[language].translation;
			const empty = Object.entries(translated)
				.filter(([, v]) => v === "" || (Array.isArray(v) && v.length === 0))
				.map(([k]) => k);
			expect(empty).toEqual([]);
		});
	});
});
