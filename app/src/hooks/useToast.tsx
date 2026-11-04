import { Alert, type AlertColor, Snackbar } from "@mui/material";
import { useCallback, useState } from "react";

type ToastState = { message: string; severity: AlertColor };

/**
 * Bottom-right toast. Render `toast` once in the component and call
 * `showToast` to display a message.
 */
export const useToast = (autoHideDuration = 8000) => {
	const [state, setState] = useState<ToastState | null>(null);
	// Keep the last message while the snackbar animates out.
	const [last, setLast] = useState<ToastState | null>(null);

	const showToast = useCallback(
		(message: string, severity: AlertColor = "info") => {
			const next = { message, severity };
			setState(next);
			setLast(next);
		},
		[],
	);
	const hideToast = useCallback(() => setState(null), []);

	const toast = (
		<Snackbar
			open={state !== null}
			autoHideDuration={autoHideDuration}
			onClose={hideToast}
			anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
		>
			<Alert
				onClose={hideToast}
				severity={last?.severity ?? "info"}
				variant={last?.severity === "info" ? "standard" : "filled"}
				sx={{ width: "100%" }}
			>
				{last?.message}
			</Alert>
		</Snackbar>
	);

	return { showToast, hideToast, toast };
};
