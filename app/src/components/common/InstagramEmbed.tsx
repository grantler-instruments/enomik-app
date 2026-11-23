import InstagramIcon from "@mui/icons-material/Instagram";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Shortcode of a post URL like https://www.instagram.com/p/ABC123/. */
export const instagramShortcode = (url: string) =>
	url.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/)?.[1] ?? null;

/**
 * An Instagram post that only loads after a click: embedding contacts Meta
 * (data, cookies), so nothing is requested from Instagram before that.
 */
const InstagramEmbed = ({
	url,
	author,
	title,
}: {
	url: string;
	/** Account that posted it, shown before loading. */
	author: string;
	/** Accessible name of the embedded frame. */
	title: string;
}) => {
	const { t } = useTranslation();
	const [loaded, setLoaded] = useState(false);
	const shortcode = instagramShortcode(url);
	if (!shortcode) return null;

	if (loaded)
		return (
			<Box
				component="iframe"
				src={`https://www.instagram.com/p/${shortcode}/embed/captioned/`}
				title={title}
				loading="lazy"
				allow="encrypted-media; fullscreen"
				sx={{
					display: "block",
					width: "100%",
					maxWidth: 540,
					// The embed's own height; scrolls inside when the caption is long.
					height: 720,
					border: 1,
					borderColor: "divider",
					borderRadius: 2,
					bgcolor: "background.paper",
				}}
			/>
		);

	return (
		<Stack
			spacing={2}
			alignItems="flex-start"
			sx={{
				maxWidth: 540,
				p: 3,
				border: 1,
				borderColor: "divider",
				borderRadius: 2,
				bgcolor: "background.paper",
			}}
		>
			<Stack direction="row" spacing={1} alignItems="center">
				<InstagramIcon color="secondary" />
				<Typography variant="subtitle1" fontWeight={600}>
					@{author}
				</Typography>
			</Stack>
			<Typography variant="body2" sx={{ opacity: 0.9 }}>
				{t("instagram_consent")}
			</Typography>
			<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
				<Button variant="contained" onClick={() => setLoaded(true)}>
					{t("instagram_load")}
				</Button>
				<Button
					href={url}
					target="_blank"
					rel="noopener"
					endIcon={<OpenInNewIcon fontSize="small" />}
				>
					{t("instagram_open")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default InstagramEmbed;
