import { ThemeProvider } from "@mui/material";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import i18n from "../i18n";
import { lightTheme } from "../muiTheme";

// Assertions match the English labels, whatever language the stored setting picks.
await i18n.changeLanguage("en");

const Providers = ({ children }: { children: ReactNode }) => (
	<ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

/** render() with the app's theme and translations. */
export const renderWithProviders = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: Providers, ...options });
