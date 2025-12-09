import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useAppStore } from "../store/app";

const Modals = () => {
  const showSettingsModal = useAppStore((state) => state.showSettingsModal);
  const setShowSettingsModal = useAppStore(
    (state) => state.setShowSettingsModal
  );
  const showHints = useAppStore((state) => state.showHints);
  const setShowHints = useAppStore((state) => state.setShowHints);

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
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setShowSettingsModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modals;
