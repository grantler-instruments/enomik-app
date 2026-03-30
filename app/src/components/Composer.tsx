import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { useMIDIStore, type MidiMessage } from "../store/midi";
import { v4 as uuidv4 } from "uuid";
import { MIDI_STATUS, typeToLabel } from "../utils/midi";
import MidiDeviceChooser from "./MidiDeviceChooser";

const Composer = () => {
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  const selectedOutputId = useMIDIStore(
    (state) => state.selectedComposerOutputDevice
  );
  const setSelectedOutputId = useMIDIStore(
    (state) => state.setSelectedComposerOutputDevice
  );

  const channel = useMIDIStore((state) => state.composerChannel);
  const setChannel = useMIDIStore((state) => state.setComposerChannel);
  const type = useMIDIStore((state) => state.composerType);
  const setType = useMIDIStore((state) => state.setComposerType);
  const noteOrCc = useMIDIStore((state) => state.composerNoteOrCc);
  const setNoteOrCc = useMIDIStore((state) => state.setComposerNoteOrCc);
  const velocityOrValue = useMIDIStore(
    (state) => state.composerVelocityOrValue
  );
  const setVelocityOrValue = useMIDIStore(
    (state) => state.setComposerVelocityOrValue
  );
  const pitchBendValue = useMIDIStore(
    (state) => state.composerPitchBendValue
  );
  const setPitchBendValue = useMIDIStore(
    (state) => state.setComposerPitchBendValue
  );
  const sysexData = useMIDIStore((state) => state.composerSysexData);
  const setSysexData = useMIDIStore((state) => state.setComposerSysexData);
  const manufacturerId = useMIDIStore(
    (state) => state.composerManufacturerId
  );
  const setManufacturerId = useMIDIStore(
    (state) => state.setComposerManufacturerId
  );

  const types = [
    { value: MIDI_STATUS.NOTE_ON, label: typeToLabel(MIDI_STATUS.NOTE_ON) },
    { value: MIDI_STATUS.NOTE_OFF, label: typeToLabel(MIDI_STATUS.NOTE_OFF) },
    {
      value: MIDI_STATUS.CONTROL_CHANGE,
      label: typeToLabel(MIDI_STATUS.CONTROL_CHANGE),
    },
    {
      value: MIDI_STATUS.PROGRAM_CHANGE,
      label: typeToLabel(MIDI_STATUS.PROGRAM_CHANGE),
    },
    {
      value: MIDI_STATUS.PITCH_BEND,
      label: typeToLabel(MIDI_STATUS.PITCH_BEND),
    },
    {
      value: MIDI_STATUS.CHANNEL_PRESSURE,
      label: typeToLabel(MIDI_STATUS.CHANNEL_PRESSURE),
    },
    {
      value: MIDI_STATUS.POLY_PRESSURE,
      label: typeToLabel(MIDI_STATUS.POLY_PRESSURE),
    },
    {
      value: MIDI_STATUS.SYSEX_START,
      label: typeToLabel(MIDI_STATUS.SYSEX_START),
    },
    { value: MIDI_STATUS.START, label: typeToLabel(MIDI_STATUS.START) },
    { value: MIDI_STATUS.STOP, label: typeToLabel(MIDI_STATUS.STOP) },
    { value: MIDI_STATUS.CONTINUE, label: typeToLabel(MIDI_STATUS.CONTINUE) },
  ];

  const hexStringToArray = (hex: string): number[] => {
    const clean = hex.replace(/\s+/g, "").toUpperCase();
    const result: number[] = [];

    for (let i = 0; i < clean.length; i += 2) {
      result.push(parseInt(clean.slice(i, i + 2), 16));
    }

    return result;
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        width="100%"
      >
        <FormControl
          size="small"
          sx={{ width: { xs: "100%", sm: 120 } }}
        >
          <InputLabel>Channel</InputLabel>
          <Select
            value={channel}
            label="Channel"
            onChange={(e) => setChannel(Number(e.target.value))}
          >
            {[...Array(16)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {i + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ width: { xs: "100%", sm: 180 } }}
        >
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(Number(e.target.value))}
          >
            {types.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {type === MIDI_STATUS.SYSEX_START && (
          <>
            <TextField
              label="Start Byte"
              value="F0"
              disabled
              size="small"
              sx={{ width: { xs: "100%", sm: 80 } }}
            />
            <TextField
              label="Manufacturer ID (*)"
              value={manufacturerId}
              onChange={(e) => setManufacturerId(e.target.value)}
              placeholder="FD"
              size="small"
              sx={{ width: { xs: "100%", sm: 140 } }}
            />
            <TextField
              label="Data (hex)"
              value={sysexData.replace(/\s+/g, "").toUpperCase()}
              onChange={(e) => setSysexData(e.target.value)}
              placeholder="43 12 00"
              size="small"
              sx={{ width: { xs: "100%", sm: 240 } }}
            />
            <TextField
              label="End Byte"
              value="F7"
              disabled
              size="small"
              sx={{ width: { xs: "100%", sm: 80 } }}
            />
          </>
        )}

        {(type === MIDI_STATUS.NOTE_ON ||
          type === MIDI_STATUS.NOTE_OFF ||
          type === MIDI_STATUS.CHANNEL_PRESSURE ||
          type === MIDI_STATUS.POLY_PRESSURE ||
          type === MIDI_STATUS.CONTROL_CHANGE ||
          type === MIDI_STATUS.PROGRAM_CHANGE) && (
          <>
            {type !== MIDI_STATUS.CHANNEL_PRESSURE && (
              <TextField
                label={
                  type === MIDI_STATUS.NOTE_ON ||
                  type === MIDI_STATUS.NOTE_OFF ||
                  type === MIDI_STATUS.POLY_PRESSURE
                    ? "Note"
                    : type === MIDI_STATUS.PROGRAM_CHANGE
                    ? "Program"
                    : "Controller"
                }
                type="number"
                value={noteOrCc}
                onChange={(e) => setNoteOrCc(Number(e.target.value))}
                size="small"
                sx={{ width: { xs: "100%", sm: 120 } }}
              />
            )}

            {type !== MIDI_STATUS.PROGRAM_CHANGE && (
              <TextField
                label={
                  type === MIDI_STATUS.NOTE_ON ||
                  type === MIDI_STATUS.NOTE_OFF
                    ? "Velocity"
                    : "Value"
                }
                type="number"
                value={velocityOrValue}
                onChange={(e) => setVelocityOrValue(Number(e.target.value))}
                size="small"
                sx={{ width: { xs: "100%", sm: 120 } }}
              />
            )}
          </>
        )}

        {type === MIDI_STATUS.PITCH_BEND && (
          <TextField
            label="Pitch Bend (-8192 to +8191)"
            type="number"
            value={pitchBendValue}
            onChange={(e) => setPitchBendValue(Number(e.target.value))}
            size="small"
            sx={{ width: { xs: "100%", sm: 220 } }}
          />
        )}

        <Box sx={{ flexGrow: { sm: 1 } }} />

        <MidiDeviceChooser
          value={selectedOutputId || ""}
          onChange={setSelectedOutputId}
        />

        <Button
          variant="contained"
          startIcon={<Send />}
          sx={{ width: { xs: "100%", sm: "auto" } }}
          onClick={() => {
            const msg: MidiMessage = {
              id: uuidv4(),
              type,
              timestamp: Date.now(),
              channel,
              note: type !== 240 ? noteOrCc : undefined,
              controller: type !== 240 ? noteOrCc : undefined,
              value:
                type === MIDI_STATUS.CONTROL_CHANGE ||
                type === MIDI_STATUS.NOTE_ON ||
                type === MIDI_STATUS.NOTE_OFF ||
                type === MIDI_STATUS.CHANNEL_PRESSURE ||
                type === MIDI_STATUS.POLY_PRESSURE
                  ? velocityOrValue
                  : undefined,
              pitchBendValue:
                type === MIDI_STATUS.PITCH_BEND
                  ? pitchBendValue + 8192
                  : undefined,
              velocity: type !== 240 ? velocityOrValue : undefined,
              data:
                type === MIDI_STATUS.SYSEX_START
                  ? [
                      0xf0,
                      ...(manufacturerId
                        ? [parseInt(manufacturerId, 16)]
                        : []),
                      ...hexStringToArray(sysexData),
                      0xf7,
                    ]
                  : undefined,
            };

            sendMessage(msg, selectedOutputId);
          }}
        >
          Send MIDI
        </Button>
      </Stack>
    </Box>
  );
};

export default Composer;
