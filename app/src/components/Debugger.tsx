import {
  Box,
  Typography,
} from "@mui/material";
import { useMIDIStore } from "../store/midi";
import Composer from "./Composer";
import MessageList from "./MessageList";
import InitMidi from "./InitMidi";


const Debugger = () => {
  const initialized = useMIDIStore((state) => state.initialized);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {!initialized && (
        <Box marginTop={"64px"} textAlign={"center"} display={"flex"} flexDirection={"column"} alignItems={"center"} gap={2}>
          <Typography variant="body1" gutterBottom>
            To use the MIDI features, please initialize the MIDI system.
          </Typography>
          <InitMidi></InitMidi>
        </Box>
      )}
      {initialized && (
        <>
          <Composer />
          <MessageList />
        </>
      )}
    </Box>
  );
};

export default Debugger;
