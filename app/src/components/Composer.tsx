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
const Composer = () => {
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  const outputs = useMIDIStore((state) => state.outputs);
  const [output, setOutput] = useState("");
  const [channel, setChannel] = useState(1);
  const [type, setType] = useState(144);
  const [noteOrCc, setNoteOrCc] = useState(60);
  const [velocityOrValue, setVelocityOrValue] = useState(127);
  const [sysexData, setSysexData] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const types = [
    { value: 144, label: "Note On" },
    { value: 128, label: "Note Off" },
    { value: 176, label: "Control Change" },
    { value: 192, label: "Program Change" },
    { value: 224, label: "Pitch Bend" },
    { value: 240, label: "SysEx" },
  ];
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
        {type === 240 ? (
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
              helperText="hex"
              sx={{ width: 120 }}
              size="small"
            />
            <TextField
              label="Data (hex)"
              value={sysexData.toUpperCase()}
              onChange={(e) => setSysexData(e.target.value)}
              placeholder="43 12 00"
              helperText="hex"
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
        ) : (
          <>
            <TextField
              label={type === 144 || type === 128 ? "Note" : "CC"}
              type="number"
              value={noteOrCc}
              onChange={(e) => setNoteOrCc(Number(e.target.value))}
              sx={{ width: 100 }}
              size="small"
            />
            <TextField
              label={type === 144 || type === 128 ? "Velocity" : "Value"}
              type="number"
              value={velocityOrValue}
              onChange={(e) => setVelocityOrValue(Number(e.target.value))}
              sx={{ width: 100 }}
              size="small"
            />
          </>
        )}
        <Box flex={1}></Box>
        <FormControl>
          <InputLabel>MIDI Output</InputLabel>
          <Select
            size="small"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            label="MIDI Output"
          >
            <MenuItem value={""}>All outputs</MenuItem>
            {outputs.map((out, index) => (
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
                      ...sysexData
                        .split(" ")
                        .filter((s) => s.length > 0)
                        .map((s) => parseInt(s, 16)),
                      0xf7,
                    ]
                  : undefined,
            };
            sendMessage(msg, output);
          }}
        >
          Send MIDI
        </Button>
      </Box>
    </Box>
  );
};
export default Composer;
