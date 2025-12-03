import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Grid,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SendIcon from "@mui/icons-material/Send";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import { v4 as uuidv4 } from "uuid";

import { useMIDIStore } from "../store/midi";
import { typeToLabel } from "../utils/midi";
import { useState } from "react";
import Filter, { midiTypes } from "./Filter";

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
  let activeFilters = 0;
  if (activeInputs.length > 0) activeFilters++;
  if (activeOutputs.length > 0) activeFilters++;
  if (activeTypes.length < midiTypes.length) activeFilters++;
  if (activeChannels.length < 16) activeFilters++;
  return (
    <Box mt={4}>
      <Box display="flex" flexDirection={"column"} mb={2}>
        <Typography variant="h2">MIDI Monitor</Typography>
        <Accordion>
          <AccordionSummary
            expandIcon={<ArrowDropDownIcon />}
            aria-controls="inputs-content"
          >
            <Box
              display={"flex"}
              gap={1}
              justifyItems={"flex-start"}
              alignItems={"flex-start"}
            >
              <Typography variant="h3">Filter</Typography>{" "}
              <Typography variant="body2" fontSize={"10px"}>
                {activeFilters > 0 && <> ({activeFilters + 1}) active</>}
              </Typography>
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

      <Box display={"flex"} flexDirection={"column"} gap={2}>
        <Box display={"flex"}>
          <Typography variant="h3">History</Typography>
          <Box flex={1}></Box>

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
          display={"flex"}
          flexDirection={"column"}
        >
          <Grid container>
            <Grid size={{ xs: 1 }}>Direction</Grid>
            <Grid size={{ xs: 2 }}>Timestamp</Grid>
            <Grid size={{ xs: 2 }}>Device</Grid>
            <Grid size={{ xs: 1 }}>Channel</Grid>
            <Grid size={{ xs: 2 }}>Type</Grid>
            <Grid size={{ xs: 1 }}>Note/CC</Grid>
            <Grid size={{ xs: 1 }}>Vel/Value</Grid>
            <Grid size={{ xs: 2 }}>Data</Grid>
          </Grid>
          {messages
            .filter((msg) => {
              const channelMatch = msg.channel
                ? activeChannels.includes(msg.channel)
                : true;
              const inputMatch = activeInputs.includes(msg.deviceId);
              const outputMatch = activeOutputs.includes(msg.deviceId);
              const typeMatch = activeTypes.includes(msg.type);
              return channelMatch && (inputMatch || outputMatch) && typeMatch;
            })
            .map((msg, index) => (
              <Grid
                container
                key={index}
                sx={{
                  backgroundColor:
                    index % 2 === 0 ? "inherit" : "rgb(24,24,24)",
                }}
                p={1}
              >
                <Grid size={{ xs: 1 }}>
                  {msg.incoming && <CallReceivedIcon />}
                  {!msg.incoming && (
                    <SendIcon
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        sendMessage({ ...msg, id: uuidv4() }, msg.deviceId)
                      }
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 2 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Grid>
                {msg.incoming && (
                  <Grid size={{ xs: 2 }}>
                    {inputs.find((input) => input.id === msg.deviceId)?.name}
                  </Grid>
                )}
                {!msg.incoming && (
                  <Grid size={{ xs: 2 }}>
                    {outputs.find((output) => output.id === msg.deviceId)?.name}
                  </Grid>
                )}
                <Grid size={{ xs: 1 }}>{msg.channel}</Grid>
                <Grid size={{ xs: 2 }}>
                  {typeToLabel(msg.type)} ({msg.type})
                </Grid>

                {(msg.type === 128 || msg.type === 144) && (
                  <Grid size={{ xs: 1 }}>{msg.note}</Grid>
                )}
                {msg.type === 176 && (
                  <Grid size={{ xs: 1 }}>{msg.controller}</Grid>
                )}
                {msg.type === 240 && ( //sysex
                  <Grid size={{ xs: 1 }}></Grid>
                )}

                {(msg.type === 128 || msg.type === 144) && (
                  <Grid size={{ xs: 1 }}>{msg.velocity}</Grid>
                )}
                {msg.type === 176 && <Grid size={{ xs: 1 }}>{msg.value}</Grid>}
                {msg.type === 240 && ( //sysex
                  <Grid size={{ xs: 1 }}></Grid>
                )}

                <Grid size={{ xs: 2 }}>
                  {msg.type !== 240 && <>{msg.type}</>}
                  {(msg.type === 128 || msg.type === 144) && msg.note && (
                    <>, {msg.note}</>
                  )}
                  {(msg.type === 128 || msg.type === 144) && msg.velocity && (
                    <>, {msg.velocity}</>
                  )}
                  {msg.type === 176 && msg.controller && (
                    <>, {msg.controller}</>
                  )}
                  {msg.type === 176 && msg.value && <>, {msg.value}</>}
                  {msg.type === 240 && <>{msg.data?.join(", ")}</>}
                </Grid>
              </Grid>
            ))}
        </Box>
      </Box>
    </Box>
  );
}

export default MessageList;
