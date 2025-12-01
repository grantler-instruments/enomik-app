import { Alert, Box, Button } from "@mui/material";
import { useState } from "react";
import MidiDeviceChooser from "./MidiDeviceChooser";
import { useMIDIStore, type MidiMessage } from "../store/midi";
import InitMidi from "./InitMidi";
import { v4 as uuidv4 } from "uuid";

const Inspector = () => {
  const [device, setDevice] = useState("");
  const initialized = useMIDIStore((state) => state.initialized);
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  return (
    <Box display={"flex"} flexDirection="column" gap={2} padding={2}>
      <Alert severity="info" sx={{ mb: 2 }}>
        The Inspector allows you to select MIDI devices and synchronize
        settings. Because who knows what one did months ago.
      </Alert>
      <Box display={"flex"} flex={1} gap={2}>
        <InitMidi></InitMidi>
        <MidiDeviceChooser
          value={device}
          onChange={(e) => setDevice(e)}
        ></MidiDeviceChooser>
        <Button
          variant="outlined"
          color="primary"
          disabled={!initialized}
          onClick={() => {
            const sysexMessage = [0xf0, 0x7d, 0x06, 0xf7];
            const msg: MidiMessage = {
              id: uuidv4(),
              type: 240,
              channel: 1,
              data: sysexMessage,
              timestamp: Date.now(),
            };
            sendMessage(msg);
          }}
        >
          sync
        </Button>
      </Box>
    </Box>
  );
};

export default Inspector;
