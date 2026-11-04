import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	type SxProps,
	type Theme,
} from "@mui/material";
import { type ReactNode, type SyntheticEvent, useId } from "react";

type CollapsibleSectionProps = {
	/** Content of the clickable summary row. */
	title: ReactNode;
	/**
	 * Controls in the summary row, right-aligned before the arrow (switches,
	 * buttons). Not inside the title: that's a button, and a button inside a
	 * button is invalid HTML that screen readers can't use.
	 */
	actions?: ReactNode;
	/** Base of the header and content ids; generated if not given. */
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
}: CollapsibleSectionProps) => {
	const generatedId = useId();
	const base = id ?? generatedId;
	const headerId = `${base}-header`;
	const contentId = `${base}-content`;
	return (
		<Accordion
			expanded={expanded}
			defaultExpanded={defaultExpanded}
			onChange={onChange ? (event, open) => onChange(open, event) : undefined}
			disabled={disabled}
			slotProps={{
				// The actions are placed over the summary row, inside the heading.
				// Sections sit right below the page's h1. The title inside is
				// plain text: the summary is a button, which can't hold a heading.
				heading: { component: "h2", style: { position: "relative" } },
				// MUI names the region after its first child's id, which is the
				// fragment here: link it to the summary by hand.
				region: { id: contentId, "aria-labelledby": headerId },
				...(unmountOnExit && { transition: { unmountOnExit: true } }),
			}}
			sx={sx}
		>
			{/* One child: Accordion takes its first child as the summary. */}
			{/* biome-ignore lint/complexity/noUselessFragments: see above */}
			<>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls={contentId}
					id={headerId}
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
};

export default CollapsibleSection;
