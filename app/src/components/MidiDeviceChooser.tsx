import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { useId } from "react";
import { useMIDIStore } from "../store/midi";
import InitMidi from "./InitMidi";

const MidiDeviceChooser = ({
  value,
  onChange,
  sx,
}: {
  value: string;
  onChange: (value: string) => void;
  // Best-effort: this component mainly needs an object-style merge for `sx`.
  // (Current callsites don't pass `sx`.)
  sx?: Record<string, unknown>;
}) => {
  const outputs = useMIDIStore((state) => state.outputs);
  const initialized = useMIDIStore((state) => state.initialized);
  const labelId = useId();

  const additionalSx: Record<string, unknown> =
    sx && typeof sx === "object" && !Array.isArray(sx) ? sx : {};

  // Ensure we always render a value that exists in our options list.
  // Several callsites pass `""` before the store has a persisted selection.
  const selectedValue =
    value && value !== "" && outputs.some((out) => out.id === value)
      ? value
      : "-1";

  return (
    <Box>
      <InitMidi></InitMidi>
      {initialized && (
        <FormControl
          size="small"
          sx={{ minWidth: 220, flexShrink: 0, ...additionalSx }}
        >
          <InputLabel id={labelId}>MIDI Output</InputLabel>
          <Select
            size="small"
            labelId={labelId}
            value={selectedValue}
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
