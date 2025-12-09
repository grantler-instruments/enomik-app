import { Alert, Box, Button } from "@mui/material";
import { useIOStore } from "../store/io";
import { MIDI_CONTROL_CHANGE, sysexPinModeAnalogIn } from "../store/midi.config";
import PinMapping from "./pinmapping/PinMapping";
import { useAppStore } from "../store/app";

const Inputs = () => {
  const inputs = useIOStore((state) => state.inputs);
  const addInput = useIOStore((state) => state.addInput);
  const showHints = useAppStore((state) => state.showHints);
  return (
    <Box display={"flex"} flexDirection={"column"}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Inputs read data from input pins on the microcontroller and map them to
          MIDI messages. Configure the input pin mode, MIDI message type, and value
          mapping here.
        </Alert>
      )}
      {inputs.map((input, index) => (
        <PinMapping key={index} config={input} type="input" />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            addInput({
              pin: inputs.length,
              mode: sysexPinModeAnalogIn,
              channel: 1,
              midiType: MIDI_CONTROL_CHANGE,
              midiMin: 0,
              midiMax: 127,
              pinMin: 0,
              pinMax: 1023,
              controller: 20,
            });
          }}
          fullWidth
        >
          Add Input
        </Button>
      </Box>
    </Box>
  );
};

export default Inputs;
