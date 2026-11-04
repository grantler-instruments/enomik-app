import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SectionCardProps = {
	icon?: ReactNode;
	title: ReactNode;
	children: ReactNode;
};

const SectionCard = ({ icon, title, children }: SectionCardProps) => (
	<Paper
		component="section"
		variant="outlined"
		sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, borderColor: "divider" }}
	>
		<Box display="flex" alignItems="center" gap={1.5} mb={2}>
			{icon}
			<Typography variant="h6" fontWeight={600}>
				{title}
			</Typography>
		</Box>
		{children}
	</Paper>
);

export default SectionCard;
