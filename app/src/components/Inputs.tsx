import { Alert, Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRawStream } from "../hooks/useRawStream";
import { useAppStore } from "../store/app";
import { useIOStore } from "../store/io";
import { useMIDIStore } from "../store/midi";
import {
	MIDI_CONTROL_CHANGE,
	sysexPinModeAnalogIn,
} from "../store/midi.config";
import { useRawStreamStore } from "../store/rawStream";
import AddRowButton from "./AddRowButton";
import { LiveCell, RawStreamToggle } from "./inspector/RawValues";
import PinRow, { hasTouchInput, PinTableHeader } from "./pinmapping/PinRow";

const Inputs = () => {
	const inputs = useIOStore((state) => state.inputs);
	const addInput = useIOStore((state) => state.addInput);
	const showHints = useAppStore((state) => state.showHints);
	const initialized = useMIDIStore((state) => state.initialized);
	const device = useMIDIStore(
		(state) => state.selectedConfiguratorOutputDevice,
	);
	const streaming = useRawStreamStore((state) => state.active);
	const rawValues = useRawStreamStore((state) => state.values);
	const [hovered, setHovered] = useState(false);
	const { t } = useTranslation();

	// Values come from the device: only show them when it runs this pin in the same mode.
	const deployedValue = (input: (typeof inputs)[number]) => {
		const value = rawValues[input.pin];
		return value !== undefined && value.mode === input.mode ? value : null;
	};
	const showThreshold = hasTouchInput(inputs);
	const anyUndeployed = inputs.some((input) => !deployedValue(input));

	// The stream needs one specific device; it can't run on broadcast.
	const isBroadcast = !device || device === "-1";
	useRawStream(device || "-1");

	// Live values are for touch tuning: no touch input left, no stream.
	const setStreaming = useRawStreamStore((state) => state.setActive);
	useEffect(() => {
		if (!showThreshold && streaming) setStreaming(false);
	}, [showThreshold, streaming, setStreaming]);

	return (
		<Box
			display={"flex"}
			flexDirection={"column"}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{showHints && (
				<Alert severity="info" sx={{ mb: 2 }}>
					{t("tooltip_pin_to_midi")}
				</Alert>
			)}
			{showThreshold && (
				<Box>
					<RawStreamToggle disabled={!initialized || isBroadcast} />
					{isBroadcast && (
						<Typography variant="caption" color="text.secondary">
							{t("configurator_raw_stream_broadcast")}
						</Typography>
					)}
				</Box>
			)}
			{streaming && anyUndeployed && (
				<Alert severity="info" sx={{ mb: 1 }}>
					{t("configurator_raw_stream_not_deployed")}
				</Alert>
			)}
			{inputs.length > 0 && (
				<PinTableHeader type="input" showThreshold={showThreshold} />
			)}
			{inputs.map((input, index) => {
				const value = deployedValue(input);
				return (
					<PinRow
						key={input.uuid}
						config={input}
						type="input"
						index={index}
						showThreshold={showThreshold}
						live={
							streaming &&
							(value ? (
								<LiveCell value={value} threshold={input.threshold} />
							) : (
								<Typography
									variant="caption"
									color="text.secondary"
									title={t("configurator_raw_stream_not_deployed")}
								>
									{t("live_after_deploy")}
								</Typography>
							))
						}
					/>
				);
			})}
			<Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
				<AddRowButton
					visible={inputs.length === 0 || hovered}
					onClick={() => {
						addInput({
							pin: inputs.length,
							mode: sysexPinModeAnalogIn,
							channel: 1,
							midiType: MIDI_CONTROL_CHANGE,
							midiMin: 0,
							midiMax: 127,
							pinMin: 0,
							pinMax: 1023,
							controller: 20,
						});
					}}
				></AddRowButton>
			</Box>
		</Box>
	);
};

export default Inputs;
