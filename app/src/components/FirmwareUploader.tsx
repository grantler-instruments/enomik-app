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
  FlashOn as FlashOnIcon,
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
    flashFirmware,
    disconnect,
  } = useSerialStore();

  const [file, setFile] = useState<File | null>(null);
  const [selectedFirmware, setSelectedFirmware] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when log updates
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

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

  /* ------------------------ connect & flash in one operation ------------------------ */

  const handleConnectAndFlash = async (): Promise<void> => {
    if (!file) {
      return;
    }

    try {
      // Single function does everything
      await flashFirmware(file);
    } catch (err) {
      // Error already logged in store
      console.error(err);
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    try {
      await disconnect();
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------------ render ------------------------ */

  const canFlash = Boolean(file) && !isFlashing;
  const isConnectedAndNotFlashing = isConnected && !isFlashing;

  return (
    <Box p={2}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Select your firmware file first, then click "Connect & Flash" to upload it to your ESP32-S2.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            ESP32-S2 Manual Bootloader Mode (if auto-reset fails):
          </Typography>
          <Typography variant="body2" component="ol" sx={{ pl: 2, mt: 0.5 }}>
            <li>Hold the BOOT button (GPIO0)</li>
            <li>While holding BOOT, press and release RESET (or plug in USB)</li>
            <li>Release BOOT button</li>
            <li>Click "Connect & Flash" immediately</li>
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Step 1: Select Firmware */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 1: Select Firmware
          </Typography>
          
          <Select
            fullWidth
            value={selectedFirmware}
            onChange={(e) => setSelectedFirmware(e.target.value)}
            displayEmpty
            sx={{ mb: 2 }}
            disabled={isFlashing}
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
            {file ? file.name : "Or select custom .bin file"}
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
                color="success"
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

        {/* Step 2: Connect & Flash */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 2: Connect & Flash
          </Typography>

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
            color="primary"
            onClick={handleConnectAndFlash}
            startIcon={<FlashOnIcon />}
            disabled={!canFlash}
            sx={{ mb: 2 }}
          >
            {isFlashing ? "Flashing..." : "Connect & Flash"}
          </Button>

          {isConnectedAndNotFlashing && (
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="error"
              onClick={handleDisconnect}
              startIcon={<UsbOffIcon />}
            >
              Disconnect
            </Button>
          )}

          {!file && !isFlashing && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please select a firmware file first
            </Alert>
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

      <Console canSend={false} height={200} />
    </Box>
  );
};

export default FirmwareUploader;