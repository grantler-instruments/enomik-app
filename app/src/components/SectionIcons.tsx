import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import LaptopIcon from "@mui/icons-material/Laptop";
import SettingsInputAntennaIcon from "@mui/icons-material/SettingsInputAntenna";
import TuneIcon from "@mui/icons-material/Tune";
import type { ReactNode } from "react";

const Flow = ({ from, to }: { from: ReactNode; to: ReactNode }) => (
	<>
		{from}
		<ArrowForwardIcon fontSize="small" />
		{to}
	</>
);

export const GlobalIcon = () => <TuneIcon />;

export const PinToMidiIcon = () => (
	<Flow from={<DeveloperBoardIcon />} to={<LaptopIcon />} />
);

export const MidiToPinIcon = () => (
	<Flow from={<LaptopIcon />} to={<DeveloperBoardIcon />} />
);

export const WirelessMidiIcon = () => <SettingsInputAntennaIcon />;
