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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useIOStore, type InputPinConfig } from "../store/io";

const PIN_MODES = ["analog", "digital"] as const;
const MIDI_TYPES = ["cc", "noteon", "pitchbend", "aftertouch"] as const;

interface InputProps {
  input: InputPinConfig;
}

const Input = ({ input }: InputProps) => {
  const updateInput = useIOStore((state) => state.updateInput);
  const removeInput = useIOStore((state) => state.removeInput);

  const [localInput, setLocalInput] = useState<InputPinConfig>(input);

  useEffect(() => {
    setLocalInput(input);
  }, [input]);

  const handleChange = <K extends keyof InputPinConfig>(
    key: K,
    value: InputPinConfig[K]
  ) => {
    const updated = { ...localInput, [key]: value };
    setLocalInput(updated);
    updateInput(localInput.uuid, updated);
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
      >
        <TextField
          label="Pin"
          type="number"
          value={localInput.pin}
          onChange={(e) => handleChange("pin", Number(e.target.value))}
          sx={{ width: 80 }}
        />

        <FormControl sx={{ width: 120 }}>
          <InputLabel>Mode</InputLabel>
          <Select
            value={localInput.mode}
            label="Mode"
            onChange={(e) =>
              handleChange("mode", e.target.value as typeof localInput.mode)
            }
          >
            {PIN_MODES.map((mode) => (
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
        <ArrowForwardIcon fontSize="small" sx={{ opacity: 0.7 }} />
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
      >
        <FormControl sx={{ width: 140 }}>
          <InputLabel>MIDI Type</InputLabel>
          <Select
            value={localInput.midiType}
            label="MIDI Type"
            onChange={(e) =>
              handleChange(
                "midiType",
                e.target.value as typeof localInput.midiType
              )
            }
          >
            {MIDI_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {localInput.midiType === "cc" && (
          <TextField
            label="Controller"
            type="number"
            value={localInput.controller ?? ""}
            onChange={(e) =>
              handleChange("controller", Number(e.target.value))
            }
            sx={{ width: 100 }}
          />
        )}

        {localInput.midiType === "noteon" && (
          <TextField
            label="Note"
            type="number"
            value={localInput.note ?? ""}
            onChange={(e) => handleChange("note", Number(e.target.value))}
            sx={{ width: 100 }}
          />
        )}

        {localInput.mode === "analog" && (
          <>
            <TextField
              label="Input Min"
              type="number"
              value={localInput.inputMin ?? ""}
              onChange={(e) =>
                handleChange("inputMin", Number(e.target.value))
              }
              sx={{ width: 100 }}
            />
            <TextField
              label="Input Max"
              type="number"
              value={localInput.inputMax ?? ""}
              onChange={(e) =>
                handleChange("inputMax", Number(e.target.value))
              }
              sx={{ width: 100 }}
            />
            <TextField
              label="Output Min"
              type="number"
              value={localInput.outputMin ?? ""}
              onChange={(e) =>
                handleChange("outputMin", Number(e.target.value))
              }
              sx={{ width: 100 }}
            />
            <TextField
              label="Output Max"
              type="number"
              value={localInput.outputMax ?? ""}
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
        onClick={() => removeInput(localInput.uuid)}
        sx={{ marginLeft: "auto" }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

export default Input;
