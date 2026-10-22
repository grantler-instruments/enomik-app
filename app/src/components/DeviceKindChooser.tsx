import {
	FormControl,
	InputLabel,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDeviceKind } from "../hooks/useDevice";
import { type DeviceKind, useDeviceStore } from "../store/device";
import { useMIDIStore } from "../store/midi";

/** Client or dongle for the selected port: guessed from the port name, user can override. */
const DeviceKindChooser = ({ deviceId }: { deviceId: string }) => {
	const { t } = useTranslation();
	const initialized = useMIDIStore((state) => state.initialized);
	const kind = useDeviceKind(deviceId);
	const setKind = useDeviceStore((state) => state.setKind);
	const hasPort = useMIDIStore((state) =>
		state.outputs.some((port) => port.id === deviceId),
	);
	if (!initialized) return null;
	return (
		<Tooltip title={t("tooltip_device_kind")}>
			<FormControl size="small" sx={{ flexShrink: 0 }}>
				{/* Sits on the outline like the port picker's label */}
				<InputLabel
					shrink
					disabled={!hasPort}
					sx={{ backgroundColor: "background.default", px: 0.5, ml: -0.5 }}
				>
					{t("device_kind")}
				</InputLabel>
				<ToggleButtonGroup
					size="small"
					exclusive
					color="primary"
					disabled={!hasPort}
					value={hasPort ? kind : null}
					// Filled like a contained button, so the active kind reads at a glance
					sx={{
						"& .MuiToggleButton-root": { height: 40, px: 2 },
						"& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover":
							{
								backgroundColor: "primary.main",
								color: "primary.contrastText",
							},
					}}
					onChange={(_, value: DeviceKind | null) => {
						if (value) setKind(deviceId, value);
					}}
				>
					<ToggleButton value="client">{t("device_kind_client")}</ToggleButton>
					<ToggleButton value="dongle">{t("device_kind_dongle")}</ToggleButton>
				</ToggleButtonGroup>
			</FormControl>
		</Tooltip>
	);
};

export default DeviceKindChooser;
