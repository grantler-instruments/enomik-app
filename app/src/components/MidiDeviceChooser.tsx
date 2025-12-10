import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { useMIDIStore } from "../store/midi";
import InitMidi from "./InitMidi";

const MidiDeviceChooser = ({
  value,
  onChange,
  sx,
}: {
  value: string;
  onChange: (value: string) => void;
  sx?: object;
}) => {
  const outputs = useMIDIStore((state) => state.outputs);
  const initialized = useMIDIStore((state) => state.initialized);

  return (
    <Box sx={sx}>
      <InitMidi></InitMidi>
      {initialized && (
        <FormControl>
          <InputLabel>MIDI Output</InputLabel>
          <Select
            size="small"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
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
      )}
    </Box>
  );
};

export default MidiDeviceChooser;
