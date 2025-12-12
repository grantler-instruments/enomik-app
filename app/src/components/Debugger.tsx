import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { useMIDIStore } from "../store/midi";
import Composer from "./Composer";
import MessageList from "./MessageList";
import InitMidi from "./InitMidi";
import WebSerialMonitor from "./SerialMonitor";
import { ExpandMore } from "@mui/icons-material";

const Debugger = () => {
  const initialized = useMIDIStore((state) => state.initialized);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {!initialized && (
        <Box
          marginTop={"64px"}
          textAlign={"center"}
          display={"flex"}
          flexDirection={"column"}
          alignItems={"center"}
          gap={2}
        >
          <Typography variant="body1" gutterBottom>
            To use the MIDI features, please initialize the MIDI system.
          </Typography>
          <InitMidi></InitMidi>
        </Box>
      )}
      {initialized && (
        <>
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h2">MIDI Composer</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Composer />
            </AccordionDetails>
          </Accordion>
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h2">MIDI Monitor</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MessageList />
            </AccordionDetails>
          </Accordion>
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h2">Serial Monitor</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <WebSerialMonitor />
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Box>
  );
};

export default Debugger;
