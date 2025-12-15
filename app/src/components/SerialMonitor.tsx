import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useSerialStore } from "../store/serial";

type LogType = "send" | "receive" | "error" | "system";

export default function SerialMonitor() {
  const {
    isConnected,
    log,
    connect,
    disconnect,
    send,
    clearLog,
  } = useSerialStore();

  const [input, setInput] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const getLogColor = (type: LogType) => {
    switch (type) {
      case "send":
        return "primary.main";
      case "receive":
        return "text.primary";
      case "error":
        return "error.main";
      case "system":
        return "text.secondary";
      default:
        return "text.primary";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await send(input);
    setInput("");
  };

  return (
    <Box sx={{ p: 1 }}>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {!isConnected ? (
            <Button variant="contained" onClick={connect}>
              {t("connect")}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={disconnect}
            >
              {t("disconnect")}
            </Button>
          )}

          <Box flex={1} />

          <Button
            variant="contained"
            color="error"
            onClick={clearLog}
          >
            {t("clear")}
          </Button>
        </Box>

        <Paper sx={{ p: 2, height: 400, overflow: "auto" }}>
          {log.length === 0 ? (
            <Typography color="text.secondary">
              No data yet...
            </Typography>
          ) : (
            log.map((entry, idx) => (
              <Typography
                key={idx}
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  color: getLogColor(entry.type),
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {entry.type === "send" && "> "}
                {entry.message}
              </Typography>
            ))
          )}
          <div ref={logEndRef} />
        </Paper>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder={t("typeMessage")}
            disabled={!isConnected}
          />
          <IconButton
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Stack>
    </Box>
  );
}
