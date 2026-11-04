import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
	Alert,
	Box,
	Collapse,
	Container,
	type ContainerProps,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material";
import { type ReactNode, type Ref, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/app";

/** How long the page hint stays open before folding into the info icon. */
const HINT_AUTO_COLLAPSE_MS = 20_000;

type PageLayoutProps = {
	/** Page heading, rendered as h1. Omit for pages with their own hero. */
	title?: ReactNode;
	/** Content of the sticky toolbar shown above the page. */
	actions?: ReactNode;
	/**
	 * Page hint. Shown below the title (if hints are enabled), folds into an
	 * info icon next to the title after a while; the icon reopens it.
	 */
	info?: ReactNode;
	/** Optional action (e.g. a button) shown inside the hint. */
	infoAction?: ReactNode;
	maxWidth?: ContainerProps["maxWidth"];
	ref?: Ref<HTMLDivElement>;
	children: ReactNode;
};

const PageLayout = ({
	title,
	actions,
	info,
	infoAction,
	maxWidth = "lg",
	ref,
	children,
}: PageLayoutProps) => {
	const { t } = useTranslation();
	const showHints = useAppStore((state) => state.showHints);
	const [infoOpen, setInfoOpen] = useState(showHints);
	const [hovered, setHovered] = useState(false);

	// Fold the hint away after a while, but not while the user is reading it.
	useEffect(() => {
		if (!infoOpen || hovered) return;
		const timer = setTimeout(() => setInfoOpen(false), HINT_AUTO_COLLAPSE_MS);
		return () => clearTimeout(timer);
	}, [infoOpen, hovered]);

	const infoToggle = info && (
		<Tooltip title={t("show_hints")}>
			<IconButton
				aria-label={t("show_hints")}
				aria-expanded={infoOpen}
				color={infoOpen ? "info" : "default"}
				onClick={() => setInfoOpen((open) => !open)}
			>
				<InfoOutlinedIcon />
			</IconButton>
		</Tooltip>
	);

	return (
		<>
			{actions && (
				<Box
					display="flex"
					alignItems="center"
					flexWrap="wrap"
					gap={2}
					p={2}
					sx={{
						position: "sticky",
						top: 0,
						zIndex: (theme) => theme.zIndex.appBar,
						backgroundColor: "background.default",
					}}
				>
					{actions}
				</Box>
			)}
			<Container
				ref={ref}
				maxWidth={maxWidth}
				sx={{ my: { xs: 3, md: 4 }, pb: 4 }}
			>
				{title ? (
					<Box display="flex" alignItems="center" gap={1} mb={2}>
						<Typography variant="h1" sx={{ mb: 0 }}>
							{title}
						</Typography>
						{infoToggle}
					</Box>
				) : (
					infoToggle
				)}
				{info && (
					<Collapse in={infoOpen} unmountOnExit>
						<Alert
							severity="info"
							sx={{ mb: 2 }}
							action={infoAction}
							onClose={() => setInfoOpen(false)}
							onMouseEnter={() => setHovered(true)}
							onMouseLeave={() => setHovered(false)}
						>
							{info}
						</Alert>
					</Collapse>
				)}
				{children}
			</Container>
		</>
	);
};

export default PageLayout;
