// ===== MidiConfigSection.tsx =====
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_TYPE_LABELS,
} from "../../store/midi.config";
import { type InputPinConfig, type OutputPinConfig } from "../../store/io";
import MinMax from "../MinMax";
import InfoWithTooltip from "../InfoWithTooltip";

const MIDI_TYPES = [
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
] as const;

type PinConfig = InputPinConfig | OutputPinConfig;

interface MidiConfigSectionProps {
  config: PinConfig;
  onChange: <K extends keyof PinConfig>(key: K, value: PinConfig[K]) => void;
  disabled: boolean;
  type: "input" | "output";
}

export default function MidiConfigSection({
  config,
  onChange,
  disabled,
  type,
}: MidiConfigSectionProps) {
  return (
    <Grid container gap={2}>
      <Grid size={{ xs: 6, sm: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Channel</InputLabel>
          <Select
            value={config.channel}
            label="Channel"
            onChange={(e) => onChange("channel", Number(e.target.value))}
            size="small"
            disabled={disabled}
          >
            {[...Array(16)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {i + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 6, sm: 3 }}>
        <FormControl fullWidth>
          <InputLabel>MIDI Type</InputLabel>
          <Select
            value={config.midiType}
            label="MIDI Type"
            onChange={(e) => onChange("midiType", e.target.value)}
            size="small"
            disabled={disabled}
          >
            {MIDI_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {MIDI_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {config.midiType === MIDI_CONTROL_CHANGE && (
        <Grid size={{ xs: 6, sm: 2 }}>
          <FormControl fullWidth>
            <TextField
              label="Controller"
              type="number"
              value={config.controller ?? ""}
              onChange={(e) => onChange("controller", Number(e.target.value))}
              size="small"
              disabled={disabled}
            />
          </FormControl>
        </Grid>
      )}

      {config.midiType === MIDI_NOTE_ON && (
        <Grid size={{ xs: 6, sm: 2 }}>
          <FormControl fullWidth>
            <TextField
              label="Note"
              type="number"
              value={config.note ?? 60}
              onChange={(e) => onChange("note", Number(e.target.value))}
              sx={{ width: 80 }}
              size="small"
              disabled={disabled}
            />
          </FormControl>
        </Grid>
      )}

      <Grid size={{ xs: 6, sm: 2 }}>
        <FormControl fullWidth>
          <MinMax
            min={config.midiMin ?? 0}
            max={config.midiMax ?? 127}
            onChangeMin={(value) => onChange("midiMin", value)}
            onChangeMax={(value) => onChange("midiMax", value)}
            bitResolution={config.midiType === MIDI_PITCH_BEND ? 14 : 7}
            disabled={disabled}
          />
        </FormControl>

        {config.midiType === MIDI_PITCH_BEND && type === "input" && (
          <InfoWithTooltip text="min/max values are transmitted as 7 bit values, you might lose precision. the underlying config api needs some adjustments. the actual pitchbend values are sent as 14bit values, no worries." />
        )}
      </Grid>
    </Grid>
  );
}
