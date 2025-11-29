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
  Paper,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import {
  useIOStore,
  type InputPinConfig,
  type OutputPinConfig,
} from "../store/io";
import {
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_POLY_AFTERTOUCH,
  MIDI_PROGRAM_CHANGE,
  MIDI_TYPE_LABELS,
} from "../store/midi.config";

const INPUT_MODES = ["analog", "digital"] as const;
const OUTPUT_MODES = ["digital", "pwm"] as const;
const MIDI_TYPES = [
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
  MIDI_PROGRAM_CHANGE,
  MIDI_POLY_AFTERTOUCH,
] as const;

type PinConfig = InputPinConfig | OutputPinConfig;

interface PinMappingProps {
  config: PinConfig;
  type: "input" | "output";
}

const PinMapping = ({ config, type }: PinMappingProps) => {
  const updateInput = useIOStore((state) => state.updateInput);
  const removeInput = useIOStore((state) => state.removeInput);
  const duplicateInput = useIOStore((state) => state.duplicateInput);

  const updateOutput = useIOStore((state) => state.updateOutput);
  const removeOutput = useIOStore((state) => state.removeOutput);
  const duplicateOutput = useIOStore((state) => state.duplicateOutput);

  const [localConfig, setLocalConfig] = useState<PinConfig>(config);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isInput = type === "input";
  const availableModes = isInput ? INPUT_MODES : OUTPUT_MODES;

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = <K extends keyof PinConfig>(
    key: K,
    value: PinConfig[K]
  ) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);

    if (isInput) {
      updateInput(localConfig.uuid, updated as InputPinConfig);
    } else {
      updateOutput(localConfig.uuid, updated as OutputPinConfig);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDuplicate = () => {
    if (isInput) {
      duplicateInput(localConfig.uuid);
    } else {
      duplicateOutput(localConfig.uuid);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (isInput) {
      removeInput(localConfig.uuid);
    } else {
      removeOutput(localConfig.uuid);
    }
    handleMenuClose();
  };

  // Helper to check if config has a specific property
  const hasProperty = <K extends keyof PinConfig>(key: K): boolean => {
    return key in localConfig;
  };

  return (
    <Box
      padding={2}
      margin={1}
      borderRadius={1}
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      gap={4}
      alignItems="center"
    >
      {/* ---------------- LEFT SECTION (MIDI for outputs, Pin for inputs) ---------------- */}
      <Paper
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
          padding: 1,
          minWidth: 0,
          flex: 1,
        }}
      >
        {isInput ? (
          // INPUT: Pin config first
          <>
            <TextField
              label="Pin"
              type="number"
              value={localConfig.pin}
              onChange={(e) => handleChange("pin", Number(e.target.value))}
              sx={{ width: 80 }}
            />

            <FormControl sx={{ width: 120 }}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={localConfig.mode}
                label="Mode"
                onChange={(e) =>
                  handleChange(
                    "mode",
                    e.target.value as typeof localConfig.mode
                  )
                }
              >
                {availableModes.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {localConfig.mode === "analog" && hasProperty("inputMin") && (
              <>
                <TextField
                  label="Min"
                  type="number"
                  value={(localConfig as InputPinConfig).inputMin ?? ""}
                  onChange={(e) =>
                    handleChange("inputMin" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Max"
                  type="number"
                  value={(localConfig as InputPinConfig).inputMax ?? ""}
                  onChange={(e) =>
                    handleChange("inputMax" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
              </>
            )}
          </>
        ) : (
          // OUTPUT: MIDI config first
          <>
            <FormControl sx={{ width: 140 }}>
              <InputLabel>MIDI Type</InputLabel>
              <Select
                value={localConfig.midiType}
                label="MIDI Type"
                onChange={(e) =>
                  handleChange(
                    "midiType",
                    e.target.value as typeof localConfig.midiType
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

            {localConfig.midiType === MIDI_CONTROL_CHANGE &&
              hasProperty("controller") && (
                <TextField
                  label="Controller"
                  type="number"
                  value={(localConfig as OutputPinConfig).controller ?? ""}
                  onChange={(e) =>
                    handleChange("controller" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
              )}

            {localConfig.midiType === MIDI_NOTE_ON && hasProperty("note") && (
              <>
                <TextField
                  label="Note"
                  type="number"
                  value={(localConfig as OutputPinConfig).note ?? ""}
                  onChange={(e) =>
                    handleChange("note" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />

                {hasProperty("velocitySensitive") && (
                  <TextField
                    label="Velocity Sensitive"
                    value={
                      (localConfig as OutputPinConfig).velocitySensitive
                        ? "yes"
                        : "no"
                    }
                    select
                    sx={{ width: 130 }}
                    onChange={(e) =>
                      handleChange(
                        "velocitySensitive" as any,
                        e.target.value === "yes"
                      )
                    }
                  >
                    <MenuItem value="yes">yes</MenuItem>
                    <MenuItem value="no">no</MenuItem>
                  </TextField>
                )}
              </>
            )}

            {localConfig.mode === "pwm" && hasProperty("outputMin") && (
              <>
                <TextField
                  label="Min"
                  type="number"
                  value={(localConfig as OutputPinConfig).outputMin ?? ""}
                  onChange={(e) =>
                    handleChange("outputMin" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Max"
                  type="number"
                  value={(localConfig as OutputPinConfig).outputMax ?? ""}
                  onChange={(e) =>
                    handleChange("outputMax" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
              </>
            )}
          </>
        )}
      </Paper>

      {/* ---------------- CENTERED ARROW ---------------- */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        paddingX={1}
      >
        <ArrowForwardIcon fontSize="small" sx={{ opacity: 0.7 }} />
      </Box>

      {/* ---------------- RIGHT SECTION (Pin for outputs, MIDI for inputs) ---------------- */}
      <Paper
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
          padding: 1,
          minWidth: 0,
          flex: 1,
        }}
      >
        <>
          {isInput ? (
            // INPUT: MIDI config on right
            <>
              <FormControl sx={{ width: 140 }}>
                <InputLabel>MIDI Type</InputLabel>
                <Select
                  value={localConfig.midiType}
                  label="MIDI Type"
                  onChange={(e) =>
                    handleChange(
                      "midiType",
                      e.target.value as typeof localConfig.midiType
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

              {localConfig.midiType === MIDI_CONTROL_CHANGE &&
                hasProperty("controller") && (
                  <TextField
                    label="Controller"
                    type="number"
                    value={(localConfig as InputPinConfig).controller ?? ""}
                    onChange={(e) =>
                      handleChange("controller" as any, Number(e.target.value))
                    }
                    sx={{ width: 100 }}
                  />
                )}

              {localConfig.midiType === MIDI_NOTE_ON && hasProperty("note") && (
                <TextField
                  label="Note"
                  type="number"
                  value={(localConfig as InputPinConfig).note ?? ""}
                  onChange={(e) =>
                    handleChange("note" as any, Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
              )}

              {localConfig.mode === "analog" && hasProperty("outputMin") && (
                <>
                  <TextField
                    label="Min"
                    type="number"
                    value={(localConfig as InputPinConfig).outputMin ?? ""}
                    onChange={(e) =>
                      handleChange("outputMin" as any, Number(e.target.value))
                    }
                    sx={{ width: 100 }}
                  />
                  <TextField
                    label="Max"
                    type="number"
                    value={(localConfig as InputPinConfig).outputMax ?? ""}
                    onChange={(e) =>
                      handleChange("outputMax" as any, Number(e.target.value))
                    }
                    sx={{ width: 100 }}
                  />
                </>
              )}
            </>
          ) : (
            // OUTPUT: Pin config on right
            <>
              <TextField
                label="Pin"
                type="number"
                value={localConfig.pin}
                onChange={(e) => handleChange("pin", Number(e.target.value))}
                sx={{ width: 80 }}
              />

              <FormControl sx={{ width: 120 }}>
                <InputLabel>Mode</InputLabel>
                <Select
                  value={localConfig.mode}
                  label="Mode"
                  onChange={(e) =>
                    handleChange(
                      "mode",
                      e.target.value as typeof localConfig.mode
                    )
                  }
                >
                  {availableModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </>
      </Paper>

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
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
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

export default PinMapping;
