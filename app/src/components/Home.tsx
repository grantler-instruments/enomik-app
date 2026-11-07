import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BuildIcon from "@mui/icons-material/Build";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExtensionIcon from "@mui/icons-material/Extension";
import GetAppIcon from "@mui/icons-material/GetApp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WifiIcon from "@mui/icons-material/Wifi";
import { Box, Button, Grid, Link, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { useToast } from "../hooks/useToast";
import { openInstalledAppsPage } from "../utils/browser";
import SignalPath from "./home/SignalPath";
import PageLayout from "./layout/PageLayout";

const Home = () => {
	const { t } = useTranslation();
	const { canInstall, isInstalled, install } = usePwaInstall();
	const { showToast, toast } = useToast();

	const handleUninstall = async () => {
		const { url, opened } = openInstalledAppsPage();
		if (opened || !url) return;
		try {
			await navigator.clipboard.writeText(url);
			showToast(t("uninstall_app_copied", { url }));
		} catch {
			showToast(t("uninstall_app_open_failed", { url }));
		}
	};

	return (
		<PageLayout>
			<Grid
				component="section"
				container
				spacing={{ xs: 4, md: 6 }}
				alignItems="center"
				sx={{ pt: { xs: 3, md: 8 }, pb: { xs: 6, md: 10 } }}
			>
				<Grid size={{ xs: 12, md: 6 }}>
					<Typography
						component="p"
						sx={{
							fontFamily: MONO,
							fontSize: 13,
							letterSpacing: "0.14em",
							color: "text.secondary",
							mb: 3,
						}}
					>
						ESP32 · ESP-NOW · USB MIDI
					</Typography>
					<Typography
						variant="h2"
						// The page's main heading, styled smaller than an h1.
						component="h1"
						sx={{
							fontSize: "clamp(2.3rem, 4.6vw, 3.4rem)",
							fontWeight: 700,
							lineHeight: 1.05,
							letterSpacing: "-0.025em",
							mb: 0,
						}}
					>
						{t("home_create_midi_devices_easily")}
						<Box
							component="span"
							sx={{ display: "block", color: "secondary.main" }}
						>
							{t("home_no_coding_required")}
						</Box>
					</Typography>
					<Typography
						variant="h6"
						component="p"
						sx={{
							fontWeight: 400,
							color: "text.secondary",
							maxWidth: 540,
							mt: 3,
						}}
					>
						{t("home_caption")}
					</Typography>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={1.5}
						useFlexGap
						flexWrap="wrap"
						sx={{ mt: 4, "& .MuiButton-root": { whiteSpace: "nowrap" } }}
						alignItems={{ xs: "stretch", sm: "center" }}
					>
						<Button
							variant="contained"
							size="large"
							component={NavLink}
							to="/configurator"
							endIcon={<ArrowForwardIcon />}
							sx={{
								bgcolor: "primary.main",
								color: "primary.contrastText",
								borderColor: "primary.main",
								"&:hover": {
									bgcolor: "primary.dark",
									borderColor: "primary.dark",
								},
							}}
						>
							{t("launch_configurator")}
						</Button>
						<Button
							variant="outlined"
							size="large"
							component={NavLink}
							to="/tutorial"
						>
							{t("tutorial")}
						</Button>
					</Stack>
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<Box
						component="figure"
						sx={{
							m: 0,
							p: { xs: 2, sm: 3 },
							borderRadius: 3,
							border: 1,
							borderColor: "divider",
							// Breadboard holes behind the picture.
							backgroundImage: (theme) =>
								`radial-gradient(${theme.palette.divider} 1.5px, transparent 1.6px)`,
							backgroundSize: "14px 14px",
						}}
					>
						<SignalPath />
						<Typography
							component="figcaption"
							variant="caption"
							sx={{
								display: "block",
								mt: 1.5,
								textAlign: "center",
								color: "text.secondary",
								letterSpacing: "0.08em",
								textTransform: "uppercase",
							}}
						>
							{t("home_topology_caption")}
						</Typography>
					</Box>
				</Grid>
			</Grid>

			<Grid container columnSpacing={6}>
				<Feature
					n={1}
					icon={<WifiIcon />}
					title={t("home_reliable_wireless_midi")}
					subtitle={t("home_without_bluetooth")}
				>
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
				</Feature>
				<Feature
					n={2}
					icon={<SwapHorizIcon />}
					title={t("home_fully_bidirectional")}
					subtitle={t("home_midi_controller_or_instrument")}
				>
					{t("home_fully_bidirectional_description")}
				</Feature>
				<Feature
					n={3}
					icon={<ExtensionIcon />}
					title={t("home_kit")}
					subtitle={t("home_dongles_and_client_boards")}
					wide
					aside={
						<Box
							component="img"
							src={`${import.meta.env.BASE_URL}/enomik_dongle_client.jpg`}
							alt="enomik_3000 dongle and client boards from Grantler Instruments"
							sx={{
								width: "100%",
								borderRadius: 2,
								display: "block",
							}}
						/>
					}
					action={
						<Button
							variant="outlined"
							component={NavLink}
							to="/kits"
							endIcon={<ArrowForwardIcon />}
						>
							{t("kits_title")}
						</Button>
					}
				>
					{t("home_kit_description")}
				</Feature>
				<Feature
					n={4}
					icon={<BuildIcon />}
					title={t("home_utilities")}
					subtitle={t("home_utilities_description")}
				>
					{t("home_utilities_description_includes")}{" "}
					<Link component={NavLink} to="/debugger" sx={{ fontWeight: 600 }}>
						{t("midi_monitor")}
					</Link>{" "}
					{t("home_utilities_description_includes_continues")}{" "}
					<Link component={NavLink} to="/uploader" sx={{ fontWeight: 600 }}>
						{t("firmware_uploader")}
					</Link>{" "}
					{t("home_utilities_description_includes_end")}
				</Feature>
				<Feature
					n={5}
					icon={<GetAppIcon />}
					title={t("home_pwa_title")}
					action={
						(canInstall || isInstalled) && (
							<>
								{canInstall && (
									<Button
										variant="outlined"
										startIcon={<GetAppIcon />}
										onClick={() => void install()}
									>
										{t("install_app")}
									</Button>
								)}
								{isInstalled && (
									<Button
										variant="outlined"
										color="inherit"
										startIcon={<DeleteOutlineIcon />}
										onClick={() => void handleUninstall()}
									>
										{t("uninstall_app")}
									</Button>
								)}
							</>
						)
					}
				>
					{t("home_pwa_description")}
				</Feature>
			</Grid>

			{toast}
		</PageLayout>
	);
};

const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

/**
 * One feature: a numbered row under a hairline, like a line on a spec
 * sheet. Half width on large screens; `wide` spans the row, with `aside`
 * (e.g. a photo) next to the text.
 */
const Feature = ({
	n,
	icon,
	title,
	subtitle,
	wide,
	aside,
	action,
	children,
}: {
	n: number;
	icon: ReactNode;
	title: string;
	subtitle?: string;
	wide?: boolean;
	aside?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
}) => (
	<Grid
		component="section"
		size={{ xs: 12, md: wide ? 12 : 6 }}
		sx={{
			borderTop: 1,
			borderColor: "divider",
			pt: 3,
			pb: { xs: 5, md: 7 },
		}}
	>
		<Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
			<Grid size={{ xs: 12, md: aside ? 6 : 12 }}>
				<Box
					display="flex"
					alignItems="center"
					gap={1.5}
					mb={2.5}
					sx={{ color: "text.secondary" }}
				>
					<Typography
						component="span"
						sx={{ fontFamily: MONO, fontSize: 13, color: "primary.main" }}
					>
						{String(n).padStart(2, "0")}
					</Typography>
					<Box
						component="span"
						aria-hidden
						sx={{ display: "flex", "& svg": { fontSize: 20 } }}
					>
						{icon}
					</Box>
				</Box>
				<Typography
					component="h2"
					sx={{
						fontSize: { xs: "1.5rem", md: "1.75rem" },
						fontWeight: 700,
						lineHeight: 1.2,
						letterSpacing: "-0.015em",
						mb: 0,
					}}
				>
					{title}
					{subtitle && (
						<Box
							component="span"
							sx={{ display: "block", color: "secondary.main" }}
						>
							{subtitle}
						</Box>
					)}
				</Typography>
				<Typography
					variant="body1"
					sx={{ color: "text.secondary", mt: 2, maxWidth: 560 }}
				>
					{children}
				</Typography>
				{action && (
					<Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
						{action}
					</Stack>
				)}
			</Grid>
			{aside && <Grid size={{ xs: 12, md: 6 }}>{aside}</Grid>}
		</Grid>
	</Grid>
);

export default Home;
