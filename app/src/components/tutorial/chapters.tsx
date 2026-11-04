import GitHubIcon from "@mui/icons-material/GitHub";
import {
	Box,
	Link,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import Composer from "../Composer";
import Configurator from "../Configurator";
import BoardView from "../configurator/BoardView";
import FirmwareUploader from "../FirmwareUploader";
import Globals from "../Globals";
import InitMidi from "../InitMidi";
import Inspector from "../Inspector";
import MessageList from "../MessageList";
import SerialMonitor from "../SerialMonitor";
import { TesterContent } from "../Tester";
import ArchitectureDiagram from "./ArchitectureDiagram";
import {
	CodeBlock,
	Heading,
	LinkButtons,
	LiveDemo,
	Note,
	Paragraphs,
	Steps,
	useList,
} from "./blocks";
import Dimmer from "./Dimmer";
import LightSwitch from "./LightSwitch";
import { Keyboard, MessageDiagram } from "./MidiGraphics";
import PartPhotos from "./PartPhotos";
import Screenshots, {
	type Screenshot,
	type ScreenshotSource,
} from "./Screenshots";
import Waveform from "./Waveform";

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

const Architecture = () => (
	<>
		<Paragraphs i18nKey="tutorial_architecture_text" />
		<ArchitectureDiagram />
		<Paragraphs i18nKey="tutorial_architecture_details" />
	</>
);

const Electronics = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_electronics_text" />
			<Heading>{t("tutorial_electronics_sensor_title")}</Heading>
			<Paragraphs i18nKey="tutorial_electronics_sensor" />
			<PartPhotos
				ids={["button", "potentiometer", "photoresistor", "motion"]}
			/>
			<Heading>{t("tutorial_electronics_actuator_title")}</Heading>
			<Paragraphs i18nKey="tutorial_electronics_actuator" />
			<PartPhotos ids={["leds", "neopixels", "servo", "relay"]} />
			<Note severity="warning">{t("tutorial_electronics_actuator_note")}</Note>
			<Heading>{t("tutorial_electronics_digital_title")}</Heading>
			<Typography variant="body1">
				{t("tutorial_electronics_switch_intro")}
			</Typography>
			<LightSwitch />
			<Waveform kind="digital" />
			<Paragraphs i18nKey="tutorial_electronics_digital" />
			<Note severity="warning">{t("tutorial_electronics_digital_note")}</Note>
			<Heading>{t("tutorial_electronics_analog_title")}</Heading>
			<Typography variant="body1">
				{t("tutorial_electronics_dimmer_intro")}
			</Typography>
			<Dimmer />
			<Waveform kind="analog" />
			<Paragraphs i18nKey="tutorial_electronics_analog" />
			<LinkButtons actions={[{ label: t("kits_title"), link: "/kits" }]} />
			<Heading>{t("tutorial_electronics_pwm_title")}</Heading>
			<Waveform kind="pwm" />
			<Paragraphs i18nKey="tutorial_electronics_pwm" />
		</>
	);
};

const MessageTable = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const wide = useMediaQuery(theme.breakpoints.up("sm"));
	const head = useList("tutorial_midi_table_head");
	const value: unknown = t("tutorial_midi_table", { returnObjects: true });
	const rows = Array.isArray(value) ? (value as string[][]) : [];

	// Phones: one card per message instead of a cramped four-column table
	if (!wide) {
		return (
			<Stack spacing={1.5} sx={{ my: 2 }}>
				{rows.map((row) => (
					<Paper
						key={row[0]}
						variant="outlined"
						sx={{ p: 1.5, borderRadius: 2 }}
					>
						<Typography variant="subtitle2" fontWeight={600}>
							{row[0]}
						</Typography>
						{row.slice(1).map((cell, index) => (
							<Typography key={cell} variant="body2">
								<Box component="span" sx={{ color: "text.secondary" }}>
									{head[index + 1]}:
								</Box>{" "}
								{cell}
							</Typography>
						))}
					</Paper>
				))}
			</Stack>
		);
	}

	return (
		<TableContainer sx={{ my: 2 }}>
			<Table size="small">
				<TableHead>
					<TableRow>
						{head.map((cell) => (
							<TableCell key={cell} sx={{ fontWeight: 600 }}>
								{cell}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row[0]}>
							{row.map((cell, index) => (
								<TableCell
									key={cell}
									sx={index === 0 ? { fontWeight: 600 } : undefined}
								>
									{cell}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

const Midi = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_midi_text" />
			<Heading>{t("tutorial_midi_messages_title")}</Heading>
			<Paragraphs i18nKey="tutorial_midi_messages" />
			<MessageDiagram kind="note" />
			<MessageDiagram kind="cc" />
			<MessageTable />
			<Note>{t("tutorial_midi_table_note")}</Note>
			<Heading>{t("tutorial_midi_notes_title")}</Heading>
			<Paragraphs i18nKey="tutorial_midi_notes" />
			<Keyboard />
			<Heading>{t("tutorial_midi_cc_title")}</Heading>
			<Paragraphs i18nKey="tutorial_midi_cc" />
			<Heading>{t("tutorial_midi_channels_title")}</Heading>
			<Paragraphs i18nKey="tutorial_midi_channels" />
			<Heading>{t("tutorial_midi_enomik_title")}</Heading>
			<Paragraphs i18nKey="tutorial_midi_enomik" />
			<LinkButtons
				actions={[
					{ label: t("configurator"), link: "/configurator" },
					{ label: t("midi_monitor"), link: "/debugger" },
				]}
			/>
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

const MICROPYTHON = `
import time
import network
from esp_now_midi import ESPNowMidi

DONGLE_MAC = b"\\x84\\xF7\\x03\\xF2\\x54\\x62"

# ESP-NOW needs Wi-Fi on, on the same channel as the dongle (6)
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.config(channel=6)

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

/** Buttons to the subchapters of the current page. */
const SectionLinks = ({ sections }: { sections: Chapter[] }) => {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const base = pathname.replace(/\/$/, "");
	return (
		<LinkButtons
			actions={sections.map((section) => ({
				label: t(section.titleKey),
				link: `${base}/${section.id}`,
			}))}
		/>
	);
};

/** Link to a file or folder in the library repository. */
const SourceLink = ({ paths }: { paths: string[] }) => {
	const { t } = useTranslation();
	return (
		<Stack spacing={0.5} sx={{ mt: -1, mb: 2 }}>
			{paths.map((path) => (
				<Link
					key={path}
					href={`${LIBRARY_REPO}/${/\.\w+$/.test(path) ? "blob" : "tree"}/main/${path}`}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={t("tutorial_source_link", { path })}
					variant="body2"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						alignSelf: "flex-start",
						gap: 0.75,
					}}
				>
					<GitHubIcon fontSize="small" />
					{path}
				</Link>
			))}
		</Stack>
	);
};

const LibraryLinks = () => {
	const { t } = useTranslation();
	return (
		<LinkButtons
			actions={[
				{ label: t("tutorial_library_docs"), link: LIBRARY_DOCS },
				{ label: t("tutorial_library_github"), link: LIBRARY_REPO },
			]}
		/>
	);
};

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

			<Heading>{t("tutorial_platforms_code_title")}</Heading>
			<Typography variant="body1">{t("tutorial_platforms_code")}</Typography>
			<SectionLinks sections={PLATFORM_SECTIONS} />
			<LibraryLinks />
		</>
	);
};

const ARDUINO_DOCS: ScreenshotSource = {
	author: "Arduino",
	url: "https://docs.arduino.cc/software/ide-v2/tutorials/ide-v2-board-manager/",
	license: "CC BY-SA 4.0",
	licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
};

const ARDUINO_LIBRARY_DOCS: ScreenshotSource = {
	...ARDUINO_DOCS,
	url: "https://docs.arduino.cc/software/ide-v2/tutorials/ide-v2-installing-a-library/",
};

const BOARDS_SCREENSHOTS: Screenshot[] = [1, 2, 3].map((n) => ({
	file: `arduino/boards-${n}.webp`,
	captionKey: `tutorial_arduino_boards_${n}`,
}));

const LIBRARY_SCREENSHOTS: Screenshot[] = [1, 2, 3].map((n) => ({
	file: `arduino/library-${n}.webp`,
	captionKey: `tutorial_arduino_library_${n}`,
}));

const ArduinoPlatform = () => {
	const { t } = useTranslation();
	const install = useList("tutorial_platforms_arduino_install");
	return (
		<>
			<Heading>{t("tutorial_platforms_arduino_install_title")}</Heading>
			<Note>{t("tutorial_arduino_screenshots_note")}</Note>
			<Typography variant="body1">{install[0]}</Typography>
			<Screenshots items={BOARDS_SCREENSHOTS} source={ARDUINO_DOCS} />
			<Typography variant="body1">{install[1]}</Typography>
			<Screenshots items={LIBRARY_SCREENSHOTS} source={ARDUINO_LIBRARY_DOCS} />
			<Heading>{t("tutorial_platforms_arduino_usage_title")}</Heading>
			<Typography variant="body1">{t("tutorial_platforms_arduino")}</Typography>
			<CodeBlock>{ARDUINO_CLIENT}</CodeBlock>
			<SourceLink paths={["examples/client"]} />
			<Typography variant="body1">
				{t("tutorial_platforms_arduino_plain")}
			</Typography>
			<CodeBlock>{ARDUINO_PLAIN}</CodeBlock>
			<SourceLink paths={["examples/plain_echo"]} />
			<Note>{t("tutorial_platforms_arduino_s3")}</Note>
			<LibraryLinks />
		</>
	);
};

const MicroPythonPlatform = () => {
	const { t } = useTranslation();
	return (
		<>
			<Typography variant="body1">
				{t("tutorial_platforms_micropython")}
			</Typography>
			<CodeBlock>{MICROPYTHON}</CodeBlock>
			<SourceLink paths={["esp_now_midi.py"]} />
			<LibraryLinks />
		</>
	);
};

const PlatformIOPlatform = () => {
	const { t } = useTranslation();
	return (
		<>
			<Typography variant="body1">
				{t("tutorial_platforms_platformio")}
			</Typography>
			<CodeBlock>{PLATFORMIO_INI}</CodeBlock>
			<SourceLink paths={["examples/client/platformio.ini"]} />
			<LibraryLinks />
		</>
	);
};

const IdfPlatform = () => {
	const { t } = useTranslation();
	return (
		<>
			<Typography variant="body1">{t("tutorial_platforms_idf")}</Typography>
			<CodeBlock>{IDF_SETUP}</CodeBlock>
			<CodeBlock>{IDF_MAIN}</CodeBlock>
			<SourceLink paths={["examples_idf"]} />
			<LibraryLinks />
		</>
	);
};

const Firmware = () => (
	<>
		<Paragraphs i18nKey="tutorial_firmware_text" />
		<SectionLinks sections={FIRMWARE_SECTIONS} />
	</>
);

const FirmwareWeb = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_firmware_web_text" />
			<Steps i18nKey="tutorial_firmware_steps" />
			<Note severity="warning">{t("tutorial_firmware_nvs")}</Note>
			<LiveDemo>
				<FirmwareUploader embedded />
			</LiveDemo>
			<LinkButtons
				actions={[{ label: t("firmware_uploader"), link: "/uploader" }]}
			/>
			<Heading>{t("tutorial_troubleshooting")}</Heading>
			<Steps i18nKey="tutorial_firmware_troubleshooting" ordered={false} />
			<LinkButtons
				actions={[
					{
						label: t("tutorial_troubleshooting_title"),
						link: "/tutorial/troubleshooting",
					},
				]}
			/>
		</>
	);
};

const ARDUINO_UPLOAD_DOCS: ScreenshotSource = {
	author: "Arduino",
	url: "https://docs.arduino.cc/software/ide-v2/tutorials/getting-started/ide-v2-uploading-a-sketch/",
	license: "CC BY-SA 4.0",
	licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
};

const UPLOAD_SCREENSHOTS: Screenshot[] = [1, 2, 3, 4].map((n) => ({
	file: `arduino/upload-${n}.webp`,
	captionKey: `tutorial_firmware_arduino_shot_${n}`,
}));

const FirmwareArduino = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_firmware_arduino_text" />
			<LinkButtons
				actions={[
					{
						label: t("tutorial_firmware_arduino_link"),
						link: "/tutorial/platforms/arduino",
					},
				]}
			/>
			<Steps i18nKey="tutorial_firmware_arduino_steps" />
			<SourceLink
				paths={["examples/client", "examples/grantler_instruments/dongle"]}
			/>
			<Note>{t("tutorial_firmware_arduino_shots_note")}</Note>
			<Screenshots items={UPLOAD_SCREENSHOTS} source={ARDUINO_UPLOAD_DOCS} />
			<Note>{t("tutorial_platforms_arduino_s3")}</Note>
			<Note severity="success">{t("tutorial_firmware_arduino_tip")}</Note>
			<LibraryLinks />
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
			<LiveDemo>
				<Inspector embedded />
			</LiveDemo>
			<LinkButtons actions={[{ label: t("inspector"), link: "/inspector" }]} />
			<Heading>{t("tutorial_pairing_peer_title")}</Heading>
			<Steps i18nKey="tutorial_pairing_peer" />
			<LiveDemo>
				<Configurator embedded />
			</LiveDemo>
			<LinkButtons
				actions={[{ label: t("configurator"), link: "/configurator" }]}
			/>
			<Heading>{t("tutorial_pairing_test_title")}</Heading>
			<Typography variant="body1">{t("tutorial_pairing_test")}</Typography>
			<Note>{t("tutorial_pairing_tip")}</Note>
		</>
	);
};

const GlobalSettings = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_cfg_global_text" />
			<Steps i18nKey="tutorial_cfg_global_list" ordered={false} />
			<LiveDemo>
				<Globals />
			</LiveDemo>
			<Note>{t("tutorial_cfg_global_note")}</Note>
			<LinkButtons
				actions={[{ label: t("configurator"), link: "/configurator" }]}
			/>
		</>
	);
};

const BoardViewChapter = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_cfg_board_text" />
			<Steps i18nKey="tutorial_cfg_board_steps" />
			<LiveDemo>
				<BoardView />
			</LiveDemo>
			<LinkButtons
				actions={[{ label: t("configurator"), link: "/configurator" }]}
			/>
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
			<LiveDemo>
				<Configurator embedded />
			</LiveDemo>
			<LinkButtons
				actions={[{ label: t("configurator"), link: "/configurator" }]}
			/>
			<Heading>{t("tutorial_test")}</Heading>
			<Typography variant="body1">{t(`${prefix}_test`)}</Typography>
			<LiveDemo>
				<InitMidi />
				<MessageList />
			</LiveDemo>
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
					<LinkButtons
						actions={[
							{
								label: t("tutorial_cfg_global_title"),
								link: "/tutorial/examples/webapp/global",
							},
							{
								label: t("tutorial_button_title"),
								link: "/tutorial/examples/webapp/button",
							},
						]}
					/>
				</>
			}
		/>
	);
};

const I2cExample = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_i2c_text" />
			<Heading>{t("tutorial_i2c_about_title")}</Heading>
			<Paragraphs i18nKey="tutorial_i2c_about" />
			<Heading>{t("tutorial_wiring")}</Heading>
			<Typography variant="body1">{t("tutorial_i2c_wiring")}</Typography>
			<Steps i18nKey="tutorial_i2c_pins" ordered={false} />
			<Note>{t("tutorial_i2c_board_note")}</Note>
			<LinkButtons actions={[{ label: t("kits_title"), link: "/kits" }]} />
			<Heading>{t("tutorial_i2c_upload_title")}</Heading>
			<Steps i18nKey="tutorial_i2c_upload" />
			<SourceLink paths={["examples/client_vl53l0x"]} />
			<LinkButtons
				actions={[
					{
						label: t("tutorial_i2c_upload_link"),
						link: "/tutorial/firmware/arduino",
					},
				]}
			/>
			<Heading>{t("tutorial_test")}</Heading>
			<Typography variant="body1">{t("tutorial_i2c_test")}</Typography>
			<LinkButtons
				actions={[{ label: t("midi_monitor"), link: "/debugger" }]}
			/>
		</>
	);
};

const Examples = () => (
	<>
		<Paragraphs i18nKey="tutorial_examples_text" />
		<SectionLinks sections={EXAMPLE_SECTIONS} />
	</>
);

const OWN_CLIENT_SKETCH = `
/*
  My first client: a potentiometer sends a control change,
  a button plays a note. Both go wirelessly to the dongle.
*/

#include "enomik_client.h"

// Pins for ESP32-S2/S3 boards such as the LOLIN S2 Mini.
// On a classic ESP32 use e.g. 34 for the potentiometer and 4 for the button.
#define POT_PIN 1
#define BUTTON_PIN 2

#define MIDI_CHANNEL 1
#define POT_CC 1        // CC 1 = modulation wheel
#define BUTTON_NOTE 60  // middle C

enomik::Client _client;

float _smoothed = 0;            // averaged potentiometer reading
int _lastValue = -1;            // last CC value sent
unsigned long _lastPotMs = 0;
bool _lastPressed = false;      // last button state
unsigned long _lastButtonMs = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  _client.setName("my_client");  // optional, shown in the web app
  _client.begin();               // starts ESP-NOW, restores paired peers

  // Not paired via the web app? Enter the dongle's MAC address here:
  // uint8_t dongleMac[6] = { 0x84, 0xF7, 0x03, 0xF2, 0x54, 0x62 };
  // _client.addPeer(dongleMac);
}

void loop() {
  _client.loop();  // keep this first, and never block loop() with long delays
  unsigned long now = millis();

  // Potentiometer -> control change, read every 5 ms
  if (now - _lastPotMs >= 5) {
    _lastPotMs = now;
    _smoothed += (analogRead(POT_PIN) - _smoothed) * 0.1f;  // average out noise
    int value = (int)(_smoothed * 127.0f / 4095.0f + 0.5f); // 0–4095 -> 0–127
    if (value != _lastValue) {                              // send changes only
      _lastValue = value;
      _client.sendControlChange(POT_CC, value, MIDI_CHANNEL);
    }
  }

  // Button -> note on / note off, with 20 ms debounce
  bool pressed = digitalRead(BUTTON_PIN) == LOW;  // pull-up: pressed reads LOW
  if (pressed != _lastPressed && now - _lastButtonMs >= 20) {
    _lastPressed = pressed;
    _lastButtonMs = now;
    if (pressed) {
      _client.sendNoteOn(BUTTON_NOTE, 127, MIDI_CHANNEL);
    } else {
      _client.sendNoteOff(BUTTON_NOTE, 0, MIDI_CHANNEL);
    }
  }
}
`;

const OWN_CLIENT_RECEIVE = `
#define LED_PIN 15  // onboard LED of the LOLIN S2 Mini

void onNoteOn(byte channel, byte note, byte velocity) {
  if (note == BUTTON_NOTE) {
    digitalWrite(LED_PIN, velocity > 0 ? HIGH : LOW);
  }
}

void onNoteOff(byte channel, byte note, byte velocity) {
  if (note == BUTTON_NOTE) {
    digitalWrite(LED_PIN, LOW);
  }
}

// in setup(), before _client.begin():
pinMode(LED_PIN, OUTPUT);
_client.setHandleNoteOn(onNoteOn);
_client.setHandleNoteOff(onNoteOff);
`;

const OwnClientExample = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_own_client_text" />
			<Heading>{t("tutorial_own_client_parts_title")}</Heading>
			<Steps i18nKey="tutorial_own_client_parts" ordered={false} />
			<Heading>{t("tutorial_wiring")}</Heading>
			<Steps i18nKey="tutorial_own_client_pins" ordered={false} />
			<Note>{t("tutorial_own_client_pins_note")}</Note>
			<Heading>{t("tutorial_own_client_code_title")}</Heading>
			<Typography variant="body1">
				{t("tutorial_own_client_code_before")}
			</Typography>
			<CodeBlock>{OWN_CLIENT_SKETCH}</CodeBlock>
			<Typography variant="body1">
				{t("tutorial_own_client_based_on")}
			</Typography>
			<SourceLink
				paths={[
					"examples/client_hello_midi/client_hello_midi.ino",
					"examples/client_buttons/client_buttons.ino",
				]}
			/>
			<Steps i18nKey="tutorial_own_client_code_after" ordered={false} />
			<Heading>{t("tutorial_own_client_pairing_title")}</Heading>
			<Typography variant="body1">
				{t("tutorial_own_client_pairing")}
			</Typography>
			<LinkButtons
				actions={[
					{
						label: t("tutorial_pairing_title"),
						link: "/tutorial/examples/webapp/pairing",
					},
				]}
			/>
			<Heading>{t("tutorial_i2c_upload_title")}</Heading>
			<Steps i18nKey="tutorial_own_client_upload" />
			<LinkButtons
				actions={[
					{
						label: t("tutorial_i2c_upload_link"),
						link: "/tutorial/firmware/arduino",
					},
				]}
			/>
			<Heading>{t("tutorial_test")}</Heading>
			<Typography variant="body1">{t("tutorial_own_client_test")}</Typography>
			<LinkButtons
				actions={[{ label: t("midi_monitor"), link: "/debugger" }]}
			/>
			<Heading>{t("tutorial_own_client_receive_title")}</Heading>
			<Typography variant="body1">
				{t("tutorial_own_client_receive_before")}
			</Typography>
			<CodeBlock>{OWN_CLIENT_RECEIVE}</CodeBlock>
			<Paragraphs i18nKey="tutorial_own_client_receive_after" />
		</>
	);
};

const SERVO_SKETCH = `
/*
  Servo client: MIDI control change (ESP-NOW) -> hobby servo angle.

  Based on the Arduino "Sweep" tutorial (BARRAGAN / Scott Fitzgerald / John Bennett,
  public domain) and ESP32Servo usage patterns — see
  https://www.arduino.cc/en/Tutorial/Sweep

  Dependency: ESP32Servo (Library Manager or https://github.com/madhephaestus/ESP32Servo)

  Typical hobby servos expect ~50 Hz with pulse widths roughly 500–2500 µs for 0–180°;
  adjust attach() min/max if your servo stops short or binds.

  Power: servos draw significant current — use VBat or an external 5 V supply with
  common ground; do not rely on the 3.3 V logic rail for motor power.

  Dongle: run examples/print_mac and set peerMacAddress below (or rely on stored peers).

  CC scaling (SERVO_CC_VALUE_IS_DEGREES):
  - 1 (default): CC value is the angle in degrees (e.g. value 90 → 90°). MIDI is 7-bit,
    so you can only command 0–127° unless you use scaling below.
  - 0: map CC 0–127 across 0–180° (then value 90 → ~127°, not 90°).

  Incoming CC is handled inside the ESP-NOW receive path; the servo is updated from
  loop() so PWM writes stay off the WiFi callback stack.
*/

#include "enomik_client.h"
#include <ESP32Servo.h>

// GPIO for servo signal (PWM-capable pin for your board)
#define SERVO_PIN 40

// MIDI routing — match your DAW / dongle
#define SERVO_CC SERVO_PIN
#define MIDI_CHANNEL 1

// 1 = CC value == degrees (90 → 90°). 0 = map 0–127 → 0–180°
#define SERVO_CC_VALUE_IS_DEGREES 0

// on the dongle: run the print_mac firmware and paste it here
// uint8_t peerMacAddress[6] = { 0x84, 0xF7, 0x03, 0xF2, 0x54, 0x62 };

enomik::Client _client;
Servo _servo;
bool _isDirty = false;

static portMUX_TYPE _servoMux = portMUX_INITIALIZER_UNLOCKED;
static volatile int _servoAnglePending = 90;

void onControlChange(byte channel, byte control, byte value) {
  Serial.println(channel);
  Serial.println(control);
  if (channel != MIDI_CHANNEL) {
    return;
  }
  if (control != SERVO_CC) {
    return;
  }
  int angle;
#if SERVO_CC_VALUE_IS_DEGREES
  angle = constrain((int)value, 0, 180);
#else
  angle = (int)map(value, 0, 127, 0, 180);
  angle = constrain(angle, 0, 180);
#endif

  _servoAnglePending = angle;
  _isDirty = true;
}

void setup() {
  Serial.begin(115200);
  ESP32PWM::allocateTimer(3);
  _servo.setPeriodHertz(50);
  _servo.attach(SERVO_PIN, 500, 2400);
  _servo.write(90);

  _client.setName("client_servo"); // optional
  _client.begin();
  // _client.addPeer(peerMacAddress);
  _client.setHandleControlChange(onControlChange);
}

void loop() {
  _client.loop();

  if (_isDirty) {
    _servo.write(_servoAnglePending);
    Serial.println(_servoAnglePending);
    _isDirty = false;
  }
}
`;

const ServoExample = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_servo_text" />
			<Heading>{t("tutorial_servo_about_title")}</Heading>
			<Paragraphs i18nKey="tutorial_servo_about" />
			<Heading>{t("tutorial_wiring")}</Heading>
			<Typography variant="body1">{t("tutorial_servo_wiring")}</Typography>
			<Steps i18nKey="tutorial_servo_pins" ordered={false} />
			<Note severity="warning">{t("tutorial_servo_power")}</Note>
			<Heading>{t("tutorial_servo_code_title")}</Heading>
			<Typography variant="body1">{t("tutorial_servo_code_before")}</Typography>
			<CodeBlock>{SERVO_SKETCH}</CodeBlock>
			<SourceLink paths={["examples/client_servo/client_servo.ino"]} />
			<Paragraphs i18nKey="tutorial_servo_code_after" />
			<Heading>{t("tutorial_i2c_upload_title")}</Heading>
			<Steps i18nKey="tutorial_servo_upload" />
			<LinkButtons
				actions={[
					{
						label: t("tutorial_i2c_upload_link"),
						link: "/tutorial/firmware/arduino",
					},
				]}
			/>
			<Heading>{t("tutorial_test")}</Heading>
			<Typography variant="body1">{t("tutorial_servo_test")}</Typography>
		</>
	);
};

const WebappExamples = () => (
	<>
		<Paragraphs i18nKey="tutorial_examples_webapp_text" />
		<SectionLinks sections={WEBAPP_EXAMPLES} />
	</>
);

const CodeExamples = () => (
	<>
		<Paragraphs i18nKey="tutorial_examples_code_text" />
		<SectionLinks sections={CODE_EXAMPLES} />
	</>
);

const DAWS = ["ableton", "bitwig", "logic", "reaper"];

const DawSetup = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_daw_text" />
			<Heading>{t("tutorial_daw_input_title")}</Heading>
			<Paragraphs i18nKey="tutorial_daw_input" />
			{DAWS.map((daw) => (
				<Box key={daw}>
					<Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
						{t(`tutorial_daw_${daw}_title`)}
					</Typography>
					<Steps i18nKey={`tutorial_daw_${daw}`} />
				</Box>
			))}
			<Heading>{t("tutorial_daw_notes_title")}</Heading>
			<Paragraphs i18nKey="tutorial_daw_notes" />
			<Heading>{t("tutorial_daw_learn_title")}</Heading>
			<Steps i18nKey="tutorial_daw_learn" />
			<Heading>{t("tutorial_daw_feedback_title")}</Heading>
			<Paragraphs i18nKey="tutorial_daw_feedback" />
			<Note>{t("tutorial_daw_port_note")}</Note>
			<LinkButtons actions={[{ label: t("debugger"), link: "/debugger" }]} />
		</>
	);
};

const Tools = () => (
	<>
		<Paragraphs i18nKey="tutorial_tools_text" />
		<SectionLinks sections={TOOL_SECTIONS} />
	</>
);

const DebuggerTool = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_tool_debugger_text" />
			<Heading>{t("section_midi_composer")}</Heading>
			<Steps i18nKey="tutorial_tool_debugger_composer" />
			<LiveDemo>
				<Composer />
			</LiveDemo>
			<Heading>{t("section_midi_monitor")}</Heading>
			<Steps i18nKey="tutorial_tool_debugger_monitor" ordered={false} />
			<LiveDemo>
				<InitMidi />
				<MessageList />
			</LiveDemo>
			<Heading>{t("section_serial_monitor")}</Heading>
			<Paragraphs i18nKey="tutorial_tool_debugger_serial" />
			<Note>{t("tutorial_tool_debugger_tip")}</Note>
			<LiveDemo>
				<SerialMonitor />
			</LiveDemo>
			<LinkButtons actions={[{ label: t("debugger"), link: "/debugger" }]} />
		</>
	);
};

const InspectorTool = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_tool_inspector_text" />
			<Steps i18nKey="tutorial_tool_inspector_steps" />
			<LiveDemo>
				<Inspector embedded />
			</LiveDemo>
			<Heading>{t("tutorial_tool_inspector_live_title")}</Heading>
			<Paragraphs i18nKey="tutorial_tool_inspector_live" />
			<LinkButtons actions={[{ label: t("inspector"), link: "/inspector" }]} />
		</>
	);
};

const TesterTool = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_tool_tester_text" />
			<Heading>{t("tutorial_tool_tester_needs_title")}</Heading>
			<Steps i18nKey="tutorial_tool_tester_needs" />
			<Note severity="warning">{t("tutorial_tool_tester_warning")}</Note>
			<Heading>{t("tutorial_tool_tester_steps_title")}</Heading>
			<Steps i18nKey="tutorial_tool_tester_steps" />
			<LiveDemo>
				<TesterContent />
			</LiveDemo>
			<LinkButtons actions={[{ label: t("open_tester"), link: "/tester" }]} />
		</>
	);
};

const Troubleshooting = () => {
	const { t } = useTranslation();
	return (
		<>
			<Paragraphs i18nKey="tutorial_troubleshooting_text" />
			<Heading>{t("tutorial_troubleshooting_tools_title")}</Heading>
			<Steps i18nKey="tutorial_troubleshooting_tools" ordered={false} />
			<LinkButtons
				actions={[
					{ label: t("debugger"), link: "/debugger" },
					{ label: t("inspector"), link: "/inspector" },
					{ label: t("open_tester"), link: "/tester" },
				]}
			/>
			{["board", "daw", "wireless", "knob", "button", "settings"].map(
				(symptom) => (
					<Box key={symptom}>
						<Heading>{t(`tutorial_troubleshooting_${symptom}_title`)}</Heading>
						<Steps
							i18nKey={`tutorial_troubleshooting_${symptom}`}
							ordered={false}
						/>
					</Box>
				),
			)}
			<LinkButtons
				actions={[
					{
						label: t("tutorial_firmware_title"),
						link: "/tutorial/firmware/web",
					},
					{ label: t("tutorial_daw_title"), link: "/tutorial/daw" },
					{ label: t("kits_title"), link: "/kits" },
				]}
			/>
			<Paragraphs i18nKey="tutorial_troubleshooting_issue" />
			<LinkButtons
				actions={[
					{
						label: t("firmwareuploader_issue_tracker"),
						link: "https://github.com/grantler-instruments/enomik-app/issues",
					},
				]}
			/>
		</>
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

export type Chapter = {
	id: string;
	titleKey: string;
	Content: FC;
	sections?: Chapter[];
};

const WEBAPP_EXAMPLES: Chapter[] = [
	{
		id: "global",
		titleKey: "tutorial_cfg_global_title",
		Content: GlobalSettings,
	},
	{
		id: "board",
		titleKey: "tutorial_cfg_board_title",
		Content: BoardViewChapter,
	},
	{ id: "button", titleKey: "tutorial_button_title", Content: ButtonExample },
	{ id: "knob", titleKey: "tutorial_knob_title", Content: KnobExample },
	{ id: "led", titleKey: "tutorial_led_title", Content: LedExample },
	{ id: "pairing", titleKey: "tutorial_pairing_title", Content: Pairing },
];

const CODE_EXAMPLES: Chapter[] = [
	{
		id: "own-client",
		titleKey: "tutorial_own_client_title",
		Content: OwnClientExample,
	},
	{ id: "i2c", titleKey: "tutorial_i2c_title", Content: I2cExample },
	{ id: "servo", titleKey: "tutorial_servo_title", Content: ServoExample },
];

const EXAMPLE_SECTIONS: Chapter[] = [
	{
		id: "webapp",
		titleKey: "tutorial_examples_webapp_title",
		Content: WebappExamples,
		sections: WEBAPP_EXAMPLES,
	},
	{
		id: "code",
		titleKey: "tutorial_examples_code_title",
		Content: CodeExamples,
		sections: CODE_EXAMPLES,
	},
];

const FIRMWARE_SECTIONS: Chapter[] = [
	{ id: "web", titleKey: "tutorial_firmware_web_title", Content: FirmwareWeb },
	{
		id: "arduino",
		titleKey: "tutorial_firmware_arduino_title",
		Content: FirmwareArduino,
	},
];

const PLATFORM_SECTIONS: Chapter[] = [
	{
		id: "arduino",
		titleKey: "tutorial_platforms_arduino_title",
		Content: ArduinoPlatform,
	},
	{
		id: "micropython",
		titleKey: "tutorial_platforms_micropython_title",
		Content: MicroPythonPlatform,
	},
	{
		id: "platformio",
		titleKey: "tutorial_platforms_platformio_title",
		Content: PlatformIOPlatform,
	},
	{
		id: "idf",
		titleKey: "tutorial_platforms_idf_title",
		Content: IdfPlatform,
	},
];

const TOOL_SECTIONS: Chapter[] = [
	{
		id: "debugger",
		titleKey: "tutorial_tool_debugger_title",
		Content: DebuggerTool,
	},
	{
		id: "inspector",
		titleKey: "tutorial_tool_inspector_title",
		Content: InspectorTool,
	},
	{
		id: "tester",
		titleKey: "tutorial_tool_tester_title",
		Content: TesterTool,
	},
];

export const CHAPTERS: Chapter[] = [
	{ id: "introduction", titleKey: "tutorial_intro_title", Content: Intro },
	{
		id: "architecture",
		titleKey: "tutorial_architecture_title",
		Content: Architecture,
	},
	{
		id: "electronics",
		titleKey: "tutorial_electronics_title",
		Content: Electronics,
	},
	{ id: "midi", titleKey: "tutorial_midi_title", Content: Midi },
	{
		id: "platforms",
		titleKey: "tutorial_platforms_title",
		Content: Platforms,
		sections: PLATFORM_SECTIONS,
	},
	{
		id: "firmware",
		titleKey: "tutorial_firmware_title",
		Content: Firmware,
		sections: FIRMWARE_SECTIONS,
	},
	{
		id: "examples",
		titleKey: "tutorial_examples_title",
		Content: Examples,
		sections: EXAMPLE_SECTIONS,
	},
	{ id: "daw", titleKey: "tutorial_daw_title", Content: DawSetup },
	{
		id: "tools",
		titleKey: "tutorial_tools_title",
		Content: Tools,
		sections: TOOL_SECTIONS,
	},
	{
		id: "troubleshooting",
		titleKey: "tutorial_troubleshooting_title",
		Content: Troubleshooting,
	},
	{
		id: "next-steps",
		titleKey: "tutorial_next_steps_title",
		Content: NextSteps,
	},
];

/** A chapter or section as a page, in reading order (for numbering and prev/next). */
export type TutorialPage = {
	chapter: Chapter;
	path: string;
	number: string;
	depth: number;
};

const flatten = (
	chapters: Chapter[],
	parentPath: string,
	parentNumber: string,
	depth: number,
): TutorialPage[] =>
	chapters.flatMap((chapter, index) => {
		const path = `${parentPath}/${chapter.id}`;
		const number = parentNumber
			? `${parentNumber}.${index + 1}`
			: `${index + 1}`;
		return [
			{ chapter, path, number, depth },
			...flatten(chapter.sections ?? [], path, number, depth + 1),
		];
	});

export const PAGES: TutorialPage[] = flatten(CHAPTERS, "/tutorial", "", 0);
