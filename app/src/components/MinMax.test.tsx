// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/render";
import MinMax from "./MinMax";

/** Parent that owns the values, like PinRow writing them to the store. */
const Controlled = ({
	bitResolution,
	onChangeMin,
	onChangeMax,
	initial = [0, 127],
}: {
	bitResolution?: 7 | 14;
	onChangeMin: (value: number) => void;
	onChangeMax: (value: number) => void;
	initial?: [number, number];
}) => {
	const [min, setMin] = useState(initial[0]);
	const [max, setMax] = useState(initial[1]);
	return (
		<MinMax
			min={min}
			max={max}
			bitResolution={bitResolution}
			onChangeMin={(value) => {
				setMin(value);
				onChangeMin(value);
			}}
			onChangeMax={(value) => {
				setMax(value);
				onChangeMax(value);
			}}
		/>
	);
};

const setup = (props: Partial<Parameters<typeof Controlled>[0]> = {}) => {
	const onChangeMin = vi.fn();
	const onChangeMax = vi.fn();
	renderWithProviders(
		<Controlled
			onChangeMin={onChangeMin}
			onChangeMax={onChangeMax}
			{...props}
		/>,
	);
	return {
		user: userEvent.setup(),
		onChangeMin,
		onChangeMax,
		min: () => screen.getByRole("textbox", { name: "Min" }),
		max: () => screen.getByRole("textbox", { name: "Max" }),
	};
};

/** Replace the field's text, then leave it. */
const typeAndBlur = async (
	user: ReturnType<typeof userEvent.setup>,
	field: HTMLElement,
	text: string,
) => {
	await user.clear(field);
	if (text) await user.type(field, text);
	await user.tab();
};

describe("MinMax", () => {
	it("reports nothing while typing, only on blur", async () => {
		const { user, min, onChangeMin } = setup();
		await user.clear(min());
		await user.type(min(), "42");
		expect(onChangeMin).not.toHaveBeenCalled();

		await user.tab();
		expect(onChangeMin).toHaveBeenLastCalledWith(42);
		expect(min()).toHaveValue("42");
	});

	it("clamps 7-bit values to 0..127", async () => {
		const { user, min, max, onChangeMin, onChangeMax } = setup();
		await typeAndBlur(user, max(), "300");
		expect(onChangeMax).toHaveBeenLastCalledWith(127);
		expect(max()).toHaveValue("127");

		await typeAndBlur(user, min(), "-5");
		expect(onChangeMin).toHaveBeenLastCalledWith(0);
		expect(min()).toHaveValue("0");
	});

	it("clamps 14-bit (pitch bend) values to -8192..8191", async () => {
		const { user, min, max, onChangeMin, onChangeMax } = setup({
			bitResolution: 14,
			initial: [-8192, 8191],
		});
		await typeAndBlur(user, min(), "-9000");
		expect(onChangeMin).toHaveBeenLastCalledWith(-8192);

		await typeAndBlur(user, max(), "9000");
		expect(onChangeMax).toHaveBeenLastCalledWith(8191);

		await typeAndBlur(user, min(), "-100");
		expect(onChangeMin).toHaveBeenLastCalledWith(-100);
	});

	it("falls back to the range edge when the field is empty or just '-'", async () => {
		const { user, min, max, onChangeMin, onChangeMax } = setup({
			initial: [10, 100],
		});
		await typeAndBlur(user, min(), "");
		expect(onChangeMin).toHaveBeenLastCalledWith(0);

		await typeAndBlur(user, max(), "-");
		expect(onChangeMax).toHaveBeenLastCalledWith(127);
		expect(max()).toHaveValue("127");
	});

	it("falls back to the range edge for text that is not a number", async () => {
		const { user, max, onChangeMax } = setup({ initial: [0, 64] });
		await typeAndBlur(user, max(), "abc");
		expect(onChangeMax).toHaveBeenLastCalledWith(127);
	});

	it("strips leading zeros", async () => {
		const { user, min, onChangeMin } = setup();
		await typeAndBlur(user, min(), "007");
		expect(onChangeMin).toHaveBeenLastCalledWith(7);
		expect(min()).toHaveValue("7");
	});

	it("shows new values from the parent", () => {
		const { rerender } = renderWithProviders(
			<MinMax min={1} max={2} onChangeMin={vi.fn()} onChangeMax={vi.fn()} />,
		);
		rerender(
			<MinMax min={5} max={99} onChangeMin={vi.fn()} onChangeMax={vi.fn()} />,
		);
		expect(screen.getByRole("textbox", { name: "Min" })).toHaveValue("5");
		expect(screen.getByRole("textbox", { name: "Max" })).toHaveValue("99");
	});
});
