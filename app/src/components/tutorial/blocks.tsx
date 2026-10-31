import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

/** Translation arrays (`returnObjects`) used for paragraphs and lists. */
export const useList = (key: string): string[] => {
	const { t } = useTranslation();
	const value: unknown = t(key, { returnObjects: true });
	return Array.isArray(value) ? value.map(String) : [];
};

export const Paragraphs = ({ i18nKey }: { i18nKey: string }) => {
	const paragraphs = useList(i18nKey);
	return (
		<>
			{paragraphs.map((text) => (
				<Typography key={text} variant="body1" sx={{ mb: 2 }}>
					{text}
				</Typography>
			))}
		</>
	);
};

export const Heading = ({ children }: { children: ReactNode }) => (
	<Typography variant="h5" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>
		{children}
	</Typography>
);

export const Steps = ({
	i18nKey,
	ordered = true,
}: {
	i18nKey: string;
	ordered?: boolean;
}) => {
	const items = useList(i18nKey);
	return (
		<Box
			component={ordered ? "ol" : "ul"}
			sx={{ pl: 3, my: 0, "& li": { mb: 1 } }}
		>
			{items.map((text) => (
				<Typography key={text} component="li" variant="body1">
					{text}
				</Typography>
			))}
		</Box>
	);
};

export const Note = ({
	children,
	severity = "info",
}: {
	children: ReactNode;
	severity?: "info" | "success" | "warning";
}) => (
	<Alert severity={severity} sx={{ my: 2 }}>
		{children}
	</Alert>
);

export const CodeBlock = ({ children }: { children: string }) => (
	<Box
		component="pre"
		sx={{
			fontFamily: "monospace",
			fontSize: 13,
			p: 2,
			my: 2,
			borderRadius: 1,
			overflowX: "auto",
			bgcolor: "action.hover",
			border: 1,
			borderColor: "divider",
		}}
	>
		{children.trim()}
	</Box>
);

export type LinkAction = { label: string; link: string };

export const LinkButtons = ({ actions }: { actions: LinkAction[] }) => (
	<Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ my: 2 }}>
		{actions.map((action) => {
			const external = action.link.startsWith("http");
			return (
				<Button
					key={action.link}
					variant="outlined"
					component={NavLink}
					to={action.link}
					target={external ? "_blank" : undefined}
					rel={external ? "noopener noreferrer" : undefined}
				>
					{action.label}
				</Button>
			);
		})}
	</Stack>
);
