import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
	Box,
	Button,
	Container,
	Grid,
	List,
	ListItemButton,
	ListItemText,
	Typography,
} from "@mui/material";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, NavLink, useParams } from "react-router-dom";
import { PAGES } from "./tutorial/chapters";

const Tutorial = () => {
	const { t } = useTranslation();
	const { "*": rest = "" } = useParams();
	const path = `/tutorial/${rest}`.replace(/\/+$/, "");
	const index = PAGES.findIndex((page) => page.path === path);
	const topRef = useRef<HTMLDivElement>(null);

	// The page scrolls inside App's content box, not the window
	useEffect(() => {
		if (path) topRef.current?.scrollIntoView();
	}, [path]);

	if (index === -1) {
		return <Navigate to={PAGES[0].path} replace />;
	}

	const page = PAGES[index];
	const previous = PAGES[index - 1];
	const next = PAGES[index + 1];
	const { Content } = page.chapter;

	return (
		<Container ref={topRef} maxWidth="lg" sx={{ my: 4 }}>
			<Typography variant="h1" gutterBottom>
				{t("tutorial")}
			</Typography>
			<Grid container spacing={4}>
				{/* Chapter list; below the content on small screens */}
				<Grid size={{ xs: 12, md: 3 }} order={{ xs: 2, md: 1 }}>
					<Box component="nav" sx={{ position: { md: "sticky" }, top: 16 }}>
						<Typography variant="overline" color="text.secondary">
							{t("tutorial_chapters")}
						</Typography>
						<List dense disablePadding>
							{PAGES.map((item) => (
								<ListItemButton
									key={item.path}
									component={NavLink}
									to={item.path}
									end
									sx={{
										borderRadius: 1,
										pl: 2 + item.depth * 2,
										"&.active": {
											color: "primary.main",
											"& .MuiListItemText-primary": { fontWeight: 600 },
										},
									}}
								>
									<ListItemText
										primary={`${item.number}. ${t(item.chapter.titleKey)}`}
									/>
								</ListItemButton>
							))}
						</List>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 9 }} order={{ xs: 1, md: 2 }}>
					<Box component="article">
						<Typography variant="overline" color="text.secondary">
							{t("tutorial_chapter_n", { n: page.number })}
						</Typography>
						<Typography variant="h3" fontWeight={600} sx={{ mb: 3 }}>
							{t(page.chapter.titleKey)}
						</Typography>
						<Content />
					</Box>

					<Box
						display="flex"
						justifyContent="space-between"
						gap={2}
						sx={{ mt: 6, pt: 2, borderTop: 1, borderColor: "divider" }}
					>
						{previous ? (
							<Button
								component={NavLink}
								to={previous.path}
								startIcon={<ArrowBackIcon />}
							>
								{t(previous.chapter.titleKey)}
							</Button>
						) : (
							<Box />
						)}
						{next && (
							<Button
								variant="contained"
								component={NavLink}
								to={next.path}
								endIcon={<ArrowForwardIcon />}
							>
								{t(next.chapter.titleKey)}
							</Button>
						)}
					</Box>
				</Grid>
			</Grid>
		</Container>
	);
};

export default Tutorial;
