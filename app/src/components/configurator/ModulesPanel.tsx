import {
	Alert,
	Box,
	Card,
	CardContent,
	Checkbox,
	FormControlLabel,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useIOStore } from "../../store/io";
import { deviceInputId, useMIDIStore } from "../../store/midi";
import {
	buildEnomikSysex,
	buildFeatureSettingsRequest,
	ENOMIK_COMMAND_GET_FEATURES,
	type FeatureConfig,
	type FeatureMappingMode,
	MIDI_CONTROL_CHANGE,
	MIDI_NOTE_ON,
	MIDI_PITCH_BEND,
} from "../../store/midi.config";
import {
	type ConfiguredFeature,
	type ModulesDeviceState,
	useModulesStore,
	waitForFeatureList,
	waitForFeatureSettings,
} from "../../store/modules";

const EMPTY_DEVICE: ModulesDeviceState = {
	status: "idle",
	features: [],
	error: null,
};
const MODES: FeatureMappingMode[] = [0, 1, 2];
const MIDI_TYPES = [MIDI_NOTE_ON, MIDI_CONTROL_CHANGE, MIDI_PITCH_BEND];

function scaled(value: number, scale: number) {
	return value / 10 ** scale;
}

function unscale(value: string, scale: number) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? Math.round(parsed * 10 ** scale) : 0;
}

function defaultConfig(feature: ConfiguredFeature): FeatureConfig {
	return {
		...feature.draft,
		settings: feature.settings.map((setting) => ({
			id: setting.descriptor.id,
			value:
				feature.draft.settings.find(
					(value) => value.id === setting.descriptor.id,
				)?.value ??
				setting.value ??
				setting.descriptor.defaultValue,
		})),
	};
}

function ModuleFeature({
	deviceId,
	feature,
}: {
	deviceId: string;
	feature: ConfiguredFeature;
}) {
	const { t } = useTranslation();
	const updateDraft = useModulesStore((state) => state.updateDraft);
	const updateSetting = useModulesStore((state) => state.updateSetting);
	const setModuleConfig = useIOStore((state) => state.setModuleConfig);
	const config = feature.draft;
	const applyPatch = (patch: Partial<FeatureConfig>) => {
		const current =
			useModulesStore
				.getState()
				.devices[deviceId]?.features.find(
					(item) => item.descriptor.id === feature.descriptor.id,
				)?.draft ?? config;
		updateDraft(deviceId, feature.descriptor.id, patch);
		setModuleConfig({ ...current, ...patch });
	};
	const applySetting = (settingId: number, value: number) => {
		const current =
			useModulesStore
				.getState()
				.devices[deviceId]?.features.find(
					(item) => item.descriptor.id === feature.descriptor.id,
				)?.draft ?? config;
		const settings = [
			...current.settings.filter((item) => item.id !== settingId),
			{ id: settingId, value },
		];
		updateSetting(deviceId, feature.descriptor.id, settingId, value);
		setModuleConfig({ ...current, settings });
	};
	const availableModes = MODES.filter(
		(mode) => (feature.descriptor.mappingModes & (1 << mode)) !== 0,
	);
	const isInput = feature.descriptor.direction === 1;
	const midiTypes =
		isInput && config.mode !== 0
			? [MIDI_NOTE_ON]
			: isInput
				? [MIDI_CONTROL_CHANGE, MIDI_PITCH_BEND]
				: MIDI_TYPES;
	const maxMidi = config.midiType === MIDI_PITCH_BEND ? 16383 : 127;
	const chooseMidiType = (midiType: number) => {
		applyPatch({
			midiType,
			midiMin: 0,
			midiMax: midiType === MIDI_PITCH_BEND ? 16383 : 127,
			...(midiType === MIDI_NOTE_ON && isInput && config.mode === 0
				? { mode: availableModes.includes(1) ? 1 : 2 }
				: {}),
		});
	};
	return (
		<Box sx={{ overflowX: "auto", borderBottom: 1, borderColor: "divider" }}>
			<Stack
				direction="row"
				alignItems="center"
				spacing={1}
				sx={{ width: "max(100%, max-content)", py: 1 }}
			>
				<Box sx={{ width: 170, flexShrink: 0 }}>
					<Typography variant="body2" fontWeight={600} noWrap>
						{feature.descriptor.name}
					</Typography>
					<Typography variant="caption" color="text.secondary" noWrap>
						{isInput ? t("module_input") : t("module_output")} ·{" "}
						{scaled(feature.descriptor.minValue, feature.descriptor.scale)}–
						{scaled(feature.descriptor.maxValue, feature.descriptor.scale)}{" "}
						{feature.descriptor.unit}
					</Typography>
				</Box>
				<FormControlLabel
					sx={{ m: 0, whiteSpace: "nowrap", flexShrink: 0 }}
					control={
						<Checkbox
							size="small"
							sx={config.enabled ? undefined : { color: "warning.main" }}
							checked={config.enabled}
							onChange={(event) =>
								applyPatch({ enabled: event.target.checked })
							}
						/>
					}
					label={t("module_enabled")}
				/>
				<Box
					display="grid"
					gridAutoFlow="column"
					gridAutoColumns="minmax(120px, 1fr)"
					alignItems="center"
					gap={1}
					sx={{
						flex: feature.settings.length > 0 ? 2 : 1,
						minWidth: 0,
					}}
				>
					<TextField
						select
						size="small"
						label={t("module_mapping_mode")}
						value={config.mode}
						onChange={(event) => {
							const mode = Number(event.target.value) as FeatureMappingMode;
							applyPatch({
								mode,
								...(mode !== 0
									? { midiType: MIDI_NOTE_ON }
									: config.midiType === MIDI_NOTE_ON
										? { midiType: MIDI_CONTROL_CHANGE }
										: {}),
							});
						}}
					>
						{availableModes.map((mode) => (
							<MenuItem key={mode} value={mode}>
								{t(
									[
										"module_mode_linear",
										"module_mode_above",
										"module_mode_below",
									][mode],
								)}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						size="small"
						label={t("module_midi_type")}
						value={config.midiType}
						onChange={(event) => chooseMidiType(Number(event.target.value))}
					>
						{midiTypes.map((type) => (
							<MenuItem key={type} value={type}>
								{type === MIDI_NOTE_ON
									? t("module_midi_note")
									: type === MIDI_PITCH_BEND
										? t("module_midi_pitch_bend")
										: t("module_midi_cc")}
							</MenuItem>
						))}
					</TextField>
					<TextField
						size="small"
						type="number"
						label={t("module_channel")}
						value={config.midiChannel}
						inputProps={{ min: 1, max: 16 }}
						onChange={(event) =>
							applyPatch({
								midiChannel: Math.min(
									16,
									Math.max(1, Number(event.target.value) || 1),
								),
							})
						}
					/>
					{config.midiType !== MIDI_PITCH_BEND && (
						<TextField
							size="small"
							type="number"
							label={
								config.midiType === MIDI_NOTE_ON
									? t("module_note")
									: t("module_cc_number")
							}
							value={config.midiNumber}
							inputProps={{ min: 0, max: 127 }}
							onChange={(event) =>
								applyPatch({
									midiNumber: Math.min(
										127,
										Math.max(0, Number(event.target.value) || 0),
									),
								})
							}
						/>
					)}
					<TextField
						size="small"
						type="number"
						label={t("module_midi_min")}
						value={config.midiMin}
						inputProps={{ min: 0, max: maxMidi }}
						onChange={(event) =>
							applyPatch({
								midiMin: Math.min(
									config.midiMax,
									maxMidi,
									Math.max(0, Number(event.target.value) || 0),
								),
							})
						}
					/>
					<TextField
						size="small"
						type="number"
						label={t("module_midi_max")}
						value={config.midiMax}
						inputProps={{ min: 0, max: maxMidi }}
						onChange={(event) =>
							applyPatch({
								midiMax: Math.min(
									maxMidi,
									Math.max(config.midiMin, Number(event.target.value) || 0),
								),
							})
						}
					/>
					{config.mode !== 0 && isInput && (
						<>
							<TextField
								size="small"
								type="number"
								label={`${t("module_threshold")} (${feature.descriptor.unit})`}
								value={scaled(config.threshold, feature.descriptor.scale)}
								inputProps={{
									min: scaled(
										feature.descriptor.minValue,
										feature.descriptor.scale,
									),
									max: scaled(
										feature.descriptor.maxValue,
										feature.descriptor.scale,
									),
									step: 1 / 10 ** feature.descriptor.scale,
								}}
								onChange={(event) =>
									applyPatch({
										threshold: Math.min(
											feature.descriptor.maxValue,
											Math.max(
												feature.descriptor.minValue,
												unscale(event.target.value, feature.descriptor.scale),
											),
										),
									})
								}
							/>
							<TextField
								size="small"
								type="number"
								label={`${t("module_hysteresis")} (${feature.descriptor.unit})`}
								value={scaled(config.hysteresis, feature.descriptor.scale)}
								inputProps={{
									min: 0,
									step: 1 / 10 ** feature.descriptor.scale,
								}}
								onChange={(event) =>
									applyPatch({
										hysteresis: Math.max(
											0,
											unscale(event.target.value, feature.descriptor.scale),
										),
									})
								}
							/>
						</>
					)}
				</Box>
				{feature.settings.length > 0 && (
					<Box
						display="grid"
						gridAutoFlow="column"
						gridAutoColumns="minmax(120px, 1fr)"
						alignItems="center"
						gap={1}
						sx={{ flex: 1, minWidth: 0 }}
					>
						{feature.settings.map(({ descriptor, value }) => {
							const current =
								config.settings.find((setting) => setting.id === descriptor.id)
									?.value ?? value;
							const label = descriptor.unit
								? `${descriptor.name} (${descriptor.unit})`
								: descriptor.name;
							if (descriptor.type === 1)
								return (
									<FormControlLabel
										key={descriptor.id}
										control={
											<Checkbox
												sx={
													current !== 0 ? undefined : { color: "warning.main" }
												}
												checked={current !== 0}
												onChange={(event) =>
													applySetting(
														descriptor.id,
														event.target.checked ? 1 : 0,
													)
												}
											/>
										}
										label={descriptor.name}
									/>
								);
							if (descriptor.type === 2)
								return (
									<TextField
										key={descriptor.id}
										select
										size="small"
										label={label}
										value={current}
										onChange={(event) =>
											applySetting(descriptor.id, Number(event.target.value))
										}
									>
										{descriptor.options.map((option, index) => (
											<MenuItem
												key={option}
												value={descriptor.minValue + index}
											>
												{option}
											</MenuItem>
										))}
									</TextField>
								);
							return (
								<TextField
									key={descriptor.id}
									size="small"
									type="number"
									label={label}
									value={current}
									inputProps={{
										min: descriptor.minValue,
										max: descriptor.maxValue,
									}}
									onChange={(event) => {
										const nextValue = Math.min(
											descriptor.maxValue,
											Math.max(
												descriptor.minValue,
												Number(event.target.value) || 0,
											),
										);
										let constrained = nextValue;
										if (descriptor.role === 1) {
											const maxSetting = feature.settings.find(
												(item) => item.descriptor.role === 2,
											);
											const maxValue = maxSetting
												? (config.settings.find(
														(item) => item.id === maxSetting.descriptor.id,
													)?.value ?? maxSetting.value)
												: undefined;
											if (maxValue !== undefined)
												constrained = Math.min(constrained, maxValue - 1);
										} else if (descriptor.role === 2) {
											const minSetting = feature.settings.find(
												(item) => item.descriptor.role === 1,
											);
											const minValue = minSetting
												? (config.settings.find(
														(item) => item.id === minSetting.descriptor.id,
													)?.value ?? minSetting.value)
												: undefined;
											if (minValue !== undefined)
												constrained = Math.max(constrained, minValue + 1);
										}
										applySetting(descriptor.id, constrained);
									}}
								/>
							);
						})}
					</Box>
				)}
			</Stack>
		</Box>
	);
}

const ModulesPanel = () => {
	const { t } = useTranslation();
	const deviceId =
		useMIDIStore((state) => state.selectedConfiguratorOutputDevice) ?? "-1";
	const sendMessage = useMIDIStore((state) => state.sendMessage);
	const deviceState = useModulesStore(
		(state) => state.devices[deviceId] ?? EMPTY_DEVICE,
	);
	const startDiscovery = useModulesStore((state) => state.startDiscovery);
	const finishDiscovery = useModulesStore((state) => state.finishDiscovery);
	const setError = useModulesStore((state) => state.setError);
	const moduleGroups = Object.values(
		deviceState.features.reduce<
			Record<
				number,
				{ moduleId: number; name: string; features: ConfiguredFeature[] }
			>
		>((groups, feature) => {
			const { moduleId, moduleName } = feature.descriptor;
			const group = groups[moduleId] ?? {
				moduleId,
				name: moduleName,
				features: [],
			};
			group.features.push(feature);
			groups[moduleId] = group;
			return groups;
		}, {}),
	);

	useEffect(() => {
		let cancelled = false;
		const inputId = deviceId !== "-1" ? deviceInputId(deviceId) : undefined;
		if (!inputId) {
			setError(deviceId, "unpaired");
			return;
		}
		startDiscovery(deviceId);
		const request = {
			id: uuidv4(),
			timestamp: Date.now(),
			type: 0xf0,
			data: buildEnomikSysex(ENOMIK_COMMAND_GET_FEATURES),
		};
		const listPromise = waitForFeatureList(deviceId, inputId);
		if (!sendMessage(request, deviceId)) {
			setError(deviceId, "disconnected");
			return;
		}
		void (async () => {
			const features = await listPromise;
			if (cancelled) return;
			if (!features) {
				if (useModulesStore.getState().devices[deviceId]?.status === "loading")
					setError(deviceId, "timeout");
				return;
			}
			for (const feature of features) {
				if (cancelled) return;
				const settingsPromise = waitForFeatureSettings(
					deviceId,
					inputId,
					feature.descriptor.id,
				);
				if (
					!sendMessage(
						{
							id: uuidv4(),
							timestamp: Date.now(),
							type: 0xf0,
							data: buildFeatureSettingsRequest(feature.descriptor.id),
						},
						deviceId,
					)
				) {
					setError(deviceId, "disconnected");
					return;
				}
				const settings = await settingsPromise;
				if (cancelled) return;
				if (!settings) {
					setError(deviceId, "settings");
					return;
				}
			}
			const moduleState = useModulesStore.getState().devices[deviceId];
			const localConfigs = useIOStore.getState().moduleConfigs;
			for (const feature of moduleState?.features ?? []) {
				const localConfig = localConfigs.find(
					(config) => config.featureId === feature.descriptor.id,
				);
				const draft = localConfig
					? {
							...localConfig,
							settings: feature.settings.map((setting) => ({
								id: setting.descriptor.id,
								value:
									localConfig.settings.find(
										(value) => value.id === setting.descriptor.id,
									)?.value ?? setting.value,
							})),
						}
					: defaultConfig(feature);
				useModulesStore
					.getState()
					.updateDraft(deviceId, feature.descriptor.id, draft);
				if (!localConfig) useIOStore.getState().setModuleConfig(draft);
			}
			if (!cancelled) finishDiscovery(deviceId);
		})();
		return () => {
			cancelled = true;
		};
	}, [deviceId, sendMessage, startDiscovery, finishDiscovery, setError]);

	return (
		<Stack spacing={1.5}>
			{deviceState.status === "loading" && (
				<Alert severity="info">{t("module_discovering")}</Alert>
			)}
			{deviceState.status === "error" && (
				<Alert severity="warning">
					{t(`module_error_${deviceState.error}`)}
				</Alert>
			)}
			{deviceState.status === "ready" && deviceState.features.length === 0 && (
				<Alert severity="info">{t("module_none")}</Alert>
			)}
			{moduleGroups.map((group) => (
				<Card component="section" variant="outlined" key={group.moduleId}>
					<CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
						<Typography
							variant="subtitle2"
							fontWeight={600}
							sx={{ px: 1, py: 1 }}
						>
							{group.name}
						</Typography>
						<Stack spacing={0}>
							{group.features.map((feature) => (
								<ModuleFeature
									key={feature.descriptor.id}
									deviceId={deviceId}
									feature={feature}
								/>
							))}
						</Stack>
					</CardContent>
				</Card>
			))}
		</Stack>
	);
};

export default ModulesPanel;
