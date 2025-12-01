import { Box, Typography, Button } from "@mui/material";
import { useMIDIStore } from "../store/midi";
import { typeToLabel } from "../utils/midi";

function MessageList() {
  const messages = useMIDIStore((state) => state.messages);
  const clear = useMIDIStore((state) => state.clear);
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h2">MIDI Monitor</Typography>
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
        {messages.map((msg, index) => (
          <Box
            key={msg.id}
            sx={{
              py: 0.5,
              px: 1,
              backgroundColor: index % 2 === 0 ? "transparent" : "action.hover",
            }}
            display={"flex"}
            gap={1}
          >
            <Typography variant="body2">
              [{new Date(msg.timestamp).toLocaleTimeString()}]
            </Typography>
            <Typography variant="body2">{typeToLabel(msg.type)}</Typography>
            {msg.channel !== undefined && <Typography variant="body2">Ch: {msg.channel}</Typography>}
            {msg.note && <Typography variant="body2">Note: {msg.note}</Typography>}
            {msg.velocity && <Typography variant="body2">Vel: {msg.velocity}</Typography>}
            {msg.controller && <Typography variant="body2">controller: {msg.controller}</Typography>}
            {msg.value && <Typography variant="body2">Value: {msg.value}</Typography>}
            {msg.data && <Typography variant="body2">Data: {msg.data.join(", ")}</Typography>}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default MessageList;
