import { Button, ButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

const AllNone = ({
	onAll,
	onNone,
}: {
	onAll: () => void;
	onNone: () => void;
}) => {
	const { t } = useTranslation();
	return (
		<ButtonGroup
			variant="text"
			size="small"
			sx={{ "& .MuiButton-root": { minWidth: 0, px: 0.75, py: 0 } }}
		>
			<Button onClick={onAll}>{t("all")}</Button>
			<Button onClick={onNone}>{t("none")}</Button>
		</ButtonGroup>
	);
};

export default AllNone;
