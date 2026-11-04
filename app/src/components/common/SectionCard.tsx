import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SectionCardProps = {
	icon?: ReactNode;
	title: ReactNode;
	/** "h3" when the cards sit under a section heading of their own. */
	headingLevel?: "h2" | "h3";
	children: ReactNode;
};

const SectionCard = ({
	icon,
	title,
	headingLevel = "h2",
	children,
}: SectionCardProps) => (
	<Paper
		component="section"
		variant="outlined"
		sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, borderColor: "divider" }}
	>
		<Box display="flex" alignItems="center" gap={1.5} mb={2}>
			{icon}
			<Typography variant="h6" component={headingLevel} fontWeight={600}>
				{title}
			</Typography>
		</Box>
		{children}
	</Paper>
);

export default SectionCard;
