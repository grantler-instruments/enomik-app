import { useState, useEffect, useRef } from "react";
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

type LogType = "send" | "receive" | "error" | "system";

interface LogEntry {
  message: string;
  type: LogType;
  timestamp: Date;
}

export default function WebSerialMonitor() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [reader, setReader] =
    useState<ReadableStreamDefaultReader<string> | null>(null);
  const [writer, setWriter] =
    useState<WritableStreamDefaultWriter<string> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      if (!selectedPort) throw new Error("Failed to open serial port");

      const textDecoder = new TextDecoderStream();
      (selectedPort.readable as unknown as ReadableStream<Uint8Array>)
        ?.pipeTo(textDecoder.writable as unknown as WritableStream<Uint8Array>)
        .catch((err) => addLog(`Readable pipeline error: ${err}`, "error"));
      const r = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      textEncoder.readable
        .pipeTo(selectedPort.writable as unknown as WritableStream<Uint8Array>)
        .catch((err) => addLog(`Writable pipeline error: ${err}`, "error"));

      const w = textEncoder.writable.getWriter();

      setPort(selectedPort);
      setReader(r);
      setWriter(w);
      setIsConnected(true);

      addLog("Connected to serial device", "system");

      readLoop(r);
    } catch (error) {
      addLog(`Error: ${(error as Error).message}`, "error");
    }
  };

  const readLoop = async (r: ReadableStreamDefaultReader<string>) => {
    try {
      while (true) {
        const { value, done } = await r.read();
        if (done) break;
        if (value) {
          addLog(value, "receive");
        }
      }
    } catch (error) {
      addLog(`Read error: ${(error as Error).message}`, "error");
    }
  };

  const disconnect = async () => {
    try {
      if (reader) {
        await reader.cancel();
        setReader(null);
      }
      if (writer) {
        await writer.close();
        setWriter(null);
      }
      if (port) {
        await port.close();
        setPort(null);
      }
      setIsConnected(false);
      addLog("Disconnected", "system");
    } catch (error) {
      addLog(`Disconnect error: ${(error as Error).message}`, "error");
    }
  };

  const sendData = async () => {
    if (!writer || !input.trim()) return;

    try {
      await writer.write(input + "\n");
      addLog(input, "send");
      setInput("");
    } catch (error) {
      addLog(`Send error: ${(error as Error).message}`, "error");
    }
  };

  const addLog = (message: string, type: LogType) => {
    setLog((prev) => [...prev, { message, type, timestamp: new Date() }]);
  };

  const clearLog = () => {
    setLog([]);
  };

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

  return (
    <Box sx={{ p: 1 }}>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {!isConnected ? (
            <Button variant="contained" onClick={connect}>
                {t("connect")}
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={disconnect}>
              {t("disconnect")}
            </Button>
          )}
          <Box flex={1} />
          <Button variant="contained" color="error" onClick={clearLog}>
            {t("clear")}
          </Button>
        </Box>

        <Paper sx={{ p: 2, height: 400, overflow: "auto" }}>
          {log.length === 0 ? (
            <Typography color="text.secondary">No data yet...</Typography>
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
            onKeyPress={(e) => e.key === "Enter" && sendData()}
            placeholder="Type message and press Enter..."
            disabled={!isConnected}
          />
          <IconButton
            onClick={sendData}
            disabled={!isConnected || !input.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Stack>
    </Box>
  );
}
