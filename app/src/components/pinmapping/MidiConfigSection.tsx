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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <Grid container gap={2} flex={1}>
      <Grid size={{ xs: 6, sm: 2 }}>
        <FormControl fullWidth>
          <InputLabel>{t("channel")}</InputLabel>
          <Select
            value={config.channel}
            label={t("channel")}
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
          <InputLabel>{t("midi_type")}</InputLabel>
          <Select
            value={config.midiType}
            label={t("midi_type")}
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
              label={t("controller")}
              type="number"
              value={
                config.controller !== undefined && config.controller !== null
                  ? String(Number(config.controller))
                  : ""
              }
              onChange={(e) => onChange("controller", Number(e.target.value))}
              size="small"
              disabled={disabled}
              fullWidth
            />
          </FormControl>
        </Grid>
      )}

      {config.midiType === MIDI_NOTE_ON && (
        <Grid size={{ xs: 6, sm: 2 }}>
          <FormControl fullWidth>
            <TextField
              label={t("note")}
              type="number"
              value={
                config.note !== undefined && config.note !== null
                  ? String(Number(config.note))
                  : 60
              }
              onChange={(e) => onChange("note", Number(e.target.value))}
              size="small"
              disabled={disabled}
              fullWidth
            />
          </FormControl>
        </Grid>
      )}

      <Grid size={{ xs: 6, sm: 4 }}>
        <FormControl fullWidth>
          <MinMax
            min={Number(config.midiMin) ?? 0}
            max={Number(config.midiMax) ?? 127}
            onChangeMin={(value) => onChange("midiMin", value)}
            onChangeMax={(value) => onChange("midiMax", value)}
            bitResolution={config.midiType === MIDI_PITCH_BEND ? 14 : 7}
            disabled={disabled}
          />
        </FormControl>

        {config.midiType === MIDI_PITCH_BEND && type === "input" && (
          <InfoWithTooltip text={t("pitch_bend_precision_info")} />
        )}
      </Grid>
    </Grid>
  );
}
