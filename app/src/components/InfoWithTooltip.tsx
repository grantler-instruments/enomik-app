import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

export default function InfoWithTooltip({ text }: { text?: string }) {
  return (
    <Tooltip
      title={text || ""}
      enterTouchDelay={0} // makes it appear on tap for touch devices
      arrow
    >
      <IconButton size="small">
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
