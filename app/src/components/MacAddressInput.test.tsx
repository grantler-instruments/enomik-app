// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/render";
import MacAddressInput from "./MacAddressInput";

/** Parent that owns the address, like Peers writing it to the store. */
const Controlled = ({
	initial = "",
	onChange,
}: {
	initial?: string;
	onChange: (mac: string) => void;
}) => {
	const [mac, setMac] = useState(initial);
	return (
		<MacAddressInput
			macAddress={mac}
			onMacAddressChange={(value) => {
				setMac(value);
				onChange(value);
			}}
		/>
	);
};

const setup = (initial?: string) => {
	const onChange = vi.fn();
	renderWithProviders(<Controlled initial={initial} onChange={onChange} />);
	return {
		user: userEvent.setup(),
		onChange,
		fields: () => screen.getAllByRole("textbox"),
	};
};

describe("MacAddressInput", () => {
	it("splits the address into six fields", () => {
		const { fields } = setup("AA:BB:CC:DD:EE:FF");
		expect(fields().map((f) => (f as HTMLInputElement).value)).toEqual([
			"AA",
			"BB",
			"CC",
			"DD",
			"EE",
			"FF",
		]);
	});

	it("uppercases hex, drops other characters and moves to the next field", async () => {
		const { user, fields, onChange } = setup();
		await user.click(fields()[0]);
		await user.keyboard("zg1a");

		expect(onChange).toHaveBeenLastCalledWith("1A:::::");
		expect(fields()[1]).toHaveFocus();
	});

	it("moves on with ':' or '-' without writing them", async () => {
		const { user, fields, onChange } = setup();
		await user.click(fields()[0]);
		await user.keyboard("a:b-c");

		expect(onChange).toHaveBeenLastCalledWith("A:B:C:::");
		expect(fields()[2]).toHaveFocus();
	});

	it("goes back a field on backspace in an empty field", async () => {
		const { user, fields } = setup("AA:::::");
		await user.click(fields()[1]);
		await user.keyboard("{Backspace}");
		expect(fields()[0]).toHaveFocus();
	});

	it.each([
		["with colons", "aa:bb:cc:dd:ee:ff"],
		["with dashes", "AA-BB-CC-DD-EE-FF"],
		["without separators", "aabbccddeeff"],
		["with spaces and brackets", "\t[ aa bb cc dd ee ff ]\n"],
	])("spreads a pasted address %s over all fields", async (_, text) => {
		const { user, fields, onChange } = setup();
		await user.click(fields()[0]);
		await user.paste(text);
		expect(onChange).toHaveBeenLastCalledWith("AA:BB:CC:DD:EE:FF");
	});

	it("pastes from the focused field on and drops what does not fit", async () => {
		const { user, fields, onChange } = setup("11:22:33:44:55:66");
		await user.click(fields()[4]);
		await user.paste("AABBCC");
		expect(onChange).toHaveBeenLastCalledWith("11:22:33:44:AA:BB");
	});
});
