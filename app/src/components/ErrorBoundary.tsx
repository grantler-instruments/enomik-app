import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Props = {
	children: ReactNode;
	/** Changing this clears the error, e.g. the route path on navigation. */
	resetKey?: unknown;
};

type State = { error: Error | null; resetKey: unknown };

/**
 * Catches render errors below it, so one broken part shows a message
 * instead of blanking the whole app.
 */
export default class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null, resetKey: this.props.resetKey };

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { error };
	}

	static getDerivedStateFromProps(props: Props, state: State) {
		return props.resetKey === state.resetKey
			? null
			: { error: null, resetKey: props.resetKey };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error(error, info.componentStack);
	}

	render() {
		if (!this.state.error) return this.props.children;
		return (
			<ErrorFallback
				error={this.state.error}
				onRetry={() => this.setState({ error: null })}
			/>
		);
	}
}

const ErrorFallback = ({
	error,
	onRetry,
}: {
	error: Error;
	onRetry: () => void;
}) => {
	const { t } = useTranslation();
	return (
		<Alert
			severity="error"
			sx={{ my: 2 }}
			action={
				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
					<Button color="inherit" size="small" onClick={onRetry}>
						{t("error_retry")}
					</Button>
					<Button
						color="inherit"
						size="small"
						onClick={() => window.location.reload()}
					>
						{t("error_reload")}
					</Button>
				</Box>
			}
		>
			<AlertTitle>{t("error_title")}</AlertTitle>
			{t("error_text")}
			<Typography
				component="pre"
				variant="caption"
				sx={{ mt: 1, mb: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}
			>
				{error.message}
			</Typography>
		</Alert>
	);
};
