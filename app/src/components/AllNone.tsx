import { Box, Typography } from "@mui/material";

const AllNone = ({
  onAll,
  onNone,
}: {
  onAll: () => void;
  onNone: () => void;
}) => {
  return (
    <Box display={"flex"} gap={1}>
      <Box onClick={onAll} color="secondary" sx={{ cursor: "pointer" }}>
        <Typography variant="body2">All</Typography>
      </Box>
      <Box onClick={onNone} color="secondary" sx={{ cursor: "pointer" }}>
        <Typography variant="body2">None</Typography>
      </Box>
    </Box>
  );
};

export default AllNone;
