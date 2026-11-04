import { useTranslation } from "react-i18next";
import PageLayout from "./layout/PageLayout";

const NotFound = () => {
	const { t } = useTranslation();
	return <PageLayout title={t("not_found")}>{null}</PageLayout>;
};

export default NotFound;
