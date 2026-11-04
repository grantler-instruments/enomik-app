import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	type SxProps,
	type Theme,
} from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";

type CollapsibleSectionProps = {
	/** Content of the clickable summary row. */
	title: ReactNode;
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
		slotProps={
			unmountOnExit ? { transition: { unmountOnExit: true } } : undefined
		}
		sx={sx}
	>
		<AccordionSummary
			expandIcon={<ExpandMoreIcon />}
			aria-controls={id ? `${id}-content` : undefined}
			id={id ? `${id}-header` : undefined}
		>
			{title}
		</AccordionSummary>
		<AccordionDetails>{children}</AccordionDetails>
	</Accordion>
);

export default CollapsibleSection;
