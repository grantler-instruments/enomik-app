// Footer.tsx
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
        textAlign: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {"© "}
        <Link color="inherit" href="#">
          grantler instruments
        </Link>{" "}
        {new Date().getFullYear()}
        {". All rights reserved."}
      </Typography>
    </Box>
  );
};

export default Footer;
