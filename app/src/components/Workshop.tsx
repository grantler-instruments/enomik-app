import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GroupsIcon from "@mui/icons-material/Groups";
import InventoryIcon from "@mui/icons-material/Inventory2";
import LaptopIcon from "@mui/icons-material/Laptop";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceIcon from "@mui/icons-material/Place";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
	Box,
	Button,
	Grid,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import SectionCard from "./common/SectionCard";
import PageLayout from "./layout/PageLayout";
import WIPBanner from "./WorkInProgress";

const MAX_PARTICIPANTS = 15;

const USE_CASES: { key: string; image: string }[] = [
	{ key: "touch", image: "tutorial/button.jpg" },
	{ key: "motion", image: "tutorial/motion.jpg" },
	{ key: "installation", image: "tutorial/nfc.jpg" },
	{ key: "light", image: "tutorial/neopixels.jpg" },
	{ key: "kinetic", image: "tutorial/servo.jpg" },
	{ key: "controller", image: "tutorial/potentiometer.jpg" },
];

// Newest first. Proper names, not translated.
const PAST_WORKSHOPS: {
	name: string;
	host: string;
	place?: string;
	date: string;
	url: string;
}[] = [
	{
		name: "DIY Performative Systems: Wireless MIDI and Interactive Systems",
		host: "UdK Berlin",
		place: "Berlin",
		date: "Oct–Nov 2026",
		url: "https://www.udk-berlin.de/universitaet/inter/aktuelle-inter-projekte-wise-2026-27-i2/diy-performative-systems-light-sound-objects-and-interactive-scenography-1/",
	},
	{
		name: "Zero-Code Rapid Prototyping of Wireless MIDI Devices with ESP-NOW MIDI",
		host: "NIME 2026",
		place: "London",
		date: "2026",
		url: "https://nime2026.org/proceedings/667.html",
	},
	{
		name: "Wireless MIDI for Instruments and Interactive Exhibits #2",
		host: "Pixel Forest",
		date: "Mar 2026",
		url: "https://pixel-forest.com/workshops/wireless-midi-for-instruments-and-interactive-exhibits-2/",
	},
	{
		name: "Wireless MIDI for Instruments and Interactive Exhibits",
		host: "Pixel Forest",
		date: "2026",
		url: "https://pixel-forest.com/event/wireless-midi-for-instruments-and-interactive-exhibits",
	},
];

const iconSx = { fontSize: 28 };

const Fact = ({
	icon,
	title,
	children,
}: {
	icon: ReactNode;
	title: string;
	children: ReactNode;
}) => (
	<Grid size={{ xs: 12, sm: 6, md: 3 }}>
		<SectionCard headingLevel="h3" icon={icon} title={title}>
			<Typography variant="body2" sx={{ opacity: 0.9 }}>
				{children}
			</Typography>
		</SectionCard>
	</Grid>
);

const Workshop = () => {
	const { t } = useTranslation();

	return (
		<PageLayout title={t("workshop_title")}>
			<WIPBanner />
			<Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 800 }}>
				{t("workshop_intro")}
			</Typography>

			<Stack spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
				<Typography variant="h2">{t("workshop_facts_title")}</Typography>
				<Grid container spacing={3}>
					<Fact
						icon={<GroupsIcon color="secondary" sx={iconSx} />}
						title={t("workshop_participants", { count: MAX_PARTICIPANTS })}
					>
						{t("workshop_participants_desc")}
					</Fact>
					<Fact
						icon={<InventoryIcon color="secondary" sx={iconSx} />}
						title={t("workshop_kits")}
					>
						{t("workshop_kits_desc")}
					</Fact>
					<Fact
						icon={<ShoppingCartIcon color="secondary" sx={iconSx} />}
						title={t("workshop_buy")}
					>
						{t("workshop_buy_desc")}
					</Fact>
					<Fact
						icon={<LaptopIcon color="secondary" sx={iconSx} />}
						title={t("workshop_bring")}
					>
						{t("workshop_bring_desc")}
					</Fact>
				</Grid>
				<Box>
					<Button
						variant="outlined"
						component={NavLink}
						to="/kits"
						endIcon={<ArrowForwardIcon />}
					>
						{t("workshop_kits_link")}
					</Button>
				</Box>
			</Stack>

			<Stack spacing={3} sx={{ mt: { xs: 6, md: 8 } }}>
				<Typography variant="h2">{t("workshop_use_cases_title")}</Typography>
				<Grid container spacing={3}>
					{USE_CASES.map(({ key, image }) => (
						<Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
							<Box
								component="section"
								sx={{
									height: "100%",
									border: 1,
									borderColor: "divider",
									borderRadius: 2,
									overflow: "hidden",
								}}
							>
								<Box
									component="img"
									src={`${import.meta.env.BASE_URL}/${image}`}
									alt=""
									loading="lazy"
									sx={{
										width: "100%",
										aspectRatio: "4 / 3",
										objectFit: "cover",
										display: "block",
									}}
								/>
								<Box p={2}>
									<Typography
										variant="h6"
										component="h3"
										fontWeight={600}
										gutterBottom
									>
										{t(`workshop_use_case_${key}`)}
									</Typography>
									<Typography variant="body2" sx={{ opacity: 0.9 }}>
										{t(`workshop_use_case_${key}_desc`)}
									</Typography>
								</Box>
							</Box>
						</Grid>
					))}
				</Grid>
			</Stack>

			<Stack spacing={2} sx={{ mt: { xs: 6, md: 8 } }}>
				<Typography variant="h2">{t("workshop_past_title")}</Typography>
				<List>
					{PAST_WORKSHOPS.map((w) => (
						<ListItem key={w.url} disablePadding>
							<ListItemButton
								component="a"
								href={w.url}
								target="_blank"
								rel="noopener"
								sx={{ borderRadius: 1 }}
							>
								<ListItemIcon>
									<PlaceIcon color="secondary" />
								</ListItemIcon>
								<ListItemText
									primary={w.name}
									secondary={[w.host, w.place, w.date]
										.filter(Boolean)
										.join(" · ")}
								/>
								<OpenInNewIcon fontSize="small" color="action" />
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Stack>

			<Box sx={{ mt: { xs: 6, md: 8 } }}>
				<SectionCard title={t("workshop_contact_title")}>
					<Typography variant="body1" sx={{ opacity: 0.9 }} mb={2}>
						{t("workshop_contact_desc")}
					</Typography>
					<Button
						variant="contained"
						href="https://grantler-instruments.com/contact"
						target="_blank"
						rel="noopener"
					>
						{t("workshop_contact")}
					</Button>
				</SectionCard>
			</Box>
		</PageLayout>
	);
};

export default Workshop;
