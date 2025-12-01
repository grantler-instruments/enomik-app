import { useState } from "react";
import { Input } from "webmidi";
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useMIDIStore } from "../store/midi";
import Composer from "./Composer";
import MessageList from "./MessageList";
import InitMidi from "./InitMidi";

function MidiComponent() {
  const [error, _] = useState<string | null>(null);

  const inputs = useMIDIStore((state) => state.inputs);
  const activeInputs = useMIDIStore((state) => state.activeInputs);
  const toggleInput = useMIDIStore((state) => state.toggleInput);

  return (
    <Box>
      {/* Inputs section with checkboxes */}
      <Box marginTop={2}>
        <Typography variant="h6">MIDI Inputs</Typography>
        {inputs.map((input: Input) => (
          <FormControlLabel
            key={input.id}
            control={
              <Checkbox
                checked={activeInputs.includes(input.id)}
                onChange={() => toggleInput(input.id)}
              />
            }
            label={input.name}
          />
        ))}
      </Box>

      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}

const Debugger = () => {
  const initialized = useMIDIStore((state) => state.initialized);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {!initialized && (
        <Box marginTop={"64px"} textAlign={"center"} display={"flex"} flexDirection={"column"} alignItems={"center"} gap={2}>
          <Typography variant="body1" gutterBottom>
            To use the MIDI features, please initialize the MIDI system.
          </Typography>
          <InitMidi></InitMidi>
        </Box>
      )}
      {initialized && (
        <>
          <Composer />
          <MidiComponent />
          <MessageList />
        </>
      )}
    </Box>
  );
};

export default Debugger;
