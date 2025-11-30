import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useState } from "react";
const Composer = () => {
  const [type, setType] = useState("noteOn");
  const [noteOrCc, setNoteOrCc] = useState(60);
  const [velocityOrValue, setVelocityOrValue] = useState(127);
  const [sysexData, setSysexData] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const types = [
    "noteOn",
    "noteOff",
    "controlChange",
    "programChange",
    "pitchBend",
    "sysex",
  ];
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2} gap={2}>
      <Typography variant="h2">MIDI Composer</Typography>
      <Box display="flex" flexDirection="row" gap={2}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value)}
          >
            {types.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {type === "sysex" ? (
          <>
            <TextField
              label="Start Byte"
              value="F0"
              disabled
              sx={{ width: 80 }}
            />
            <TextField
              label="Mfr ID (optional)"
              value={manufacturerId}
              onChange={(e) => setManufacturerId(e.target.value)}
              placeholder="43"
              helperText="Hex manufacturer ID"
              sx={{ width: 120 }}
            />
            <TextField
              label="Data (hex)"
              value={sysexData}
              onChange={(e) => setSysexData(e.target.value)}
              placeholder="43 12 00"
              helperText="Space-separated hex bytes"
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="End Byte"
              value="F7"
              disabled
              sx={{ width: 80 }}
            />
          </>
        ) : (
          <>
            <TextField
              label={type === "noteOn" || type === "noteOff" ? "Note" : "CC"}
              type="number"
              value={noteOrCc}
              onChange={(e) => setNoteOrCc(Number(e.target.value))}
              sx={{ width: 100 }}
            />
            <TextField
              label={
                type === "noteOn" || type === "noteOff" ? "Velocity" : "Value"
              }
              type="number"
              value={velocityOrValue}
              onChange={(e) => setVelocityOrValue(Number(e.target.value))}
              sx={{ width: 100 }}
            />
          </>
        )}
        <Box flex={1}></Box>
        <Button variant="contained" onClick={() => {
          if (type === "sysex") {
            const mfrPart = manufacturerId ? `${manufacturerId} ` : "";
            console.log({ type, data: `F0 ${mfrPart}${sysexData} F7` });
          } else {
            console.log({ type, noteOrCc, velocityOrValue });
          }
        }}>
          Send MIDI
        </Button>
      </Box>
    </Box>
  );
};
export default Composer;