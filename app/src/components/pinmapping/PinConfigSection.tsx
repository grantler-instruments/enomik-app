import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  sysexPinModeAnalogIn,
  sysexPinModeDigitalIn,
  sysexPinModeDigitalInPullup,
  sysexPinModeDigitalOut,
  sysexPinModePWMOut,
  sysexPinModeTouch,
} from "../../store/midi.config";
import MinMax from "../MinMax";
import InfoWithTooltip from "../InfoWithTooltip";
import type { InputPinConfig, OutputPinConfig } from "../../store/io";
import { useTranslation } from "react-i18next";

const INPUT_MODES = [
  { label: "ANALOG", value: sysexPinModeAnalogIn },
  { label: "INPUT (digital)", value: sysexPinModeDigitalIn },
  { label: "INPUT_PULLUP (digital)", value: sysexPinModeDigitalInPullup },
  { label: "INPUT_TOUCH", value: sysexPinModeTouch },
];

const OUTPUT_MODES = [
  { label: "OUTPUT (digital)", value: sysexPinModeDigitalOut },
  { label: "PWM (analog)", value: sysexPinModePWMOut },
];

type PinConfig = InputPinConfig | OutputPinConfig;
interface MidiConfigSectionProps {
  config: PinConfig;
  onChange: <K extends keyof PinConfig>(key: K, value: PinConfig[K]) => void;
  disabled: boolean;
  type: "input" | "output";
  hasConflict?: boolean;
}
export default function PinConfigSection({
  config,
  onChange,
  disabled,
  type,
  hasConflict = false,
}: MidiConfigSectionProps) {
  const { t } = useTranslation();
  const modes = type === "input" ? INPUT_MODES : OUTPUT_MODES;

  const getModeDescription = () => {
    if (type === "input") {
      switch (config.mode) {
        case sysexPinModeAnalogIn:
          return t("pin_mode_analog_desc");
        case sysexPinModeDigitalIn:
          return t("pin_mode_digital_in_desc");
        case sysexPinModeDigitalInPullup:
          return t("pin_mode_digital_in_pullup_desc");
        case sysexPinModeTouch:
          return t("pin_mode_touch_desc");
        default:
          return "";
      }
    }

    switch (config.mode) {
      case sysexPinModeDigitalOut:
        return t("pin_mode_digital_out_desc");
      case sysexPinModePWMOut:
        return t("pin_mode_pwm_desc");
      default:
        return "";
    }
  };

  return (
    <Grid container gap={2} flex={1}>
      <Grid size={{ xs: 6, sm: 2 }}>
        <Tooltip
          title={
            hasConflict
              ? t("pin_conflict", { pin: config.pin })
              : ""
          }
          arrow
        >
          <TextField
            label={t("pin")}
            type="number"
            value={
              config.pin != null
                ? String(Number(config.pin))
                : ""
            }
            onChange={(e) => onChange("pin", Number(e.target.value))}
            size="small"
            disabled={disabled}
            fullWidth
            error={hasConflict}
            slotProps={{
              input: hasConflict
                ? {
                    endAdornment: (
                      <InputAdornment position="end">
                        <WarningAmberIcon
                          fontSize="small"
                          color="error"
                        />
                      </InputAdornment>
                    ),
                  }
                : undefined,
            }}
          />
        </Tooltip>
      </Grid>

      <Grid size={{ xs: 6, sm: 4 }}>
        <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t("mode")}</InputLabel>
          <Select
            value={config.mode}
            label={t("mode")}
            onChange={(e) => onChange("mode", e.target.value)}
            size="small"
            disabled={disabled}
            fullWidth
          >
            {modes.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <InfoWithTooltip text={getModeDescription()} />
      </Grid>

      <Grid size={{ xs: 6, sm: 2 }}>
          {config.mode === sysexPinModeTouch && type === "input" && (
            <TextField
              value={
                config.threshold != null
                  ? String(Number(config.threshold))
                  : ""
              }
              onChange={(e) => onChange("threshold", Number(e.target.value))}
              label={t("threshold")}
              size="small"
              disabled={disabled}
            />
          )}
      </Grid>

      <Grid size={{ xs: 6, sm: 4 }} display={"flex"}>
        {config.mode === sysexPinModePWMOut && type === "output" && (
          <MinMax
            min={Number(config.pinMin) ?? 0}
            max={Number(config.pinMax) ?? 1024}
            onChangeMin={(value) => onChange("pinMin", value)}
            onChangeMax={(value) => onChange("pinMax", value)}
            disabled={disabled}
            sx={{ flex: 1 }}
          />
        )}
      </Grid>
    </Grid>
  );
}
