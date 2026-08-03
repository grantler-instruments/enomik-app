import CloseIcon from "@mui/icons-material/Close";
import { Alert, AlertTitle, Collapse, IconButton } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type BrowserName, detectBrowser } from "../utils/browser";

type WarningConfig = {
	severity: "error" | "warning" | "info";
	titleKey: string;
	messageKey: string;
} | null;

function getWarningConfig(browser: BrowserName): WarningConfig {
	switch (browser) {
		case "firefox":
		case "safari":
			return {
				severity: "error",
				titleKey: "browser_warning_unsupported_title",
				messageKey: "browser_warning_unsupported",
			};
		case "brave":
			return {
				severity: "warning",
				titleKey: "browser_warning_brave_title",
				messageKey: "browser_warning_brave",
			};
		case "edge":
		case "opera":
		case "chromium":
			return {
				severity: "info",
				titleKey: "browser_warning_chromium_title",
				messageKey: "browser_warning_chromium",
			};
		case "unknown":
			return {
				severity: "warning",
				titleKey: "browser_warning_unknown_title",
				messageKey: "browser_warning_unknown",
			};
		case "chrome":
		default:
			return null;
	}
}

export default function BrowserWarning() {
	const { t } = useTranslation();
	const [dismissed, setDismissed] = useState(false);

	const browser = detectBrowser();
	const config = getWarningConfig(browser);

	if (!config) return null;

	return (
		<Collapse in={!dismissed}>
			<Alert
				severity={config.severity}
				action={
					<IconButton
						aria-label={t("browser_warning_dismiss")}
						color="inherit"
						size="small"
						onClick={() => setDismissed(true)}
					>
						<CloseIcon fontSize="inherit" />
					</IconButton>
				}
				sx={{ borderRadius: 0 }}
			>
				<AlertTitle>{t(config.titleKey)}</AlertTitle>
				{t(config.messageKey)}
			</Alert>
		</Collapse>
	);
}
