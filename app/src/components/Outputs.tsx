import { Box, Button } from "@mui/material";
import { useIOStore } from "../store/io";
import Output from "./Output";

const Outputs = () => {
  const outputs = useIOStore((state) => state.outputs);
  const addOutput = useIOStore((state) => state.addOutput);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {outputs.map((output, index) => (
        <Output key={index} output={output} />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          onClick={() => {
            addOutput({
              pin: outputs.length,
              mode: "digital",
              midiType: "cc",
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
