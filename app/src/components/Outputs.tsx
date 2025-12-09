import { Alert, Box, Button } from "@mui/material";
import { useIOStore } from "../store/io";
// import Output from "./Output";
import { MIDI_CONTROL_CHANGE, sysexPinModePWMOut } from "../store/midi.config";
import PinMapping from "./pinmapping/PinMapping";
import { useAppStore } from "../store/app";

const Outputs = () => {
  const outputs = useIOStore((state) => state.outputs);
  const addOutput = useIOStore((state) => state.addOutput);
  const showHints = useAppStore((state) => state.showHints);
  return (
    <Box display={"flex"} flexDirection={"column"}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Output pins on the microcontroller can be controlled via MIDI messages. Configure the output pin mode and MIDI message type here.
        </Alert>
      )}
      {outputs.map((output, index) => (
        <PinMapping key={index} config={output} type="output" />
        // <Output key={index} output={output} />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            addOutput({
              pin: outputs.length,
              mode: sysexPinModePWMOut,
              pinMin: 0,
              pinMax: 1024,
              midiMin: 0,
              midiMax: 127,
              channel: 1,
              midiType: MIDI_CONTROL_CHANGE,
              controller: 20,
            });
          }}
          fullWidth
        >
          Add Output
        </Button>
      </Box>
    </Box>
  );
};

export default Outputs;
