import { Box, Button } from "@mui/material";
import { useState } from "react";
import MidiDeviceChooser from "./MidiDeviceChooser";

const Inspector = () => {
  const [device, setDevice] = useState("");
  return (
    <Box display={"flex"} gap={2}>
      <MidiDeviceChooser
        value={device}
        onChange={(e) => setDevice(e)}
      ></MidiDeviceChooser>
      <Button variant="outlined" color="primary">
        sync
      </Button>
    </Box>
  );
};

export default Inspector;
