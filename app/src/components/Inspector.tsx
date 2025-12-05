import { Alert, Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import MidiDeviceChooser from "./MidiDeviceChooser";
import { useMIDIStore, type MidiMessage } from "../store/midi";
import InitMidi from "./InitMidi";
import { v4 as uuidv4 } from "uuid";
import { useInspectorStore } from "../store/inspector";
import MacAddressInput from "./MacAddressInput";

const Inspector = () => {
  const [device, setDevice] = useState("");
  const initialized = useMIDIStore((state) => state.initialized);
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  const peers = useInspectorStore((state) => state.peers);
  const inputPinConfigs = useInspectorStore((state) => state.inputPinConfigs);
  const outputPinConfigs = useInspectorStore((state) => state.outputPinConfigs);
  const clear = useInspectorStore((state) => state.clear);
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
            clear()
            const sysexMessage = [0xf0, 0x7d, 0x08, 0xf7];//0x08=get_peers
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
      <Box>
        <Typography variant="h6">Input Pins:</Typography>
        {inputPinConfigs.map((config, index) => (
          <Box key={index}>- Pin {config.pin}: {JSON.stringify(config)}</Box>
        ))}
      </Box>
      <Box>
        <Typography variant="h6">Output Pins:</Typography>
        {outputPinConfigs.map((config, index) => (
          <Box key={index}>- Pin {config.pin}: {JSON.stringify(config)}</Box>
        ))}
        <Typography variant="h6">Peers:</Typography>
        {peers.map((peer) => (
          <MacAddressInput key={peer} macAddress={peer} disabled={true} onMacAddressChange={() => {}}></MacAddressInput>
        ))}
      </Box>
    </Box>
  );
};

export default Inspector;
