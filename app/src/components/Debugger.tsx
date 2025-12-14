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
import SectionHeader from "./SectionHeader";

const Debugger = () => {
  const initialized = useMIDIStore((state) => state.initialized);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      {!initialized && (
        <Box
          my={"64px"}
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
              <SectionHeader
                title={"MIDI Composer"}
                tooltipKey="tooltip_midi_composer"
              />
            </AccordionSummary>
            <AccordionDetails>
              <Composer />
            </AccordionDetails>
          </Accordion>
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <SectionHeader
                title={"MIDI Monitor"}
                tooltipKey="tooltip_midi_monitor"
              />
            </AccordionSummary>
            <AccordionDetails>
              <MessageList />
            </AccordionDetails>
          </Accordion>
        </>
      )}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionHeader
            title={"Serial Monitor"}
            tooltipKey="tooltip_serial_monitor"
          />
        </AccordionSummary>
        <AccordionDetails>
          <WebSerialMonitor />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Debugger;
