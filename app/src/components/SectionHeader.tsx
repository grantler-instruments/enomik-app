import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import InfoWithTooltip from "./InfoWithTooltip";
import { useState } from "react";

const SectionHeader = ({
  title,
  tooltipKey,
}: {
  title: string;
  tooltipKey: string;
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  return (
    <Typography
      variant="h2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {title}
      {hovered && <InfoWithTooltip text={t(tooltipKey)} />}
    </Typography>
  );
};

export default SectionHeader;