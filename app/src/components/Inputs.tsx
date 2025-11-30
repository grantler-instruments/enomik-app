import { Alert, Box, Button, Typography } from "@mui/material";
import { useIOStore } from "../store/io";
// import Input from "./Input";
import { MIDI_CONTROL_CHANGE, sysexPinModeAnalogIn } from "../store/midi.config";
import PinMapping from "./PinMapping";

const Inputs = () => {
  const inputs = useIOStore((state) => state.inputs);
  const addInput = useIOStore((state) => state.addInput);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      <Typography variant="h2">Input PIN to MIDI</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Inputs read data from input pins on the microcontroller and map them to
        MIDI messages. Configure the input pin mode, MIDI message type, and value
        mapping here.
      </Alert>
      {inputs.map((input, index) => (
        <PinMapping key={index} config={input} type="input" />
        // <Input key={index} input={input} />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            addInput({
              pin: inputs.length,
              mode: sysexPinModeAnalogIn,
              midiType: MIDI_CONTROL_CHANGE,
              midiMin: 0,
              midiMax: 127,
              pinMin: 0,
              pinMax: 1023,
              controller: 20,
            });
          }}
        >
          Add Input
        </Button>
      </Box>
    </Box>
  );
};

export default Inputs;
