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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import {
  Upload as UploadIcon,
  UsbOff as UsbOffIcon,
  Close as CloseIcon,
  FlashOn as FlashOnIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
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

  const [fwOpen, setFwOpen] = useState(true);
  const [bootOpen, setBootOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);

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

  /* -------------------------------------------------------------------------- */
  /*                              helper functions                              */
  /* -------------------------------------------------------------------------- */

  const resetUploader = (): void => {
    setStep("select");
    setFile(null);
    setSelectedFirmware("");
    setBootConfirmed(false);

    setFwOpen(true);
    setBootOpen(false);
    setFlashOpen(false);
  };

  /* -------------------------------------------------------------------------- */
  /*                              firmware loading                              */
  /* -------------------------------------------------------------------------- */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    if (!f || !f.name.endsWith(".bin")) return;

    setFile(f);
    setFwOpen(false);
    setBootOpen(true);
    setStep("bootloader");
  };

  const handlePresetSelect = async (fw: any): Promise<void> => {
    setSelectedFirmware(fw.label);

    try {
      const res = await fetch(fw.path);
      if (!res.ok) throw new Error(res.statusText);

      const blob = await res.blob();
      const f = new File([blob], fw.path.split("/").pop()!, {
        type: "application/octet-stream",
      });

      setFile(f);
      setFwOpen(false);
      setBootOpen(true);
      setStep("bootloader");
    } catch {
      alert("Failed to load firmware.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              flashing logic                                */
  /* -------------------------------------------------------------------------- */

  const handleConnectAndFlash = async (): Promise<void> => {
    if (!file || !bootConfirmed) return;

    try {
      await flashFirmware(file);
    } catch (err) {
      console.error(err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Box p={2}>
      <Grid container spacing={2}>
        {/* ------------------------------------------------------------------ */}
        {/* Step 1: Firmware selection                                         */}
        {/* ------------------------------------------------------------------ */}

        <Grid size={{ xs: 12 }}>
          <Accordion expanded={fwOpen} disabled={isFlashing}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="subtitle2">
                  Step 1 — Select firmware
                </Typography>

                {file && (
                  <>
                    {selectedFirmware && (
                      <Chip
                        size="small"
                        color="primary"
                        label={selectedFirmware}
                      />
                    )}
                    <Chip
                      size="small"
                      color="success"
                      label={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                  </>
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
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
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, lineHeight: 1.2 }}
                      >
                        {fw.label}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", lineHeight: 1.3 }}
                      >
                        {fw.board} — {fw.description}
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
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* ------------------------------------------------------------------ */}
        {/* Step 2: Bootloader confirmation                                    */}
        {/* ------------------------------------------------------------------ */}

        <Grid size={{ xs: 12 }}>
          <Accordion expanded={bootOpen} disabled={!file || isFlashing}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  Step 2 — Bootloader mode
                </Typography>
                {bootConfirmed && (
                  <Chip size="small" color="success" label="Confirmed" />
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Hold BOOT, press and release RESET.
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={bootConfirmed}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBootConfirmed(true);
                        setBootOpen(false);
                        setFlashOpen(true);
                        setStep("flash");
                      }
                    }}
                  />
                }
                label="Device is in bootloader mode"
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* ------------------------------------------------------------------ */}
        {/* Step 3: Connect and flash                                          */}
        {/* ------------------------------------------------------------------ */}

        <Grid size={{ xs: 12 }}>
          <Accordion expanded={flashOpen} disabled={!bootConfirmed}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  Step 3 — Flash firmware
                </Typography>
                {chipInfo && (
                  <Chip size="small" color="primary" label={chipInfo} />
                )}
                {isConnected && !isFlashing && (
                  <Chip size="small" color="success" label="Connected" />
                )}
                {isFlashing && (
                  <Chip size="small" color="warning" label="Flashing" />
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<FlashOnIcon />}
                onClick={handleConnectAndFlash}
                disabled={!bootConfirmed || isFlashing}
              >
                {isFlashing ? "Flashing…" : "Connect & Flash"}
              </Button>

              {isConnected && !isFlashing && (
                <Button
                  sx={{ mt: 1 }}
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<UsbOffIcon />}
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* -------------------------------------------------------------------- */}
      {/* Progress                                                             */}
      {/* -------------------------------------------------------------------- */}

      {flashProgress && flashProgress.total > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2">
              {flashProgress.percentage.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={flashProgress.percentage}
            />
          </CardContent>
        </Card>
      )}

      <Console canSend={false} height={200} />
      <div ref={logEndRef} />
    </Box>
  );
};

export default FirmwareUploader;
