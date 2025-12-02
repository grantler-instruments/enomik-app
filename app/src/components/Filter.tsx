import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
} from "@mui/material";

const Filter = () => {
  return (
    <Box display={"flex"} flexDirection={"column"} gap={2}>
      <Grid container spacing={2} marginTop={1} marginBottom={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          {/* Input filter options can be added here */}
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          {/* Output filter options can be added here */}
        </Grid>
      </Grid>
      <Box display={"flex"} gap={2}>
        <Typography variant="h4">Channels</Typography>
        {Array.from({ length: 16 }, (_, i) => (
          <Box key={i}>
            <FormControlLabel
              control={<Checkbox />}
              label={`${i + 1}`}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default Filter;
