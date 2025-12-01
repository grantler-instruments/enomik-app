import { Alert, Box, Button } from "@mui/material";
import { useState } from "react";
import MidiDeviceChooser from "./MidiDeviceChooser";
import { useMIDIStore } from "../store/midi";
import InitMidi from "./InitMidi";

const Inspector = () => {
  const [device, setDevice] = useState("");
  const initialized = useMIDIStore((state) => state.initialized);
  return (
    <Box display={"flex"} flexDirection="column" gap={2} padding={2}>
      <Alert severity="info" sx={{ mb: 2 }}>
        The Inspector allows you to select MIDI devices and synchronize settings.
        Because who knows what one did months ago.
      </Alert>
      <Box display={"flex"} flex={1}>
        <InitMidi></InitMidi>
        <MidiDeviceChooser
          value={device}
          onChange={(e) => setDevice(e)}
        ></MidiDeviceChooser>
        <Button variant="outlined" color="primary" disabled={!initialized}>
          sync
        </Button>
      </Box>
    </Box>
  );
};

export default Inspector;
