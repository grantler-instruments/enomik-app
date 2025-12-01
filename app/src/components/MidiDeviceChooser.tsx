import { useEffect, useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useMIDIStore } from "../store/midi";

const MidiDeviceChooser = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const init = useMIDIStore((state) => state.init);
  const outputs = useMIDIStore((state) => state.outputs);
  const initialized = useMIDIStore((state) => state.initialized);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {}, []);

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id="midi-device-select-label">MIDI Output</InputLabel>
        <Select
          labelId="midi-device-select-label"
          value={value}
          label="MIDI Output"
          onChange={(e) => onChange(e.target.value)}
          disabled={outputs.length === 0 || !!error}
          size="small"
        >
          {outputs.map((output, index) => {
            return (
              <MenuItem key={`midi-output-${index}`} value={index}>
                {output.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      {error && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default MidiDeviceChooser;
