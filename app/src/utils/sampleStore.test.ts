import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { loadSample, saveSample } from "./sampleStore";

const bytes = (...values: number[]) => new Uint8Array(values).buffer;

describe("sampleStore", () => {
	beforeEach(() => {
		// A fresh, empty database for each test.
		globalThis.indexedDB = new IDBFactory();
	});

	it("has nothing before the first save", async () => {
		await expect(loadSample()).resolves.toBeUndefined();
	});

	it("gives back the saved name and bytes", async () => {
		await saveSample({ name: "tone.wav", data: bytes(1, 2, 3) });
		const stored = await loadSample();
		expect(stored?.name).toBe("tone.wav");
		expect([...new Uint8Array(stored?.data ?? bytes())]).toEqual([1, 2, 3]);
	});

	it("keeps only the last saved sample", async () => {
		await saveSample({ name: "a.wav", data: bytes(1) });
		await saveSample({ name: "b.wav", data: bytes(2, 2) });
		const stored = await loadSample();
		expect(stored?.name).toBe("b.wav");
		expect(stored?.data.byteLength).toBe(2);
	});

	it("rejects when the database can't be opened", async () => {
		const request = {
			error: new DOMException("blocked", "SecurityError"),
		} as IDBOpenDBRequest;
		globalThis.indexedDB = {
			open: () => {
				setTimeout(() => request.onerror?.(new Event("error")));
				return request;
			},
		} as unknown as IDBFactory;
		await expect(loadSample()).rejects.toThrow("blocked");
		await expect(saveSample({ name: "a.wav", data: bytes() })).rejects.toThrow(
			"blocked",
		);
	});
});
