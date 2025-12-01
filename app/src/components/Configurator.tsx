import { Box, Button, IconButton, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import Inputs from "./Inputs";
import Outputs from "./Outputs";
import { useIOStore } from "../store/io";
import { useMIDIStore } from "../store/midi";
import MidiDeviceChooser from "./MidiDeviceChooser";
import { useRef, useState } from "react";
import { ArrowDropDown } from "@mui/icons-material";
import Peers from "./Peers";
import InitMidi from "./InitMidi";

const Configurator = () => {
  const deployConfiguration = useIOStore((state) => state.deploy);
  const initialized = useMIDIStore((state) => state.initialized);
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");

  const saveToFile = useIOStore((state) => state.saveToFile);
  const loadFromFile = useIOStore((state) => state.loadFromFile);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadFromFile(json);
      } catch (err) {
        console.error("Failed to load JSON", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box display={"flex"} flexDirection={"column"} gap={4} marginBottom={2}>
      <Box marginTop={2}>
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ArrowDropDownIcon />}
            aria-controls="inputs-content"
          >
            <Typography variant="h2">Input PIN to MIDI</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Inputs></Inputs>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            aria-controls="outputs-content"
          >
            <Typography variant="h2">MIDI to Output PIN</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Outputs></Outputs>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            aria-controls="outputs-content"
          >
            <Typography variant="h2">ESP-NOW MIDI</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Peers></Peers>
          </AccordionDetails>
        </Accordion>
      </Box>
      <Box flex={1}></Box>
      <Box display={"flex"} gap={2}>
        {/* Hidden file input */}
        <input
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <IconButton color="inherit" onClick={saveToFile}>
          <DownloadIcon />
        </IconButton>

        <IconButton color="inherit" onClick={handleUploadClick}>
          <FolderOpenIcon />
        </IconButton>
        <Box flex={1} />
        <InitMidi></InitMidi>
        <MidiDeviceChooser
          value={selectedOutputId}
          onChange={setSelectedOutputId}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={deployConfiguration}
          disabled={!initialized}
        >
          Deploy Configuration to Device
        </Button>
      </Box>
    </Box>
  );
};

export default Configurator;
