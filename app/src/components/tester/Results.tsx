import { Cancel, CheckCircle } from "@mui/icons-material";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";

/** Pass/fail per test and an overall verdict. */
const Results = ({
	results,
	onRestart,
}: {
	results: { label: string; passed: boolean }[];
	onRestart: () => void;
}) => {
	const failed = results.filter((r) => !r.passed).length;
	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Typography variant="h6" mb={1}>
				Results
			</Typography>
			{results.map(({ label, passed }) => (
				<Box key={label} display="flex" gap={1} alignItems="center" mb={1}>
					{passed ? <CheckCircle color="success" /> : <Cancel color="error" />}
					<Typography>{label}</Typography>
				</Box>
			))}
			<Alert
				severity={failed ? "error" : "success"}
				sx={{ mt: 1 }}
				action={<Button onClick={onRestart}>Start over</Button>}
			>
				{failed
					? `${failed} of ${results.length} tests failed`
					: "All tests passed – the board works"}
			</Alert>
		</Paper>
	);
};

export default Results;
