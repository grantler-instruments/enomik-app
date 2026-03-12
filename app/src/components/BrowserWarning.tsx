import { useState } from "react";
import { Alert, AlertTitle, Collapse, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";

type BrowserName =
  | "chrome"
  | "brave"
  | "edge"
  | "opera"
  | "chromium"
  | "firefox"
  | "safari"
  | "unknown";

declare global {
  interface Navigator {
    brave?: { isBrave: () => Promise<boolean> };
    userAgentData?: {
      brands: { brand: string; version: string }[];
    };
  }
  interface Window {
    opr?: unknown;
  }
}

function detectBrowser(): BrowserName {
  const ua = navigator.userAgent;
  const brands = navigator.userAgentData?.brands?.map((b) => b.brand) ?? [];

  if (navigator.userAgentData) {
    const isChrome = brands.some((b) => b === "Google Chrome");
    const isBrave = navigator.brave?.isBrave !== undefined;
    const isEdge = brands.some((b) => b === "Microsoft Edge");
    const isOpera = brands.some((b) => b === "Opera") || !!window.opr;

    if (isBrave) return "brave";
    if (isEdge) return "edge";
    if (isOpera) return "opera";
    if (isChrome) return "chrome";
    return "chromium";
  }

  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "opera";
  if (ua.includes("Chrome")) return "chromium";

  return "unknown";
}

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
