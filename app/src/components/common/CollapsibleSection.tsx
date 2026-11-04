import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	type SxProps,
	type Theme,
} from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";

type CollapsibleSectionProps = {
	/** Content of the clickable summary row. */
	title: ReactNode;
	/**
	 * Controls in the summary row, right-aligned before the arrow (switches,
	 * buttons). Not inside the title: that's a button, and a button inside a
	 * button is invalid HTML that screen readers can't use.
	 */
	actions?: ReactNode;
	/** Used for aria-controls / ids. */
	id?: string;
	expanded?: boolean;
	defaultExpanded?: boolean;
	onChange?: (open: boolean, event: SyntheticEvent) => void;
	disabled?: boolean;
	unmountOnExit?: boolean;
	sx?: SxProps<Theme>;
	children: ReactNode;
};

const CollapsibleSection = ({
	title,
	actions,
	id,
	expanded,
	defaultExpanded,
	onChange,
	disabled,
	unmountOnExit,
	sx,
	children,
}: CollapsibleSectionProps) => (
	<Accordion
		expanded={expanded}
		defaultExpanded={defaultExpanded}
		onChange={onChange ? (event, open) => onChange(open, event) : undefined}
		disabled={disabled}
		slotProps={{
			// The actions are placed over the summary row, inside the heading.
			heading: { style: { position: "relative" } },
			...(unmountOnExit && { transition: { unmountOnExit: true } }),
		}}
		sx={sx}
	>
		{/* One child: Accordion takes its first child as the summary. */}
		{/* biome-ignore lint/complexity/noUselessFragments: see above */}
		<>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon />}
				aria-controls={id ? `${id}-content` : undefined}
				id={id ? `${id}-header` : undefined}
			>
				{title}
			</AccordionSummary>
			{actions && (
				<Box
					sx={{
						position: "absolute",
						top: 0,
						bottom: 0,
						// Clear of the expand arrow.
						right: 48,
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					{actions}
				</Box>
			)}
		</>
		<AccordionDetails>{children}</AccordionDetails>
	</Accordion>
);

export default CollapsibleSection;
