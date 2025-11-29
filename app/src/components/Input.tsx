import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useIOStore, type InputPinConfig } from "../store/io";
import {
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_POLY_AFTERTOUCH,
  MIDI_PROGRAM_CHANGE,
  MIDI_TYPE_LABELS,
} from "../store/midi.config";

const PIN_MODES = ["analog", "digital"] as const;
const MIDI_TYPES = [
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_PROGRAM_CHANGE,
  MIDI_POLY_AFTERTOUCH,
] as const;

interface InputProps {
  input: InputPinConfig;
}

const Input = ({ input }: InputProps) => {
  const updateInput = useIOStore((state) => state.updateInput);
  const removeInput = useIOStore((state) => state.removeInput);
  const duplicateInput = useIOStore((state) => state.duplicateInput);

  const [localInput, setLocalInput] = useState<InputPinConfig>(input);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDuplicate = () => {
    duplicateInput(localInput.uuid);
    handleMenuClose();
  };

  const handleDelete = () => {
    removeInput(localInput.uuid);
    handleMenuClose();
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
         {localInput.mode === "analog" && (
          <>
            <TextField
              label="Min"
              type="number"
              value={localInput.inputMin ?? ""}
              onChange={(e) => handleChange("inputMin", Number(e.target.value))}
              sx={{ width: 100 }}
            />
            <TextField
              label="Max"
              type="number"
              value={localInput.inputMax ?? ""}
              onChange={(e) => handleChange("inputMax", Number(e.target.value))}
              sx={{ width: 100 }}
            />
          </>
        )}
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
                {MIDI_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {localInput.midiType === MIDI_CONTROL_CHANGE && (
          <TextField
            label="Controller"
            type="number"
            value={localInput.controller ?? ""}
            onChange={(e) => handleChange("controller", Number(e.target.value))}
            sx={{ width: 100 }}
          />
        )}

        {localInput.midiType === MIDI_NOTE_ON && (
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

      {/* THREE-DOT MENU BUTTON */}
      <IconButton
        onClick={handleMenuOpen}
        sx={{ marginLeft: "auto" }}
        aria-label="more options"
      >
        <MoreVertIcon />
      </IconButton>

      {/* MENU */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Input;