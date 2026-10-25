import { describe, expect, it } from "vitest";
import { coalesce } from "./coalesce";

/** A job that takes until release() and counts its runs. */
function slowJob() {
	let release = () => {};
	const job = {
		runs: 0,
		release: () => release(),
		run: () => {
			job.runs++;
			return new Promise<void>((resolve) => {
				release = resolve;
			});
		},
	};
	return job;
}

const tick = () => new Promise((resolve) => setTimeout(resolve));

describe("coalesce", () => {
	it("folds requests made during a run into one follow-up run", async () => {
		const job = slowJob();
		const request = coalesce(job.run);
		const first = request();
		for (let i = 0; i < 10; i++) void request();
		expect(job.runs).toBe(1);
		job.release();
		await tick();
		expect(job.runs).toBe(2);
		job.release();
		await first;
		expect(job.runs).toBe(2);
	});

	it("runs once per request when they don't overlap", async () => {
		const job = slowJob();
		const request = coalesce(job.run);
		for (let i = 0; i < 3; i++) {
			const done = request();
			job.release();
			await done;
		}
		expect(job.runs).toBe(3);
	});

	it("can run again after a failed run", async () => {
		let fail = true;
		const request = coalesce(async () => {
			if (fail) throw new Error("boom");
		});
		await expect(request()).rejects.toThrow("boom");
		fail = false;
		await expect(request()).resolves.toBeUndefined();
	});
});
