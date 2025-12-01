import { useState, useEffect } from "react";
import { WebMidi, Input, Output } from "webmidi";
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";
import { useMIDIStore } from "../store/midi";
import Composer from "./Composer";
import MessageList from "./MessageList";

function MidiComponent() {
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const inputs = useMIDIStore((state) => state.inputs);
  const outputs = useMIDIStore((state) => state.outputs);
  const activeInputs = useMIDIStore((state) => state.activeInputs);
  const toggleInput = useMIDIStore((state) => state.toggleInput);

  useEffect(() => {
    // init();
  }, []);

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
  const init = useMIDIStore((state) => state.init);
  const initialized = useMIDIStore((state) => state.initialized);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {!initialized && (
        <Box marginTop={"64px"} textAlign={"center"} display={"flex"} flexDirection={"column"} alignItems={"center"} gap={2}>
          <Typography variant="body1" gutterBottom>
            To use the MIDI features, please initialize the MIDI system.
          </Typography>
          <Button onClick={init} variant="contained" color="primary">
            Initialize MIDI
          </Button>
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
