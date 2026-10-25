import { Box, Typography } from "@mui/material";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import InfoWithTooltip from "./InfoWithTooltip";

const SectionHeader = ({
	title,
	tooltipKey,
	icon,
}: {
	title: string;
	tooltipKey?: string;
	icon?: ReactNode;
}) => {
	const { t } = useTranslation();
	const [hovered, setHovered] = useState(false);
	return (
		<Typography
			variant="h2"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			sx={{ display: "flex", alignItems: "center", gap: 1 }}
		>
			{icon && (
				<Box
					component="span"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						color: "text.secondary",
					}}
				>
					{icon}
				</Box>
			)}
			{title}
			{hovered && tooltipKey && (
				<InfoWithTooltip text={t(tooltipKey)} asButton={false} />
			)}
		</Typography>
	);
};

export default SectionHeader;
