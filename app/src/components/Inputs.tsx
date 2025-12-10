import { Alert, Box } from "@mui/material";
import { useIOStore } from "../store/io";
import {
  MIDI_CONTROL_CHANGE,
  sysexPinModeAnalogIn,
} from "../store/midi.config";
import PinMapping from "./pinmapping/PinMapping";
import { useAppStore } from "../store/app";
import { useState } from "react";
import AddRowButton from "./AddRowButton";
import { useTranslation } from "react-i18next";

const Inputs = () => {
  const inputs = useIOStore((state) => state.inputs);
  const addInput = useIOStore((state) => state.addInput);
  const showHints = useAppStore((state) => state.showHints);
  const [hovered, setHovered] = useState(false);
  const {t} = useTranslation();
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("tooltip_pin_to_midi")}
        </Alert>
      )}
      {inputs.map((input, index) => (
        <PinMapping key={index} config={input} type="input" />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <AddRowButton
          visible={inputs.length === 0 || hovered}
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
        ></AddRowButton>
      </Box>
    </Box>
  );
};

export default Inputs;
