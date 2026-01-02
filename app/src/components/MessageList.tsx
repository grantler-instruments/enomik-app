import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Close } from "@mui/icons-material";
import SendIcon from "@mui/icons-material/Send";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import { v4 as uuidv4 } from "uuid";

import { useMIDIStore } from "../store/midi";
import { MIDI_STATUS, typeToLabel } from "../utils/midi";
import { useState } from "react";
import Filter, { midiTypes } from "./Filter";
import { useTranslation } from "react-i18next";

// Grid layout configuration for desktop
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

  const { t } = useTranslation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeInputs, setActiveInputs] = useState<string[]>([]);
  const [activeOutputs, setActiveOutputs] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<number[]>([...midiTypes]);
  const [activeChannels, setActiveChannels] = useState(
    Array.from({ length: 16 }).map((_, i) => i)
  );

  // Calculate active filters count
  const activeFilters = [
    activeInputs.length < inputs.length,
    activeOutputs.length < outputs.length,
    activeTypes.length < midiTypes.length,
    activeChannels.length < 16,
  ].filter(Boolean).length;

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const channelMatch = msg.channel
      ? activeChannels.includes(msg.channel)
      : true;
    const deviceMatch =
      activeInputs.includes(msg.deviceId) ||
      activeOutputs.includes(msg.deviceId);
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
    if (
      msg.type === MIDI_STATUS.NOTE_OFF ||
      msg.type === MIDI_STATUS.NOTE_ON ||
      msg.type === MIDI_STATUS.POLY_PRESSURE
    ) {
      return msg.note;
    }
    if (
      msg.type === MIDI_STATUS.CONTROL_CHANGE ||
      msg.type === MIDI_STATUS.PROGRAM_CHANGE
    ) {
      return msg.controller;
    }
    return "";
  };

  // Helper to get velocity/value
  const getVelocityOrValue = (msg: any) => {
    if (msg.type === MIDI_STATUS.NOTE_OFF || msg.type === MIDI_STATUS.NOTE_ON) {
      return msg.velocity;
    }
    if (
      msg.type === MIDI_STATUS.CONTROL_CHANGE ||
      msg.type === MIDI_STATUS.POLY_PRESSURE ||
      msg.type === MIDI_STATUS.CHANNEL_PRESSURE
    ) {
      return msg.value;
    }
    if (msg.type === MIDI_STATUS.PITCH_BEND) {
      return msg.pitchBendValue - 8192;
    }
    return "";
  };

  // Helper to format data column
  const formatData = (msg: any) => {
    if (msg.type === MIDI_STATUS.SYSEX_START) {
      return msg.data?.join(", ") || "";
    }

    const parts = [msg.type];

    if (
      msg.type === MIDI_STATUS.NOTE_OFF ||
      msg.type === MIDI_STATUS.NOTE_ON ||
      msg.type === MIDI_STATUS.POLY_PRESSURE
    ) {
      if (msg.note !== undefined) parts.push(msg.note);
      if (msg.velocity !== undefined) parts.push(msg.velocity);
    }

    if (msg.type === MIDI_STATUS.CONTROL_CHANGE) {
      if (msg.controller) parts.push(msg.controller);
      parts.push(msg.value);
    }

    if (
      msg.type === MIDI_STATUS.POLY_PRESSURE ||
      msg.type === MIDI_STATUS.CHANNEL_PRESSURE
    ) {
      parts.push(msg.value);
    }

    return parts.join(", ");
  };

  // Mobile Card Component
  const MobileMessageCard = ({ msg, index }: { msg: any; index: number }) => (
    <Card
      sx={{
        mb: 1.5,
        backgroundColor: index % 2 === 0 ? "background.paper" : "action.hover",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {msg.incoming ? (
              <CallReceivedIcon fontSize="small" color="primary" />
            ) : (
              <SendIcon
                fontSize="small"
                color="secondary"
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  sendMessage({ ...msg, id: uuidv4() }, msg.deviceId)
                }
              />
            )}
            <Chip
              label={typeToLabel(msg.type)}
              size="small"
              color={msg.incoming ? "primary" : "secondary"}
              sx={{ fontSize: "0.7rem", height: "24px" }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.7rem" }}
          >
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr"
          gap={1.5}
          sx={{ fontSize: "0.875rem" }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ fontSize: "0.65rem", mb: 0.25 }}
            >
              Device
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.8rem", wordBreak: "break-word" }}
            >
              {getDeviceName(msg)}
            </Typography>
          </Box>

          {msg.channel && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.65rem", mb: 0.25 }}
              >
                Channel
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {msg.channel}
              </Typography>
            </Box>
          )}

          {getNoteOrController(msg) !== "" && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.65rem", mb: 0.25 }}
              >
                Note/CC/PRG
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {getNoteOrController(msg)}
              </Typography>
            </Box>
          )}

          {getVelocityOrValue(msg) !== "" && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.65rem", mb: 0.25 }}
              >
                Vel/Value
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {getVelocityOrValue(msg)}
              </Typography>
            </Box>
          )}
        </Box>

        {formatData(msg) && (
          <Box mt={1.5} pt={1.5} borderTop="1px solid" borderColor="divider">
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ fontSize: "0.65rem", mb: 0.25 }}
            >
              Data
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.75rem",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {formatData(msg)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box mt={isMobile ? 2 : 4} px={isMobile ? 1 : 0}>
      <Box display="flex" flexDirection="column" mb={2}>
        <Accordion>
          <AccordionSummary
            expandIcon={<ArrowDropDownIcon />}
            aria-controls="inputs-content"
          >
            <Box display="flex" gap={1} alignItems="center">
              <Typography variant={isMobile ? "h6" : "h3"}>Filter</Typography>
              {activeFilters > 0 && (
                <Typography
                  variant="body2"
                  fontSize={isMobile ? "9px" : "10px"}
                >
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant={isMobile ? "h6" : "h3"}>History</Typography>
          <Button
            variant="outlined"
            onClick={clear}
            startIcon={<Close />}
            size={isMobile ? "small" : "medium"}
          >
            {t("clear")}
          </Button>
        </Box>

        {isMobile ? (
          // Mobile Card Layout
          <Box
            sx={{
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            {filteredMessages.map((msg, index) => (
              <MobileMessageCard key={index} msg={msg} index={index} />
            ))}
          </Box>
        ) : (
          // Desktop Table Layout
          <Box
            sx={{
              maxHeight: "400px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            {/* Header */}
            <Grid
              container
              sx={{ fontWeight: "bold", pb: 1, borderBottom: "1px solid #333" }}
            >
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
                  backgroundColor: index % 2 === 0 ? "inherit" : "action.hover",
                  p: 1,
                }}
              >
                <Grid size={{ xs: gridColumns.direction }}>
                  <Box>
                    {msg.incoming ? (
                      <CallReceivedIcon color="primary" />
                    ) : (
                      <SendIcon
                        color="secondary"
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          sendMessage({ ...msg, id: uuidv4() }, msg.deviceId)
                        }
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
                  <Box>{typeToLabel(msg.type)}</Box>
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
        )}
      </Box>
    </Box>
  );
}

export default MessageList;
