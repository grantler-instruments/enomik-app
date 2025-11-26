import { Alert, Box, Button, Typography } from "@mui/material";
import { useIOStore } from "../store/io";
import Output from "./Output";
import { MIDI_CONTROL_CHANGE } from "../store/midi.config";

const Outputs = () => {
  const outputs = useIOStore((state) => state.outputs);
  const addOutput = useIOStore((state) => state.addOutput);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      <Typography variant="h2">MIDI to Output</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Output pins on the microcontroller can be controlled via MIDI messages. Configure the output pin mode and MIDI message type here.
      </Alert>
      {outputs.map((output, index) => (
        <Output key={index} output={output} />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            addOutput({
              pin: outputs.length,
              mode: "digital",
              midiType: MIDI_CONTROL_CHANGE,
              controller: 20,
            });
          }}
        >
          Add Output
        </Button>
      </Box>
    </Box>
  );
};

export default Outputs;
