import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";

interface PinMappingMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function PinMappingMenu({ anchorEl, onClose, onDuplicate, onDelete }: PinMappingMenuProps) {
  const { t } = useTranslation();
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <MenuItem onClick={onDuplicate}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t("duplicate")}</ListItemText>
      </MenuItem>
      <MenuItem onClick={onDelete}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t("delete")}</ListItemText>
      </MenuItem>
    </Menu>
  );
}