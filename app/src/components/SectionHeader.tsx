import { Box, Typography } from "@mui/material";
import { type ElementType, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import InfoWithTooltip from "./InfoWithTooltip";

const SectionHeader = ({
	title,
	tooltipKey,
	icon,
	component = "h2",
}: {
	title: string;
	tooltipKey?: string;
	icon?: ReactNode;
	/** "span" inside a CollapsibleSection title, whose heading is already there. */
	component?: ElementType;
}) => {
	const { t } = useTranslation();
	const [hovered, setHovered] = useState(false);
	return (
		<Typography
			variant="h2"
			component={component}
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
