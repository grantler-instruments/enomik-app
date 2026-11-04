import { CheckCircle } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDevice } from "../../hooks/useDevice";
import { useRawStream } from "../../hooks/useRawStream";
import { supportsLiveValues } from "../../store/device";
import { useRawStreamStore } from "../../store/rawStream";
import { TOUCH_THRESHOLD } from "../../utils/tester";
import type { Path, TesterState } from "../../utils/testerState";
import { LiveCell, RawStreamToggle } from "../inspector/RawValues";
import PathChips from "./PathChips";

/**
 * Live touch readings (same bars as the configurator) plus where each touch's
 * CC arrived. Render only while the step is open: unmounting stops the stream.
 */
const TouchStep = ({
	device,
	state,
	paths,
	passed,
	onBack,
	onNext,
}: {
	device: string;
	state: TesterState;
	paths: Path[];
	passed: boolean;
	onBack: () => void;
	onNext: () => void;
}) => {
	const { t } = useTranslation();
	const values = useRawStreamStore((s) => s.values);
	const streaming = useRawStreamStore((s) => s.active);
	useRawStream(device);
	// On by default, once the device's version is known: useRawStream switches
	// the stream off again while the device can't stream (yet).
	const info = useDevice(device);
	const supported =
		info?.status === "ready" && supportsLiveValues(info.version);
	useEffect(() => {
		if (!supported) return;
		useRawStreamStore.getState().clear();
		useRawStreamStore.getState().setActive(true);
	}, [supported]);

	// Pads whose live reading crossed the threshold at least once.
	const [reached, setReached] = useState<number[]>([]);
	useEffect(() => {
		const touched = state.touchPins.filter(
			(pin) => values[pin]?.active && !reached.includes(pin),
		);
		if (touched.length) setReached((prev) => [...prev, ...touched]);
	}, [values, state.touchPins, reached]);

	return (
		<>
			<Typography variant="body2" color="text.secondary" mb={1}>
				{t("tester_touch_text", { threshold: TOUCH_THRESHOLD })}
			</Typography>
			<RawStreamToggle device={device} />
			{state.touchPins.map((pin) => (
				<Box key={pin} display="flex" gap={1} alignItems="center" mb={1}>
					<Typography width={60}>{t("tester_pin", { pin })}</Typography>
					<Box width={200}>
						{streaming && values[pin] ? (
							<LiveCell value={values[pin]} />
						) : (
							<Typography variant="caption" color="text.secondary">
								{t("tester_no_live_value")}
							</Typography>
						)}
					</Box>
					<Box width={24} display="flex">
						{reached.includes(pin) && (
							<CheckCircle
								color="success"
								fontSize="small"
								titleAccess={t("tester_threshold_reached")}
							/>
						)}
					</Box>
					<PathChips paths={paths} seen={state.touch[pin]} />
				</Box>
			))}
			<Box display="flex" gap={1} mt={2}>
				<Button onClick={onBack}>{t("tester_back")}</Button>
				<Button variant="contained" onClick={onNext}>
					{passed ? t("tester_finish") : t("tester_skip")}
				</Button>
			</Box>
		</>
	);
};

export default TouchStep;
