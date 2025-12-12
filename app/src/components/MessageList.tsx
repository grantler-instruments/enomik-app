import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SendIcon from "@mui/icons-material/Send";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import { v4 as uuidv4 } from "uuid";

import { useMIDIStore } from "../store/midi";
import { MIDI_STATUS, typeToLabel } from "../utils/midi";
import { useState } from "react";
import Filter, { midiTypes } from "./Filter";

// Grid layout configuration
const gridColumns = {
  direction: 1,
  timestamp: 2,
  device: 2,
  channel: 1,
  type: 2,
  noteCC: 1,
  velocity: 1,
  data: 2,
};

function MessageList() {
  const messages = useMIDIStore((state) => state.messages);
  const sendMessage = useMIDIStore((state) => state.sendMessage);
  const inputs = useMIDIStore((state) => state.inputs);
  const outputs = useMIDIStore((state) => state.outputs);
  const clear = useMIDIStore((state) => state.clear);
  
  const [activeInputs, setActiveInputs] = useState<string[]>([]);
  const [activeOutputs, setActiveOutputs] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<number[]>([...midiTypes]);
  const [activeChannels, setActiveChannels] = useState(
    Array.from({ length: 16 }).map((_, i) => i)
  );

  // Calculate active filters count
  const activeFilters = [
    activeInputs.length > 0,
    activeOutputs.length > 0,
    activeTypes.length < midiTypes.length,
    activeChannels.length < 16,
  ].filter(Boolean).length;

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const channelMatch = msg.channel ? activeChannels.includes(msg.channel) : true;
    const deviceMatch = activeInputs.includes(msg.deviceId) || activeOutputs.includes(msg.deviceId);
    const typeMatch = activeTypes.includes(msg.type);
    return channelMatch && deviceMatch && typeMatch;
  });

  // Helper to get device name
  const getDeviceName = (msg: any) => {
    if (msg.incoming) {
      return inputs.find((input) => input.id === msg.deviceId)?.name || "";
    }
    return outputs.find((output) => output.id === msg.deviceId)?.name || "";
  };

  // Helper to get note/CC/PRG value
  const getNoteOrController = (msg: any) => {
    if (msg.type === MIDI_STATUS.NOTE_OFF || msg.type === MIDI_STATUS.NOTE_ON) {
      return msg.note;
    }
    if (msg.type === MIDI_STATUS.CONTROL_CHANGE || msg.type === MIDI_STATUS.PROGRAM_CHANGE) {
      return msg.controller;
    }
    return "";
  };

  // Helper to get velocity/value
  const getVelocityOrValue = (msg: any) => {
    if (msg.type === MIDI_STATUS.NOTE_OFF || msg.type === MIDI_STATUS.NOTE_ON) {
      return msg.velocity;
    }
    if (msg.type === MIDI_STATUS.CONTROL_CHANGE) {
      return msg.value;
    }
    return "";
  };

  // Helper to format data column
  const formatData = (msg: any) => {
    if (msg.type === MIDI_STATUS.SYSEX_START) {
      return msg.data?.join(", ") || "";
    }
    
    const parts = [msg.type];
    
    if (msg.type === MIDI_STATUS.NOTE_OFF || msg.type === MIDI_STATUS.NOTE_ON) {
      if (msg.note !== undefined) parts.push(msg.note);
      if (msg.velocity !== undefined) parts.push(msg.velocity);
    }
    
    if (msg.type === MIDI_STATUS.CONTROL_CHANGE) {
      if (msg.controller) parts.push(msg.controller);
      parts.push(msg.value);
    }
    
    return parts.join(", ");
  };

  return (
    <Box mt={4}>
      <Box display="flex" flexDirection="column" mb={2}>
        <Typography variant="h2">MIDI Monitor</Typography>
        <Accordion>
          <AccordionSummary
            expandIcon={<ArrowDropDownIcon />}
            aria-controls="inputs-content"
          >
            <Box display="flex" gap={1} alignItems="center">
              <Typography variant="h3">Filter</Typography>
              {activeFilters > 0 && (
                <Typography variant="body2" fontSize="10px">
                  ({activeFilters} active)
                </Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Filter
              onActiveChannelsChange={setActiveChannels}
              onActiveInputsChange={setActiveInputs}
              onActiveOutputsChange={setActiveOutputs}
              onActiveTypesChange={setActiveTypes}
            />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">History</Typography>
          <Button variant="outlined" onClick={clear}>
            Clear
          </Button>
        </Box>

        <Box
          sx={{
            maxHeight: "400px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          {/* Header */}
          <Grid container sx={{ fontWeight: "bold", pb: 1, borderBottom: "1px solid #333" }}>
            <Grid size={{ xs: gridColumns.direction }}>
              <Box>Direction</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.timestamp }}>
              <Box>Timestamp</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.device }}>
              <Box>Device</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.channel }}>
              <Box>Channel</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.type }}>
              <Box>Type</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.noteCC }}>
              <Box>Note/CC/PRG</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.velocity }}>
              <Box>Vel/Value</Box>
            </Grid>
            <Grid size={{ xs: gridColumns.data }}>
              <Box>Data</Box>
            </Grid>
          </Grid>

          {/* Data Rows */}
          {filteredMessages.map((msg, index) => (
            <Grid
              container
              key={index}
              sx={{
                backgroundColor: index % 2 === 0 ? "inherit" : "rgb(24,24,24)",
                p: 1,
              }}
            >
              <Grid size={{ xs: gridColumns.direction }}>
                <Box>
                  {msg.incoming ? (
                    <CallReceivedIcon />
                  ) : (
                    <SendIcon
                      sx={{ cursor: "pointer" }}
                      onClick={() => sendMessage({ ...msg, id: uuidv4() }, msg.deviceId)}
                    />
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: gridColumns.timestamp }}>
                <Box>{new Date(msg.timestamp).toLocaleTimeString()}</Box>
              </Grid>
              <Grid size={{ xs: gridColumns.device }}>
                <Box>{getDeviceName(msg)}</Box>
              </Grid>
              <Grid size={{ xs: gridColumns.channel }}>
                <Box>{msg.channel}</Box>
              </Grid>
              <Grid size={{ xs: gridColumns.type }}>
                <Box>
                  {typeToLabel(msg.type)} ({msg.type})
                </Box>
              </Grid>
              <Grid size={{ xs: gridColumns.noteCC }}>
                <Box>{getNoteOrController(msg)}</Box>
              </Grid>
              <Grid size={{ xs: gridColumns.velocity }}>
                <Box>{getVelocityOrValue(msg)}</Box>
              </Grid>
              <Grid size={{ xs: gridColumns.data }}>
                <Box>{formatData(msg)}</Box>
              </Grid>
            </Grid>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default MessageList;