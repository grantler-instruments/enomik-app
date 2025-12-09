import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useMIDIStore, type MidiMessage } from "../store/midi";
import { v4 as uuidv4 } from "uuid";
import { MIDI_STATUS, typeToLabel } from "../utils/midi";
const Composer = () => {
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  const outputs = useMIDIStore((state) => state.outputs);
  const selectedOutputId = useMIDIStore((state) => state.selectedComposerOutputDevice);
  const setSelectedOutputId = useMIDIStore((state) => state.setSelectedComposerOutputDevice);
  const [channel, setChannel] = useState(1);
  const [type, setType] = useState(144);
  const [noteOrCc, setNoteOrCc] = useState(60);
  const [velocityOrValue, setVelocityOrValue] = useState(127);
  const [sysexData, setSysexData] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const types = [
    { value: MIDI_STATUS.NOTE_ON, label: typeToLabel(MIDI_STATUS.NOTE_ON) },
    { value: MIDI_STATUS.NOTE_OFF, label: typeToLabel(MIDI_STATUS.NOTE_OFF) },
    { value: MIDI_STATUS.CONTROL_CHANGE, label: typeToLabel(MIDI_STATUS.CONTROL_CHANGE) },
    { value: MIDI_STATUS.PROGRAM_CHANGE, label: typeToLabel(MIDI_STATUS.PROGRAM_CHANGE) },
    { value: MIDI_STATUS.PITCH_BEND, label: typeToLabel(MIDI_STATUS.PITCH_BEND) },
    { value: MIDI_STATUS.SYSEX_START, label: typeToLabel(MIDI_STATUS.SYSEX_START) },
    { value: MIDI_STATUS.START, label: typeToLabel(MIDI_STATUS.START) },
    { value: MIDI_STATUS.STOP, label: typeToLabel(MIDI_STATUS.STOP) },
    { value: MIDI_STATUS.CONTINUE, label: typeToLabel(MIDI_STATUS.CONTINUE) },
  ];

  //TODO: move to utils
  const hexStringToArray = (hex: string): number[] => {
    // Remove all whitespace
    const clean = hex.replace(/\s+/g, "").toUpperCase();
    const result: number[] = [];

    // Parse every two characters as a hex byte
    for (let i = 0; i < clean.length; i += 2) {
      result.push(parseInt(clean.slice(i, i + 2), 16));
    }

    return result;
  };
  return (
    <Box display={"flex"} flexDirection={"column"} gap={2}>
      <Typography variant="h2">MIDI Composer</Typography>
      <Box display="flex" flexDirection="row" gap={2}>
        <FormControl sx={{ width: 120 }}>
          <InputLabel>Channel</InputLabel>
          <Select
            value={channel}
            label="Channel"
            onChange={(e) => setChannel(Number(e.target.value))}
            size="small"
          >
            {[...Array(16)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {i + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value)}
            size="small"
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
              sx={{ width: 80 }}
              size="small"
            />
            <TextField
              label="Manufacturer ID (*)"
              value={manufacturerId}
              onChange={(e) => setManufacturerId(e.target.value)}
              placeholder="FD"
              sx={{ width: 120 }}
              size="small"
            />
            <TextField
              label="Data (hex)"
              value={sysexData.replace(/\s+/g, "").toUpperCase()}
              onChange={(e) => setSysexData(e.target.value)}
              placeholder="43 12 00"
              sx={{ minWidth: 200 }}
              size="small"
            />
            <TextField
              label="End Byte"
              value="F7"
              disabled
              sx={{ width: 80 }}
              size="small"
            />
          </>
        )}
        {(type === MIDI_STATUS.NOTE_ON ||
          type === MIDI_STATUS.NOTE_OFF ||
          type === MIDI_STATUS.CONTROL_CHANGE ||
          type === MIDI_STATUS.PROGRAM_CHANGE) && (
          <>
            <TextField
              label={
                type === MIDI_STATUS.NOTE_ON || type === MIDI_STATUS.NOTE_OFF
                  ? "Note"
                  : type === MIDI_STATUS.PROGRAM_CHANGE
                  ? "Program"
                  : "Controller"
              }
              type="number"
              value={noteOrCc}
              onChange={(e) => setNoteOrCc(Number(e.target.value))}
              sx={{ width: 100 }}
              size="small"
            />
            {type !== 192 && (
              <TextField
                label={type === 144 || type === 128 ? "Velocity" : "Value"}
                type="number"
                value={velocityOrValue}
                onChange={(e) => setVelocityOrValue(Number(e.target.value))}
                sx={{ width: 100 }}
                size="small"
              />
            )}
          </>
        )}
        <Box flex={1}></Box>
        <FormControl>
          <InputLabel>MIDI Output</InputLabel>
          <Select
            size="small"
            value={selectedOutputId || ""}
            onChange={(e) => setSelectedOutputId(e.target.value)}
            label="MIDI Output"
          >
            <MenuItem value={"-1"}>All outputs</MenuItem>
            {outputs.map((out) => (
              <MenuItem key={out.id} value={out.id}>
                {out.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={() => {
            const msg: MidiMessage = {
              id: uuidv4(),
              type: type,
              timestamp: Date.now(),
              channel: channel,
              note: type !== 240 ? noteOrCc : undefined,
              controller: type !== 240 ? noteOrCc : undefined,
              value: type !== 240 ? velocityOrValue : undefined,
              velocity: type !== 240 ? velocityOrValue : undefined,
              data:
                type === 240
                  ? [
                      0xf0,
                      ...(manufacturerId ? [parseInt(manufacturerId, 16)] : []),
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
      </Box>
    </Box>
  );
};
export default Composer;
