import { useState, useEffect } from "react";
import { Box, TextField } from "@mui/material";

const MidiMinMax = ({
  min,
  max,
  onChangeMin,
  onChangeMax,
  disabled,
  bitResolution = 7,
  sx,
}: {
  min: number;
  max: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  disabled?: boolean;
  bitResolution?: 7 | 14;
  sx?: any;
}) => {
  const minRange = bitResolution === 7 ? 0 : -8192;
  const maxRange = bitResolution === 7 ? 127 : 8191;

  // local string buffers for typing; normalize to strip leading zeros
  const norm = (n: number | string) => String(Number(n));
  const [minText, setMinText] = useState(norm(min));
  const [maxText, setMaxText] = useState(norm(max));

  // keep local text in sync when parent changes
  useEffect(() => setMinText(norm(min)), [min]);
  useEffect(() => setMaxText(norm(max)), [max]);

  const clamp = (n: number) => Math.max(minRange, Math.min(maxRange, n));

  const parseOrNull = (v: string) => {
    if (v === "" || v === "-") return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    return n;
  };

  const handleMinBlur = () => {
    const val = parseOrNull(minText);
    const result = val === null ? minRange : clamp(val);
    onChangeMin(result);
    setMinText(norm(result));
  };

  const handleMaxBlur = () => {
    const val = parseOrNull(maxText);
    const result = val === null ? maxRange : clamp(val);
    onChangeMax(result);
    setMaxText(norm(result));
  };

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      gap={1}
      sx={{ ...sx }}
    >
      <TextField
        label="Min"
        value={minText}
        onChange={(e) => setMinText(e.target.value)}
        onBlur={handleMinBlur}
        sx={{ width: 100 }}
        disabled={disabled}
        size="small"
        inputProps={{
          inputMode: "numeric",
          pattern: "-?[0-9]*",
        }}
      />

      <TextField
        label="Max"
        value={maxText}
        onChange={(e) => setMaxText(e.target.value)}
        onBlur={handleMaxBlur}
        sx={{ width: 100 }}
        disabled={disabled}
        size="small"
        inputProps={{
          inputMode: "numeric",
          pattern: "-?[0-9]*",
        }}
      />
    </Box>
  );
};

export default MidiMinMax;
