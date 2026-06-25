import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMIDIStore } from "../store/midi";

const InitMidi = () => {
    const { t } = useTranslation();
    const init = useMIDIStore((state) => state.init);
    const initialized = useMIDIStore((state) => state.initialized);
    if(initialized){
        return null;
    }
    return <Button variant="outlined" onClick={init}>{t("init_midi")}</Button>
}
export default InitMidi;