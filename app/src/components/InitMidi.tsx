import { Button } from "@mui/material";
import { useMIDIStore } from "../store/midi";

const InitMidi = () => {
    const init = useMIDIStore((state) => state.init);
    const initialized = useMIDIStore((state) => state.initialized);
    if(initialized){
        return null;
    }
    return <Button variant="outlined" onClick={init}>Init MIDI</Button>
}
export default InitMidi;