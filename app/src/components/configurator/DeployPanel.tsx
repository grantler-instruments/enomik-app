import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import DownloadIcon from "@mui/icons-material/Download";
import {
	Alert,
	Box,
	Button,
	Chip,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	activeConfigs,
	findDuplicatePins,
	findInvalidPeers,
	type InputPinConfig,
	type OutputPinConfig,
	type useIOStore,
} from "../../store/io";
import {
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_TYPE_LABELS,
} from "../../store/midi.config";
import SectionCard from "../common/SectionCard";
import { INPUT_MODES, OUTPUT_MODES } from "../pinmapping/modes";
import { GlobalIcon, WirelessMidiIcon } from "../SectionIcons";

const MODES = [...INPUT_MODES, ...OUTPUT_MODES];

/** Label/value pairs, labels in a column of their own. */
const Facts = ({ rows }: { rows: [string, ReactNode][] }) => (
	<Box
		component="dl"
		display="grid"
		gridTemplateColumns="max-content 1fr"
		columnGap={3}
		rowGap={1}
		m={0}
	>
		{rows.map(([label, value]) => (
			<Box key={label} display="contents">
				<Typography component="dt" color="text.secondary">
					{label}
				</Typography>
				<Typography component="dd" m={0} fontWeight={500} minWidth={0}>
					{value}
				</Typography>
			</Box>
		))}
	</Box>
);

const Empty = () => (
	<Typography color="text.secondary" component="span">
		–
	</Typography>
);

/** Last step: what is about to be written, problems that block it, and the button. */
const DeployPanel = ({
	store: useConfig,
	isDongle,
	deviceName,
	canDeploy,
	onDeploy,
	onSave,
}: {
	store: typeof useIOStore;
	isDongle: boolean;
	/** Name of the selected MIDI output, if one is connected. */
	deviceName?: string;
	canDeploy: boolean;
	onDeploy: () => void;
	onSave: () => void;
}) => {
	const { t } = useTranslation();
	const inputs = useConfig((state) => state.inputs);
	const outputs = useConfig((state) => state.outputs);
	const peers = useConfig((state) => state.peers);
	const name = useConfig((state) => state.name);
	const midiLoopback = useConfig((state) => state.midiLoopback);
	const powerSave = useConfig((state) => state.powerSave);

	const duplicatePins = isDongle
		? []
		: [...findDuplicatePins(inputs, outputs)].sort((a, b) => a - b);
	const invalidPeers = findInvalidPeers(peers);
	const onOff = (value: boolean) => t(value ? "state_on" : "state_off");

	// Muted rows are not deployed.
	const pins: {
		config: InputPinConfig | OutputPinConfig;
		direction: "input" | "output";
	}[] = [
		...activeConfigs(inputs).map((config) => ({
			config,
			direction: "input" as const,
		})),
		...activeConfigs(outputs).map((config) => ({
			config,
			direction: "output" as const,
		})),
	].sort((a, b) => a.config.pin - b.config.pin);

	const peersCard = (
		<SectionCard
			icon={<WirelessMidiIcon />}
			title={`${t("configurator_tab_wireless")} (${peers.length})`}
		>
			{peers.length === 0 ? (
				<Empty />
			) : (
				<Stack direction="row" flexWrap="wrap" gap={1}>
					{peers.map((peer) => (
						<Chip
							key={peer.uuid}
							label={peer.macAddress || "–"}
							variant="outlined"
							color={invalidPeers.includes(peer) ? "error" : "default"}
							sx={{ fontFamily: "monospace" }}
						/>
					))}
				</Stack>
			)}
		</SectionCard>
	);

	return (
		<Stack spacing={3}>
			{/* What happens, where it goes, and the button */}
			<Paper
				variant="outlined"
				sx={{
					p: { xs: 2, md: 3 },
					borderRadius: 2,
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					alignItems: { md: "center" },
					gap: 2,
				}}
			>
				<Box flex={1} minWidth={0}>
					<Typography variant="body1" mb={1}>
						{t("deploy_step_intro")}
					</Typography>
					{deviceName ? (
						<Typography variant="body2" color="text.secondary">
							{t("midi_output")}:{" "}
							<Box component="strong" color="text.primary">
								{deviceName}
							</Box>
						</Typography>
					) : (
						<Typography variant="body2" color="warning.main">
							{t("deploy_no_device")}
						</Typography>
					)}
				</Box>
				<Stack direction="row" spacing={2} flexShrink={0}>
					<Button
						variant="outlined"
						startIcon={<DownloadIcon />}
						onClick={onSave}
					>
						{t("deploy_save_file")}
					</Button>
					<Button
						variant="contained"
						size="large"
						onClick={onDeploy}
						disabled={!canDeploy}
					>
						{t("deploy")}
					</Button>
				</Stack>
			</Paper>

			{duplicatePins.length > 0 && (
				<Alert severity="error">
					{t("deploy_toast_duplicate_pins", { pins: duplicatePins.join(", ") })}
				</Alert>
			)}
			{invalidPeers.length > 0 && (
				<Alert severity="error">
					{t("deploy_toast_invalid_peer", {
						macs: invalidPeers.map((peer) => peer.macAddress || "–").join(", "),
					})}
				</Alert>
			)}

			{isDongle ? (
				peersCard
			) : (
				<>
					<Box
						display="grid"
						gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
						gap={3}
					>
						<SectionCard icon={<GlobalIcon />} title={t("section_global")}>
							<Facts
								rows={[
									[t("client_name"), name || t("client_name_placeholder")],
									[t("midi_loopback"), onOff(midiLoopback)],
									[t("power_save"), onOff(powerSave)],
								]}
							/>
						</SectionCard>
						{peersCard}
					</Box>
					<SectionCard
						icon={<DeveloperBoardIcon />}
						title={`${t("configurator_tab_pins")} (${pins.length})`}
					>
						{pins.length === 0 ? (
							<Empty />
						) : (
							<TableContainer>
								<Table
									size="small"
									sx={{ "& td, & th": { whiteSpace: "nowrap" } }}
								>
									<TableHead>
										<TableRow>
											<TableCell>{t("pin")}</TableCell>
											<TableCell>{t("mode")}</TableCell>
											<TableCell>{t("channel")}</TableCell>
											<TableCell>{t("midi_type")}</TableCell>
											<TableCell>{t("cc_or_note")}</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{pins.map(({ config, direction }) => (
											<TableRow
												key={config.uuid}
												sx={
													duplicatePins.includes(config.pin)
														? { "& td": { color: "error.main" } }
														: undefined
												}
											>
												<TableCell sx={{ fontWeight: 600 }}>
													<Stack direction="row" alignItems="center" gap={1}>
														GPIO {config.pin}
														<Chip
															size="small"
															variant="outlined"
															label={t(`kits_${direction}`)}
															color={
																direction === "input" ? "primary" : "secondary"
															}
														/>
													</Stack>
												</TableCell>
												<TableCell>
													{MODES.find((m) => m.value === config.mode)?.label}
												</TableCell>
												<TableCell>{config.channel}</TableCell>
												<TableCell>
													{MIDI_TYPE_LABELS[config.midiType]}
												</TableCell>
												<TableCell>
													{config.midiType === MIDI_CONTROL_CHANGE
														? config.controller
														: config.midiType === MIDI_NOTE_ON
															? (config.note ?? 60)
															: "–"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</SectionCard>
				</>
			)}
		</Stack>
	);
};

export default DeployPanel;
