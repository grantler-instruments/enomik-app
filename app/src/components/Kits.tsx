import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import InputIcon from "@mui/icons-material/Input";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import OutputIcon from "@mui/icons-material/Output";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import {
	Box,
	Button,
	Container,
	Grid,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import BoardDiagram from "./kits/BoardDiagram";
import { BOARDS } from "./kits/boards";
import {
	INPUT_MODES,
	MODE_DESCRIPTION_KEYS,
	OUTPUT_MODES,
} from "./pinmapping/modes";

const Section = ({
	icon,
	title,
	children,
}: {
	icon: ReactNode;
	title: ReactNode;
	children: ReactNode;
}) => (
	<Paper
		component="section"
		variant="outlined"
		sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, borderColor: "divider" }}
	>
		<Box display="flex" alignItems="center" gap={1.5} mb={2}>
			{icon}
			<Typography variant="h6" fontWeight={600}>
				{title}
			</Typography>
		</Box>
		{children}
	</Paper>
);

const ModeList = ({ modes }: { modes: { label: string; value: number }[] }) => {
	const { t } = useTranslation();
	return (
		<Stack spacing={1.5}>
			{modes.map((mode) => (
				<Box key={mode.value}>
					<Typography variant="subtitle2" fontWeight={600}>
						{mode.label}
					</Typography>
					<Typography variant="body2" sx={{ opacity: 0.9 }}>
						{t(MODE_DESCRIPTION_KEYS[mode.value])}
					</Typography>
				</Box>
			))}
		</Stack>
	);
};

const iconSx = { fontSize: 28 };

const Kits = () => {
	const { t } = useTranslation();

	return (
		<Container maxWidth="lg" sx={{ my: { xs: 4, md: 8 }, pb: 6 }}>
			<Typography variant="h1">{t("kits_title")}</Typography>

			<Stack spacing={4}>
				<Typography variant="h2">{t("kits_boards_title")}</Typography>
				{BOARDS.map((board) => (
					<Section
						key={board.id}
						icon={<DeveloperBoardIcon color="secondary" sx={iconSx} />}
						title={board.name}
					>
						<Typography variant="body1" sx={{ opacity: 0.9 }} mb={2}>
							{t(board.descriptionKey)}
						</Typography>
						<BoardDiagram board={board} interactive />
						<Box display="flex" alignItems="center" gap={2} mt={1}>
							<Typography variant="body2" color="text.secondary">
								{t("kits_deploy_hint")}
							</Typography>
							<Button
								size="small"
								variant="outlined"
								component={NavLink}
								to="/configurator"
							>
								{t("configurator")}
							</Button>
						</Box>
					</Section>
				))}
			</Stack>

			<Grid
				container
				spacing={3}
				alignItems="center"
				sx={{ mt: { xs: 6, md: 8 } }}
			>
				<Grid size={{ xs: 12, md: 7 }}>
					<Typography variant="body1" sx={{ opacity: 0.9 }} gutterBottom>
						{t("kits_intro")}
					</Typography>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{t("kits_any_esp32")}
					</Typography>
					<Button
						variant="outlined"
						component={NavLink}
						to="/getting-started"
						sx={{ mt: 2 }}
					>
						{t("getting_started")}
					</Button>
				</Grid>
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
			</Grid>

			<Stack spacing={4} sx={{ mt: { xs: 6, md: 8 } }}>
				<Typography variant="h2">{t("kits_io_title")}</Typography>
				<Typography variant="body1" sx={{ opacity: 0.9 }}>
					{t("kits_io_intro")}
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Section
							icon={<InputIcon color="secondary" sx={iconSx} />}
							title={t("kits_inputs")}
						>
							<ModeList modes={INPUT_MODES} />
						</Section>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Section
							icon={<OutputIcon color="secondary" sx={iconSx} />}
							title={t("kits_outputs")}
						>
							<ModeList modes={OUTPUT_MODES} />
						</Section>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Section
							icon={
								<SettingsInputComponentIcon color="secondary" sx={iconSx} />
							}
							title="I2C"
						>
							<Typography variant="body2" sx={{ opacity: 0.9 }}>
								{t("kits_type_i2c_desc")}
							</Typography>
						</Section>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Section
							icon={<LightbulbIcon color="secondary" sx={iconSx} />}
							title="NeoPixel"
						>
							<Typography variant="body2" sx={{ opacity: 0.9 }}>
								{t("kits_type_neopixel_desc")}
							</Typography>
						</Section>
					</Grid>
				</Grid>
			</Stack>
		</Container>
	);
};

export default Kits;
