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
  // MIDI_POLY_AFTERTOUCH,
  // MIDI_PROGRAM_CHANGE,
  MIDI_TYPE_LABELS,
  sysexPinModeDigitalIn,
  sysexPinModeAnalogIn,
  sysexPinModeDigitalInPullup,
  sysexPinModeDigitalOut,
  sysexPinModePWMOut,
  sysexPinModeTouch,
} from "../store/midi.config";
import MinMax from "./MinMax";
import InfoWithTooltip from "./InfoWithTooltip";

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
const MIDI_TYPES = [
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MIDI_PITCH_BEND,
] as const;

type PinConfig = InputPinConfig | OutputPinConfig;

interface PinMappingProps {
  config: PinConfig;
  type: "input" | "output";
  disabled?: boolean;
}

const PinMapping = ({ config, type, disabled = false }: PinMappingProps) => {
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
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = <K extends keyof PinConfig>(
    key: K,
    value: PinConfig[K]
  ) => {
    const updated = { ...localConfig, [key]: value };
    if (key === "mode") {
      if (value === sysexPinModeAnalogIn || value === sysexPinModePWMOut) {
        // Set default pinMin/pinMax for analog/PWM modes
        updated.pinMin = 0;
        updated.pinMax = 1023;
      } else if (value === sysexPinModeTouch) {
        updated.pinMin = 0;
        updated.pinMax = 100;
        updated.threshold = 40;
      } else {
        updated.pinMin = 0;
        updated.pinMax = 1;
      }
    }
    if (key === "midiType") {
      // Reset controller/note when changing midiType
      if (value === MIDI_CONTROL_CHANGE) {
        updated.midiMin = 0;
        updated.midiMax = 127;
      } else if (value === MIDI_NOTE_ON) {
        updated.midiMin = 0;
        updated.midiMax = 127;
      } else if (value === MIDI_PITCH_BEND) {
        updated.midiMin = -8192;
        updated.midiMax = 8191;
      }
    }
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
      borderRadius={1}
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      gap={4}
      alignItems="center"
      marginTop={1}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      padding={1}
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

            <FormControl>
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
                sx={{ width: 160 }}
              >
                {availableModes.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* {(localConfig.mode === sysexPinModeAnalogIn ||
              localConfig.mode === sysexPinModeTouch) && (
              <MinMax
                min={(localConfig as OutputPinConfig).pinMin ?? 0}
                max={(localConfig as OutputPinConfig).pinMax ?? 1024}
                onChangeMin={(value) => handleChange("pinMin" as any, value)}
                onChangeMax={(value) => handleChange("pinMax" as any, value)}
                disabled={true}
              />
            )} */}
            {localConfig.mode === sysexPinModeTouch && (
              <TextField
                value={localConfig.threshold}
                onChange={(e) =>
                  handleChange("threshold", Number(e.target.value))
                }
                label="Threshold"
              />
            )}
          </>
        ) : (
          // OUTPUT: MIDI config first
          <>
            <FormControl sx={{ width: 80 }}>
              <InputLabel>Channel</InputLabel>
              <Select
                value={localConfig.channel}
                label="Channel"
                onChange={(e) =>
                  handleChange("channel", Number(e.target.value))
                }
              >
                {[...Array(16)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ width: 160 }}>
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
                  sx={{ width: 80 }}
                />
              )}

            {localConfig.midiType === MIDI_NOTE_ON && hasProperty("note") && (
              <TextField
                label="Note"
                type="number"
                value={(localConfig as OutputPinConfig).note ?? ""}
                onChange={(e) =>
                  handleChange("note" as any, Number(e.target.value))
                }
              />
            )}

            {
              <MinMax
                min={(localConfig as OutputPinConfig).midiMin ?? 0}
                max={(localConfig as OutputPinConfig).midiMax ?? 127}
                onChangeMin={(value) => handleChange("midiMin" as any, value)}
                onChangeMax={(value) => handleChange("midiMax" as any, value)}
              />
            }
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
              <FormControl sx={{ width: 80 }}>
                <InputLabel>Channel</InputLabel>
                <Select
                  value={localConfig.channel}
                  label="Channel"
                  onChange={(e) =>
                    handleChange("channel", Number(e.target.value))
                  }
                >
                  {[...Array(16)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ width: 160 }}>
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

              {localConfig.midiType === MIDI_CONTROL_CHANGE && (
                <TextField
                  label="Controller"
                  type="number"
                  value={(localConfig as InputPinConfig).controller ?? ""}
                  onChange={(e) =>
                    handleChange("controller" as any, Number(e.target.value))
                  }
                  sx={{ width: 80 }}
                />
              )}

              {localConfig.midiType === MIDI_NOTE_ON && (
                <TextField
                  label="Note"
                  type="number"
                  value={(localConfig as InputPinConfig).note ?? 60}
                  onChange={(e) =>
                    handleChange("note" as any, Number(e.target.value))
                  }
                />
              )}
              <MinMax
                min={(localConfig as InputPinConfig).midiMin ?? 0}
                max={(localConfig as InputPinConfig).midiMax ?? 127}
                onChangeMin={(value) => handleChange("midiMin" as any, value)}
                onChangeMax={(value) => handleChange("midiMax" as any, value)}
                bitResolution={
                  localConfig.midiType === MIDI_PITCH_BEND ? 14 : 7
                }
              />

              {localConfig.midiType === MIDI_PITCH_BEND && (
                <InfoWithTooltip text="min/max values are transmitted as 7 bit values, you might lose precision. the underlying config api needs some adjustments. the actual pitchbend values are sent as 14bit values, no worries. " />
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

              <FormControl>
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
                  sx={{ width: 160 }}
                >
                  {availableModes.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {localConfig.mode === sysexPinModePWMOut && (
                <MinMax
                  min={(localConfig as InputPinConfig).pinMin ?? 0}
                  max={(localConfig as InputPinConfig).pinMax ?? 1024}
                  onChangeMin={(value) => handleChange("pinMin" as any, value)}
                  onChangeMax={(value) => handleChange("pinMax" as any, value)}
                />
              )}
            </>
          )}
        </>
      </Paper>

      {/* THREE-DOT MENU BUTTON */}
      <IconButton
        onClick={handleMenuOpen}
        sx={{ marginLeft: "auto", opacity: hovered ? 1 : 0 }}
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
