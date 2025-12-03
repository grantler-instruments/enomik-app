import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { Button } from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, cursor: "pointer" }}
          textTransform="uppercase"
          onClick={() => navigate("/")}
          color="primary"
        >
          enomik 3000
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            component={NavLink}
            to="/"
            color="inherit"
            sx={{
              "&.active": {
                backgroundColor: "primary.main",
                fontWeight: 600,
              },
            }}
          >
            Configurator
          </Button>
          <Button
            component={NavLink}
            to="/debugger"
            color="inherit"
            sx={{
              "&.active": {
                backgroundColor: "primary.main",
                fontWeight: 600,
              },
            }}
          >
            Debugger
          </Button>
          <Button
            component={NavLink}
            to="/inspector"
            color="inherit"
            sx={{
              "&.active": {
                backgroundColor: "primary.main",
                fontWeight: 600,
              },
            }}
          >
            Inspector
          </Button>
          <Button
            component={NavLink}
            to="/uploader"
            color="inherit"
            sx={{
              "&.active": {
                backgroundColor: "primary.main",
                fontWeight: 600,
              },
            }}
          >
            Uploader
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
