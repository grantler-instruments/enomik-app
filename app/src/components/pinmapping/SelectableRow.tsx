import { Box } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Wraps a pin row so it can be linked to the board: marks the row while its
 * pin is selected and reports clicks/focus. `data-pin-row` lets the board
 * scroll to it.
 */
const SelectableRow = ({
	pin,
	selected,
	onSelect,
	children,
}: {
	pin: number;
	selected: boolean;
	onSelect?: (gpio: number) => void;
	children: ReactNode;
}) => (
	<Box
		data-pin-row={pin}
		onClick={onSelect && (() => onSelect(pin))}
		onFocus={onSelect && (() => onSelect(pin))}
		sx={{
			borderRadius: 1,
			outline: 2,
			outlineOffset: -2,
			outlineColor: selected ? "primary.main" : "transparent",
			transition: "outline-color 150ms",
			scrollMarginTop: 96,
		}}
	>
		{children}
	</Box>
);

export default SelectableRow;
