import {
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	FlashOn as FlashOnIcon,
	Search as SearchIcon,
	Upload as UploadIcon,
	UsbOff as UsbOffIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Chip,
	Collapse,
	FormControl,
	FormControlLabel,
	Grid,
	InputAdornment,
	InputLabel,
	LinearProgress,
	Link,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import type { ChangeEvent, FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { type FirmwarePreset, useSerialStore } from "../store/serial";
import { FIRMWARE_CATEGORIES } from "../utils/firmware";
import CollapsibleSection from "./common/CollapsibleSection";
import PageLayout from "./layout/PageLayout";
import Console from "./SerialConsole";

/** Known categories first, in their listed order; unknown ones after. */
const categoryOrder = (category: string): number => {
	const index = (FIRMWARE_CATEGORIES as readonly string[]).indexOf(category);
	return index === -1 ? FIRMWARE_CATEGORIES.length : index;
};

const formatVersionLabel = (versionPathSegment: string): string =>
	versionPathSegment.replace(/-/g, ".");

/** `embedded`: without page chrome (used in the tutorial). */
const FirmwareUploader: FC<{ embedded?: boolean }> = ({ embedded = false }) => {
	const {
		chipInfo,
		isFlashing,
		flashProgress,
		isConnected,
		flashFirmware,
		disconnect,
		init,
		availableFirmware,
		boards,
		versions,
		selectedBoardId,
		selectedVersion,
		setSelectedBoard,
		setSelectedVersion,
	} = useSerialStore();

	const { t } = useTranslation();

	const latestVersionPath = versions[0] ?? "";
	const versionLabel = (versionPathSegment: string): string => {
		const label = formatVersionLabel(versionPathSegment);
		return versionPathSegment === latestVersionPath
			? t("firmwareuploader_version_latest", { version: label })
			: label;
	};

	// const [step, setStep] = useState<UploadStep>("select");
	const [file, setFile] = useState<File | null>(null);
	const [selectedFirmware, setSelectedFirmware] = useState("");

	// Whether manual bootloader mode is required (default depends on board)
	const selectedBoard =
		boards.find((b) => b.id === selectedBoardId) ?? boards[0];
	const [bootloaderRequired, setBootloaderRequired] = useState(
		selectedBoard?.requiresManualBootloader ?? true,
	);
	const [bootConfirmed, setBootConfirmed] = useState(false);
	const [clearNvs, setClearNvs] = useState(false);

	const [versionOpen, setVersionOpen] = useState(false);
	const [boardOpen, setBoardOpen] = useState(false);
	const [fwOpen, setFwOpen] = useState(true);
	const [bootOpen, setBootOpen] = useState(false);
	const [flashOpen, setFlashOpen] = useState(false);
	const [moreFirmwareOpen, setMoreFirmwareOpen] = useState(false);
	const [moreFirmwareFilter, setMoreFirmwareFilter] = useState("");
	const { showToast, toast } = useToast();

	useEffect(() => {
		init();
	}, [init]);

	// Keep bootloader default in sync when board list changes (e.g. version switch)
	useEffect(() => {
		if (!selectedBoard) return;
		setBootloaderRequired(selectedBoard.requiresManualBootloader);
	}, [selectedBoard]);

	const handleVersionChange = async (
		versionPathSegment: string,
	): Promise<void> => {
		await setSelectedVersion(versionPathSegment);
		setBootConfirmed(false);
		setFile(null);
		setSelectedFirmware("");
		setVersionOpen(false);
		setBoardOpen(true);
		setFwOpen(false);
		setBootOpen(false);
		setFlashOpen(false);
	};

	const handleBoardChange = (boardId: string): void => {
		setSelectedBoard(boardId);
		const board = boards.find((b) => b.id === boardId) ?? boards[0];
		setBootloaderRequired(board.requiresManualBootloader);
		setBootConfirmed(false);
		setFile(null);
		setSelectedFirmware("");
		setBoardOpen(false);
		setFwOpen(true);
		setBootOpen(false);
		setFlashOpen(false);
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
		const f = e.target.files?.[0];
		if (!f?.name.endsWith(".bin")) return;
		setFile(f);
		setSelectedFirmware("");

		// Step 2 opens if bootloader required, otherwise flash directly
		setBootOpen(bootloaderRequired);
		setFlashOpen(!bootloaderRequired);
		// setStep("bootloader");
	};

	const handlePresetSelect = async (fw: FirmwarePreset): Promise<void> => {
		setSelectedFirmware(fw.label);

		// Auto-set bootloader requirement based on board
		const requiresBootloader = fw.requiresManualBootloader;
		setBootloaderRequired(requiresBootloader);

		try {
			const res = await fetch(fw.path);
			if (!res.ok) throw new Error(res.statusText);

			const blob = await res.blob();
			const filename = fw.path.split("/").pop() ?? "firmware.bin";
			const f = new File([blob], filename, {
				type: "application/octet-stream",
			});

			setFile(f);
			setFwOpen(false);

			setBootOpen(requiresBootloader);
			setFlashOpen(!requiresBootloader);
			// setStep("bootloader");
		} catch {
			alert(t("firmwareuploader_load_failed"));
		}
	};

	const mainFirmware = availableFirmware.filter((fw) => !fw.category);
	const categories = [
		...new Set(
			availableFirmware.flatMap((fw) => (fw.category ? [fw.category] : [])),
		),
	].sort((a, b) => categoryOrder(a) - categoryOrder(b));
	const categoryLabel = (category: string): string =>
		t(`firmwareuploader_category_${category}`, { defaultValue: category });

	/** "More firmware" entries matching the filter, grouped by category. */
	const filterQuery = moreFirmwareFilter.trim().toLowerCase();
	const filteredCategories = categories
		.map((category) => ({
			category,
			firmware: availableFirmware.filter(
				(fw) =>
					fw.category === category &&
					(!filterQuery ||
						[fw.label, fw.description, categoryLabel(category)].some((text) =>
							text.toLowerCase().includes(filterQuery),
						)),
			),
		}))
		.filter(({ firmware }) => firmware.length > 0);

	const renderFirmwareButton = (fw: FirmwarePreset) => (
		<Button
			key={`${fw.boardId}-${fw.label}`}
			variant={selectedFirmware === fw.label ? "contained" : "outlined"}
			size="large"
			fullWidth
			onClick={() => handlePresetSelect(fw)}
			disabled={isFlashing}
			sx={{
				py: 2,
				justifyContent: "flex-start",
				textAlign: "left",
			}}
		>
			<Box>
				<Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
					{fw.label}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", lineHeight: 1.3 }}
				>
					{fw.board} (v{fw.version}) — {fw.description}
				</Typography>
			</Box>
		</Button>
	);

	const handleConnectAndFlash = async (): Promise<void> => {
		if (!file || (bootloaderRequired && !bootConfirmed)) return;

		try {
			const result = await flashFirmware(
				file,
				bootloaderRequired,
				undefined,
				clearNvs,
			);
			if (!result) return;
			showToast(
				result.hardReset
					? t("firmwareuploader_flash_success")
					: t("firmwareuploader_flash_success_reset_manual"),
				"success",
			);
		} catch (err) {
			console.error(err);
		}
	};

	const body = (
		<>
			<Grid container spacing={2}>
				{/* Step 1: Version selection */}
				<Grid size={{ xs: 12 }}>
					<CollapsibleSection
						expanded={versionOpen}
						disabled={isFlashing}
						onChange={setVersionOpen}
						title={
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="subtitle2" component="span">
									{t("firmwareuploader_step1")}
								</Typography>
								{selectedVersion && (
									<Chip
										size="small"
										color="primary"
										label={versionLabel(selectedVersion)}
									/>
								)}
							</Stack>
						}
					>
						<FormControl fullWidth disabled={isFlashing}>
							<InputLabel id="firmware-version-label">
								{t("firmwareuploader_select_version")}
							</InputLabel>
							<Select
								labelId="firmware-version-label"
								label={t("firmwareuploader_select_version")}
								value={selectedVersion}
								onChange={(e) => handleVersionChange(e.target.value)}
							>
								{versions.map((version) => (
									<MenuItem key={version} value={version}>
										{versionLabel(version)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</CollapsibleSection>
				</Grid>

				{/* Step 2: Board selection */}
				<Grid size={{ xs: 12 }}>
					<CollapsibleSection
						expanded={boardOpen}
						disabled={isFlashing}
						onChange={setBoardOpen}
						title={
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="subtitle2" component="span">
									{t("firmwareuploader_step2")}
								</Typography>
								{selectedBoard && (
									<Chip
										size="small"
										color="primary"
										label={selectedBoard.label}
									/>
								)}
							</Stack>
						}
					>
						<Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
							{boards.map((board) => (
								<Button
									key={board.id}
									variant={
										selectedBoardId === board.id ? "contained" : "outlined"
									}
									size="large"
									onClick={() => handleBoardChange(board.id)}
									disabled={isFlashing}
								>
									{board.label}
								</Button>
							))}
						</Stack>
					</CollapsibleSection>
				</Grid>

				{/* Step 3: Firmware selection */}
				<Grid size={{ xs: 12 }}>
					<CollapsibleSection
						expanded={fwOpen}
						disabled={isFlashing}
						onChange={setFwOpen}
						title={
							<Stack
								direction="row"
								spacing={1}
								alignItems="center"
								flexWrap="wrap"
							>
								<Typography variant="subtitle2" component="span">
									{t("firmwareuploader_step3")}
								</Typography>
								{file && (
									<>
										{selectedFirmware && (
											<Chip
												size="small"
												color="primary"
												label={selectedFirmware}
											/>
										)}
										<Chip
											size="small"
											color="success"
											label={`${(file.size / 1024).toFixed(2)} KB`}
										/>
									</>
								)}
							</Stack>
						}
					>
						<Box
							sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
						>
							{mainFirmware.map(renderFirmwareButton)}
							{categories.length > 0 && (
								<>
									<Button
										variant="text"
										size="small"
										onClick={() => setMoreFirmwareOpen((open) => !open)}
										endIcon={
											moreFirmwareOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
										}
										sx={{ alignSelf: "flex-start" }}
									>
										{moreFirmwareOpen
											? t("firmwareuploader_less_firmware")
											: t("firmwareuploader_more_firmware")}
									</Button>
									<Collapse in={moreFirmwareOpen} unmountOnExit>
										<Box
											sx={{ display: "flex", flexDirection: "column", gap: 2 }}
										>
											<TextField
												size="small"
												fullWidth
												value={moreFirmwareFilter}
												onChange={(e) => setMoreFirmwareFilter(e.target.value)}
												placeholder={t("firmwareuploader_filter_firmware")}
												slotProps={{
													input: {
														startAdornment: (
															<InputAdornment position="start">
																<SearchIcon fontSize="small" />
															</InputAdornment>
														),
													},
												}}
											/>
											{filteredCategories.length === 0 && (
												<Typography variant="body2" color="text.secondary">
													{t("firmwareuploader_filter_no_match")}
												</Typography>
											)}
											{filteredCategories.map(({ category, firmware }) => (
												<Box
													key={category}
													sx={{
														display: "flex",
														flexDirection: "column",
														gap: 2,
													}}
												>
													<Typography variant="overline" color="text.secondary">
														{categoryLabel(category)}
													</Typography>
													{firmware.map(renderFirmwareButton)}
												</Box>
											))}
										</Box>
									</Collapse>
								</>
							)}
						</Box>
						<Box my={2} typography="body2">
							{t("firmwareuploader_releases_link")}{" "}
							<Link
								href="https://github.com/grantler-instruments/esp-now-midi/releases"
								target="_blank"
								rel="noopener noreferrer"
							>
								{t("firmwareuploader_releases_page")}
							</Link>
							.
						</Box>

						<Button
							variant="outlined"
							component="label"
							fullWidth
							size="large"
							startIcon={<UploadIcon />}
							sx={{ borderStyle: "dashed", borderWidth: 2 }}
							disabled={isFlashing}
						>
							{file ? file.name : t("firmwareuploader_custom_bin")}
							<input
								type="file"
								hidden
								accept=".bin"
								onChange={handleFileChange}
							/>
						</Button>
					</CollapsibleSection>
				</Grid>

				{/* Step 4: Bootloader toggle + confirmation */}
				<Grid size={{ xs: 12 }}>
					<CollapsibleSection
						expanded={bootOpen}
						disabled={!file || isFlashing}
						onChange={setBootOpen}
						title={
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="subtitle2" component="span">
									{t("firmwareuploader_step4")}
								</Typography>
								{bootConfirmed && (
									<Chip size="small" color="success" label={t("confirmed")} />
								)}
							</Stack>
						}
					>
						{/* Toggle bootloader requirement */}
						<FormControlLabel
							control={
								<Checkbox
									checked={bootloaderRequired}
									onChange={(e) => setBootloaderRequired(e.target.checked)}
								/>
							}
							label={t("firmwareuploader_manual_bootloader_required")}
						/>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", mb: 2, ml: 3 }}
						>
							{t("firmwareuploader_bootloader_mode")}
						</Typography>

						{/* Only show confirmation if bootloader is required */}
						{bootloaderRequired && (
							<>
								<Alert severity="warning" sx={{ my: 2 }}>
									{t("firmwareuploader_bootloader_mode_instruction")}
								</Alert>

								<FormControlLabel
									control={
										<Checkbox
											checked={bootConfirmed}
											onChange={(e) => {
												const checked = e.target.checked;
												setBootConfirmed(checked);

												if (checked) {
													setBootOpen(false);
													setFlashOpen(true);
													// setStep("flash");
												} else {
													setFlashOpen(false);
													// setStep("bootloader");
												}
											}}
										/>
									}
									label={t("firmwareuploader_bootloader_mode_confirmation")}
								/>
							</>
						)}
					</CollapsibleSection>
				</Grid>

				{/* Step 5: Flash */}
				<Grid size={{ xs: 12 }}>
					<CollapsibleSection
						expanded={flashOpen}
						disabled={bootloaderRequired && !bootConfirmed}
						title={
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="subtitle2" component="span">
									{t("firmwareuploader_step5")}
								</Typography>
								{chipInfo && (
									<Chip size="small" color="primary" label={chipInfo} />
								)}
								{isConnected && !isFlashing && (
									<Chip size="small" color="success" label={t("connected")} />
								)}
								{isFlashing && (
									<Chip size="small" color="warning" label={t("flashing")} />
								)}
							</Stack>
						}
					>
						<FormControlLabel
							control={
								<Checkbox
									checked={clearNvs}
									onChange={(e) => setClearNvs(e.target.checked)}
									disabled={isFlashing}
								/>
							}
							label={t("firmwareuploader_clear_nvs")}
						/>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", mb: 2, ml: 3 }}
						>
							{t("firmwareuploader_clear_nvs_help")}
						</Typography>

						<Button
							fullWidth
							size="large"
							variant="contained"
							startIcon={<FlashOnIcon />}
							onClick={handleConnectAndFlash}
							disabled={(bootloaderRequired && !bootConfirmed) || isFlashing}
						>
							{isFlashing ? t("flashing_progress") : t("connect_and_flash")}
						</Button>

						{isConnected && !isFlashing && (
							<Button
								sx={{ mt: 1 }}
								fullWidth
								variant="outlined"
								color="error"
								startIcon={<UsbOffIcon />}
								onClick={disconnect}
							>
								{t("disconnect")}
							</Button>
						)}
					</CollapsibleSection>
				</Grid>
			</Grid>

			{flashProgress && flashProgress.total > 0 && (
				<Card sx={{ mt: 3 }}>
					<CardContent>
						<Typography variant="body2">
							{flashProgress.percentage} %
						</Typography>
						<LinearProgress
							variant="determinate"
							value={flashProgress.percentage}
						/>
					</CardContent>
				</Card>
			)}

			<Console canSend={false} height={200} />

			{toast}
		</>
	);
	if (embedded) return body;
	return (
		<PageLayout
			title={t("firmware_uploader")}
			info={
				<>
					{t("firmwareuploader_intro")}{" "}
					<Link
						href="https://github.com/grantler-instruments/enomik-app/issues"
						target="_blank"
						rel="noopener noreferrer"
					>
						{t("firmwareuploader_issue_tracker")}
					</Link>
				</>
			}
		>
			{body}
		</PageLayout>
	);
};

export default FirmwareUploader;
