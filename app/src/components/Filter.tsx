import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
} from "@mui/material";
import { useMIDIStore } from "../store/midi";
import { useEffect, useState } from "react";
import { typeToLabel } from "../utils/midi";
import AllNone from "./AllNone";

const midiTypes = [128, 144, 176, 192, 224, 240];
export { midiTypes };

const Filter = ({onActiveInputsChange, onActiveOutputsChange, onActiveChannelsChange, onActiveTypesChange}:{
  onActiveInputsChange: (inputs: string[]) => void;
  onActiveOutputsChange: (outputs: string[]) => void;
  onActiveChannelsChange: (channels: number[]) => void;
  onActiveTypesChange: (types: number[]) => void;
}) => {
  const inputs = useMIDIStore((state) => state.inputs);
  const outputs = useMIDIStore((state) => state.outputs);
  const [activeInputs, setActiveInputs] = useState<string[]>([]);
  const [activeOutputs, setActiveOutputs] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<number[]>([...midiTypes]);
  const [activeChannels, setActiveChannels] = useState(
    Array.from({ length: 16 }).map((_, i) => i)
  );

  useEffect(() => {
    setActiveInputs(
      inputs.filter((input) => input.active).map((input) => input.id)
    );
    setActiveOutputs(
      outputs.filter((output) => output.active).map((output) => output.id)
    );
  }, [inputs, outputs]);

  const toggleInput = (id: string) => {
    const newInputs = activeInputs.includes(id) ? activeInputs.filter((inputId) => inputId !== id) : [...activeInputs, id];
    setActiveInputs(newInputs);
    onActiveInputsChange(newInputs)
  };
  const toggleOutput = (id: string) => {
    const newOutputs = activeOutputs.includes(id) ? activeOutputs.filter((outputId) => outputId !== id) : [...activeOutputs, id];
      setActiveOutputs(newOutputs);
      onActiveOutputsChange(newOutputs)
  };
  const toggleType = (type: number) => {
    if (activeTypes.includes(type)) {
      setActiveTypes(activeTypes.filter((t) => t !== type));
    } else {
      setActiveTypes([...activeTypes, type]);
    }
  };

  const toggleChannel = (channel: number) => {
    if (activeChannels.includes(channel)) {
      setActiveChannels(activeChannels.filter((c) => c !== channel));
    } else {
      setActiveChannels([...activeChannels, channel]);
    }
  };

  return (
    <Box display={"flex"} flexDirection={"column"} gap={2}>
      <Grid container spacing={2} marginTop={1} marginBottom={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          {/* Input filter options can be added here */}
          <Box display={"flex"} flexDirection={"row"} gap={2}>
            <Typography variant="h4">Inputs</Typography>
            <AllNone
              onAll={() => setActiveInputs(inputs.map((input) => input.id))}
              onNone={() => setActiveInputs([])}
            />
          </Box>
          {inputs.map((input) => (
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
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          {/* Output filter options can be added here */}
          <Box display={"flex"} flexDirection={"row"} gap={2}>
            <Typography variant="h4">Outputs</Typography>
            <AllNone
              onAll={() => setActiveOutputs(outputs.map((output) => output.id))}
              onNone={() => setActiveOutputs([])}
            />
          </Box>
          {outputs.map((output) => (
            <FormControlLabel
              key={output.id}
              control={
                <Checkbox
                  checked={activeOutputs.includes(output.id)}
                  onChange={() => toggleOutput(output.id)}
                />
              }
              label={output.name}
            />
          ))}
        </Grid>
      </Grid>
      <Box display={"flex"} gap={2} flexDirection={"column"}>
        <Box display={"flex"} gap={2}>
          <Typography variant="h4">Channels</Typography>
          <AllNone
            onAll={() =>
              setActiveChannels(Array.from({ length: 16 }, (_, i) => i))
            }
            onNone={() => setActiveChannels([])}
          />
        </Box>
        <Box display={"flex"} flexDirection={"row"} gap={2}>
          {Array.from({ length: 16 }, (_, i) => (
            <Box key={i}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={activeChannels.includes(i)}
                    onChange={() => toggleChannel(i)}
                  />
                }
                label={`${i + 1}`}
              />
            </Box>
          ))}
        </Box>
      </Box>
      <Box display={"flex"} gap={2} flexDirection={"column"}>
        <Box display={"flex"} gap={2}>
          <Typography variant="h4">Types</Typography>
          <AllNone
            onAll={() => setActiveTypes(midiTypes)}
            onNone={() => setActiveTypes([])}
          />
        </Box>
        <Box display={"flex"} flexDirection={"row"} gap={2}>
          {midiTypes.map((type, i) => (
            <Box key={i}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={activeTypes.includes(midiTypes[i])}
                    onChange={() => toggleType(type)}
                  />
                }
                label={typeToLabel(type)}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
export default Filter;
