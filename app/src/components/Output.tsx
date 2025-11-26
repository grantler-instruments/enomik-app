import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useIOStore, type OutputPinConfig } from "../store/io";
import {
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_POLY_AFTERTOUCH,
  MIDI_PROGRAM_CHANGE,
  MIDI_TYPE_LABELS,
} from "../store/midi.config";

const OUTPUT_MODES = ["digital", "pwm"] as const;
const MIDI_TYPES = [
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_PROGRAM_CHANGE,
  MIDI_POLY_AFTERTOUCH,
] as const;

interface OutputProps {
  output: OutputPinConfig;
}

const Output = ({ output }: OutputProps) => {
  const updateOutput = useIOStore((state) => state.updateOutput);
  const removeOutput = useIOStore((state) => state.removeOutput);

  const [localOutput, setLocalOutput] = useState<OutputPinConfig>(output);

  useEffect(() => {
    setLocalOutput(output);
  }, [output]);

  const handleChange = <K extends keyof OutputPinConfig>(
    key: K,
    value: OutputPinConfig[K]
  ) => {
    const updated = { ...localOutput, [key]: value };
    setLocalOutput(updated);
    updateOutput(localOutput.uuid, updated);
  };

  return (
    <Box
      border="1px solid gray"
      padding={1}
      margin={1}
      borderRadius={1}
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      gap={2}
      alignItems="center"
    >
      {/* ---------------- INPUT SECTION ---------------- */}
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        gap={1}
        padding={1}
        border="1px solid #ccc"
        borderRadius={1}
        flex={1}
        minWidth={0}
      >
        <TextField
          label="Pin"
          type="number"
          value={localOutput.pin}
          onChange={(e) => handleChange("pin", Number(e.target.value))}
          sx={{ width: 80 }}
        />

        <FormControl sx={{ width: 120 }}>
          <InputLabel>Mode</InputLabel>
          <Select
            value={localOutput.mode}
            label="Mode"
            onChange={(e) =>
              handleChange("mode", e.target.value as typeof localOutput.mode)
            }
          >
            {OUTPUT_MODES.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {mode}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ---------------- CENTERED ARROW ---------------- */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        paddingX={1}
      >
        <ArrowBackIcon fontSize="small" sx={{ opacity: 0.7 }} />
      </Box>

      {/* ---------------- OUTPUT SECTION ---------------- */}
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        gap={1}
        padding={1}
        border="1px solid #ccc"
        borderRadius={1}
        flex={1}
        minWidth={0}
      >
        <FormControl sx={{ width: 140 }}>
          <InputLabel>MIDI Type</InputLabel>
          <Select
            value={localOutput.midiType}
            label="MIDI Type"
            onChange={(e) =>
              handleChange(
                "midiType",
                e.target.value as typeof localOutput.midiType
              )
            }
          >
            {MIDI_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {MIDI_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* cc */}
        {localOutput.midiType === MIDI_CONTROL_CHANGE && (
          <TextField
            label="Controller"
            type="number"
            value={localOutput.controller ?? ""}
            onChange={(e) => handleChange("controller", Number(e.target.value))}
            sx={{ width: 100 }}
          />
        )}

        {/* noteon */}
        {localOutput.midiType === MIDI_NOTE_ON && (
          <>
            <TextField
              label="Note"
              type="number"
              value={localOutput.note ?? ""}
              onChange={(e) => handleChange("note", Number(e.target.value))}
              sx={{ width: 100 }}
            />

            <TextField
              label="Velocity Sensitive"
              value={localOutput.velocitySensitive ? "yes" : "no"}
              select
              sx={{ width: 130 }}
              onChange={(e) =>
                handleChange("velocitySensitive", e.target.value === "yes")
              }
            >
              <MenuItem value="yes">yes</MenuItem>
              <MenuItem value="no">no</MenuItem>
            </TextField>
          </>
        )}

        {/* pwm */}
        {localOutput.mode === "pwm" && (
          <>
            <TextField
              label="Output Min"
              type="number"
              value={localOutput.outputMin ?? ""}
              onChange={(e) =>
                handleChange("outputMin", Number(e.target.value))
              }
              sx={{ width: 100 }}
            />
            <TextField
              label="Output Max"
              type="number"
              value={localOutput.outputMax ?? ""}
              onChange={(e) =>
                handleChange("outputMax", Number(e.target.value))
              }
              sx={{ width: 100 }}
            />
          </>
        )}
      </Box>

      {/* DELETE BUTTON */}
      <IconButton
        onClick={() => removeOutput(localOutput.uuid)}
        sx={{ marginLeft: "auto" }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

export default Output;
