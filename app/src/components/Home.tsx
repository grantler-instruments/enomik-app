import BuildIcon from "@mui/icons-material/Build";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExtensionIcon from "@mui/icons-material/Extension";
import GetAppIcon from "@mui/icons-material/GetApp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WifiIcon from "@mui/icons-material/Wifi";
import {
	Alert,
	Box,
	Button,
	Container,
	Grid,
	Link,
	Paper,
	Snackbar,
	Stack,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { openInstalledAppsPage } from "../utils/browser";

const Home = () => {
	const { t } = useTranslation();
	const { canInstall, isInstalled, install } = usePwaInstall();
	const [appsHint, setAppsHint] = useState<string | null>(null);

	const handleUninstall = async () => {
		const { url, opened } = openInstalledAppsPage();
		if (opened || !url) return;
		try {
			await navigator.clipboard.writeText(url);
			setAppsHint(t("uninstall_app_copied", { url }));
		} catch {
			setAppsHint(t("uninstall_app_open_failed", { url }));
		}
	};

	return (
		<Container maxWidth="lg" sx={{ my: { xs: 4, md: 8 }, pb: 6 }}>
			{/* Hero Section */}
			<Box
				component="section"
				sx={{
					py: { xs: 4, md: 6 },
					px: { xs: 0, md: 2 },
				}}
			>
				<Typography
					variant="h2"
					fontWeight={700}
					gutterBottom
					sx={{ lineHeight: 1.2 }}
				>
					{t("home_create_midi_devices_easily")}
					<br />
					<Box component="span" sx={{ color: "secondary.main" }}>
						{t("home_no_coding_required")}
					</Box>
				</Typography>

				<Typography
					variant="h6"
					sx={{ opacity: 0.9, maxWidth: 560, mt: 2 }}
					gutterBottom
				>
					{t("home_caption")}
				</Typography>

				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={2}
					sx={{ mt: 4 }}
					alignItems={{ xs: "stretch", sm: "center" }}
				>
					<Button
						variant="contained"
						size="large"
						component={NavLink}
						to="/configurator"
						sx={{ minWidth: { sm: 200 } }}
					>
						{t("launch_configurator")}
					</Button>
					<Button
						variant="outlined"
						size="large"
						component={NavLink}
						to="/getting-started"
						sx={{ minWidth: { sm: 180 } }}
					>
						{t("getting_started")}
					</Button>
				</Stack>
			</Box>

			{/* Feature Sections as Cards */}
			<Stack spacing={4} sx={{ mt: { xs: 6, md: 8 } }}>
				<Paper
					component="section"
					variant="outlined"
					sx={{
						p: { xs: 2, md: 3 },
						borderRadius: 2,
						borderColor: "divider",
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
						<WifiIcon color="secondary" sx={{ fontSize: 28 }} />
						<Typography variant="h6" fontWeight={600}>
							{t("home_reliable_wireless_midi")} —{" "}
							<Box component="span" sx={{ color: "secondary.main" }}>
								{t("home_without_bluetooth")}
							</Box>
						</Typography>
					</Box>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{t("home_dont_trust_bluetooth_midi")}{" "}
						<Link
							href="https://github.com/thomasgeissl/esp-now-midi"
							target="_blank"
							rel="noopener"
							sx={{ fontWeight: 600 }}
						>
							ESP-NOW MIDI
						</Link>{" "}
						{t("home_esp_now_midi")}
					</Typography>
				</Paper>

				<Paper
					component="section"
					variant="outlined"
					sx={{
						p: { xs: 2, md: 3 },
						borderRadius: 2,
						borderColor: "divider",
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
						<SwapHorizIcon color="secondary" sx={{ fontSize: 28 }} />
						<Typography variant="h6" fontWeight={600}>
							{t("home_fully_bidirectional")} —{" "}
							<Box component="span" sx={{ color: "secondary.main" }}>
								{t("home_midi_controller_or_instrument")}
							</Box>
						</Typography>
					</Box>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{t("home_fully_bidirectional_description")}
					</Typography>
				</Paper>

				<Paper
					component="section"
					variant="outlined"
					sx={{
						p: { xs: 2, md: 3 },
						borderRadius: 2,
						borderColor: "divider",
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5} mb={2}>
						<ExtensionIcon color="secondary" sx={{ fontSize: 28 }} />
						<Typography variant="h6" fontWeight={600}>
							{t("home_kit")} —{" "}
							<Box component="span" sx={{ color: "secondary.main" }}>
								{t("home_dongles_and_client_boards")}
							</Box>
						</Typography>
					</Box>
					<Grid container spacing={3} alignItems="center">
						<Grid size={{ xs: 12, md: 5 }}>
							<Box
								component="img"
								src={`${import.meta.env.BASE_URL}/enomik_dongle_client.jpg`}
								alt="enomik_3000 dongle and client boards from Grantler Instruments"
								sx={{
									width: "100%",
									maxWidth: 480,
									borderRadius: 1,
									boxShadow: 2,
									display: "block",
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 7 }}>
							<Typography variant="body1" sx={{ opacity: 0.9 }}>
								{t("home_kit_description")}
							</Typography>
						</Grid>
					</Grid>
				</Paper>

				<Paper
					component="section"
					variant="outlined"
					sx={{
						p: { xs: 2, md: 3 },
						borderRadius: 2,
						borderColor: "divider",
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5} mb={2}>
						<BuildIcon color="secondary" sx={{ fontSize: 28 }} />
						<Typography variant="h6" fontWeight={600}>
							{t("home_utilities")} —{" "}
							<Box component="span" sx={{ color: "secondary.main" }}>
								{t("home_utilities_description")}
							</Box>
						</Typography>
					</Box>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{t("home_utilities_description_includes")}{" "}
						<Button
							variant="outlined"
							size="medium"
							component={NavLink}
							to="/debugger"
							sx={{ mx: 0.5, verticalAlign: "middle" }}
						>
							{t("midi_monitor")}
						</Button>{" "}
						{t("home_utilities_description_includes_continues")}{" "}
						<Button
							variant="outlined"
							size="medium"
							component={NavLink}
							to="/uploader"
							sx={{ mx: 0.5, verticalAlign: "middle" }}
						>
							{t("firmware_uploader")}
						</Button>{" "}
						{t("home_utilities_description_includes_end")}
					</Typography>
				</Paper>

				<Paper
					component="section"
					variant="outlined"
					sx={{
						p: { xs: 2, md: 3 },
						borderRadius: 2,
						borderColor: "divider",
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
						<GetAppIcon color="secondary" sx={{ fontSize: 28 }} />
						<Typography variant="h6" fontWeight={600}>
							{t("home_pwa_title")}
						</Typography>
					</Box>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{t("home_pwa_description")}
					</Typography>
					{canInstall && (
						<Button
							variant="outlined"
							size="medium"
							startIcon={<GetAppIcon />}
							onClick={() => void install()}
							sx={{ mt: 2 }}
						>
							{t("install_app")}
						</Button>
					)}
					{isInstalled && (
						<Button
							variant="outlined"
							size="medium"
							color="inherit"
							startIcon={<DeleteOutlineIcon />}
							onClick={() => void handleUninstall()}
							sx={{ mt: 2 }}
						>
							{t("uninstall_app")}
						</Button>
					)}
				</Paper>
			</Stack>

			<Snackbar
				open={appsHint != null}
				autoHideDuration={8000}
				onClose={() => setAppsHint(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert
					severity="info"
					onClose={() => setAppsHint(null)}
					sx={{ width: "100%" }}
				>
					{appsHint}
				</Alert>
			</Snackbar>
		</Container>
	);
};

export default Home;
