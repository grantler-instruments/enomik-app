import { Alert, Box } from "@mui/material";
import { useIOStore } from "../store/io";
import { MIDI_CONTROL_CHANGE, sysexPinModePWMOut } from "../store/midi.config";
import PinMapping from "./pinmapping/PinMapping";
import { useAppStore } from "../store/app";
import { useState } from "react";
import AddRowButton from "./AddRowButton";
import { useTranslation } from "react-i18next";

const Outputs = () => {
  const outputs = useIOStore((state) => state.outputs);
  const addOutput = useIOStore((state) => state.addOutput);
  const showHints = useAppStore((state) => state.showHints);
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("tooltip_midi_to_pin")}
        </Alert>
      )}
      {outputs.map((output, index) => (
        <PinMapping key={index} config={output} type="output" />
        // <Output key={index} output={output} />
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <AddRowButton
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
          visible={outputs.length === 0 || hovered}
        ></AddRowButton>
      </Box>
    </Box>
  );
};

export default Outputs;
