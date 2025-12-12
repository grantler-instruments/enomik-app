import { Alert, Box, Button, Typography } from "@mui/material";
import MidiDeviceChooser from "./MidiDeviceChooser";
import { useMIDIStore, type MidiMessage } from "../store/midi";
import { v4 as uuidv4 } from "uuid";
import { useInspectorStore } from "../store/inspector";
import MacAddressInput from "./MacAddressInput";
import PinMapping from "./pinmapping/PinMapping";
import { useAppStore } from "../store/app";

const Inspector = () => {
  const device = useMIDIStore((state) => state.selectedInspectorOutputDevice);
  const setDevice = useMIDIStore(
    (state) => state.setSelectedInspectorOutputDevice
  );
  const initialized = useMIDIStore((state) => state.initialized);
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  const peers = useInspectorStore((state) => state.peers);
  const inputPinConfigs = useInspectorStore((state) => state.inputPinConfigs);
  const outputPinConfigs = useInspectorStore((state) => state.outputPinConfigs);
  const clear = useInspectorStore((state) => state.clear);
  const showHints = useAppStore((state) => state.showHints);
  return (
    <Box display={"flex"} flexDirection="column" gap={2} padding={2}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The Inspector allows you to select MIDI devices and synchronize
          settings. Because who knows what one did months ago.
        </Alert>
      )}
      <Box display={"flex"} flex={1} gap={2}>
        <MidiDeviceChooser
          value={device || ""}
          onChange={(e) => setDevice(e)}
        ></MidiDeviceChooser>
        <Button
          variant="outlined"
          color="primary"
          disabled={!initialized}
          onClick={() => {
            clear();
            const sysexMessage = [0xf0, 0x7d, 0x08, 0xf7]; //0x08=get_peers
            const msg: MidiMessage = {
              id: uuidv4(),
              type: 240,
              channel: 1,
              data: sysexMessage,
              timestamp: Date.now(),
            };
            sendMessage(msg);

            const sysexGetAllPinConfigsMessage = [0xf0, 0x7d, 0x04, 0xf7]; //0x04=get_pin_configs
            const allPinConfigsmsg: MidiMessage = {
              id: uuidv4(),
              type: 240,
              channel: 1,
              data: sysexGetAllPinConfigsMessage,
              timestamp: Date.now(),
            };
            sendMessage(allPinConfigsmsg);
          }}
        >
          sync
        </Button>
      </Box>
      <Box>
        <Typography variant="h2">Input PIN to MIDI</Typography>
        {inputPinConfigs.map((config, index) => (
          <PinMapping
            key={`input-${index}`}
            config={config}
            type={"input"}
            disabled={true}
          ></PinMapping>
        ))}
      </Box>
      <Box>
        <Typography variant="h2">MIDI to Output PIN</Typography>
        {outputPinConfigs.map((config, index) => (
          <PinMapping
            key={`output-${index}`}
            config={config}
            type={"output"}
            disabled={true}
          ></PinMapping>
        ))}
      </Box>
      <Box>
        <Typography variant="h2">ESP-NOW MIDI</Typography>
        {peers.map((peer) => (
          <MacAddressInput
            key={peer}
            macAddress={peer}
            disabled={true}
            onMacAddressChange={() => {}}
          ></MacAddressInput>
        ))}
      </Box>
    </Box>
  );
};

export default Inspector;
