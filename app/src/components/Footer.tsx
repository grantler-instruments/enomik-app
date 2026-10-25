import { Divider } from "@mui/material";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type React from "react";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
	const { t } = useTranslation();

	return (
		<Box
			component="footer"
			sx={{
				py: 4,
				px: 2,
				mt: "auto",
				textAlign: "center",
			}}
		>
			<Divider sx={{ my: 2 }} />
			<Typography variant="body2" color="text.secondary">
				{t("made_with_love")}{" "}
				<Link
					color="primary"
					href="https://grantler-instruments.com"
					target="_blank"
					rel="noopener"
				>
					grantler instruments
				</Link>{" "}
				{new Date().getFullYear()}
				{t("all_rights_reserved")}
			</Typography>
		</Box>
	);
};

export default Footer;
