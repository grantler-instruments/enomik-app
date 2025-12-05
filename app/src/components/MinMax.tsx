import { Box, TextField } from "@mui/material";

const MidiMinMax = ({
  min,
  max,
  onChangeMin,
  onChangeMax,
  disabled,
}: {
  min: number;
  max: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  disabled?: boolean;
}) => {
  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
      <TextField
        label="Min"
        type="number"
        value={min}
        onChange={(e) => onChangeMin(Number(e.target.value))}
        sx={{ width: 80 }}
        disabled={disabled}
      />
      <TextField
        label="Max"
        type="number"
        value={max}
        onChange={(e) => onChangeMax(Number(e.target.value))}
        sx={{ width: 80 }}
        disabled={disabled}
      />
    </Box>
  );
};

export default MidiMinMax;
