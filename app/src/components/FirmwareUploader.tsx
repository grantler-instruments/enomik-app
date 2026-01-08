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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Upload as UploadIcon,
  UsbOff as UsbOffIcon,
  Close as CloseIcon,
  FlashOn as FlashOnIcon,
} from "@mui/icons-material";
import { useAppStore } from "../store/app";
import { useSerialStore } from "../store/serial";
import Console from "./SerialConsole";

/* -------------------------------------------------------------------------- */
/*                                   types                                    */
/* -------------------------------------------------------------------------- */

type UploadStep = "select" | "bootloader" | "flash";

/* -------------------------------------------------------------------------- */
/*                              main component                                */
/* -------------------------------------------------------------------------- */

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
    init,
    availableFirmware,
  } = useSerialStore();

  const [step, setStep] = useState<UploadStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [selectedFirmware, setSelectedFirmware] = useState("");
  const [bootConfirmed, setBootConfirmed] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------------------------------------- */
  /*                                side effects                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    if (file) {
      setStep("bootloader");
    } else {
      resetUploader();
    }
  }, [file]);

  /* -------------------------------------------------------------------------- */
  /*                              helper functions                              */
  /* -------------------------------------------------------------------------- */

  const resetUploader = (): void => {
    setStep("select");
    setBootConfirmed(false);
    setSelectedFirmware("");
  };

  const clearFile = (): void => {
    setFile(null);
    resetUploader();
  };

  /* -------------------------------------------------------------------------- */
  /*                              firmware loading                              */
  /* -------------------------------------------------------------------------- */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    if (!f || !f.name.endsWith(".bin")) {
      return;
    }
    setFile(f);
  };

  // TODO: move to store
  const handlePresetSelect = async (fw: any): Promise<void> => {
    setSelectedFirmware(fw.label);

    try {
      const res = await fetch(fw.path);

      if (!res.ok) {
        throw new Error(`Failed to fetch firmware: ${res.statusText}`);
      }

      const blob = await res.blob();
      const fileName = fw.path.split("/").pop() || "firmware.bin";
      const f = new File([blob], fileName, {
        type: "application/octet-stream",
      });
      setFile(f);
    } catch (err) {
      console.error("Error loading firmware:", err);
      alert("Failed to load firmware. Please select the file manually.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              flashing logic                                */
  /* -------------------------------------------------------------------------- */

  const handleConnectAndFlash = async (): Promise<void> => {
    if (!file || !bootConfirmed) {
      return;
    }

    try {
      await flashFirmware(file);
    } catch (err) {
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

  /* -------------------------------------------------------------------------- */
  /*                                  guards                                    */
  /* -------------------------------------------------------------------------- */

  const canFlash =
    step === "flash" && bootConfirmed && Boolean(file) && !isFlashing;

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Box p={2}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Firmware upload is a three-stage process. Each step must be
            completed explicitly before the next becomes available.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* ------------------------------------------------------------------ */}
        {/* Step 1: Firmware selection                                         */}
        {/* ------------------------------------------------------------------ */}

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 1 — Select firmware
          </Typography>

          {/* Main firmware types as big buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
            {availableFirmware.map((fw) => (
              <Button
                key={fw.label}
                variant={
                  selectedFirmware === fw.label ? "contained" : "outlined"
                }
                size="large"
                fullWidth
                onClick={() => handlePresetSelect(fw)}
                disabled={isFlashing}
                sx={{
                  py: 2,
                  justifyContent: "flex-start",
                  textAlign: "left",
                  fontSize: "1rem",
                  fontWeight: selectedFirmware === fw.label ? "bold" : "normal",
                }}
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: selectedFirmware === fw.label ? 600 : 400,
                    }}
                  >
                    {fw.label}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1.3 }}
                  >
                    {fw.board}, {fw.description}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>

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
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`${(file.size / 1024).toFixed(2)} KB`}
                size="small"
                color="success"
              />
              <IconButton size="small" onClick={clearFile}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Grid>

        {/* ------------------------------------------------------------------ */}
        {/* Step 2: Bootloader confirmation                                    */}
        {/* ------------------------------------------------------------------ */}

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 2 — Enter bootloader mode
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Place the device into manual bootloader mode before proceeding.
              Hold the BOOT button while pressing and releasing the RESET
              button.
            </Typography>
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={bootConfirmed}
                onChange={(e) => {
                  setBootConfirmed(e.target.checked);
                  if (e.target.checked) {
                    setStep("flash");
                  }
                }}
                disabled={!file || isFlashing}
              />
            }
            label="I have placed the device in bootloader mode"
          />
        </Grid>
      </Grid>

      {/* -------------------------------------------------------------------- */}
      {/* Step 3: Connect and flash                                            */}
      {/* -------------------------------------------------------------------- */}

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Step 3 — Connect and flash
        </Typography>

        {chipInfo && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Detected chip:</strong> {chipInfo}
            </Typography>
          </Alert>
        )}

        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={<FlashOnIcon />}
          disabled={!canFlash}
          onClick={handleConnectAndFlash}
          sx={{ mb: 2 }}
        >
          {isFlashing ? "Flashing…" : "Connect & Flash"}
        </Button>

        {isConnected && !isFlashing && (
          <Button
            fullWidth
            size="small"
            variant="outlined"
            color="error"
            startIcon={<UsbOffIcon />}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        )}
      </Box>

      {/* -------------------------------------------------------------------- */}
      {/* Progress                                                             */}
      {/* -------------------------------------------------------------------- */}

      {flashProgress && flashProgress.total > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2" gutterBottom>
              Progress: {flashProgress.percentage.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={flashProgress.percentage}
            />
            <Typography variant="caption" color="text.secondary">
              {(flashProgress.written / 1024).toFixed(2)} KB /{" "}
              {(flashProgress.total / 1024).toFixed(2)} KB
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Console                                                              */}
      {/* -------------------------------------------------------------------- */}

      <Console canSend={false} height={200} />
      <div ref={logEndRef} />
    </Box>
  );
};

export default FirmwareUploader;
