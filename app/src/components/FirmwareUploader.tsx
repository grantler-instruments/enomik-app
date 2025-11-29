import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  TextField,
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Bolt as BoltIcon,
  Upload as UploadIcon,
  UsbOff as UsbOffIcon,
  Usb as UsbIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Web Serial API type definitions
interface SerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface Navigator {
  serial: {
    requestPort(): Promise<SerialPort>;
  };
}

declare const navigator: Navigator;

type StatusType = "error" | "warning" | "info" | "success";

interface Status {
  message: string;
  type: StatusType;
}

const FirmwareUploader: React.FC = () => {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<Status>({ message: "", type: "info" });
  const [progress, setProgress] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [flashAddress, setFlashAddress] = useState<string>("0x10000");
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const updateStatus = (message: string, type: StatusType = "info"): void => {
    setStatus({ message, type });
  };

  const connect = async (): Promise<void> => {
    try {
      const p = await navigator.serial.requestPort();
      await p.open({ baudRate: 115200 });
      setPort(p);
      setConnected(true);
      updateStatus("Connected! Ready to flash.", "success");
    } catch (err) {
      const error = err as Error;
      updateStatus(`Connection error: ${error.message}`, "error");
    }
  };

  const disconnect = async (): Promise<void> => {
    if (port) {
      await port.close();
      setPort(null);
      setConnected(false);
      updateStatus("Disconnected", "info");
    }
  };

  const sendCommand = async (data: Uint8Array): Promise<void> => {
    if (!port?.writable) return;
    const writer = port.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
  };

  const readResponse = async (
    timeout: number = 1000
  ): Promise<Uint8Array | null> => {
    if (!port?.readable) return null;

    const reader = port.readable.getReader();
    const timer = setTimeout(() => reader.cancel(), timeout);

    try {
      const { value } = await reader.read();
      clearTimeout(timer);
      return value || null;
    } catch (err) {
      return null;
    } finally {
      reader.releaseLock();
    }
  };

  const enterBootloader = async (): Promise<boolean> => {
    updateStatus("Entering bootloader mode...", "info");

    const syncCmd = new Uint8Array([
      0xc0, 0x00, 0x08, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x07, 0x12,
      0x20, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0xc0,
    ]);

    await sendCommand(syncCmd);
    await new Promise((r) => setTimeout(r, 100));

    const response = await readResponse();
    if (response) {
      updateStatus("Bootloader ready!", "success");
      return true;
    }

    updateStatus(
      "Warning: Could not verify bootloader. Try pressing BOOT+RESET on your ESP.",
      "warning"
    );
    return false;
  };

  const flashBin = async (): Promise<void> => {
    if (!file || !connected) {
      updateStatus("Please connect and select a file first", "error");
      return;
    }

    try {
      setIsFlashing(true);
      updateStatus("Starting flash process...", "info");
      setProgress(0);

      await enterBootloader();

      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      updateStatus(`Flashing ${file.name} (${data.length} bytes)...`, "info");

      const chunkSize = 4096;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await sendCommand(chunk);
        setProgress((i / data.length) * 100);
        await new Promise((r) => setTimeout(r, 50));
      }

      setProgress(100);
      updateStatus(
        "Flash complete! Reset your ESP to run the new firmware.",
        "success"
      );
    } catch (err) {
      const error = err as Error;
      updateStatus(`Flash error: ${error.message}`, "error");
    } finally {
      setIsFlashing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    if (f && f.name.endsWith(".bin")) {
      setFile(f);
      updateStatus(
        `Selected: ${f.name} (${(f.size / 1024).toFixed(2)} KB)`,
        "success"
      );
    } else {
      updateStatus("Please select a .bin file", "error");
    }
  };

  const clearFile = (): void => {
    setFile(null);
    updateStatus("", "info");
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <BoltIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold">
              FirmwareUploader
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ESP Web Serial Flasher
            </Typography>
          </Box>
        </Box>

        {/* Connection Section */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              {connected ? <UsbIcon color="success" /> : <UsbOffIcon />}
              Connection
              {connected && (
                <Chip
                  label="Connected"
                  color="success"
                  size="small"
                  sx={{ ml: "auto" }}
                />
              )}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              color={connected ? "error" : "primary"}
              onClick={connected ? disconnect : connect}
              startIcon={connected ? <UsbOffIcon /> : <UsbIcon />}
              sx={{ mt: 2 }}
            >
              {connected ? "Disconnect" : "Connect to ESP"}
            </Button>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Firmware File
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                size="large"
                startIcon={<UploadIcon />}
                sx={{
                  py: 3,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                    borderStyle: "dashed",
                  },
                }}
              >
                {file ? file.name : "Select .bin file"}
                <input
                  type="file"
                  accept=".bin"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              {file && (
                <Box
                  sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Chip
                    label={`${(file.size / 1024).toFixed(2)} KB`}
                    color="primary"
                    size="small"
                  />
                  <IconButton size="small" onClick={clearFile}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            <TextField
              label="Flash Address (hex)"
              value={flashAddress}
              onChange={(e) => setFlashAddress(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Common addresses: 0x10000 (app), 0x1000 (bootloader), 0x8000 (partitions)"
            />
          </CardContent>
        </Card>

        {/* Flash Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={flashBin}
          disabled={!connected || !file || isFlashing}
        >
          {isFlashing ? "Flashing..." : "Flash Firmware"}
        </Button>

        {/* Progress */}
        {progress > 0 && (
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" fontWeight="medium">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        )}

        {/* Status */}
        {status.message && (
          <Alert
            severity={status.type}
            onClose={() => setStatus({ message: "", type: "info" })}
            sx={{ mt: 3 }}
          >
            {status.message}
          </Alert>
        )}

        {/* Instructions */}
        <Card variant="outlined" sx={{ mt: 3, bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Instructions
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Connect your ESP via USB" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="2. Click 'Connect to ESP' and select the port" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="3. Select your .bin file" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="4. Put ESP in bootloader mode (hold BOOT, press RESET)" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="5. Click 'Flash Firmware'" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
};

export default FirmwareUploader;
