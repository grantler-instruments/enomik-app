import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation();
  return <Box>{t("not_found")}</Box>;
};

export default NotFound;
