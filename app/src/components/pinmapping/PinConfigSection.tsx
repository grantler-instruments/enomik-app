import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  sysexPinModeAnalogIn,
  sysexPinModeDigitalIn,
  sysexPinModeDigitalInPullup,
  sysexPinModeDigitalOut,
  sysexPinModePWMOut,
  sysexPinModeTouch,
} from "../../store/midi.config";
import MinMax from "../MinMax";
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
}
export default function PinConfigSection({
  config,
  onChange,
  disabled,
  type,
}: MidiConfigSectionProps) {
  const modes = type === "input" ? INPUT_MODES : OUTPUT_MODES;

  return (
    <Grid container gap={2}>
      <Grid size={{ xs: 6, sm: 4 }}>
        <TextField
          label="Pin"
          type="number"
          value={config.pin}
          onChange={(e) => onChange("pin", Number(e.target.value))}
          sx={{ width: 80 }}
          size="small"
          disabled={disabled}
        />
      </Grid>

      <Grid size={{ xs: 6, sm: 4 }}>
        <FormControl>
          <InputLabel>Mode</InputLabel>
          <Select
            value={config.mode}
            label="Mode"
            onChange={(e) => onChange("mode", e.target.value)}
            size="small"
            disabled={disabled}
          >
            {modes.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 6, sm: 4 }}>
        {config.mode === sysexPinModeTouch && type === "input" && (
          <TextField
            value={config.threshold}
            onChange={(e) => onChange("threshold", Number(e.target.value))}
            label="Threshold"
            size="small"
            disabled={disabled}
          />
        )}
      </Grid>

      {/* <Grid size={{ xs: 6, sm: 2 }}>
        {config.mode === sysexPinModePWMOut && type === "output" && (
          <MinMax
            min={config.pinMin ?? 0}
            max={config.pinMax ?? 1024}
            onChangeMin={(value) => onChange("pinMin", value)}
            onChangeMax={(value) => onChange("pinMax", value)}
            disabled={disabled}
          />
        )}
      </Grid> */}
    </Grid>
  );
}
