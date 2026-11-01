import { Box, ButtonBase, Link, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "./Lightbox";

export type Screenshot = { file: string; captionKey: string };
export type ScreenshotSource = {
	author: string;
	url: string;
	license: string;
	licenseUrl: string;
};

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Numbered screenshots side by side; click one to open it in a lightbox. */
const Screenshots = ({
	items,
	source,
}: {
	items: Screenshot[];
	source: ScreenshotSource;
}) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState<number | null>(null);
	const images = items.map((item) => ({
		src: `${import.meta.env.BASE_URL}/tutorial/${item.file}`,
		alt: t(item.captionKey),
		caption: t(item.captionKey),
	}));
	return (
		<Box sx={{ my: 2 }}>
			<Lightbox
				images={images}
				index={open}
				onChange={setOpen}
				onClose={() => setOpen(null)}
			/>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: `repeat(${items.length % 3 === 0 ? 3 : 2}, 1fr)`,
					},
					gap: 2,
				}}
			>
				{items.map((item, index) => {
					const { src, alt: caption } = images[index];
					return (
						<Box component="figure" key={item.file} sx={{ m: 0 }}>
							<ButtonBase
								onClick={() => setOpen(index)}
								aria-label={caption}
								sx={{
									display: "block",
									width: "100%",
									cursor: "zoom-in",
									borderRadius: 1.5,
								}}
							>
								<Box
									component="img"
									src={src}
									alt={caption}
									loading="lazy"
									sx={{
										display: "block",
										width: "100%",
										aspectRatio: "3 / 2",
										objectFit: "cover",
										objectPosition: "top left",
										borderRadius: 1.5,
										border: 1,
										borderColor: "divider",
									}}
								/>
							</ButtonBase>
							<Typography
								component="figcaption"
								variant="body2"
								sx={{ mt: 0.75 }}
							>
								<Box component="span" sx={{ fontWeight: 600 }}>
									{index + 1}.
								</Box>{" "}
								{caption}
							</Typography>
						</Box>
					);
				})}
			</Box>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ display: "block", mt: 1 }}
			>
				{t("tutorial_screenshot_credit")}:{" "}
				<Link href={source.url} color="inherit" {...external}>
					{source.author}
				</Link>
				,{" "}
				<Link href={source.licenseUrl} color="inherit" {...external}>
					{source.license}
				</Link>
				, {t("tutorial_screenshot_cropped")}
			</Typography>
		</Box>
	);
};

export default Screenshots;
