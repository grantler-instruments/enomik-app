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
  Grid,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Link,
} from "@mui/material";
import {
  Upload as UploadIcon,
  UsbOff as UsbOffIcon,
  FlashOn as FlashOnIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useSerialStore } from "../store/serial";
import Console from "./SerialConsole";
import { useAppStore } from "../store/app";
import { useTranslation } from "react-i18next";

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

  const showHints = useAppStore((state) => state.showHints);
  const { t } = useTranslation();

  // const [step, setStep] = useState<UploadStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [selectedFirmware, setSelectedFirmware] = useState("");

  // Whether manual bootloader mode is required (default depends on board)
  const [bootloaderRequired, setBootloaderRequired] = useState(true);
  const [bootConfirmed, setBootConfirmed] = useState(false);

  const [fwOpen, setFwOpen] = useState(true);
  const [bootOpen, setBootOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => init(), [init]);
  useEffect(
    () => logEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    [log]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    if (!f || !f.name.endsWith(".bin")) return;
    setFile(f);

    // Step 2 opens if bootloader required, otherwise flash directly
    setBootOpen(bootloaderRequired);
    setFlashOpen(!bootloaderRequired);
    // setStep("bootloader");
  };

  const handlePresetSelect = async (fw: any): Promise<void> => {
    setSelectedFirmware(fw.label);

    // Auto-set bootloader requirement based on board
    const requiresBootloader = fw.board === "LOLIN S2 Mini";
    setBootloaderRequired(requiresBootloader);

    try {
      const res = await fetch(fw.path);
      if (!res.ok) throw new Error(res.statusText);

      const blob = await res.blob();
      const f = new File([blob], fw.path.split("/").pop()!, {
        type: "application/octet-stream",
      });

      setFile(f);
      setFwOpen(false);

      setBootOpen(requiresBootloader);
      setFlashOpen(!requiresBootloader);
      // setStep("bootloader");
    } catch {
      alert(t("firmwareuploader_load_failed"));
    }
  };

  const handleConnectAndFlash = async (): Promise<void> => {
    if (!file || (bootloaderRequired && !bootConfirmed)) return;

    try {
      // Pass bootloaderRequired to the store for flashing logic
      await flashFirmware(file, bootloaderRequired);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box p={2}>
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("firmwareuploader_intro")}{" "}
          <Link
            href="https://github.com/grantler-instruments/enomik-app/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("firmwareuploader_issue_tracker")}
          </Link>
        </Alert>
      )}
      <Grid container spacing={2}>
        {/* Step 1: Firmware selection */}
        <Grid size={{ xs: 12 }}>
          <Accordion
            expanded={fwOpen}
            disabled={isFlashing}
            onChange={(_, expanded) => setFwOpen(expanded)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="subtitle2">
                  {t("firmwareuploader_step1")}
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
                        {fw.board} (v{fw.version}) — {fw.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
              <Box my={2} typography="body2">
                {t("firmwareuploader_releases_link")}{" "}
                <Link
                  href="https://github.com/grantler-instruments/esp-now-midi/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("firmwareuploader_releases_page")}
                </Link>
                .
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
                {file ? file.name : t("firmwareuploader_custom_bin")}
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

        {/* Step 2: Bootloader toggle + confirmation */}
        <Grid size={{ xs: 12 }}>
          <Accordion
            expanded={bootOpen}
            disabled={!file || isFlashing}
            onChange={(_, expanded) => setBootOpen(expanded)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  {t("firmwareuploader_step2")}
                </Typography>
                {bootConfirmed && (
                  <Chip size="small" color="success" label={t("confirmed")} />
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              {/* Toggle bootloader requirement */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bootloaderRequired}
                    onChange={(e) => setBootloaderRequired(e.target.checked)}
                  />
                }
                label={t("firmwareuploader_manual_bootloader_required")}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2, ml: 3 }}
              >
                {t("firmwareuploader_bootloader_mode")}
              </Typography>

              {/* Only show confirmation if bootloader is required */}
              {bootloaderRequired && (
                <>
                  <Alert severity="warning" sx={{ my: 2 }}>
                    {t("firmwareuploader_bootloader_mode_instruction")}
                  </Alert>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={bootConfirmed}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBootConfirmed(checked);

                          if (checked) {
                            setBootOpen(false);
                            setFlashOpen(true);
                            // setStep("flash");
                          } else {
                            setFlashOpen(false);
                            // setStep("bootloader");
                          }
                        }}
                      />
                    }
                    label={t("firmwareuploader_bootloader_mode_confirmation")}
                  />
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Step 3: Flash */}
        <Grid size={{ xs: 12 }}>
          <Accordion
            expanded={flashOpen}
            disabled={bootloaderRequired && !bootConfirmed}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  {t("firmwareuploader_step3")}
                </Typography>
                {chipInfo && (
                  <Chip size="small" color="primary" label={chipInfo} />
                )}
                {isConnected && !isFlashing && (
                  <Chip size="small" color="success" label={t("connected")} />
                )}
                {isFlashing && (
                  <Chip size="small" color="warning" label={t("flashing")} />
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
                disabled={(bootloaderRequired && !bootConfirmed) || isFlashing}
              >
                {isFlashing ? t("flashing_progress") : t("connect_and_flash")}
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
                  {t("disconnect")}
                </Button>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {flashProgress && flashProgress.total > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2">
              {flashProgress.percentage} %
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
