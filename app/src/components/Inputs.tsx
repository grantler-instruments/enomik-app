import { Box, Button } from "@mui/material";
import { useIOStore } from "../store/io";
import Input from "./Input";
import { MIDI_CONTROL_CHANGE } from "../store/midi.config";

const Inputs = () => {
  const inputs = useIOStore((state) => state.inputs);
  const addInput = useIOStore((state) => state.addInput);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {inputs.map((input, index) => (
        <Input key={index} input={input} />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          onClick={() => {
            addInput({
              pin: inputs.length,
              mode: "analog",
              midiType: MIDI_CONTROL_CHANGE,
              inputMin: 0,
              inputMax: 1023,
              outputMin: 0,
              outputMax: 127,
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
