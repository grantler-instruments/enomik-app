import { TextField, type TextFieldProps } from "@mui/material";
import { useEffect, useState } from "react";

const show = (n: number | undefined) => (n == null ? "" : String(n));

/**
 * Text field for a non-negative whole number (pin, CC, note).
 *
 * Keeps its own text while typing: an emptied field stays empty instead of
 * writing 0, leading zeros are dropped as you type, and leaving it empty
 * restores the last value. A plain controlled type="number" input does neither.
 */
const IntegerField = ({
	value,
	onChange,
	max,
	...props
}: Omit<TextFieldProps, "value" | "onChange" | "type"> & {
	value: number | undefined;
	onChange: (value: number) => void;
	/** Larger values are clamped to this. */
	max?: number;
}) => {
	const [text, setText] = useState(show(value));

	// Outside changes (store, file load) win, unless they match what is typed.
	useEffect(() => {
		setText((current) =>
			current !== "" && Number(current) === value ? current : show(value),
		);
	}, [value]);

	return (
		<TextField
			{...props}
			value={text}
			onChange={(e) => {
				const digits = e.target.value.replace(/\D/g, "");
				if (digits === "") {
					setText("");
					return;
				}
				const n =
					max === undefined ? Number(digits) : Math.min(max, Number(digits));
				setText(String(n));
				if (n !== value) onChange(n);
			}}
			onBlur={(e) => {
				if (text === "") setText(show(value));
				props.onBlur?.(e);
			}}
			slotProps={{
				...props.slotProps,
				htmlInput: {
					inputMode: "numeric",
					pattern: "[0-9]*",
					...(props.slotProps?.htmlInput as object | undefined),
				},
			}}
		/>
	);
};

export default IntegerField;
