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
import { CHAPTERS } from "./tutorial/chapters";

const Tutorial = () => {
	const { t } = useTranslation();
	const { chapterId } = useParams();
	const index = CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
	const topRef = useRef<HTMLDivElement>(null);

	// The page scrolls inside App's content box, not the window
	useEffect(() => {
		if (chapterId) topRef.current?.scrollIntoView();
	}, [chapterId]);

	if (index === -1) {
		return <Navigate to={`/tutorial/${CHAPTERS[0].id}`} replace />;
	}

	const chapter = CHAPTERS[index];
	const previous = CHAPTERS[index - 1];
	const next = CHAPTERS[index + 1];
	const { Content } = chapter;

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
							{CHAPTERS.map((item, itemIndex) => (
								<ListItemButton
									key={item.id}
									component={NavLink}
									to={`/tutorial/${item.id}`}
									sx={{
										borderRadius: 1,
										"&.active": {
											color: "primary.main",
											"& .MuiListItemText-primary": { fontWeight: 600 },
										},
									}}
								>
									<ListItemText
										primary={`${itemIndex + 1}. ${t(item.titleKey)}`}
									/>
								</ListItemButton>
							))}
						</List>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 9 }} order={{ xs: 1, md: 2 }}>
					<Box component="article">
						<Typography variant="overline" color="text.secondary">
							{t("tutorial_chapter_n", { n: index + 1 })}
						</Typography>
						<Typography variant="h3" fontWeight={600} sx={{ mb: 3 }}>
							{t(chapter.titleKey)}
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
								to={`/tutorial/${previous.id}`}
								startIcon={<ArrowBackIcon />}
							>
								{t(previous.titleKey)}
							</Button>
						) : (
							<Box />
						)}
						{next && (
							<Button
								variant="contained"
								component={NavLink}
								to={`/tutorial/${next.id}`}
								endIcon={<ArrowForwardIcon />}
							>
								{t(next.titleKey)}
							</Button>
						)}
					</Box>
				</Grid>
			</Grid>
		</Container>
	);
};

export default Tutorial;
