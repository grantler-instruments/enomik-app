import React, { useState, useRef } from "react";
import {
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
import { ESPLoader, Transport } from "esptool-js";

type StatusType = "error" | "warning" | "info" | "success";

interface Status {
  message: string;
  type: StatusType;
}

const FirmwareUploader: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<Status>({ message: "", type: "info" });
  const [progress, setProgress] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [flashAddress, setFlashAddress] = useState<string>("0x10000");
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [chipInfo, setChipInfo] = useState<string>("");
  
  const espLoaderRef = useRef<any>(null);
  const transportRef = useRef<any>(null);

  const updateStatus = (message: string, type: StatusType = "info"): void => {
    setStatus({ message, type });
  };

  const connect = async (): Promise<void> => {
    try {
      updateStatus("Requesting serial port...", "info");
      const port = await (navigator as any).serial.requestPort();
      
      updateStatus("Connecting...", "info");
      const transport = new Transport(port, true);
      transportRef.current = transport;

      const loader = new ESPLoader({
        transport,
        baudrate: 115200,
        terminal: {
          clean: () => {},
          writeLine: (text: string) => console.log(text),
          write: (text: string) => console.log(text),
        },
      });
      
      espLoaderRef.current = loader;

      updateStatus("Connecting to chip...", "info");
      await loader.main();
      
      const chipName = await loader.chipName();
      const macAddr = await loader.macAddr();
      
      setChipInfo(`${chipName} (MAC: ${macAddr})`);
      setConnected(true);
      updateStatus(`Connected to ${chipName}! Ready to flash.`, "success");
    } catch (err) {
      const error = err as Error;
      updateStatus(`Connection error: ${error.message}`, "error");
      if (transportRef.current) {
        await transportRef.current.disconnect();
        transportRef.current = null;
      }
      espLoaderRef.current = null;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      if (espLoaderRef.current) {
        await espLoaderRef.current.hardReset();
      }
      if (transportRef.current) {
        await transportRef.current.disconnect();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      espLoaderRef.current = null;
      transportRef.current = null;
      setConnected(false);
      setChipInfo("");
      updateStatus("Disconnected", "info");
    }
  };

  const flashBin = async (): Promise<void> => {
    if (!file || !connected || !espLoaderRef.current) {
      updateStatus("Please connect and select a file first", "error");
      return;
    }

    try {
      setIsFlashing(true);
      setProgress(0);
      updateStatus("Starting flash process...", "info");

      const loader = espLoaderRef.current;
      
      const arrayBuffer = await file.arrayBuffer();
      const fileArray = new Uint8Array(arrayBuffer);

      const address = parseInt(flashAddress, 16);
      if (isNaN(address)) {
        throw new Error("Invalid flash address");
      }

      updateStatus(`Flashing ${file.name} to 0x${address.toString(16)}...`, "info");

      const fileData = [{
        data: fileArray,
        address: address,
      }];

      await loader.writeFlash({
        fileArray: fileData,
        flashSize: "detect",
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex: number, written: number, total: number) => {
          const percent = (written / total) * 100;
          setProgress(percent);
        },
      });

      setProgress(100);
      updateStatus("Flash complete! Resetting device...", "success");
      
      await loader.hardReset();
      
      updateStatus("Flash complete! Device has been reset.", "success");
    } catch (err) {
      const error = err as Error;
      updateStatus(`Flash error: ${error.message}`, "error");
      setProgress(0);
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
    <Box p={2}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Professional ESP firmware flasher using esptool-js. Supports ESP32, ESP32-S2, 
        ESP32-S3, ESP32-C3, and ESP8266. Automatically detects chip type and handles 
        bootloader mode - no manual button pressing required!
      </Alert>
      
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
          
          {chipInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">{chipInfo}</Typography>
            </Alert>
          )}
          
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
              <ListItemText primary="3. Tool automatically detects chip and enters bootloader mode" />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText primary="4. Select your .bin file" />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText primary="5. Verify flash address (0x10000 is default for apps)" />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText primary="6. Click 'Flash Firmware'" />
            </ListItem>
          </List>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> If auto-connect fails, manually enter bootloader: 
              Hold BOOT, press RESET, release BOOT.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FirmwareUploader;