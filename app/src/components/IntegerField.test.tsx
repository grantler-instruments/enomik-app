// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/render";
import IntegerField from "./IntegerField";

let setOutside: (value: number) => void = () => {};

/** Parent that owns the number, like PinRow writing to the store. */
const Controlled = ({
	initial,
	onChange,
	max,
}: {
	initial: number;
	onChange: (value: number) => void;
	max?: number;
}) => {
	const [value, setValue] = useState(initial);
	setOutside = setValue;
	return (
		<IntegerField
			label="Pin"
			value={value}
			max={max}
			onChange={(n) => {
				setValue(n);
				onChange(n);
			}}
		/>
	);
};

const setup = (initial: number, max?: number) => {
	const onChange = vi.fn();
	renderWithProviders(
		<Controlled initial={initial} onChange={onChange} max={max} />,
	);
	return {
		user: userEvent.setup(),
		onChange,
		field: () => screen.getByRole("textbox", { name: "Pin" }),
	};
};

describe("IntegerField", () => {
	it("stays empty while cleared instead of reporting 0", async () => {
		const { user, field, onChange } = setup(4);
		await user.clear(field());

		expect(field()).toHaveValue("");
		expect(onChange).not.toHaveBeenCalled();
	});

	it("restores the last value when left empty", async () => {
		const { user, field, onChange } = setup(4);
		await user.clear(field());
		await user.tab();

		expect(field()).toHaveValue("4");
		expect(onChange).not.toHaveBeenCalled();
	});

	it("drops a leading zero while typing", async () => {
		const { user, field, onChange } = setup(0);
		await user.click(field());
		await user.keyboard("{End}5");

		expect(field()).toHaveValue("5");
		expect(onChange).toHaveBeenLastCalledWith(5);
	});

	it("ignores typed zeros in front", async () => {
		const { user, field, onChange } = setup(4);
		await user.clear(field());
		await user.type(field(), "0012");

		expect(field()).toHaveValue("12");
		expect(onChange).toHaveBeenLastCalledWith(12);
	});

	it("still accepts 0 itself", async () => {
		const { user, field, onChange } = setup(4);
		await user.clear(field());
		await user.type(field(), "0");

		expect(field()).toHaveValue("0");
		expect(onChange).toHaveBeenLastCalledWith(0);
	});

	it("drops anything that is not a digit", async () => {
		const { user, field, onChange } = setup(4);
		await user.clear(field());
		await user.type(field(), "-1e.2");

		expect(field()).toHaveValue("12");
		expect(onChange).toHaveBeenLastCalledWith(12);
	});

	it("clamps to max", async () => {
		const { user, field, onChange } = setup(4, 127);
		await user.clear(field());
		await user.type(field(), "200");

		expect(field()).toHaveValue("127");
		expect(onChange).toHaveBeenLastCalledWith(127);
	});

	it("shows values changed from outside", () => {
		const { field } = setup(4);
		act(() => setOutside(17));
		expect(field()).toHaveValue("17");
	});
});
