import { useState, useEffect } from "react";
import { WebMidi, Input, Output } from "webmidi";
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";
import { useMonitorStore } from "../store/monitor";

function Messages() {
  const messages = useMonitorStore((state) => state.messages);
  const clear = useMonitorStore((state) => state.clear);

  return (
    <Box p={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Messages</Typography>
        <Button variant="outlined" onClick={clear}>
          Clear
        </Button>
      </Box>

      <Box
        sx={{
          maxHeight: "400px",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        {messages.map((msg) => (
          <Box key={msg.id} mb={0.5}>
            <Typography variant="body2" component="span">
              [{new Date(msg.timestamp).toLocaleTimeString()}]{msg.type}
              {msg.note !== undefined && ` Note: ${msg.note}`}
              {msg.controller !== undefined && ` Controller: ${msg.controller}`}
              {msg.value !== undefined && ` Value: ${msg.value}`}
              {msg.velocity !== undefined && ` Vel: ${msg.velocity}`}
              {msg.channel !== undefined && ` Ch: ${msg.channel}`}
              {msg.data && ` Data: ${msg.data.join(", ")}`}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MidiComponent() {
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const init = useMonitorStore((state) => state.init);
  const inputs = useMonitorStore((state) => state.inputs);
  const outputs = useMonitorStore((state) => state.outputs);
  const activeInputs = useMonitorStore((state) => state.activeInputs);
  const toggleInput = useMonitorStore((state) => state.toggleInput);

  useEffect(() => {
    init();
  }, []);

  return (
    <Box>
      {/* Outputs section */}
      <Box mb={2}>
        <Typography variant="h6">MIDI Outputs</Typography>
        {/* Your existing output selection */}
      </Box>

      {/* Inputs section with checkboxes */}
      <Box>
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

const Monitor = () => {
  return (
    <Box>
      <MidiComponent></MidiComponent>
      <Messages />
    </Box>
  );
};

export default Monitor;
