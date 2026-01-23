import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Settings as SettingsIcon, Menu as MenuIcon } from "@mui/icons-material";
import { Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme } from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/app";
import { ESP_NOW_VERSION_MAJOR, ESP_NOW_VERSION_MINOR } from "../store/io";
import Logo from "./Logo";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const setShowSettingsModal = useAppStore(
    (state) => state.setShowSettingsModal
  );

  const menu = [
    { label: "Configurator", path: "/configurator" },
    { label: "Debugger", path: "/debugger" },
    // { label: "Inspector", path: "/inspector" },
    { label: "Firmware Uploader", path: "/uploader" },
  ];

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={2}>
        <Toolbar sx={{ display: "flex", gap: 2 }}>
          <Box display={"flex"} alignItems="center" gap={1} onClick={() => navigate("/")} sx={{ cursor: "pointer" }}>
            <Logo></Logo>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: 600 }}
              textTransform="uppercase"
              color="primary"
            >
              enomik 3000
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              v{ESP_NOW_VERSION_MAJOR}.{ESP_NOW_VERSION_MINOR}
            </Typography>
          </Box>
          <Box flex={1} />
          
          {/* Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {menu.map((item) => (
                <Button
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  color="inherit"
                  sx={{
                    "&.active": {
                      backgroundColor: "primary.main",
                      color: "primary.contrastText",
                      fontWeight: 600,
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <IconButton
                onClick={() => setShowSettingsModal(true)}
                color="inherit"
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={() => setShowSettingsModal(true)}
                color="inherit"
              >
                <SettingsIcon />
              </IconButton>
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                color="inherit"
                edge="end"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            {menu.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={handleMobileMenuClose}
                  sx={{
                    "&.active": {
                      backgroundColor: "primary.main",
                      color: "primary.contrastText",
                      "& .MuiListItemText-primary": {
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;