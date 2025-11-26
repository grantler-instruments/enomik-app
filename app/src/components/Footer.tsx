// Footer.tsx
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useTranslation } from "react-i18next";
import { Divider } from "@mui/material";

const Footer: React.FC = () => {
    const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
        textAlign: "center",
      }}
    >
      <Divider sx={{ mb: 4, mt: 4 }} />
      <Typography variant="body2" color="text.secondary">
        {t('made_with_love')}{" "}
        <Link color="secondary" href="https://grantler-instruments.com" target="_blank" rel="noopener">
          grantler instruments
        </Link>{" "}
        {new Date().getFullYear()}
        {". All rights reserved."}
      </Typography>
    </Box>
  );
};

export default Footer;
