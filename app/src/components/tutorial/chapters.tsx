import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import LaptopIcon from "@mui/icons-material/Laptop";
import UsbIcon from "@mui/icons-material/Usb";
import {
	Box,
	Paper,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	CodeBlock,
	Heading,
	LinkButtons,
	Note,
	Paragraphs,
	Steps,
} from "./blocks";

const LIBRARY_REPO = "https://github.com/grantler-instruments/ESP-NOW-MIDI";
const LIBRARY_DOCS = "https://grantler-instruments.github.io/ESP-NOW-MIDI/";

const Intro = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_intro_text" />
			<Heading>{t("tutorial_intro_needs_title")}</Heading>
			<Steps i18nKey="tutorial_intro_needs" ordered={false} />
			<Heading>{t("tutorial_intro_steps_title")}</Heading>
			<Steps i18nKey="tutorial_intro_steps" />
			<Note>{t("tutorial_intro_wired_note")}</Note>
		</>
	);
};

const DiagramNode = ({
	icon,
	title,
	description,
}: {
	icon: ReactNode;
	title: string;
	description: string;
}) => (
	<Paper
		variant="outlined"
		sx={{ p: 2, flex: 1, minWidth: 0, borderRadius: 2, textAlign: "center" }}
	>
		<Box color="secondary.main">{icon}</Box>
		<Typography variant="subtitle1" fontWeight={600}>
			{title}
		</Typography>
		<Typography variant="body2" color="text.secondary">
			{description}
		</Typography>
	</Paper>
);

const DiagramLink = ({ label }: { label: string }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	return (
		<Stack alignItems="center" justifyContent="center" sx={{ px: 1 }}>
			<Typography variant="caption" color="text.secondary" noWrap>
				{label}
			</Typography>
			{isMobile ? <ArrowDownwardIcon /> : <ArrowForwardIcon />}
		</Stack>
	);
};

const Architecture = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_architecture_text" />
			<Stack
				direction={{ xs: "column", md: "row" }}
				alignItems="stretch"
				spacing={1}
				sx={{ my: 3 }}
			>
				<DiagramNode
					icon={<LaptopIcon fontSize="large" />}
					title={t("tutorial_architecture_host")}
					description={t("tutorial_architecture_host_desc")}
				/>
				<DiagramLink label={t("tutorial_architecture_usb")} />
				<DiagramNode
					icon={<UsbIcon fontSize="large" />}
					title={t("device_kind_dongle")}
					description={t("tutorial_architecture_dongle_desc")}
				/>
				<DiagramLink label="ESP-NOW" />
				<DiagramNode
					icon={<DeveloperBoardIcon fontSize="large" />}
					title={t("tutorial_architecture_clients")}
					description={t("tutorial_architecture_client_desc")}
				/>
			</Stack>
			<Paragraphs i18nKey="tutorial_architecture_details" />
		</>
	);
};

const ARDUINO_CLIENT = `
#include "enomik_client.h"

enomik::Client client;

void setup() {
  client.setName("my-controller"); // optional
  client.begin();                  // pins and peers come from the web app
}

void loop() {
  client.loop();
}
`;

const ARDUINO_PLAIN = `
#include <WiFi.h>
#include "esp_now_midi.h"

// MAC address of your dongle
uint8_t dongleMac[6] = { 0x84, 0xF7, 0x03, 0xF2, 0x54, 0x62 };
esp_now_midi ESP_NOW_MIDI;

void setup() {
  WiFi.mode(WIFI_STA);
  ESP_NOW_MIDI.begin();
  ESP_NOW_MIDI.addPeer(dongleMac);
}

void loop() {
  ESP_NOW_MIDI.sendNoteOn(60, 127, 1);
  delay(500);
  ESP_NOW_MIDI.sendNoteOff(60, 0, 1);
  delay(500);
}
`;

const PLATFORMIO_INI = `
[env:lolin_s2_mini]
platform = https://github.com/pioarduino/platform-espressif32/releases/download/55.03.30/platform-espressif32.zip
board = lolin_s2_mini
framework = arduino

build_flags =
    -I \${PROJECT_PACKAGES_DIR}/framework-arduinoespressif32/libraries/Network/src

lib_deps =
    https://github.com/grantler-instruments/ESP-NOW-MIDI.git
    WiFi
    Networking
    Preferences
    EEPROM
    adafruit/Adafruit TinyUSB Library
    https://github.com/FortySevenEffects/arduino_midi_library.git
`;

const CIRCUITPYTHON = `
import time
from esp_now_midi import ESPNowMidi

DONGLE_MAC = b"\\x84\\xF7\\x03\\xF2\\x54\\x62"

midi = ESPNowMidi()
midi.begin()
midi.add_peer(DONGLE_MAC)

while True:
    midi.send_note_on(60, 127, 1)
    time.sleep(0.5)
    midi.send_note_off(60, 0, 1)
    time.sleep(0.5)
`;

const IDF_SETUP = `
cd your-idf-project
git submodule add https://github.com/grantler-instruments/ESP-NOW-MIDI.git \\
  components/esp_now_midi
idf.py set-target esp32s2   # or esp32s3
idf.py build flash
`;

const IDF_MAIN = `
#include "esp_now_midi.h"

esp_now_midi transport;

extern "C" void app_main(void)
{
    transport.begin();
    // transport.addPeer(dongleMac);
    // transport.sendNoteOn(60, 100, 1);
}
`;

const Platforms = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_platforms_text" />

			<Heading>{t("tutorial_platforms_webapp_title")}</Heading>
			<Typography variant="body1">{t("tutorial_platforms_webapp")}</Typography>
			<LinkButtons
				actions={[
					{ label: t("firmware_uploader"), link: "/uploader" },
					{ label: t("configurator"), link: "/configurator" },
				]}
			/>

			<Heading>Arduino</Heading>
			<Typography variant="body1">{t("tutorial_platforms_arduino")}</Typography>
			<CodeBlock>{ARDUINO_CLIENT}</CodeBlock>
			<Typography variant="body1">
				{t("tutorial_platforms_arduino_plain")}
			</Typography>
			<CodeBlock>{ARDUINO_PLAIN}</CodeBlock>
			<Note>{t("tutorial_platforms_arduino_s3")}</Note>

			<Heading>PlatformIO</Heading>
			<Typography variant="body1">
				{t("tutorial_platforms_platformio")}
			</Typography>
			<CodeBlock>{PLATFORMIO_INI}</CodeBlock>

			<Heading>CircuitPython</Heading>
			<Typography variant="body1">
				{t("tutorial_platforms_circuitpython")}
			</Typography>
			<CodeBlock>{CIRCUITPYTHON}</CodeBlock>

			<Heading>ESP-IDF</Heading>
			<Typography variant="body1">{t("tutorial_platforms_idf")}</Typography>
			<CodeBlock>{IDF_SETUP}</CodeBlock>
			<CodeBlock>{IDF_MAIN}</CodeBlock>

			<LinkButtons
				actions={[
					{ label: t("tutorial_library_docs"), link: LIBRARY_DOCS },
					{ label: t("tutorial_library_github"), link: LIBRARY_REPO },
				]}
			/>
		</>
	);
};

const Firmware = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_firmware_text" />
			<Steps i18nKey="tutorial_firmware_steps" />
			<Note severity="warning">{t("tutorial_firmware_nvs")}</Note>
			<LinkButtons
				actions={[{ label: t("firmware_uploader"), link: "/uploader" }]}
			/>
			<Heading>{t("tutorial_troubleshooting")}</Heading>
			<Steps i18nKey="tutorial_firmware_troubleshooting" ordered={false} />
		</>
	);
};

const Pairing = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_pairing_text" />
			<Heading>{t("tutorial_pairing_mac_title")}</Heading>
			<Steps i18nKey="tutorial_pairing_mac" ordered={false} />
			<LinkButtons actions={[{ label: t("inspector"), link: "/inspector" }]} />
			<Heading>{t("tutorial_pairing_peer_title")}</Heading>
			<Steps i18nKey="tutorial_pairing_peer" />
			<LinkButtons
				actions={[{ label: t("configurator"), link: "/configurator" }]}
			/>
			<Heading>{t("tutorial_pairing_test_title")}</Heading>
			<Typography variant="body1">{t("tutorial_pairing_test")}</Typography>
			<Note>{t("tutorial_pairing_tip")}</Note>
		</>
	);
};

const Example = ({ prefix, extra }: { prefix: string; extra?: ReactNode }) => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey={`${prefix}_text`} />
			<Heading>{t("tutorial_wiring")}</Heading>
			<Typography variant="body1">{t(`${prefix}_wiring`)}</Typography>
			<Heading>{t("tutorial_configuration")}</Heading>
			<Steps i18nKey={`${prefix}_config`} />
			<LinkButtons
				actions={[{ label: t("configurator"), link: "/configurator" }]}
			/>
			<Heading>{t("tutorial_test")}</Heading>
			<Typography variant="body1">{t(`${prefix}_test`)}</Typography>
			<LinkButtons
				actions={[{ label: t("midi_monitor"), link: "/debugger" }]}
			/>
			{extra}
		</>
	);
};

const ButtonExample = () => {
	const { t } = useTranslation();
	return (
		<Example
			prefix="tutorial_button"
			extra={<Note>{t("tutorial_button_tip")}</Note>}
		/>
	);
};

const KnobExample = () => {
	const { t } = useTranslation();
	return (
		<Example
			prefix="tutorial_knob"
			extra={
				<>
					<Note>{t("tutorial_knob_tip")}</Note>
					<LinkButtons actions={[{ label: t("kits_title"), link: "/kits" }]} />
				</>
			}
		/>
	);
};

const LedExample = () => {
	const { t } = useTranslation();
	return (
		<Example
			prefix="tutorial_led"
			extra={
				<>
					<Note>{t("tutorial_led_tip_pwm")}</Note>
					<Note severity="success">{t("tutorial_led_tip_loopback")}</Note>
				</>
			}
		/>
	);
};

const NextSteps = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_next_steps_text" />
			<Steps i18nKey="tutorial_next_steps_list" ordered={false} />
			<LinkButtons
				actions={[
					{ label: t("kits_title"), link: "/kits" },
					{ label: t("open_tester"), link: "/tester" },
					{ label: t("open_grantulator"), link: "/grantulator" },
					{ label: t("tutorial_library_docs"), link: LIBRARY_DOCS },
					{
						label: t("firmwareuploader_issue_tracker"),
						link: "https://github.com/grantler-instruments/enomik-app/issues",
					},
				]}
			/>
		</>
	);
};

export type Chapter = { id: string; titleKey: string; Content: FC };

export const CHAPTERS: Chapter[] = [
	{ id: "introduction", titleKey: "tutorial_intro_title", Content: Intro },
	{
		id: "architecture",
		titleKey: "tutorial_architecture_title",
		Content: Architecture,
	},
	{ id: "platforms", titleKey: "tutorial_platforms_title", Content: Platforms },
	{ id: "firmware", titleKey: "tutorial_firmware_title", Content: Firmware },
	{ id: "button", titleKey: "tutorial_button_title", Content: ButtonExample },
	{ id: "knob", titleKey: "tutorial_knob_title", Content: KnobExample },
	{ id: "led", titleKey: "tutorial_led_title", Content: LedExample },
	{ id: "pairing", titleKey: "tutorial_pairing_title", Content: Pairing },
	{
		id: "next-steps",
		titleKey: "tutorial_next_steps_title",
		Content: NextSteps,
	},
];
