import {
  Box,
  Button,
  Container,
  IconButton,
  Tooltip,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import Inputs from "./Inputs";
import Outputs from "./Outputs";
import { useIOStore } from "../store/io";
import { useMIDIStore } from "../store/midi";
import MidiDeviceChooser from "./MidiDeviceChooser";
import { useRef } from "react";
import { ArrowDropDown } from "@mui/icons-material";
import Peers from "./Peers";
import { useTranslation } from "react-i18next";
import SectionHeader from "./SectionHeader";



const Configurator = () => {
  const { t } = useTranslation();
  const deployConfiguration = useIOStore((state) => state.deploy);
  const inputs = useIOStore((state) => state.inputs);
  const outputs = useIOStore((state) => state.outputs);
  const peers = useIOStore((state) => state.peers);
  const initialized = useMIDIStore((state) => state.initialized);
  const selectedOutputId = useMIDIStore(
    (state) => state.selectedConfiguratorOutputDevice
  );
  const setSelectedOutputId = useMIDIStore(
    (state) => state.setSelectedConfiguratorOutputDevice
  );

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
    <Box display={"flex"} flexDirection={"column"} gap={1} marginBottom={2}>
      <Box display={"flex"} gap={2} mt={2} mb={2} pl={2} pr={2}>
        {/* Hidden file input */}
        <input
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Tooltip title={t("tooltip_save_configuration_to_file") || ""}>
          <IconButton color="inherit" onClick={saveToFile}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={t("tooltip_load_configuration_from_file") || ""}>
          <IconButton color="inherit" onClick={handleUploadClick}>
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={t("tooltip_load_configuration_from_device") || ""}>
          <IconButton color="inherit" onClick={handleUploadClick}>
            <DevicesOtherIcon />
          </IconButton>
        </Tooltip>

        <Box flex={1} />
        <MidiDeviceChooser
          value={selectedOutputId || ""}
          onChange={setSelectedOutputId}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => deployConfiguration(selectedOutputId || "")}
          disabled={!initialized}
        >
          Deploy
        </Button>
      </Box>
      <Container maxWidth="xl">
        <Accordion defaultExpanded={inputs.length > 0}>
          <AccordionSummary
            expandIcon={<ArrowDropDownIcon />}
            aria-controls="inputs-content"
          >
            <SectionHeader
              title={"Input Pin to MIDI Mapping"}
              tooltipKey="tooltip_pin_to_midi"
            />
          </AccordionSummary>
          <AccordionDetails>
            <Inputs></Inputs>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded={outputs.length > 0}>
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            aria-controls="outputs-content"
          >
            <SectionHeader
              title={"MIDI to Output Pin Mapping"}
              tooltipKey="tooltip_midi_to_pin"
            />
          </AccordionSummary>
          <AccordionDetails>
            <Outputs></Outputs>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded={peers.length > 0}>
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            aria-controls="wireless-midi-content"
          >
            <SectionHeader
              title={"Wireless MIDI Configuration"}
              tooltipKey="tooltip_wireless_midi"
            />
          </AccordionSummary>
          <AccordionDetails>
            <Peers></Peers>
          </AccordionDetails>
        </Accordion>
      </Container>
      <Box flex={1}></Box>
    </Box>
  );
};

export default Configurator;
