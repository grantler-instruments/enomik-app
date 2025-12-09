import { useState } from "react";
import { Paper, IconButton, Grid, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  useIOStore,
  type InputPinConfig,
  type OutputPinConfig,
} from "../../store/io";
import PinConfigSection from "./PinConfigSection";
import MidiConfigSection from "./MidiConfigSection";
import PinMappingMenu from "./Menu";

type PinConfig = InputPinConfig | OutputPinConfig;

interface PinMappingProps {
  config: PinConfig;
  type: "input" | "output";
  disabled?: boolean;
}

const PinMapping = ({ config, type, disabled = false }: PinMappingProps) => {
  const {
    updateInput,
    removeInput,
    duplicateInput,
    updateOutput,
    removeOutput,
    duplicateOutput,
  } = useIOStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hovered, setHovered] = useState(false);

  const isInput = type === "input";

  const handleChange = <K extends keyof PinConfig>(
    key: K,
    value: PinConfig[K]
  ) => {
    const updated = { ...config, [key]: value };

    if (isInput) {
      updateInput(config.uuid, updated as InputPinConfig);
    } else {
      updateOutput(config.uuid, updated as OutputPinConfig);
    }
  };

  const handleDuplicate = () => {
    isInput ? duplicateInput(config.uuid) : duplicateOutput(config.uuid);
    setAnchorEl(null);
  };

  const handleDelete = () => {
    isInput ? removeInput(config.uuid) : removeOutput(config.uuid);
    setAnchorEl(null);
  };
  return (
    <Box>
      <Grid
        container
        spacing={2}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Grid
          size={{ xs: 12, sm: 5 }}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            padding: 1,
            minWidth: 0,
          }}
        >
          {isInput ? (
            <PinConfigSection
              config={config}
              onChange={handleChange}
              disabled={disabled}
              type="input"
            />
          ) : (
            <MidiConfigSection
              config={config}
              onChange={handleChange}
              disabled={disabled}
              type="output"
            />
          )}
        </Grid>

        <Grid
          size={{ xs: 12, sm: 1 }}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ArrowForwardIcon fontSize="small" sx={{ opacity: 0.7 }} />
        </Grid>

        <Grid
          size={{ xs: 12, sm: 5 }}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            padding: 1,
            minWidth: 0,
          }}
        >
          {isInput ? (
            <MidiConfigSection
              config={config}
              onChange={handleChange}
              disabled={disabled}
              type="input"
            />
          ) : (
            <PinConfigSection
              config={config}
              onChange={handleChange}
              disabled={disabled}
              type="output"
            />
          )}
        </Grid>

        <Grid
          size={{ xs: 12, sm: 1 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="more options"
            sx={{ visibility: hovered ? "visible" : "hidden" }}
            size="small"
          >
            <MoreVertIcon />
          </IconButton>
        </Grid>
      </Grid>
      <PinMappingMenu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    </Box>
  );
};

export default PinMapping;
