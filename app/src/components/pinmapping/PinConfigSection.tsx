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
  const modes = type === "input" ? INPUT_MODES : OUTPUT_MODES;

  const getModeDescription = () => {
    if (type === "input") {
      switch (config.mode) {
        case sysexPinModeAnalogIn:
          return "Read a continuous value (e.g. from a potentiometer or sensor).";
        case sysexPinModeDigitalIn:
          return "Digital input. Reads LOW/HIGH, use with switches or buttons (with external resistors).";
        case sysexPinModeDigitalInPullup:
          return "Digital input with internal pull-up. Use for buttons wired to ground; idle HIGH, pressed = LOW.";
        case sysexPinModeTouch:
          return "Capacitive touch input. Use Threshold to tune touch sensitivity.";
        default:
          return "";
      }
    }

    switch (config.mode) {
      case sysexPinModeDigitalOut:
        return "Digital output. Drives LOW/HIGH for LEDs, relays or other digital loads.";
      case sysexPinModePWMOut:
        return "PWM output. Use for dimming LEDs or controlling motor speed with an analog-like value.";
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
              ? `Pin ${config.pin} is used as both an input and an output`
              : ""
          }
          arrow
        >
          <TextField
            label="Pin"
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
          <InputLabel>Mode</InputLabel>
          <Select
            value={config.mode}
            label="Mode"
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
              label="Threshold"
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
