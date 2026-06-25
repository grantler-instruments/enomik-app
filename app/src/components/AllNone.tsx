import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const AllNone = ({
  onAll,
  onNone,
}: {
  onAll: () => void;
  onNone: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box display={"flex"} gap={1}>
      <Box onClick={onAll} color="secondary" sx={{ cursor: "pointer" }}>
        <Typography variant="body2">{t("all")}</Typography>
      </Box>
      <Box onClick={onNone} color="secondary" sx={{ cursor: "pointer" }}>
        <Typography variant="body2">{t("none")}</Typography>
      </Box>
    </Box>
  );
};

export default AllNone;
