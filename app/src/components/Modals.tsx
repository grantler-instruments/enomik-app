import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/app";

const Modals = () => {
  const { i18n } = useTranslation();
  const showSettingsModal = useAppStore((state) => state.showSettingsModal);
  const setShowSettingsModal = useAppStore(
    (state) => state.setShowSettingsModal
  );
  const showHints = useAppStore((state) => state.showHints);
  const setShowHints = useAppStore((state) => state.setShowHints);
  const darkMode = useAppStore((state) => state.darkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);

  return (
    <Dialog
      open={showSettingsModal}
      onClose={() => setShowSettingsModal(false)}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Settings</DialogTitle>
      <DialogContent dividers>
        <FormControlLabel
          control={
            <Switch
              checked={showHints}
              onChange={(e) => setShowHints(e.target.checked)}
            />
          }
          label="Show Hints"
        />
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={i18n.language}
            label="Language"
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="es">Español</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <FormControlLabel control={<Checkbox checked={darkMode} onChange={toggleDarkMode} />} label="Dark Theme" />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSettingsModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modals;