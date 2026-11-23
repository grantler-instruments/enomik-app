import { create } from "zustand";
import {
	decodeFeatureConfigPayload,
	decodeFeatureInfo,
	decodeFeatureSettingInfo,
	ENOMIK_COMMAND_ERROR_RESPONSE,
	ENOMIK_COMMAND_GET_FEATURE_SETTINGS_RESPONSE,
	ENOMIK_COMMAND_GET_FEATURES_RESPONSE,
	ENOMIK_COMMAND_SET_FEATURE_CONFIG_RESPONSE,
	type FeatureConfig,
	type FeatureInfo,
	type FeatureSettingInfo,
} from "./midi.config";

export type ConfiguredFeature = FeatureInfo & {
	draft: FeatureConfig;
	settings: FeatureSettingInfo[];
	saving: boolean;
	saveError: string | null;
};

export interface ModulesDeviceState {
	status: "idle" | "loading" | "ready" | "error";
	features: ConfiguredFeature[];
	error: string | null;
}

const emptyDevice = (): ModulesDeviceState => ({
	status: "idle",
	features: [],
	error: null,
});

interface ModulesStore {
	devices: Record<string, ModulesDeviceState>;
	startDiscovery: (deviceId: string) => void;
	addFeature: (deviceId: string, info: FeatureInfo) => void;
	addSetting: (deviceId: string, setting: FeatureSettingInfo) => void;
	finishDiscovery: (deviceId: string) => void;
	setError: (deviceId: string, error: string) => void;
	updateDraft: (
		deviceId: string,
		featureId: number,
		patch: Partial<FeatureConfig>,
	) => void;
	updateSetting: (
		deviceId: string,
		featureId: number,
		settingId: number,
		value: number,
	) => void;
	setSaving: (
		deviceId: string,
		featureId: number,
		saving: boolean,
		error?: string | null,
	) => void;
	acceptConfig: (deviceId: string, config: FeatureConfig) => void;
}

export const useModulesStore = create<ModulesStore>((set) => ({
	devices: {},
	startDiscovery: (deviceId) =>
		set((state) => ({
			devices: {
				...state.devices,
				[deviceId]: { status: "loading", features: [], error: null },
			},
		})),
	addFeature: (deviceId, info) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			const supportedModes = [0, 1, 2].filter(
				(mode) => (info.descriptor.mappingModes & (1 << mode)) !== 0,
			);
			const defaultMode = (supportedModes[0] ?? 0) as FeatureConfig["mode"];
			const initialConfig: FeatureConfig = info.hasConfig
				? { ...info.config, settings: [...info.config.settings] }
				: {
						...info.config,
						mode: defaultMode,
						midiType: defaultMode === 0 ? 0xb0 : 0x90,
					};
			const feature: ConfiguredFeature = {
				...info,
				draft: initialConfig,
				settings: [],
				saving: false,
				saveError: null,
			};
			return {
				devices: {
					...state.devices,
					[deviceId]: {
						...current,
						features: [
							...current.features.filter(
								(item) => item.descriptor.id !== info.descriptor.id,
							),
							feature,
						],
					},
				},
			};
		}),
	addSetting: (deviceId, setting) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: {
						...current,
						features: current.features.map((feature) => {
							if (feature.descriptor.id !== setting.featureId) return feature;
							const settings = [
								...feature.settings.filter(
									(item) => item.descriptor.id !== setting.descriptor.id,
								),
								setting,
							];
							const values = feature.draft.settings.filter(
								(item) => item.id !== setting.descriptor.id,
							);
							values.push({ id: setting.descriptor.id, value: setting.value });
							return {
								...feature,
								settings,
								draft: { ...feature.draft, settings: values },
							};
						}),
					},
				},
			};
		}),
	finishDiscovery: (deviceId) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: { ...current, status: "ready", error: null },
				},
			};
		}),
	setError: (deviceId, error) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: { ...current, status: "error", error },
				},
			};
		}),
	updateDraft: (deviceId, featureId, patch) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: {
						...current,
						features: current.features.map((feature) =>
							feature.descriptor.id === featureId
								? {
										...feature,
										draft: { ...feature.draft, ...patch },
										saveError: null,
									}
								: feature,
						),
					},
				},
			};
		}),
	updateSetting: (deviceId, featureId, settingId, value) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: {
						...current,
						features: current.features.map((feature) => {
							if (feature.descriptor.id !== featureId) return feature;
							const settings = feature.draft.settings.filter(
								(item) => item.id !== settingId,
							);
							settings.push({ id: settingId, value });
							return {
								...feature,
								draft: { ...feature.draft, settings },
								saveError: null,
							};
						}),
					},
				},
			};
		}),
	setSaving: (deviceId, featureId, saving, error = null) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: {
						...current,
						features: current.features.map((feature) =>
							feature.descriptor.id === featureId
								? { ...feature, saving, saveError: error }
								: feature,
						),
					},
				},
			};
		}),
	acceptConfig: (deviceId, config) =>
		set((state) => {
			const current = state.devices[deviceId] ?? emptyDevice();
			return {
				devices: {
					...state.devices,
					[deviceId]: {
						...current,
						features: current.features.map((feature) =>
							feature.descriptor.id === config.featureId
								? {
										...feature,
										config,
										hasConfig: true,
										draft: config,
										saving: false,
										saveError: null,
									}
								: feature,
						),
					},
				},
			};
		}),
}));

type Waiter<T> = {
	deviceId: string;
	inputId: string;
	resolve: (result: T | null) => void;
	timeout: ReturnType<typeof setTimeout>;
};

let featureWaiter: (Waiter<FeatureInfo[]> & { items: FeatureInfo[] }) | null =
	null;
let settingsWaiter:
	| (Waiter<FeatureSettingInfo[]> & {
			featureId: number;
			items: FeatureSettingInfo[];
	  })
	| null = null;
let configWaiter: (Waiter<FeatureConfig> & { featureId: number }) | null = null;

function clearWaiter<T>(waiter: Waiter<T> | null, value: T | null) {
	if (!waiter) return;
	clearTimeout(waiter.timeout);
	waiter.resolve(value);
}

export function waitForFeatureList(
	deviceId: string,
	inputId: string,
	timeoutMs = 4000,
) {
	if (featureWaiter) clearWaiter(featureWaiter, null);
	if (settingsWaiter) clearWaiter(settingsWaiter, null);
	return new Promise<FeatureInfo[] | null>((resolve) => {
		const waiter = {
			deviceId,
			inputId,
			items: [] as FeatureInfo[],
			resolve,
			timeout: setTimeout(() => {
				if (featureWaiter === waiter) featureWaiter = null;
				resolve(null);
			}, timeoutMs),
		};
		featureWaiter = waiter;
	});
}

export function waitForFeatureSettings(
	deviceId: string,
	inputId: string,
	featureId: number,
	timeoutMs = 2500,
) {
	if (settingsWaiter) clearWaiter(settingsWaiter, null);
	return new Promise<FeatureSettingInfo[] | null>((resolve) => {
		const waiter = {
			deviceId,
			inputId,
			featureId,
			items: [] as FeatureSettingInfo[],
			resolve,
			timeout: setTimeout(() => {
				if (settingsWaiter === waiter) settingsWaiter = null;
				resolve(null);
			}, timeoutMs),
		};
		settingsWaiter = waiter;
	});
}

export function waitForFeatureConfig(
	deviceId: string,
	inputId: string,
	featureId: number,
	timeoutMs = 2500,
) {
	if (configWaiter) clearWaiter(configWaiter, null);
	return new Promise<FeatureConfig | null>((resolve) => {
		const waiter = {
			deviceId,
			inputId,
			featureId,
			resolve,
			timeout: setTimeout(() => {
				if (configWaiter === waiter) configWaiter = null;
				resolve(null);
			}, timeoutMs),
		};
		configWaiter = waiter;
	});
}

export function receiveFeatureSysEx(
	deviceId: string,
	inputId: string,
	command: number,
	payload: ArrayLike<number>,
) {
	const modules = useModulesStore.getState();
	if (
		command === ENOMIK_COMMAND_GET_FEATURES_RESPONSE &&
		featureWaiter?.inputId === inputId &&
		featureWaiter.deviceId === deviceId
	) {
		if (payload.length === 0) {
			const waiter = featureWaiter;
			featureWaiter = null;
			clearTimeout(waiter.timeout);
			waiter.resolve(waiter.items);
		} else {
			const info = decodeFeatureInfo(payload);
			if (info) {
				featureWaiter.items.push(info);
				modules.addFeature(deviceId, info);
			}
		}
		return;
	}
	if (
		command === ENOMIK_COMMAND_GET_FEATURE_SETTINGS_RESPONSE &&
		settingsWaiter?.inputId === inputId &&
		settingsWaiter.deviceId === deviceId
	) {
		if (payload.length === 0) {
			const waiter = settingsWaiter;
			settingsWaiter = null;
			clearTimeout(waiter.timeout);
			waiter.resolve(waiter.items);
		} else {
			const setting = decodeFeatureSettingInfo(payload);
			if (setting && setting.featureId === settingsWaiter.featureId) {
				settingsWaiter.items.push(setting);
				modules.addSetting(deviceId, setting);
			}
		}
		return;
	}
	if (command === ENOMIK_COMMAND_SET_FEATURE_CONFIG_RESPONSE) {
		const config = decodeFeatureConfigPayload(payload);
		if (config) {
			modules.acceptConfig(deviceId, config);
			if (
				configWaiter?.inputId === inputId &&
				configWaiter.deviceId === deviceId &&
				configWaiter.featureId === config.featureId
			) {
				const waiter = configWaiter;
				configWaiter = null;
				clearTimeout(waiter.timeout);
				waiter.resolve(config);
			}
		}
		return;
	}
	if (command === ENOMIK_COMMAND_ERROR_RESPONSE && payload.length >= 2) {
		const failedCommand = payload[0];
		if (
			failedCommand === 0x18 &&
			featureWaiter?.inputId === inputId &&
			featureWaiter.deviceId === deviceId
		) {
			const waiter = featureWaiter;
			featureWaiter = null;
			clearWaiter(waiter, null);
			modules.setError(deviceId, "unsupported");
		} else if (
			failedCommand === 0x1a &&
			settingsWaiter?.inputId === inputId &&
			settingsWaiter.deviceId === deviceId
		) {
			const waiter = settingsWaiter;
			settingsWaiter = null;
			clearWaiter(waiter, null);
			modules.setError(deviceId, "settings");
		} else if (
			failedCommand === 0x19 &&
			configWaiter?.inputId === inputId &&
			configWaiter.deviceId === deviceId
		) {
			const waiter = configWaiter;
			configWaiter = null;
			clearWaiter(waiter, null);
			modules.setSaving(deviceId, waiter.featureId, false, "write");
		}
	}
}
