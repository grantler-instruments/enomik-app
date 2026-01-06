import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Upload as UploadIcon,
  UsbOff as UsbOffIcon,
  Usb as UsbIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAppStore } from "../store/app";
import { useSerialStore } from "../store/serial";
import Console from "./SerialConsole";

const availableFirmwareFiles = [
  {
    label: "ESP-NOW Dongle",
    url: "https://example.com/firmware/dongle.bin",
    board: "lolin_s2_mini",
  },
];

const FirmwareUploader: React.FC = () => {
  const showHints = useAppStore((s) => s.showHints);

  const {
    chipInfo,
    isFlashing,
    flashProgress,
    log,
    isConnected,
    connectForFlashing,
    disconnect,
    flashFirmware,
  } = useSerialStore();

  const [file, setFile] = useState<File | null>(null);
  const [selectedFirmware, setSelectedFirmware] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  const isConnectedForFlashing = Boolean(chipInfo);

  // Auto-scroll to bottom when log updates
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);


  /* ------------------------ connection ------------------------ */

  const handleConnect = async (): Promise<void> => {
    try {
      await connectForFlashing();
    } catch (err) {
      // Error already logged in store
      console.error(err);
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    try {
      await disconnect();
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------------ flashing ------------------------ */

  const handleFlash = async (): Promise<void> => {
    if (!file) {
      return;
    }

    try {
      await flashFirmware(file);
    } catch (err) {
      // Error already logged in store
      console.error(err);
    }
  };

  /* ------------------------ file handling ------------------------ */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.name.endsWith(".bin")) {
      return;
    }
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
  };

  /* ------------------------ render ------------------------ */

  return (
    <Box p={2}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload firmware to ESP32 without Arduino IDE or PlatformIO. The serial
          monitor will be temporarily suspended during flashing.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          {chipInfo && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Chip:</strong> {chipInfo}
              </Typography>
            </Alert>
          )}

          <Button
            fullWidth
            size="large"
            variant="contained"
            color={isConnected? "error" : "primary"}
            onClick={isConnected? handleDisconnect : handleConnect}
            startIcon={isConnected? <UsbOffIcon /> : <UsbIcon />}
            disabled={isFlashing}
          >
            {isConnected? "Disconnect" : "Connect for Flashing"}
          </Button>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Select
            fullWidth
            value={selectedFirmware}
            onChange={(e) => setSelectedFirmware(e.target.value)}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>
              Select preset firmware...
            </MenuItem>
            {availableFirmwareFiles.map((fw) => (
              <MenuItem key={fw.url} value={fw.url}>
                {fw.label} ({fw.board})
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            size="large"
            startIcon={<UploadIcon />}
            sx={{ borderStyle: "dashed", borderWidth: 2 }}
            disabled={isFlashing}
          >
            {file ? file.name : "Select .bin file"}
            <input
              type="file"
              hidden
              accept=".bin"
              onChange={handleFileChange}
            />
          </Button>

          {file && (
            <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <Chip
                label={`${(file.size / 1024).toFixed(2)} KB`}
                size="small"
              />
              <IconButton
                size="small"
                onClick={clearFile}
                disabled={isFlashing}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Grid>
      </Grid>

      {flashProgress && flashProgress.total > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2" gutterBottom>
              Progress: {flashProgress.percentage.toFixed(1)}%
            </Typography>
            <LinearProgress
              value={flashProgress.percentage}
              variant="determinate"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {(flashProgress.written / 1024).toFixed(2)} KB /{" "}
              {(flashProgress.total / 1024).toFixed(2)} KB
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          size="large"
          onClick={handleFlash}
          disabled={!isConnected || !file || isFlashing}
        >
          {isFlashing ? "Flashing..." : "Flash Firmware"}
        </Button>
      </Box>
      <Console canSend={false} height={200} />
    </Box>
  );
};

export default FirmwareUploader;
