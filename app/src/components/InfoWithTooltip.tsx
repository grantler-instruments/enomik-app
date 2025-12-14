import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

export default function InfoWithTooltip({ 
  text, 
  asButton = true 
}: { 
  text?: string;
  asButton?: boolean;
}) {
  const icon = <InfoOutlinedIcon fontSize="small" />;

  return (
    <Tooltip
      title={text || ""}
      enterTouchDelay={0}
      arrow
    >
      {asButton ? (
        <IconButton size="small">
          {icon}
        </IconButton>
      ) : (
        <span 
          style={{ display: 'inline-flex', cursor: 'pointer' }}
          onClick={(e) => e.stopPropagation()}
        >
          {icon}
        </span>
      )}
    </Tooltip>
  );
}