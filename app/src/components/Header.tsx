import {
	Menu as MenuIcon,
	Settings as SettingsIcon,
} from "@mui/icons-material";
import {
	Drawer,
	IconButton,
	Link,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/app";
import {
	ESP_NOW_VERSION_MAJOR,
	ESP_NOW_VERSION_MINOR,
} from "../store/midi.config";
import Logo from "./Logo";

const Header: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const setShowSettingsModal = useAppStore(
		(state) => state.setShowSettingsModal,
	);

	const menu = [
		{ label: t("configurator"), path: "/configurator" },
		{ label: t("debugger"), path: "/debugger" },
		{ label: t("inspector"), path: "/inspector" },
		{ label: t("firmware_uploader"), path: "/uploader" },
	];

	const handleMobileMenuClose = () => {
		setMobileMenuOpen(false);
	};

	return (
		<>
			<AppBar position="static" color="transparent" elevation={2}>
				<Toolbar sx={{ display: "flex", gap: 2 }}>
					<Box
						display={"flex"}
						alignItems="center"
						gap={1}
						onClick={() => navigate("/")}
						sx={{ cursor: "pointer" }}
					>
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
						<Typography
							variant="body2"
							color="textSecondary"
							sx={{ mr: 2, display: { xs: "none", sm: "block" } }}
						>
							v{ESP_NOW_VERSION_MAJOR}.{ESP_NOW_VERSION_MINOR}
						</Typography>
					</Box>
					<Box flex={1} />

					{/* Desktop Menu */}
					{!isMobile && (
						<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
							<Box
								component="nav"
								aria-label={t("main_navigation")}
								sx={{ display: "flex", alignSelf: "stretch", gap: 3 }}
							>
								{menu.map((item) => (
									<Link
										key={item.path}
										component={NavLink}
										to={item.path}
										color="inherit"
										underline="none"
										sx={{
											display: "flex",
											alignItems: "center",
											borderBottom: 2,
											borderColor: "transparent",
											transition: "color 150ms, border-color 150ms",
											"&:hover": { color: "primary.main" },
											"&.active": {
												color: "primary.main",
												borderColor: "primary.main",
												fontWeight: 600,
											},
										}}
									>
										{item.label}
									</Link>
								))}
							</Box>
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
					component="nav"
					aria-label={t("main_navigation")}
					sx={{ width: 250 }}
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
