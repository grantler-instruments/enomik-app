import { useRegisterSW } from "virtual:pwa-register/react";
import { Button, Snackbar } from "@mui/material";
import { useTranslation } from "react-i18next";

function UpdatePrompt() {
	const { t } = useTranslation();
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW();

	return (
		<Snackbar
			open={needRefresh}
			message={t("pwa_update_available")}
			action={
				<Button color="primary" onClick={() => void updateServiceWorker(true)}>
					{t("pwa_reload")}
				</Button>
			}
		/>
	);
}

export default UpdatePrompt;
