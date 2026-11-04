import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Alert, Box, MenuItem, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/app";
import BoardDiagram from "../kits/BoardDiagram";
import { BOARD_SETS } from "../kits/boards";

/** Largest drawing scale of a board diagram. */
const BOARD_PX_PER_MM = 14;

/** Board picker plus clickable diagram(s) for assigning pins. */
const BoardView = () => {
	const { t } = useTranslation();
	const boardSetId = useAppStore((state) => state.configuratorBoard);
	const setBoardSetId = useAppStore((state) => state.setConfiguratorBoard);
	const boardSet =
		BOARD_SETS.find((set) => set.id === boardSetId) ?? BOARD_SETS[0];
	return (
		<>
			<TextField
				select
				size="small"
				label={t("board_select")}
				value={boardSet.id}
				onChange={(e) => setBoardSetId(e.target.value)}
				sx={{ mb: 2, minWidth: 280 }}
			>
				{BOARD_SETS.map((set) => (
					<MenuItem key={set.id} value={set.id}>
						{set.name}
					</MenuItem>
				))}
			</TextField>
			<Alert severity="info" icon={<TouchAppIcon />} sx={{ mb: 2 }}>
				{t("kits_click_to_configure")}
			</Alert>
			{/* Side by side, sized by board width; stacked on small screens */}
			<Box display="flex" flexDirection={{ xs: "column", lg: "row" }} gap={3}>
				{boardSet.boards.map((board) => (
					<Box
						key={board.id}
						flex={`${board.width} 1 0`}
						minWidth={0}
						// Caps the scale so small boards don't fill the page
						maxWidth={board.width * BOARD_PX_PER_MM}
					>
						<Typography variant="subtitle1" fontWeight={600} mb={1}>
							{board.name}
						</Typography>
						<BoardDiagram board={board} interactive hint={false} />
					</Box>
				))}
			</Box>
		</>
	);
};

export default BoardView;
