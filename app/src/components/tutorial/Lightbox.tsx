import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

export type LightboxImage = { src: string; alt: string; caption?: string };

/** Full-size image viewer with previous/next navigation (arrow keys work too). */
const Lightbox = ({
	images,
	index,
	onChange,
	onClose,
}: {
	images: LightboxImage[];
	index: number | null;
	onChange: (index: number) => void;
	onClose: () => void;
}) => {
	const { t } = useTranslation();
	const image = index === null ? undefined : images[index];
	const many = images.length > 1;

	const step = (delta: number) => {
		if (index === null) return;
		onChange((index + delta + images.length) % images.length);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "ArrowLeft") step(-1);
		if (event.key === "ArrowRight") step(1);
	};

	const navButton = {
		position: "absolute",
		top: "50%",
		transform: "translateY(-50%)",
		color: "common.white",
		bgcolor: "rgba(0, 0, 0, 0.4)",
		"&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)" },
	} as const;

	return (
		<Dialog
			open={Boolean(image)}
			onClose={onClose}
			onKeyDown={onKeyDown}
			maxWidth={false}
			slotProps={{
				paper: { sx: { bgcolor: "transparent", boxShadow: "none", m: 1 } },
				backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.85)" } },
			}}
		>
			{image && (
				<Box sx={{ position: "relative" }}>
					<Box
						component="img"
						src={image.src}
						alt={image.alt}
						onClick={onClose}
						sx={{
							display: "block",
							maxWidth: "94vw",
							maxHeight: "82vh",
							mx: "auto",
							borderRadius: 1,
							cursor: "zoom-out",
						}}
					/>
					{many && (
						<>
							<IconButton
								aria-label={t("tutorial_lightbox_previous")}
								onClick={() => step(-1)}
								sx={{ ...navButton, left: 8 }}
							>
								<ChevronLeftIcon />
							</IconButton>
							<IconButton
								aria-label={t("tutorial_lightbox_next")}
								onClick={() => step(1)}
								sx={{ ...navButton, right: 8 }}
							>
								<ChevronRightIcon />
							</IconButton>
						</>
					)}
					<IconButton
						aria-label={t("tutorial_lightbox_close")}
						onClick={onClose}
						sx={{ ...navButton, top: 8, right: 8, transform: "none" }}
					>
						<CloseIcon />
					</IconButton>
					{(image.caption || many) && (
						<Typography
							variant="body2"
							sx={{ color: "common.white", textAlign: "center", mt: 1.5 }}
						>
							{many && index !== null && `${index + 1} / ${images.length}  `}
							{image.caption}
						</Typography>
					)}
				</Box>
			)}
		</Dialog>
	);
};

export default Lightbox;
