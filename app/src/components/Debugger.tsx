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
import { useTranslation } from "react-i18next";

const Debugger = () => {
  const { t } = useTranslation();
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
            {t("debugger_init_prompt")}
          </Typography>
          <InitMidi></InitMidi>
        </Box>
      )}
      {initialized && (
        <>
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <SectionHeader
                title={t("section_midi_composer")}
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
                title={t("section_midi_monitor")}
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
            title={t("section_serial_monitor")}
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
