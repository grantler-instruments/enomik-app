import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const LANGUAGE_STORAGE_KEY = "enomik-language";

const getStoredLanguage = (): string | null => {
	try {
		return localStorage.getItem(LANGUAGE_STORAGE_KEY);
	} catch {
		return null;
	}
};

i18n.use(initReactI18next).init({
	resources: {
		en: {
			translation: {
				compat_inspection_unsupported:
					"Reading configuration from the device requires firmware 0.13 or newer. You can still edit, save and deploy pin and peer configurations.",
				compat_globals_skipped:
					"Pin and peer configurations were sent. This firmware does not support MIDI loopback or power-save settings, so those settings were skipped.",

				compat_name_skipped:
					"Client name was not applied because firmware support could not be confirmed.",
				compat_select_device:
					"Select one connected device to inspect firmware and stream values.",
				compat_checking: "Checking firmware support…",
				compat_timeout:
					"The device did not report its firmware version. Newer features remain unavailable; ordinary MIDI still works.",
				compat_dongle_unsupported:
					"This dongle does not answer configuration requests. Update the dongle firmware to 0.19 or newer.",
				compat_incompatible:
					"This firmware protocol is not supported. Inspection and configuration are unavailable; ordinary MIDI remains available.",
				compat_unpaired:
					"The MIDI input cannot be matched uniquely to this device. If several boards share a name, connect only the board you want to inspect.",
				compat_live_unsupported:
					"Live values require firmware 0.19 or newer. Basic configuration remains available.",
				compat_retry: "Retry",
				compat_syncing: "Reading device configuration…",
				compat_sync_failed:
					"Configuration could not be read completely. Any values shown may be incomplete. Check the connection and sync again.",
				compat_unavailable: "Unavailable",
				compat_stream_timeout:
					"The device did not acknowledge live streaming. Streaming has stopped; check firmware support and the USB connection.",
				compat_stream_no_readings:
					"No recent input readings received. Streaming has stopped. Check the connection and whether input pins are configured on the device.",
				compat_stream_unknown_command:
					"This firmware does not support live streaming. Inspection and ordinary MIDI remain available.",
				compat_stream_connection:
					"The device could not be reached. Streaming has stopped.",
				compat_stream_pin_not_found:
					"No matching input pins are configured on the device. Streaming has stopped.",
				compat_threshold_review:
					"Review touch thresholds before deploying. Firmware before 0.19 uses raw readings; 0.19+ uses percentages. These values have different or unknown units. Select a device, then explicitly keep the numbers in its units or load its configuration.",
				compat_use_raw: "Keep numbers as raw thresholds",
				compat_use_percent: "Keep numbers as percentages",
				compat_touch_raw:
					"Legacy touch input: a nonzero threshold is a raw sensor reading, not a percentage. 0 = continuous value.",
				compat_touch_unknown:
					"Touch threshold units depend on firmware. Select a device to check its version before deploying.",
				compat_deploy_failed:
					"Deployment failed. Check the device connection before retrying.",

				console: "Console",
				home_create_midi_devices_easily: "Create MIDI Devices Easily",
				home_no_coding_required: "No Coding Required.",
				home_or_getting_started_guide: "or check out the Getting Started guide",
				home_caption:
					"Tired of writing the same code over and over? Use the intuitive no-code configurator to assign MIDI messages to pins and vice versa, and set up wireless MIDI connections effortlessly.",
				home_reliable_wireless_midi: "Reliable Wireless MIDI",
				home_without_bluetooth: "Without Bluetooth.",
				home_fully_bidirectional: "Fully Bidirectional",
				home_fully_bidirectional_description:
					"Works as both a MIDI IN and MIDI OUT device. Configure your ESP32 as a standalone MIDI controller or as a MIDI-controllable instrument or sound installation.",
				home_midi_controller_or_instrument: "MIDI Controller or Instrument",
				home_dont_trust_bluetooth_midi: "Dont trust Bluetooth MIDI?",
				home_kit: "Available as a Kit",
				home_dongles_and_client_boards: "Dongles & Client Boards",
				home_kit_description:
					"Get started quickly with our custom hardware kits, including a compact wireless MIDI dongle and versatile client boards, everything you need to build your own MIDI devices with ease.",
				kits_title: "Kits & Boards",
				kits_intro:
					"enomik 3000 works best with the Grantler Instruments kits: a wireless MIDI dongle and client boards with touch pads, NeoPixel and I2C connectors already broken out.",
				kits_any_esp32:
					"You don't need our hardware though. Any ESP32-S2 or ESP32-S3 based board works: flash the dongle and client firmware with the firmware uploader and configure the pins in the browser.",
				kits_io_title: "Input and output types",
				kits_io_intro:
					"Every pin of a client can be configured as an input that sends MIDI, or as an output that reacts to incoming MIDI.",
				kits_inputs: "Inputs",
				kits_outputs: "Outputs",
				kits_type_i2c_desc:
					"Two-wire bus (SDA, SCL) for sensors such as the VL53L0X distance sensor. Use the I2C client firmware.",
				kits_type_neopixel_desc:
					"Addressable RGB LEDs (WS2812). The data pin is level-shifted to 5V on our boards so LED strips work reliably. Use the NeoPixel client firmware.",
				kits_boards_title: "Our boards",
				kits_board_client_desc:
					"Client board for the LOLIN S2 mini: 8 capacitive touch inputs, 2 digital and 2 analog inputs, a 5V NeoPixel output, two I2C Grove ports and an IDC16 connector with more GPIOs. Hover a pin for details.",
				kits_board_diagram: "Pinout of {{name}}",
				kits_pin_touch: "Capacitive touch",
				kits_pin_neopixel: "NeoPixel (5V)",
				kits_pin_digital: "Digital",
				kits_pin_analog: "Analog",
				kits_pin_i2c_sda: "I2C SDA",
				kits_pin_i2c_scl: "I2C SCL",
				kits_pin_power_5v: "5V",
				kits_pin_power_3v3: "3.3V",
				kits_pin_gnd: "GND",
				kits_pin_nc: "Not connected",
				kits_group_digital: "Digital I/O",
				kits_group_analog: "Analog in / digital I/O",
				home_esp_now_midi:
					"to the rescue! It delivers fast, stable, low-latency wireless MIDI, ideal for live performances, instruments, and embedded systems.",
				home_utilities: "Equipped with Utilities",
				home_utilities_description: "MIDI Monitor and Firmware Uploader",
				home_utilities_description_includes: "The app includes a built-in",
				home_utilities_description_includes_continues:
					"for real-time message tracking and a",
				home_utilities_description_includes_end:
					"to easily flash your ESP32 devices.",
				home_pwa_title: "Runs in Your Browser",
				home_pwa_description:
					"No desktop app required. Configure devices, monitor MIDI, and flash firmware right in the browser. Install it as a Progressive Web App for quick access from your dock or home screen.",
				getting_started_github_link_example: "Example on GitHub",
				getting_started_upload_dongle_title:
					"Upload the firmware to the Dongle board",
				getting_started_upload_dongle_description:
					"Either upload example/dongle from the ESP-NOW MIDI Arduino library or use the Firmware Uploader utility in this app to flash the precompiled dongle firmware.",
				getting_started_upload_dongle_description_extra:
					"Skip this step if you do not need a wireless MIDI connection and just want to use the client board as a wired MIDI device.",
				getting_started_upload_client_title:
					"Upload the firmware to the Client board",
				getting_started_upload_client_description:
					"Now, lets repeat the process for the client board. You can upload example/client from the ESP-NOW MIDI Arduino library or use the Firmware Uploader utility in this app to flash the precompiled client firmware.",
				getting_started_configuration_title: "Configuration",
				getting_started_configuration_description:
					"The fun part! Use the Configurator to map MIDI messages to pins and vice versa, and set up wireless MIDI connections between your devices.",
				getting_started_debugging_title: "Debugging",
				getting_started_debugging_description:
					"When things dont work as expected, use the MIDI Monitor utility in this app to view incoming and outgoing MIDI messages for debugging purposes.",
				launch_configurator: "Launch Configurator",
				firmware_uploader: "Firmware Uploader",
				midi_monitor: "MIDI Monitor",
				connect: "Connect",
				disconnect: "Disconnect",
				clear: "Clear",
				made_with_love: "Made with ♡️ by",
				tooltip_pin_to_midi:
					"Configure how input pins on the microcontroller map to MIDI messages.",
				tooltip_midi_to_pin: "Set pins values from MIDI messages",
				tooltip_wireless_midi:
					"Set up ESP-NOW MIDI connections to other devices",
				tooltip_global: "Device-wide settings that apply to the whole board",
				tooltip_midi_loopback:
					"When enabled, outgoing channel and realtime MIDI is soft-thrus locally to receive handlers. SysEx is not looped.",
				tooltip_power_save:
					"When enabled, reduces power (modem sleep and lower TX power) at the cost of higher latency. Default is off for lower latency.",
				tooltip_save_configuration_to_file:
					"Save current configuration to a file",
				tooltip_load_configuration_from_file: "Load configuration from a file",
				tooltip_clear_configuration: "Clear current configuration",
				tooltip_load_configuration_from_device:
					"Load configuration from a device",
				tooltip_pin_modes: "Pin modes and board pinouts",
				tooltip_midi_monitor:
					"View incoming and outgoing MIDI messages for debugging purposes",
				tooltip_tools:
					"Further pages: test a board, or play the Grantulator synth",
				tooltip_serial_monitor:
					"View serial output from the connected microcontroller for debugging purposes",
				tooltip_midi_composer:
					"Compose and send custom MIDI messages to connected devices",
				configurator_info:
					"In order to configure your enomik client devices, you need to flash the appropriate firmware onto them first. You can use the handy Firmware Uploader utility to upload the precompiled firmware to your ESP32-based client boards.",
				state_on: "on",
				state_off: "off",
				deploy_toast_summary_reset_ok:
					"Device reset confirmed. Sent {{pinConfigs}} pin configs, {{peerCount}} wireless MIDI addresses, MIDI loopback {{midiLoopback}}, and safe power mode {{powerSave}}.",
				deploy_toast_summary_reset_timeout:
					"Reset confirmation not received (timed out). Sent {{pinConfigs}} pin configs, {{peerCount}} wireless MIDI addresses, MIDI loopback {{midiLoopback}}, and safe power mode {{powerSave}}. If this error persists, please update the client firmware to the latest version.",
				deploy_toast_globals_unsupported:
					"Global settings require firmware 0.14+ (device reported {{version}}).",
				load_from_device_toast_ok:
					"Loaded {{pinConfigs}} pin configs, {{peerCount}} wireless MIDI addresses, MIDI loopback {{midiLoopback}}, and safe power mode {{powerSave}} from device.",
				load_from_file_kind_mismatch:
					"This is a {{file}} config, but {{selected}} is selected. Switch to {{file}} to import it.",
				port_switched: "MIDI port changed to {{port}}.",
				port_kind_not_found: "No {{kind}} port found. Keeping {{port}}.",
				port_kind_not_found_none:
					"No {{kind}} port found. Connect one or pick a port.",
				open_tester: "Board tester",
				open_grantulator: "Grantulator",
				device_kind: "Device type",
				device_kind_client: "Client",
				device_kind_dongle: "Dongle",
				tooltip_device_kind:
					"Client or dongle. Guessed from the port name, change it if wrong.",
				deploy_toast_dongle_summary_reset_ok:
					"Device reset confirmed. Sent {{peerCount}} wireless MIDI addresses.",
				deploy_toast_dongle_summary_reset_timeout:
					"Reset confirmation not received (timed out). Sent {{peerCount}} wireless MIDI addresses. If this error persists, please update the dongle firmware to the latest version.",
				load_from_device_toast_dongle_ok:
					"Loaded {{peerCount}} wireless MIDI addresses from device.",
				load_from_device_toast_timeout:
					"Could not load configuration from device (timed out or no response). Select a device and ensure firmware supports GET_CONFIG.",
				load_from_device_toast_no_device:
					"Select a MIDI device before loading configuration from device.",
				firmwareuploader_intro:
					"This is an experimental feature which works best with Chrome browser. Please report any issues you encounter.",
				firmwareuploader_releases_link:
					"Could not find your firmware, or need a specific version? You can download the corresponding .bin file from our ",
				firmwareuploader_custom_bin: "Or upload a custom .bin file",
				firmwareuploader_bootloader_mode:
					"Some boards, like LOLIN S2 Mini, must be manually set into bootloader mode by holding BOOT and pressing RESET. This is required for flashing and is not related to any software settings.",
				firmwareuploader_bootloader_mode_instruction:
					"Place the device in manual bootloader mode: hold BOOT and press RESET.",
				firmwareuploader_bootloader_mode_confirmation:
					"I have placed the device in bootloader mode",
				browser_warning:
					"This app works best with Chrome or Chromium-based browsers. Some features (e.g. Serial, Firmware Uploader) may not be available in your browser.",
				browser_warning_unsupported_title: "Unsupported Browser",
				browser_warning_unsupported:
					"Your browser does not support the Web Serial API, which is required for connecting to devices and uploading firmware. Chrome is highly encouraged for the best experience.",
				browser_warning_brave_title: "Brave Browser Detected",
				browser_warning_brave:
					"Brave's privacy shields may block the Web Serial and Web MIDI APIs. If you experience connection issues, try disabling shields for this page. Chrome is highly encouraged for the best experience.",
				browser_warning_chromium_title: "Browser Compatibility",
				browser_warning_chromium:
					"Most features should work in your browser, but Chrome is highly encouraged for the best experience.",
				browser_warning_unknown_title: "Unknown Browser",
				browser_warning_unknown:
					"Your browser could not be identified. This app requires Web Serial API support. Chrome is highly encouraged for the best experience.",
				browser_warning_dismiss: "Dismiss",
				install_app: "Install app",
				uninstall_app: "Uninstall app",
				uninstall_app_copied:
					"Could not open the apps page from here. Copied {{url}}. Paste it into the address bar to manage installed apps.",
				uninstall_app_open_failed:
					"Could not open the apps page from here. Open {{url}} in the address bar to manage installed apps.",
				settings: "Settings",
				show_hints: "Show Hints",
				language: "Language",
				dark_theme: "Dark Theme",
				close: "Close",
				configurator: "Configurator",
				debugger: "Debugger",
				inspector: "Inspector",
				main_navigation: "Main navigation",
				getting_started: "Getting Started",
				deploy: "Deploy",
				init_midi: "Init MIDI",
				midi_output: "MIDI Output",
				filter: "Filter",
				filters_active: "({{count}} active)",
				history: "History",
				direction: "Direction",
				timestamp: "Timestamp",
				device: "Device",
				channel: "Channel",
				type: "Type",
				note_cc_prg: "Note/CC/PRG",
				vel_value: "Vel/Value",
				data: "Data",
				inputs: "Inputs",
				outputs: "Outputs",
				channels: "Channels",
				types: "Types",
				all: "All",
				none: "None",
				console_placeholder: "Type message...",
				console_no_data: "No data yet...",
				all_rights_reserved: ". All rights reserved.",
				not_found: "404 - Page Not Found",
				duplicate: "Duplicate",
				delete: "Delete",
				confirmed: "Confirmed",
				connected: "Connected",
				flashing: "Flashing",
				connect_and_flash: "Connect & Flash",
				flashing_progress: "Flashing …",
				pin: "Pin",
				mode: "Mode",
				threshold: "Threshold",
				midi_type: "MIDI Type",
				controller: "Controller",
				note: "Note",
				min: "Min",
				max: "Max",
				deploy_toast_duplicate_pins:
					"Not deployed: pin {{pins}} is used more than once. Each pin can only have one configuration.",
				pin_conflict: "Pin {{pin}} is used more than once",
				pin_mode_analog_desc:
					"Read a continuous value (e.g. from a potentiometer or sensor).",
				pin_mode_digital_in_desc:
					"Digital input. Reads LOW/HIGH, use with switches or buttons (with external resistors).",
				pin_mode_digital_in_pullup_desc:
					"Digital input with internal pull-up. Use for buttons wired to ground; idle HIGH, pressed = LOW.",
				pin_mode_touch_desc:
					"Capacitive touch input. Threshold is the change from the untouched reading in % (1–127): sends max at threshold, min below ¾ of it. 0 = continuous value. Use Live Values in the Inspector to tune.",
				pin_mode_digital_out_desc:
					"Digital output. Drives LOW/HIGH for LEDs, relays or other digital loads.",
				pin_mode_pwm_desc:
					"PWM output. Use for dimming LEDs or controlling motor speed with an analog-like value.",
				pitch_bend_precision_info:
					"min/max values are transmitted as 7 bit values, you might lose precision. the underlying config api needs some adjustments. the actual pitchbend values are sent as 14bit values, no worries.",
				composer_start_byte: "Start Byte",
				composer_manufacturer_id: "Manufacturer ID (*)",
				composer_data_hex: "Data (hex)",
				composer_end_byte: "End Byte",
				composer_program: "Program",
				composer_velocity: "Velocity",
				composer_value: "Value",
				composer_pitch_bend: "Pitch Bend (-8192 to +8191)",
				composer_send_midi: "Send MIDI",
				firmwareuploader_issue_tracker: "Github Issue Tracker",
				firmwareuploader_step1: "Step 1 — Select version",
				firmwareuploader_step2: "Step 2 — Select board",
				firmwareuploader_step3: "Step 3 — Select firmware",
				firmwareuploader_step4: "Step 4 — Bootloader mode",
				firmwareuploader_step5: "Step 5 — Flash firmware",
				firmwareuploader_releases_page: "GitHub releases page",
				firmwareuploader_manual_bootloader_required:
					"Manual bootloader required (hold BOOT + RESET)",
				firmwareuploader_load_failed: "Failed to load firmware.",
				firmwareuploader_flash_success:
					"Firmware flashed successfully. The board was reset.",
				firmwareuploader_flash_success_reset_manual:
					"Firmware flashed successfully. Press RESET on the board to boot.",
				firmwareuploader_select_board: "Board",
				firmwareuploader_select_version: "Version",
				firmwareuploader_version_latest: "{{version}} (latest)",
				firmwareuploader_clear_nvs: "Clear NVS (reset saved settings)",
				firmwareuploader_clear_nvs_help:
					"Erases stored settings (e.g. peer config). Leave unchecked for normal updates. Intended for standard Arduino ESP32 firmware / this uploader’s presets.",
				debugger_init_prompt:
					"To use the MIDI features, please initialize the MIDI system.",
				section_global: "Global",
				section_input_pin_to_midi: "Input Pin to MIDI Mapping",
				section_midi_to_output_pin: "MIDI to Output Pin Mapping",
				section_wireless_midi: "Wireless MIDI Configuration",
				section_midi_composer: "MIDI Composer",
				section_midi_monitor: "MIDI Monitor",
				section_serial_monitor: "Serial Monitor",
				section_tools: "Tools",
				midi_loopback: "MIDI Loopback",
				power_save: "Safe Power Mode",
				client_name: "Client name",
				client_name_placeholder: "firmware default",
				tooltip_client_name:
					"Name shown to tell clients apart. Saved on the device when you deploy. Leave empty to keep the name set by the firmware. Printable ASCII, max. 16 characters.",
				deploy_toast_name_unsupported:
					"Client name requires firmware 0.19+ (device reported {{version}}).",
				inspector_info:
					"The Inspector allows you to select MIDI devices and synchronize settings. Because who knows what one did months ago.",
				inspector_sync: "sync",
				inspector_input_to_midi: "Input PIN to MIDI",
				inspector_midi_to_output: "MIDI to Output PIN",
				inspector_esp_now_midi: "ESP-NOW MIDI",
				inspector_global: "Global",
				inspector_no_peers: "No wireless MIDI addresses added",
				inspector_firmware: "Firmware",
				inspector_mac_address: "MAC Address",
				inspector_protocol_version: "Protocol Version",
				inspector_raw_stream: "Live Values",
				inspector_raw_stream_toggle: "Stream raw input values",
				inspector_raw_stream_hint:
					"Live readings of all configured input pins (firmware 0.19+, USB only). To tune a touch pad: touch it, read the %, and set the threshold to about half of what a light touch reaches.",
				inspector_raw_stream_error:
					"Raw stream not available ({{error}}). Requires firmware 0.19+, configured input pins and a USB connection.",
				configurator_raw_stream_not_deployed:
					"Live values are only shown after this pin is deployed.",
				cc_or_note: "CC / Note",
				live: "Live",
				pwm_min: "PWM min",
				pwm_max: "PWM max",
				live_after_deploy: "after deploy",
				configurator_raw_stream_broadcast:
					"Select a device (not broadcast) to stream live values.",
				inspector_raw_stream_waiting: "Waiting for values…",
				raw: "Raw",
				baseline: "Baseline",
				peak: "Peak",
				percent: "Change",
				normalized: "Normalized",
				touched: "touched",
			},
		},
		de: {
			translation: {
				compat_inspection_unsupported:
					"Das Auslesen der Gerätekonfiguration benötigt Firmware 0.13 oder neuer. PINs und Peers lassen sich weiterhin bearbeiten, speichern und deployen.",
				compat_globals_skipped:
					"PIN- und Peer-Konfigurationen wurden gesendet. Diese Firmware unterstützt weder MIDI-Loopback noch Energiespareinstellungen; diese wurden übersprungen.",

				compat_name_skipped:
					"Der Client-Name wurde nicht angewendet, da die Firmware-Unterstützung nicht bestätigt werden konnte.",
				compat_select_device:
					"Wähle ein verbundenes Gerät, um die Firmware zu prüfen und Live-Werte zu sehen.",
				compat_checking: "Firmware-Unterstützung wird geprüft…",
				compat_timeout:
					"Das Gerät hat keine Firmware-Version gemeldet. Neuere Funktionen bleiben deaktiviert; normales MIDI funktioniert weiterhin.",
				compat_dongle_unsupported:
					"Dieser Dongle beantwortet keine Konfigurationsanfragen. Aktualisiere die Dongle-Firmware auf 0.19 oder neuer.",
				compat_incompatible:
					"Dieses Firmware-Protokoll wird nicht unterstützt. Inspektion und Konfiguration sind nicht verfügbar; normales MIDI bleibt verfügbar.",
				compat_unpaired:
					"Der MIDI-Eingang lässt sich diesem Gerät nicht eindeutig zuordnen. Haben mehrere Boards denselben Namen, verbinde nur das gewünschte Board.",
				compat_live_unsupported:
					"Live-Werte benötigen Firmware 0.19 oder neuer. Die grundlegende Konfiguration bleibt verfügbar.",
				compat_retry: "Erneut prüfen",
				compat_syncing: "Gerätekonfiguration wird gelesen…",
				compat_sync_failed:
					"Die Konfiguration konnte nicht vollständig gelesen werden. Angezeigte Werte können unvollständig sein. Prüfe die Verbindung und synchronisiere erneut.",
				compat_unavailable: "Nicht verfügbar",
				compat_stream_timeout:
					"Das Gerät hat den Live-Stream nicht bestätigt. Der Stream wurde gestoppt. Prüfe Firmware-Unterstützung und USB-Verbindung.",
				compat_stream_no_readings:
					"Keine aktuellen Eingangswerte empfangen. Der Stream wurde gestoppt. Prüfe die Verbindung und ob Eingangs-PINs auf dem Gerät konfiguriert sind.",
				compat_stream_unknown_command:
					"Diese Firmware unterstützt keine Live-Werte. Inspektion und normales MIDI bleiben verfügbar.",
				compat_stream_connection:
					"Das Gerät ist nicht erreichbar. Der Stream wurde gestoppt.",
				compat_stream_pin_not_found:
					"Auf dem Gerät sind keine passenden Eingangs-PINs konfiguriert. Der Stream wurde gestoppt.",
				compat_threshold_review:
					"Prüfe die Touch-Schwellenwerte vor dem Deploy. Firmware vor 0.19 nutzt Rohwerte, ab 0.19 gelten Prozentwerte. Die Einheit dieser Werte ist anders oder unbekannt. Wähle ein Gerät und übernimm die Zahlen ausdrücklich in dessen Einheit oder lade seine Konfiguration.",
				compat_use_raw: "Zahlen als Rohwerte übernehmen",
				compat_use_percent: "Zahlen als Prozentwerte übernehmen",
				compat_touch_raw:
					"Touch-Eingang älterer Firmware: Ein Schwellenwert größer 0 ist ein Sensor-Rohwert, kein Prozentwert. 0 = kontinuierlicher Wert.",
				compat_touch_unknown:
					"Die Einheit des Touch-Schwellenwerts hängt von der Firmware ab. Wähle ein Gerät, um die Version vor dem Deploy zu prüfen.",
				compat_deploy_failed:
					"Deploy fehlgeschlagen. Prüfe die Geräteverbindung vor einem erneuten Versuch.",

				console: "Konsole",
				home_create_midi_devices_easily: "MIDI-Geräte einfach erstellen",
				home_no_coding_required: "Keine Programmierung erforderlich.",
				home_or_getting_started_guide:
					"oder check den Getting Started Guide aus",
				home_caption:
					"Müde von immer wieder demselben Code schreiben? Verwende den intuitiven No-Code-Konfigurator, um MIDI-Nachrichten Pins zuzuordnen und umgekehrt, und richte mühelos drahtlose MIDI-Verbindungen ein.",
				home_reliable_wireless_midi: "Zuverlässiges drahtloses MIDI",
				home_without_bluetooth: "Ohne Bluetooth.",
				home_fully_bidirectional: "Vollständig bidirektional",
				home_fully_bidirectional_description:
					"Funktioniert sowohl als MIDI IN- als auch als MIDI OUT-Gerät. Konfiguriere dein ESP32 als eigenständigen MIDI-Controller oder als MIDI-gesteuertes Instrument oder Klanginstallation.",
				home_midi_controller_or_instrument: "MIDI-Controller oder Instrument",
				home_dont_trust_bluetooth_midi: "Vertraust du Bluetooth MIDI nicht?",
				home_kit: "Als Kit erhältlich",
				home_dongles_and_client_boards: "Dongles & Client Boards",
				home_kit_description:
					"Starte schnell mit unseren maßgeschneiderten Hardware-Kits, die einen kompakten drahtlosen MIDI-Dongle und vielseitige Client-Boards enthalten alles, was du brauchst, um deine eigenen MIDI-Geräte mühelos zu bauen.",
				kits_title: "Kits & Boards",
				kits_intro:
					"enomik 3000 funktioniert am besten mit den Kits von Grantler Instruments: ein drahtloser MIDI-Dongle und Client-Boards mit Touch-Pads, NeoPixel- und I2C-Anschlüssen, bereits herausgeführt.",
				kits_any_esp32:
					"Unsere Hardware brauchst du aber nicht. Jedes Board mit ESP32-S2 oder ESP32-S3 funktioniert: Dongle- und Client-Firmware mit dem Firmware-Uploader flashen und die Pins im Browser konfigurieren.",
				kits_io_title: "Eingangs- und Ausgangstypen",
				kits_io_intro:
					"Jeder Pin eines Clients kann als Eingang konfiguriert werden, der MIDI sendet, oder als Ausgang, der auf eingehendes MIDI reagiert.",
				kits_inputs: "Eingänge",
				kits_outputs: "Ausgänge",
				kits_type_i2c_desc:
					"Zweidraht-Bus (SDA, SCL) für Sensoren wie den VL53L0X-Abstandssensor. Nutze die I2C-Client-Firmware.",
				kits_type_neopixel_desc:
					"Adressierbare RGB-LEDs (WS2812). Der Daten-Pin wird auf unseren Boards auf 5V angehoben, damit LED-Streifen zuverlässig funktionieren. Nutze die NeoPixel-Client-Firmware.",
				kits_boards_title: "Unsere Boards",
				kits_board_client_desc:
					"Client-Board für den LOLIN S2 mini: 8 kapazitive Touch-Eingänge, 2 digitale und 2 analoge Eingänge, ein 5V-NeoPixel-Ausgang, zwei I2C-Grove-Anschlüsse und ein IDC16-Stecker mit weiteren GPIOs. Fahre über einen Pin für Details.",
				kits_board_diagram: "Pinbelegung von {{name}}",
				kits_pin_touch: "Kapazitiver Touch",
				kits_pin_neopixel: "NeoPixel (5V)",
				kits_pin_digital: "Digital",
				kits_pin_analog: "Analog",
				kits_pin_i2c_sda: "I2C SDA",
				kits_pin_i2c_scl: "I2C SCL",
				kits_pin_power_5v: "5V",
				kits_pin_power_3v3: "3,3V",
				kits_pin_gnd: "GND",
				kits_pin_nc: "Nicht verbunden",
				kits_group_digital: "Digital I/O",
				kits_group_analog: "Analog-Eingang / Digital I/O",
				home_esp_now_midi:
					"Zur Rettung! Es bietet schnelles, stabiles, latenzfreies drahtloses MIDI, ideal für Live-Performances, Instrumente und eingebettete Systeme.",
				home_utilities: "Ausgestattet mit Utilities",
				home_utilities_description: "MIDI-Monitor und Firmware-Uploader",
				home_utilities_description_includes:
					"Die App enthält einen integrierten",
				home_utilities_description_includes_continues:
					"zur Echtzeit-Nachrichtenverfolgung und einen",
				home_utilities_description_includes_end:
					"um deine ESP32-Geräte einfach zu flashen.",
				home_pwa_title: "Läuft im Browser",
				home_pwa_description:
					"Keine Desktop-App nötig. Konfiguriere Geräte, überwache MIDI und flashe Firmware direkt im Browser. Installiere sie als Progressive Web App für schnellen Zugriff vom Dock oder Startbildschirm.",
				getting_started_github_link_example: "Beispiel auf GitHub",
				getting_started_upload_dongle_title:
					"Lade die Firmware auf den Dongle hoch",
				getting_started_upload_dongle_description:
					"Lade entweder example/dongle aus der ESP-NOW MIDI Arduino-Bibliothek hoch oder verwende das Firmware-Uploader-Dienstprogramm in dieser App, um die vorgefertigte Dongle-Firmware zu flashen.",
				getting_started_upload_dongle_description_extra:
					"Überspringe diesen Schritt, wenn du keine drahtlose MIDI-Verbindung benötigst und das Client-Board nur als verkabeltes MIDI-Gerät verwenden möchtest.",
				getting_started_upload_client_title:
					"Lade die Firmware auf den Client hoch",
				getting_started_upload_client_description:
					"Lass uns nun den Prozess für das Client-Board wiederholen. Du kannst example/client aus der ESP-NOW MIDI Arduino-Bibliothek hochladen oder das Firmware-Uploader-Dienstprogramm in dieser App verwenden, um die vorgefertigte Client-Firmware zu flashen.",
				getting_started_configuration_title: "Konfiguration",
				getting_started_configuration_description:
					"Der spaßige Teil! Verwende den Konfigurator, um MIDI-Nachrichten Pins zuzuordnen und umgekehrt, und richte drahtlose MIDI-Verbindungen zwischen deinen Geräten ein.",
				getting_started_debugging_title: "Debugging",
				getting_started_debugging_description:
					"Wenn Dinge nicht wie erwartet funktionieren, verwende das MIDI-Monitor-Dienstprogramm in dieser App, um eingehende und ausgehende MIDI-Nachrichten zu Debugging-Zwecken anzuzeigen.",
				launch_configurator: "Konfigurator starten",
				firmware_uploader: "Firmware Uploader",
				midi_monitor: "MIDI Monitor",
				connect: "Verbinden",
				disconnect: "Trennen",
				clear: "Löschen",
				made_with_love: "Entwickelt mit ♡️ von",
				tooltip_pin_to_midi:
					"Konfiguriere, wie Eingangs-Pins auf dem Mikrocontroller MIDI-Nachrichten zugeordnet werden.",
				tooltip_midi_to_pin: "Setze Pin-Werte von MIDI-Nachrichten",
				tooltip_wireless_midi:
					"Richte ESP-NOW MIDI-Verbindungen zu anderen Geräten ein",
				tooltip_global: "Geräteweite Einstellungen für das gesamte Board",
				tooltip_midi_loopback:
					"Wenn aktiviert, werden ausgehende Kanal- und Echtzeit-MIDI-Nachrichten lokal an Empfangs-Handler weitergeleitet. SysEx wird nicht geloopt.",
				tooltip_power_save:
					"Wenn aktiviert, wird der Stromverbrauch gesenkt (Modem-Sleep und geringere Sendeleistung) bei höherer Latenz. Standard ist aus für niedrigere Latenz.",
				tooltip_save_configuration_to_file:
					"Aktuelle Konfiguration in einer Datei speichern",
				tooltip_load_configuration_from_file:
					"Konfiguration aus einer Datei laden",
				tooltip_clear_configuration: "Aktuelle Konfiguration löschen",
				tooltip_load_configuration_from_device:
					"Konfiguration von einem Gerät laden",
				tooltip_pin_modes: "Pin-Modi und Pinbelegungen",
				tooltip_midi_monitor:
					"Eingehende und ausgehende MIDI-Nachrichten zu Debugging-Zwecken anzeigen",
				tooltip_tools:
					"Weitere Seiten: ein Board testen oder den Grantulator-Synth spielen",
				tooltip_serial_monitor:
					"Serielle Ausgabe des verbundenen Mikrocontrollers zu Debugging-Zwecken anzeigen",
				tooltip_midi_composer:
					"Erstelle und sende benutzerdefinierte MIDI-Nachrichten an verbundene Geräte",
				configurator_info:
					"Um deine enomik-Clientgeräte zu konfigurieren, musst du zuerst die entsprechende Firmware auf ihnen flashen. Du kannst das praktische Firmware-Uploader-Dienstprogramm verwenden, um die vorcompilierte Firmware auf deine ESP32-basierten Client-Boards hochzuladen.",
				state_on: "an",
				state_off: "aus",
				deploy_toast_summary_reset_ok:
					"Geräte-Reset bestätigt. {{pinConfigs}} Pin-Konfigurationen, {{peerCount}} drahtlose MIDI-Adressen, MIDI-Loopback {{midiLoopback}} und Energiesparmodus {{powerSave}} gesendet.",
				deploy_toast_summary_reset_timeout:
					"Keine Reset-Bestätigung (Zeitüberschreitung). {{pinConfigs}} Pin-Konfigurationen, {{peerCount}} drahtlose MIDI-Adressen, MIDI-Loopback {{midiLoopback}} und Energiesparmodus {{powerSave}} gesendet. Wenn dieser Fehler weiterhin auftritt, aktualisiere bitte die Client-Firmware auf die neueste Version.",
				deploy_toast_globals_unsupported:
					"Globale Einstellungen erfordern Firmware 0.14+ (Gerät meldete {{version}}).",
				load_from_device_toast_ok:
					"{{pinConfigs}} Pin-Konfigurationen, {{peerCount}} drahtlose MIDI-Adressen, MIDI-Loopback {{midiLoopback}} und Energiesparmodus {{powerSave}} vom Gerät geladen.",
				load_from_file_kind_mismatch:
					"Das ist eine {{file}}-Konfiguration, ausgewählt ist aber {{selected}}. Wechsle zu {{file}}, um sie zu importieren.",
				port_switched: "MIDI-Port zu {{port}} gewechselt.",
				port_kind_not_found:
					"Kein {{kind}}-Port gefunden. {{port}} bleibt ausgewählt.",
				port_kind_not_found_none:
					"Kein {{kind}}-Port gefunden. Schließe einen an oder wähle einen Port.",
				open_tester: "Board-Tester",
				open_grantulator: "Grantulator",
				device_kind: "Gerätetyp",
				device_kind_client: "Client",
				device_kind_dongle: "Dongle",
				tooltip_device_kind:
					"Client oder Dongle. Aus dem Portnamen erraten, bei Bedarf ändern.",
				deploy_toast_dongle_summary_reset_ok:
					"Geräte-Reset bestätigt. {{peerCount}} drahtlose MIDI-Adressen gesendet.",
				deploy_toast_dongle_summary_reset_timeout:
					"Keine Reset-Bestätigung (Zeitüberschreitung). {{peerCount}} drahtlose MIDI-Adressen gesendet. Wenn dieser Fehler weiterhin auftritt, aktualisiere bitte die Dongle-Firmware auf die neueste Version.",
				load_from_device_toast_dongle_ok:
					"{{peerCount}} drahtlose MIDI-Adressen vom Gerät geladen.",
				load_from_device_toast_timeout:
					"Konfiguration konnte nicht vom Gerät geladen werden (Zeitüberschreitung oder keine Antwort). Wähle ein Gerät und stelle sicher, dass die Firmware GET_CONFIG unterstützt.",
				load_from_device_toast_no_device:
					"Wähle ein MIDI-Gerät, bevor du die Konfiguration vom Gerät lädst.",
				firmwareuploader_intro:
					"Dies ist eine experimentelle Funktion, die am besten mit dem Chrome-Browser funktioniert. Bitte melde alle Probleme, auf die du stößt.",
				firmwareuploader_releases_link:
					"Konntest du deine Firmware nicht finden oder benötigst du eine bestimmte Version? Du kannst die entsprechende .bin-Datei von unserer ",
				firmwareuploader_custom_bin:
					"Oder lade eine benutzerdefinierte .bin-Datei hoch",
				firmwareuploader_bootloader_mode:
					"Einige Boards, wie LOLIN S2 Mini, müssen manuell in den Bootloader-Modus versetzt werden, indem du BOOT gedrückt hältst und RESET drückst. Dies ist zum Flashen erforderlich und steht in keinem Zusammenhang mit Softwareeinstellungen.",
				firmwareuploader_bootloader_mode_instruction:
					"Versetze das Gerät in den manuellen Bootloader-Modus: Halte BOOT gedrückt und drücke RESET.",
				firmwareuploader_bootloader_mode_confirmation:
					"Ich habe das Gerät in den Bootloader-Modus versetzt",
				browser_warning:
					"Diese App funktioniert am besten mit Chrome oder Chromium-basierten Browsern. Einige Funktionen (z. B. Serial, Firmware Uploader) sind in deinem Browser möglicherweise nicht verfügbar.",
				browser_warning_unsupported_title: "Nicht unterstützter Browser",
				browser_warning_unsupported:
					"Dein Browser unterstützt die Web Serial API nicht, die zum Verbinden mit Geräten und zum Hochladen von Firmware erforderlich ist. Chrome wird für die beste Erfahrung ausdrücklich empfohlen.",
				browser_warning_brave_title: "Brave Browser erkannt",
				browser_warning_brave:
					"Braves Datenschutzschilder können die Web Serial und Web MIDI APIs blockieren. Wenn Verbindungsprobleme auftreten, deaktiviere die Schilder für diese Seite. Chrome wird für die beste Erfahrung ausdrücklich empfohlen.",
				browser_warning_chromium_title: "Browser-Kompatibilität",
				browser_warning_chromium:
					"Die meisten Funktionen sollten in deinem Browser funktionieren, Chrome wird jedoch für die beste Erfahrung ausdrücklich empfohlen.",
				browser_warning_unknown_title: "Unbekannter Browser",
				browser_warning_unknown:
					"Dein Browser konnte nicht identifiziert werden. Diese App erfordert die Web Serial API. Chrome wird für die beste Erfahrung ausdrücklich empfohlen.",
				browser_warning_dismiss: "Schließen",
				install_app: "App installieren",
				uninstall_app: "App deinstallieren",
				uninstall_app_copied:
					"Die Apps-Seite konnte von hier nicht geöffnet werden. {{url}} wurde kopiert. Füge es in die Adresszeile ein, um installierte Apps zu verwalten.",
				uninstall_app_open_failed:
					"Die Apps-Seite konnte von hier nicht geöffnet werden. Öffne {{url}} in der Adresszeile, um installierte Apps zu verwalten.",
				settings: "Einstellungen",
				show_hints: "Hinweise anzeigen",
				language: "Sprache",
				dark_theme: "Dunkles Design",
				close: "Schließen",
				configurator: "Konfigurator",
				debugger: "Debugger",
				inspector: "Inspector",
				main_navigation: "Hauptnavigation",
				getting_started: "Erste Schritte",
				deploy: "Bereitstellen",
				init_midi: "MIDI initialisieren",
				midi_output: "MIDI-Ausgang",
				filter: "Filter",
				filters_active: "({{count}} aktiv)",
				history: "Verlauf",
				direction: "Richtung",
				timestamp: "Zeitstempel",
				device: "Gerät",
				channel: "Kanal",
				type: "Typ",
				note_cc_prg: "Note/CC/PRG",
				vel_value: "Vel/Wert",
				data: "Daten",
				inputs: "Eingänge",
				outputs: "Ausgänge",
				channels: "Kanäle",
				types: "Typen",
				all: "Alle",
				none: "Keine",
				console_placeholder: "Nachricht eingeben…",
				console_no_data: "Noch keine Daten…",
				all_rights_reserved: ". Alle Rechte vorbehalten.",
				not_found: "404 – Seite nicht gefunden",
				duplicate: "Duplizieren",
				delete: "Löschen",
				confirmed: "Bestätigt",
				connected: "Verbunden",
				flashing: "Flashen",
				connect_and_flash: "Verbinden & Flashen",
				flashing_progress: "Flashen …",
				pin: "Pin",
				mode: "Modus",
				threshold: "Schwellenwert",
				midi_type: "MIDI-Typ",
				controller: "Controller",
				note: "Note",
				min: "Min",
				max: "Max",
				deploy_toast_duplicate_pins:
					"Nicht deployt: PIN {{pins}} wird mehrfach verwendet. Jeder PIN kann nur eine Konfiguration haben.",
				pin_conflict: "PIN {{pin}} wird mehrfach verwendet",
				pin_mode_analog_desc:
					"Liest einen kontinuierlichen Wert (z. B. von einem Potentiometer oder Sensor).",
				pin_mode_digital_in_desc:
					"Digitaler Eingang. Liest LOW/HIGH, für Schalter oder Taster (mit externen Widerständen).",
				pin_mode_digital_in_pullup_desc:
					"Digitaler Eingang mit internem Pull-up. Für Taster gegen Masse; im Ruhezustand HIGH, gedrückt = LOW.",
				pin_mode_touch_desc:
					"Kapazitiver Touch-Eingang. Der Schwellenwert ist die Änderung gegenüber dem unberührten Messwert in % (1–127): sendet max ab dem Schwellenwert, min unter ¾ davon. 0 = kontinuierlicher Wert. Zum Einstellen die Live-Werte im Inspector nutzen.",
				pin_mode_digital_out_desc:
					"Digitaler Ausgang. Schaltet LOW/HIGH für LEDs, Relais oder andere digitale Lasten.",
				pin_mode_pwm_desc:
					"PWM-Ausgang. Zum Dimmen von LEDs oder zur Steuerung der Motordrehzahl mit einem analogähnlichen Wert.",
				pitch_bend_precision_info:
					"Min-/Max-Werte werden als 7-Bit-Werte übertragen, du könntest an Genauigkeit verlieren. Die zugrunde liegende Config-API benötigt noch einige Anpassungen. Die tatsächlichen Pitchbend-Werte werden als 14-Bit-Werte gesendet, keine Sorge.",
				composer_start_byte: "Start-Byte",
				composer_manufacturer_id: "Hersteller-ID (*)",
				composer_data_hex: "Daten (hex)",
				composer_end_byte: "End-Byte",
				composer_program: "Programm",
				composer_velocity: "Anschlagstärke",
				composer_value: "Wert",
				composer_pitch_bend: "Pitch Bend (-8192 bis +8191)",
				composer_send_midi: "MIDI senden",
				firmwareuploader_issue_tracker: "GitHub Issue Tracker",
				firmwareuploader_step1: "Schritt 1 — Version auswählen",
				firmwareuploader_step2: "Schritt 2 — Board auswählen",
				firmwareuploader_step3: "Schritt 3 — Firmware auswählen",
				firmwareuploader_step4: "Schritt 4 — Bootloader-Modus",
				firmwareuploader_step5: "Schritt 5 — Firmware flashen",
				firmwareuploader_releases_page: "GitHub-Releases-Seite",
				firmwareuploader_manual_bootloader_required:
					"Manueller Bootloader erforderlich (BOOT + RESET halten)",
				firmwareuploader_load_failed: "Firmware konnte nicht geladen werden.",
				firmwareuploader_flash_success:
					"Firmware erfolgreich geflasht. Das Board wurde zurückgesetzt.",
				firmwareuploader_flash_success_reset_manual:
					"Firmware erfolgreich geflasht. Drücke RESET am Board zum Starten.",
				firmwareuploader_select_board: "Board",
				firmwareuploader_select_version: "Version",
				firmwareuploader_version_latest: "{{version}} (aktuell)",
				firmwareuploader_clear_nvs:
					"NVS löschen (gespeicherte Einstellungen zurücksetzen)",
				firmwareuploader_clear_nvs_help:
					"Löscht gespeicherte Einstellungen (z. B. Peer-Konfiguration). Für normale Updates deaktiviert lassen. Für Standard-Arduino-ESP32-Firmware / die Presets dieses Uploaders.",
				debugger_init_prompt:
					"Um die MIDI-Funktionen zu nutzen, initialisiere bitte das MIDI-System.",
				section_global: "Global",
				section_input_pin_to_midi: "Eingangs-Pin-zu-MIDI-Zuordnung",
				section_midi_to_output_pin: "MIDI-zu-Ausgangs-Pin-Zuordnung",
				section_wireless_midi: "Drahtlose MIDI-Konfiguration",
				section_midi_composer: "MIDI-Composer",
				section_midi_monitor: "MIDI-Monitor",
				section_serial_monitor: "Serieller Monitor",
				section_tools: "Werkzeuge",
				midi_loopback: "MIDI-Loopback",
				power_save: "Energiesparmodus",
				client_name: "Client-Name",
				client_name_placeholder: "Standard der Firmware",
				tooltip_client_name:
					"Name, um Clients auseinanderzuhalten. Wird beim Deploy auf dem Gerät gespeichert. Leer lassen, um den Namen der Firmware zu behalten. Nur ASCII, max. 16 Zeichen.",
				deploy_toast_name_unsupported:
					"Der Client-Name erfordert Firmware 0.19+ (Gerät meldet {{version}}).",
				inspector_info:
					"Der Inspector ermöglicht es dir, MIDI-Geräte auszuwählen und Einstellungen zu synchronisieren. Denn wer weiß schon, was man vor Monaten gemacht hat.",
				inspector_sync: "Synchronisieren",
				inspector_input_to_midi: "Eingangs-PIN zu MIDI",
				inspector_midi_to_output: "MIDI zu Ausgangs-PIN",
				inspector_esp_now_midi: "ESP-NOW MIDI",
				inspector_global: "Global",
				inspector_no_peers: "Keine drahtlosen MIDI-Adressen hinzugefügt",
				inspector_firmware: "Firmware",
				inspector_mac_address: "MAC-Adresse",
				inspector_protocol_version: "Protokollversion",
				inspector_raw_stream: "Live-Werte",
				inspector_raw_stream_toggle: "Rohwerte der Eingänge streamen",
				inspector_raw_stream_hint:
					"Live-Messwerte aller konfigurierten Eingangs-PINs (Firmware 0.19+, nur über USB). Touch-Pad einstellen: Pad berühren, % ablesen und den Schwellwert auf etwa die Hälfte dessen setzen, was eine leichte Berührung erreicht.",
				inspector_raw_stream_error:
					"Rohwert-Stream nicht verfügbar ({{error}}). Benötigt Firmware 0.19+, konfigurierte Eingangs-PINs und eine USB-Verbindung.",
				configurator_raw_stream_not_deployed:
					"Live-Werte werden erst angezeigt, nachdem dieser PIN deployt wurde.",
				cc_or_note: "CC / Note",
				live: "Live",
				pwm_min: "PWM min",
				pwm_max: "PWM max",
				live_after_deploy: "nach Deploy",
				configurator_raw_stream_broadcast:
					"Gerät auswählen (nicht Broadcast), um Live-Werte zu streamen.",
				inspector_raw_stream_waiting: "Warte auf Werte…",
				raw: "Rohwert",
				baseline: "Basiswert",
				peak: "Spitze",
				percent: "Änderung",
				normalized: "Normalisiert",
				touched: "berührt",
			},
		},
		es: {
			translation: {
				compat_inspection_unsupported:
					"Leer la configuración del dispositivo requiere firmware 0.13 o posterior. Puedes seguir editando, guardando y desplegando configuraciones de pines y pares.",
				compat_globals_skipped:
					"Se enviaron las configuraciones de pines y pares. Este firmware no admite ajustes de bucle MIDI ni de ahorro de energía, por lo que se omitieron.",

				compat_name_skipped:
					"No se aplicó el nombre porque no se pudo confirmar la compatibilidad del firmware.",
				compat_select_device:
					"Selecciona un dispositivo conectado para consultar el firmware y ver valores en vivo.",
				compat_checking: "Comprobando compatibilidad del firmware…",
				compat_timeout:
					"El dispositivo no respondió con su versión. Las funciones nuevas quedan desactivadas; MIDI sigue funcionando.",
				compat_dongle_unsupported:
					"Este dongle no responde a las solicitudes de configuración. Actualiza el firmware del dongle a 0.19 o posterior.",
				compat_incompatible:
					"Este protocolo de firmware no es compatible. Inspección y configuración no disponibles; MIDI sigue disponible.",
				compat_unpaired:
					"No se puede identificar una entrada MIDI única. Si varias placas tienen el mismo nombre, conecta solo la que deseas inspeccionar.",
				compat_live_unsupported:
					"Los valores en vivo requieren firmware 0.19 o posterior. La configuración básica sigue disponible.",
				compat_retry: "Reintentar",
				compat_syncing: "Leyendo configuración del dispositivo…",
				compat_sync_failed:
					"No se pudo leer toda la configuración. Los valores mostrados pueden estar incompletos. Comprueba la conexión y sincroniza de nuevo.",
				compat_unavailable: "No disponible",
				compat_stream_timeout:
					"El dispositivo no confirmó la transmisión. Se ha detenido; comprueba el firmware y la conexión USB.",
				compat_stream_no_readings:
					"No se recibieron lecturas recientes. Se detuvo la transmisión. Comprueba la conexión y los pines de entrada configurados.",
				compat_stream_unknown_command:
					"Este firmware no admite valores en vivo. Inspección y MIDI siguen disponibles.",
				compat_stream_connection:
					"No se pudo contactar con el dispositivo. Se detuvo la transmisión.",
				compat_stream_pin_not_found:
					"El dispositivo no tiene pines de entrada coincidentes configurados. Se detuvo la transmisión.",
				compat_threshold_review:
					"Revisa los umbrales táctiles antes de desplegar. Firmware anterior a 0.19 usa valores brutos; 0.19+ usa porcentajes. Estos valores tienen unidades distintas o desconocidas. Selecciona un dispositivo y confirma sus unidades o carga su configuración.",
				compat_use_raw: "Usar números como umbrales brutos",
				compat_use_percent: "Usar números como porcentajes",
				compat_touch_raw:
					"Entrada táctil antigua: un umbral distinto de cero es una lectura bruta, no un porcentaje. 0 = valor continuo.",
				compat_touch_unknown:
					"Las unidades del umbral dependen del firmware. Selecciona un dispositivo para comprobar la versión antes de desplegar.",
				compat_deploy_failed:
					"Falló el despliegue. Comprueba la conexión antes de reintentar.",

				console: "Consola",
				home_create_midi_devices_easily: "Crea dispositivos MIDI fácilmente",
				home_no_coding_required: "No se requiere codificación.",
				home_or_getting_started_guide: "o consulta la guía de introducción",
				home_caption:
					"¿Cansado de escribir el mismo código una y otra vez? Usa el intuitivo configurador sin código para asignar mensajes MIDI a pines y viceversa, y configurar conexiones MIDI inalámbricas sin esfuerzo.",
				home_reliable_wireless_midi: "MIDI inalámbrico confiable",
				home_without_bluetooth: "Sin Bluetooth.",
				home_fully_bidirectional: "Totalmente bidireccional",
				home_fully_bidirectional_description:
					"Funciona tanto como un dispositivo MIDI IN como MIDI OUT. Configura tu ESP32 como un controlador MIDI independiente o como un instrumento o instalación de sonido controlable por MIDI.",
				home_midi_controller_or_instrument: "Controlador o instrumento MIDI",
				home_dont_trust_bluetooth_midi: "¿No confías en el MIDI por Bluetooth?",
				home_kit: "Disponible como kit",
				home_esp_now_midi:
					"¡A la rescate! Ofrece MIDI inalámbrico rápido, estable y de baja latencia, ideal para actuaciones en vivo, instrumentos y sistemas embebidos.",
				home_dongles_and_client_boards: "Dongles y placas cliente",
				home_kit_description:
					"Comienza rápidamente con nuestros kits de hardware personalizados, que incluyen un dongle MIDI inalámbrico compacto y placas cliente versátiles: todo lo que necesitas para construir tus propios dispositivos MIDI con facilidad.",
				kits_title: "Kits y placas",
				kits_intro:
					"enomik 3000 funciona mejor con los kits de Grantler Instruments: un dongle MIDI inalámbrico y placas cliente con pads táctiles y conectores NeoPixel e I2C ya accesibles.",
				kits_any_esp32:
					"Aunque no necesitas nuestro hardware. Cualquier placa basada en ESP32-S2 o ESP32-S3 funciona: carga el firmware de dongle y cliente con el cargador de firmware y configura los pines en el navegador.",
				kits_io_title: "Tipos de entrada y salida",
				kits_io_intro:
					"Cada pin de un cliente puede configurarse como entrada que envía MIDI o como salida que reacciona al MIDI entrante.",
				kits_inputs: "Entradas",
				kits_outputs: "Salidas",
				kits_type_i2c_desc:
					"Bus de dos hilos (SDA, SCL) para sensores como el sensor de distancia VL53L0X. Usa el firmware cliente I2C.",
				kits_type_neopixel_desc:
					"LEDs RGB direccionables (WS2812). En nuestras placas el pin de datos se eleva a 5V para que las tiras LED funcionen de forma fiable. Usa el firmware cliente NeoPixel.",
				kits_boards_title: "Nuestras placas",
				kits_board_client_desc:
					"Placa cliente para el LOLIN S2 mini: 8 entradas táctiles capacitivas, 2 entradas digitales y 2 analógicas, una salida NeoPixel de 5V, dos puertos I2C Grove y un conector IDC16 con más GPIOs. Pasa el ratón sobre un pin para ver detalles.",
				kits_board_diagram: "Pinout de {{name}}",
				kits_pin_touch: "Táctil capacitivo",
				kits_pin_neopixel: "NeoPixel (5V)",
				kits_pin_digital: "Digital",
				kits_pin_analog: "Analógico",
				kits_pin_i2c_sda: "I2C SDA",
				kits_pin_i2c_scl: "I2C SCL",
				kits_pin_power_5v: "5V",
				kits_pin_power_3v3: "3,3V",
				kits_pin_gnd: "GND",
				kits_pin_nc: "No conectado",
				kits_group_digital: "E/S digital",
				kits_group_analog: "Entrada analógica / E/S digital",
				home_utilities: "Equipado con utilidades",
				home_utilities_description: "Monitor MIDI y cargador de firmware",
				home_utilities_description_includes: "La aplicación incluye un",
				home_utilities_description_includes_continues:
					"para el seguimiento de mensajes en tiempo real y un",
				home_utilities_description_includes_end:
					"para flashear fácilmente tus dispositivos ESP32.",
				home_pwa_title: "Funciona en tu navegador",
				home_pwa_description:
					"No necesitas una app de escritorio. Configura dispositivos, monitoriza MIDI y flashea firmware directamente en el navegador. Instálala como Progressive Web App para acceso rápido desde el dock o la pantalla de inicio.",
				getting_started_github_link_example: "Ejemplo en GitHub",
				getting_started_upload_dongle_title: "Sube el firmware al dongle",
				getting_started_upload_dongle_description:
					"Sube el ejemplo/dongle de la biblioteca Arduino ESP-NOW MIDI o usa la utilidad Firmware Uploader en esta aplicación para flashear el firmware precompilado del dongle.",
				getting_started_upload_dongle_description_extra:
					"Omite este paso si no necesitas una conexión MIDI inalámbrica y solo deseas usar la placa cliente como un dispositivo MIDI con cable.",
				getting_started_upload_client_title: "Sube el firmware al cliente",
				getting_started_upload_client_description:
					"Ahora, repitamos el proceso para la placa cliente. Puedes subir el ejemplo/client de la biblioteca Arduino ESP-NOW MIDI o usar la utilidad Firmware Uploader en esta aplicación para flashear el firmware precompilado del cliente.",
				getting_started_configuration_title: "Configuración",
				getting_started_configuration_description:
					"¡La parte divertida! Usa el Configurador para mapear mensajes MIDI a pines y viceversa, y configurar conexiones MIDI inalámbricas entre tus dispositivos.",
				getting_started_debugging_title: "Depuración",
				getting_started_debugging_description:
					"Cuando las cosas no funcionan como se espera, usa la utilidad Monitor MIDI en esta aplicación para ver los mensajes MIDI entrantes y salientes con fines de depuración.",
				launch_configurator: "Iniciar Configurador",
				firmware_uploader: "Cargador de Firmware",
				midi_monitor: "Monitor MIDI",
				connect: "Conectar",
				disconnect: "Desconectar",
				clear: "Limpiar",
				test: "Esta es una cadena de prueba",
				made_with_love: "Desarrollado con ♡️ por",
				tooltip_pin_to_midi:
					"Configurar cómo los pines de entrada en el microcontrolador se asignan a los mensajes MIDI.",
				tooltip_midi_to_pin: "Establecer valores de pines desde mensajes MIDI",
				tooltip_wireless_midi:
					"Configurar conexiones MIDI ESP-NOW a otros dispositivos",
				tooltip_global:
					"Ajustes del dispositivo que se aplican a toda la placa",
				tooltip_midi_loopback:
					"Cuando está activado, el MIDI de canal y tiempo real saliente se reenvía localmente a los manejadores de recepción. SysEx no se hace loop.",
				tooltip_power_save:
					"Cuando está activado, reduce el consumo (sueño del módem y menor potencia TX) a costa de mayor latencia. Por defecto está desactivado para menor latencia.",
				tooltip_save_configuration_to_file:
					"Guardar la configuración actual en un archivo",
				tooltip_load_configuration_from_file:
					"Cargar configuración desde un archivo",
				tooltip_clear_configuration: "Limpiar la configuración actual",
				tooltip_load_configuration_from_device:
					"Cargar configuración desde un dispositivo",
				tooltip_pin_modes: "Modos de pin y pinouts de placas",
				tooltip_midi_monitor:
					"Ver mensajes MIDI entrantes y salientes para fines de depuración",
				tooltip_tools:
					"Más páginas: probar una placa o tocar el sintetizador Grantulator",
				tooltip_serial_monitor:
					"Ver la salida serial del microcontrolador conectado para fines de depuración",
				tooltip_midi_composer:
					"Componer y enviar mensajes MIDI personalizados a dispositivos conectados",
				configurator_info:
					"Para configurar tus dispositivos cliente enomik, primero debes flashear el firmware apropiado en ellos. Puedes usar la práctica utilidad Firmware Uploader para cargar el firmware precompilado en tus placas cliente basadas en ESP32.",
				state_on: "activado",
				state_off: "desactivado",
				deploy_toast_summary_reset_ok:
					"Reinicio del dispositivo confirmado. Enviadas {{pinConfigs}} configuraciones de pin, {{peerCount}} direcciones MIDI inalámbricas, MIDI loopback {{midiLoopback}} y modo de ahorro de energía {{powerSave}}.",
				deploy_toast_summary_reset_timeout:
					"No se recibió confirmación de reinicio (tiempo agotado). Enviadas {{pinConfigs}} configuraciones de pin, {{peerCount}} direcciones MIDI inalámbricas, MIDI loopback {{midiLoopback}} y modo de ahorro de energía {{powerSave}}. Si este error persiste, actualiza el firmware del cliente a la última versión.",
				deploy_toast_globals_unsupported:
					"Los ajustes globales requieren firmware 0.14+ (el dispositivo informó {{version}}).",
				load_from_device_toast_ok:
					"Se cargaron {{pinConfigs}} configuraciones de pin, {{peerCount}} direcciones MIDI inalámbricas, MIDI loopback {{midiLoopback}} y modo de ahorro de energía {{powerSave}} desde el dispositivo.",
				load_from_file_kind_mismatch:
					"Esta es una configuración de {{file}}, pero está seleccionado {{selected}}. Cambia a {{file}} para importarla.",
				port_switched: "Puerto MIDI cambiado a {{port}}.",
				port_kind_not_found:
					"No se encontró ningún puerto {{kind}}. Se mantiene {{port}}.",
				port_kind_not_found_none:
					"No se encontró ningún puerto {{kind}}. Conecta uno o elige un puerto.",
				open_tester: "Probador de placas",
				open_grantulator: "Grantulator",
				device_kind: "Tipo de dispositivo",
				device_kind_client: "Cliente",
				device_kind_dongle: "Dongle",
				tooltip_device_kind:
					"Cliente o dongle. Se deduce del nombre del puerto; cámbialo si no es correcto.",
				deploy_toast_dongle_summary_reset_ok:
					"Reinicio del dispositivo confirmado. Enviadas {{peerCount}} direcciones MIDI inalámbricas.",
				deploy_toast_dongle_summary_reset_timeout:
					"No se recibió confirmación de reinicio (tiempo agotado). Enviadas {{peerCount}} direcciones MIDI inalámbricas. Si este error persiste, actualiza el firmware del dongle a la última versión.",
				load_from_device_toast_dongle_ok:
					"Se cargaron {{peerCount}} direcciones MIDI inalámbricas desde el dispositivo.",
				load_from_device_toast_timeout:
					"No se pudo cargar la configuración del dispositivo (tiempo agotado o sin respuesta). Selecciona un dispositivo y asegúrate de que el firmware admite GET_CONFIG.",
				load_from_device_toast_no_device:
					"Selecciona un dispositivo MIDI antes de cargar la configuración desde el dispositivo.",
				firmwareuploader_intro:
					"Esta es una función experimental que funciona mejor con el navegador Chrome. Por favor, informa cualquier problema que encuentres.",
				firmwareuploader_releases_link:
					"¿No puedes encontrar tu firmware o necesitas una versión específica? Puedes descargar el archivo .bin correspondiente de nuestro ",
				firmwareuploader_custom_bin: "O sube un archivo .bin personalizado",
				firmwareuploader_bootloader_mode:
					"Algunas placas, como LOLIN S2 Mini, deben configurarse manualmente en modo bootloader manteniendo presionado BOOT y presionando RESET. Esto es necesario para flashear y no está relacionado con ninguna configuración de software.",
				firmwareuploader_bootloader_mode_instruction:
					"Coloca el dispositivo en modo bootloader manual: mantén presionado BOOT y presiona RESET.",
				firmwareuploader_bootloader_mode_confirmation:
					"He colocado el dispositivo en modo bootloader",
				browser_warning:
					"Esta aplicación funciona mejor con Chrome o navegadores basados en Chromium. Algunas funciones (p. ej. Serial, Cargador de firmware) pueden no estar disponibles en tu navegador.",
				browser_warning_unsupported_title: "Navegador no compatible",
				browser_warning_unsupported:
					"Tu navegador no es compatible con la Web Serial API, necesaria para conectar dispositivos y cargar firmware. Se recomienda encarecidamente Chrome para la mejor experiencia.",
				browser_warning_brave_title: "Brave detectado",
				browser_warning_brave:
					"Los escudos de privacidad de Brave pueden bloquear las APIs Web Serial y Web MIDI. Si tienes problemas de conexión, desactiva los escudos para esta página. Se recomienda encarecidamente Chrome para la mejor experiencia.",
				browser_warning_chromium_title: "Compatibilidad del navegador",
				browser_warning_chromium:
					"La mayoría de las funciones deberían funcionar en tu navegador, pero se recomienda encarecidamente Chrome para la mejor experiencia.",
				browser_warning_unknown_title: "Navegador desconocido",
				browser_warning_unknown:
					"No se pudo identificar tu navegador. Esta app requiere soporte de la Web Serial API. Se recomienda encarecidamente Chrome para la mejor experiencia.",
				browser_warning_dismiss: "Cerrar",
				install_app: "Instalar app",
				uninstall_app: "Desinstalar app",
				uninstall_app_copied:
					"No se pudo abrir la página de apps desde aquí. Se copió {{url}}: pégalo en la barra de direcciones para gestionar las apps instaladas.",
				uninstall_app_open_failed:
					"No se pudo abrir la página de apps desde aquí. Abre {{url}} en la barra de direcciones para gestionar las apps instaladas.",
				settings: "Configuración",
				show_hints: "Mostrar sugerencias",
				language: "Idioma",
				dark_theme: "Tema oscuro",
				close: "Cerrar",
				configurator: "Configurador",
				debugger: "Depurador",
				inspector: "Inspector",
				main_navigation: "Navegación principal",
				getting_started: "Introducción",
				deploy: "Desplegar",
				init_midi: "Iniciar MIDI",
				midi_output: "Salida MIDI",
				filter: "Filtro",
				filters_active: "({{count}} activos)",
				history: "Historial",
				direction: "Dirección",
				timestamp: "Marca de tiempo",
				device: "Dispositivo",
				channel: "Canal",
				type: "Tipo",
				note_cc_prg: "Nota/CC/PRG",
				vel_value: "Vel/Valor",
				data: "Datos",
				inputs: "Entradas",
				outputs: "Salidas",
				channels: "Canales",
				types: "Tipos",
				all: "Todos",
				none: "Ninguno",
				console_placeholder: "Escribe un mensaje…",
				console_no_data: "Aún no hay datos…",
				all_rights_reserved: ". Todos los derechos reservados.",
				not_found: "404 - Página no encontrada",
				duplicate: "Duplicar",
				delete: "Eliminar",
				confirmed: "Confirmado",
				connected: "Conectado",
				flashing: "Flasheando",
				connect_and_flash: "Conectar y flashear",
				flashing_progress: "Flasheando …",
				pin: "Pin",
				mode: "Modo",
				threshold: "Umbral",
				midi_type: "Tipo MIDI",
				controller: "Controlador",
				note: "Nota",
				min: "Mín",
				max: "Máx",
				deploy_toast_duplicate_pins:
					"No desplegado: el pin {{pins}} se usa más de una vez. Cada pin solo puede tener una configuración.",
				pin_conflict: "El pin {{pin}} se usa más de una vez",
				pin_mode_analog_desc:
					"Lee un valor continuo (p. ej. de un potenciómetro o sensor).",
				pin_mode_digital_in_desc:
					"Entrada digital. Lee LOW/HIGH, úsalo con interruptores o botones (con resistencias externas).",
				pin_mode_digital_in_pullup_desc:
					"Entrada digital con pull-up interno. Para botones conectados a tierra; en reposo HIGH, presionado = LOW.",
				pin_mode_touch_desc:
					"Entrada táctil capacitiva. El umbral es el cambio respecto a la lectura sin tocar en % (1–127): envía max al alcanzar el umbral, min por debajo de ¾ de él. 0 = valor continuo. Usa Valores en vivo en el Inspector para ajustarlo.",
				pin_mode_digital_out_desc:
					"Salida digital. Genera LOW/HIGH para LEDs, relés u otras cargas digitales.",
				pin_mode_pwm_desc:
					"Salida PWM. Úsala para atenuar LEDs o controlar la velocidad de un motor con un valor analógico.",
				pitch_bend_precision_info:
					"los valores mín/máx se transmiten como valores de 7 bits, podrías perder precisión. la API de configuración subyacente necesita algunos ajustes. los valores reales de pitchbend se envían como valores de 14 bits, sin preocupaciones.",
				composer_start_byte: "Byte inicial",
				composer_manufacturer_id: "ID de fabricante (*)",
				composer_data_hex: "Datos (hex)",
				composer_end_byte: "Byte final",
				composer_program: "Programa",
				composer_velocity: "Velocidad",
				composer_value: "Valor",
				composer_pitch_bend: "Pitch Bend (-8192 a +8191)",
				composer_send_midi: "Enviar MIDI",
				firmwareuploader_issue_tracker: "Rastreador de incidencias de GitHub",
				firmwareuploader_step1: "Paso 1 — Seleccionar versión",
				firmwareuploader_step2: "Paso 2 — Seleccionar placa",
				firmwareuploader_step3: "Paso 3 — Seleccionar firmware",
				firmwareuploader_step4: "Paso 4 — Modo bootloader",
				firmwareuploader_step5: "Paso 5 — Flashear firmware",
				firmwareuploader_releases_page: "página de versiones de GitHub",
				firmwareuploader_manual_bootloader_required:
					"Bootloader manual requerido (mantén BOOT + RESET)",
				firmwareuploader_load_failed: "No se pudo cargar el firmware.",
				firmwareuploader_flash_success:
					"Firmware flasheado correctamente. La placa se reinició.",
				firmwareuploader_flash_success_reset_manual:
					"Firmware flasheado correctamente. Pulsa RESET en la placa para arrancar.",
				firmwareuploader_select_board: "Placa",
				firmwareuploader_select_version: "Versión",
				firmwareuploader_version_latest: "{{version}} (más reciente)",
				firmwareuploader_clear_nvs:
					"Borrar NVS (restablecer ajustes guardados)",
				firmwareuploader_clear_nvs_help:
					"Borra la configuración guardada (p. ej. peers). Déjalo desmarcado para actualizaciones normales. Pensado para firmware Arduino ESP32 estándar / los presets de este cargador.",
				debugger_init_prompt:
					"Para usar las funciones MIDI, inicializa el sistema MIDI.",
				section_global: "Global",
				section_input_pin_to_midi: "Asignación de pin de entrada a MIDI",
				section_midi_to_output_pin: "Asignación de MIDI a pin de salida",
				section_wireless_midi: "Configuración de MIDI inalámbrico",
				section_midi_composer: "Compositor MIDI",
				section_midi_monitor: "Monitor MIDI",
				section_serial_monitor: "Monitor serial",
				section_tools: "Herramientas",
				midi_loopback: "MIDI Loopback",
				power_save: "Modo de ahorro de energía",
				client_name: "Nombre del cliente",
				client_name_placeholder: "predeterminado del firmware",
				tooltip_client_name:
					"Nombre para distinguir los clientes. Se guarda en el dispositivo al desplegar. Déjalo vacío para mantener el nombre del firmware. Solo ASCII, máx. 16 caracteres.",
				deploy_toast_name_unsupported:
					"El nombre del cliente requiere firmware 0.19+ (el dispositivo indicó {{version}}).",
				inspector_info:
					"El Inspector te permite seleccionar dispositivos MIDI y sincronizar la configuración. Porque quién sabe lo que uno hizo hace meses.",
				inspector_sync: "sincronizar",
				inspector_input_to_midi: "PIN de entrada a MIDI",
				inspector_midi_to_output: "MIDI a PIN de salida",
				inspector_esp_now_midi: "ESP-NOW MIDI",
				inspector_global: "Global",
				inspector_no_peers: "No se han añadido direcciones MIDI inalámbricas",
				inspector_firmware: "Firmware",
				inspector_mac_address: "Dirección MAC",
				inspector_protocol_version: "Versión del protocolo",
				inspector_raw_stream: "Valores en vivo",
				inspector_raw_stream_toggle: "Transmitir valores brutos de entrada",
				inspector_raw_stream_hint:
					"Lecturas en vivo de todos los PIN de entrada configurados (firmware 0.19+, solo USB). Para ajustar un pad táctil: tócalo, lee el % y ajusta el umbral a aproximadamente la mitad de lo que alcanza un toque ligero.",
				inspector_raw_stream_error:
					"Transmisión de valores brutos no disponible ({{error}}). Requiere firmware 0.19+, PIN de entrada configurados y conexión USB.",
				configurator_raw_stream_not_deployed:
					"Los valores en vivo solo se muestran después de desplegar este PIN.",
				cc_or_note: "CC / Nota",
				live: "En vivo",
				pwm_min: "PWM mín",
				pwm_max: "PWM máx",
				live_after_deploy: "tras desplegar",
				configurator_raw_stream_broadcast:
					"Selecciona un dispositivo (no broadcast) para transmitir valores en vivo.",
				inspector_raw_stream_waiting: "Esperando valores…",
				raw: "Bruto",
				baseline: "Referencia",
				peak: "Pico",
				percent: "Cambio",
				normalized: "Normalizado",
				touched: "tocado",
			},
		},
		zh: {
			translation: {
				compat_inspection_unsupported:
					"从设备读取配置需要固件 0.13 或更新版本。仍可编辑、保存和部署引脚与对等设备配置。",
				compat_globals_skipped:
					"已发送引脚与对等设备配置。此固件不支持 MIDI 回环或省电设置，已跳过这些设置。",

				compat_name_skipped: "无法确认固件支持，未应用客户端名称。",
				compat_select_device:
					"请选择一个已连接的设备以检查固件并查看实时数值。",
				compat_checking: "正在检查固件支持…",
				compat_timeout:
					"设备未报告固件版本。新功能暂不可用，普通 MIDI 仍可使用。",
				compat_dongle_unsupported:
					"此 Dongle 不响应配置请求。请将 Dongle 固件更新到 0.19 或更高版本。",
				compat_incompatible:
					"不支持此固件协议。检查和配置不可用，普通 MIDI 仍可使用。",
				compat_unpaired:
					"无法唯一匹配此设备的 MIDI 输入。如多个板名称相同，请仅连接要检查的板。",
				compat_live_unsupported:
					"实时数值需要固件 0.19 或更新版本。基本配置仍可使用。",
				compat_retry: "重试",
				compat_syncing: "正在读取设备配置…",
				compat_sync_failed:
					"无法完整读取配置。显示的数值可能不完整。请检查连接并重新同步。",
				compat_unavailable: "不可用",
				compat_stream_timeout:
					"设备未确认实时传输。传输已停止，请检查固件支持和 USB 连接。",
				compat_stream_no_readings:
					"未收到最新输入读数。传输已停止，请检查连接和设备上的输入引脚配置。",
				compat_stream_unknown_command:
					"此固件不支持实时传输。检查和普通 MIDI 仍可使用。",
				compat_stream_connection: "无法连接设备。传输已停止。",
				compat_stream_pin_not_found: "设备上未配置匹配的输入引脚。传输已停止。",
				compat_threshold_review:
					"部署前请检查触摸阈值。0.19 之前的固件使用原始读数，0.19 及更新版本使用百分比。这些值的单位不同或未知。请选择设备，明确按其单位保留数值，或加载其配置。",
				compat_use_raw: "按原始阈值保留数值",
				compat_use_percent: "按百分比保留数值",
				compat_touch_raw:
					"旧版触摸输入：非零阈值为传感器原始读数，而非百分比。0 = 连续值。",
				compat_touch_unknown:
					"触摸阈值单位取决于固件。部署前请选择设备以检查版本。",
				compat_deploy_failed: "部署失败。重试前请检查设备连接。",

				console: "控制台",
				home_create_midi_devices_easily: "轻松创建 MIDI 设备",
				home_no_coding_required: "无需编程。",
				home_or_getting_started_guide: "或查看入门指南",
				home_caption:
					"厌倦了一遍又一遍地编写相同的代码？使用直观的无代码配置器将 MIDI 消息分配给引脚，反之亦然，并轻松设置无线 MIDI 连接。",
				home_reliable_wireless_midi: "可靠的无线 MIDI",
				home_without_bluetooth: "无需蓝牙。",
				home_fully_bidirectional: "完全双向",
				home_fully_bidirectional_description:
					"既可作为 MIDI 输入设备，也可作为 MIDI 输出设备。将你的 ESP32 配置为独立的 MIDI 控制器，或作为可通过 MIDI 控制的乐器或声音装置。",
				home_midi_controller_or_instrument: "MIDI 控制器或乐器",
				home_dont_trust_bluetooth_midi: "不信任蓝牙 MIDI？",
				home_kit: "套件形式提供",
				home_dongles_and_client_boards: "适配器和客户端板",
				home_kit_description:
					"使用我们定制的硬件套件快速上手，包括小巧的无线 MIDI 适配器和多功能客户端板——轻松构建你自己的 MIDI 设备所需的一切。",
				kits_title: "套件与电路板",
				kits_intro:
					"enomik 3000 与 Grantler Instruments 套件配合最佳：无线 MIDI 适配器和客户端板，已引出触摸板、NeoPixel 和 I2C 接口。",
				kits_any_esp32:
					"不过你并不需要我们的硬件。任何基于 ESP32-S2 或 ESP32-S3 的开发板都可以：用固件上传工具烧录适配器和客户端固件，然后在浏览器中配置引脚。",
				kits_io_title: "输入和输出类型",
				kits_io_intro:
					"客户端的每个引脚都可以配置为发送 MIDI 的输入，或响应传入 MIDI 的输出。",
				kits_inputs: "输入",
				kits_outputs: "输出",
				kits_type_i2c_desc:
					"双线总线（SDA、SCL），用于 VL53L0X 距离传感器等传感器。请使用 I2C 客户端固件。",
				kits_type_neopixel_desc:
					"可寻址 RGB LED（WS2812）。我们的电路板将数据引脚电平提升到 5V，使 LED 灯带稳定工作。请使用 NeoPixel 客户端固件。",
				kits_boards_title: "我们的电路板",
				kits_board_client_desc:
					"适用于 LOLIN S2 mini 的客户端板：8 个电容触摸输入、2 个数字和 2 个模拟输入、5V NeoPixel 输出、两个 I2C Grove 接口以及带更多 GPIO 的 IDC16 接口。将鼠标悬停在引脚上查看详情。",
				kits_board_diagram: "{{name}} 引脚图",
				kits_pin_touch: "电容触摸",
				kits_pin_neopixel: "NeoPixel（5V）",
				kits_pin_digital: "数字",
				kits_pin_analog: "模拟",
				kits_pin_i2c_sda: "I2C SDA",
				kits_pin_i2c_scl: "I2C SCL",
				kits_pin_power_5v: "5V",
				kits_pin_power_3v3: "3.3V",
				kits_pin_gnd: "GND",
				kits_pin_nc: "未连接",
				kits_group_digital: "数字 I/O",
				kits_group_analog: "模拟输入 / 数字 I/O",
				home_esp_now_midi:
					"前来救场！它提供快速、稳定、低延迟的无线 MIDI，非常适合现场演出、乐器和嵌入式系统。",
				home_utilities: "配备实用工具",
				home_utilities_description: "MIDI 监视器和固件上传器",
				home_utilities_description_includes: "该应用内置了",
				home_utilities_description_includes_continues:
					"用于实时消息跟踪，以及一个",
				home_utilities_description_includes_end: "可轻松刷写你的 ESP32 设备。",
				home_pwa_title: "在浏览器中运行",
				home_pwa_description:
					"无需桌面应用。直接在浏览器中配置设备、监视 MIDI 并刷写固件。可安装为 Progressive Web App，方便从程序坞或主屏幕快速打开。",
				getting_started_github_link_example: "GitHub 上的示例",
				getting_started_upload_dongle_title: "将固件上传到适配器板",
				getting_started_upload_dongle_description:
					"你可以从 ESP-NOW MIDI Arduino 库上传 example/dongle，或使用本应用中的固件上传器工具来刷写预编译的适配器固件。",
				getting_started_upload_dongle_description_extra:
					"如果你不需要无线 MIDI 连接，只想将客户端板用作有线 MIDI 设备，可跳过此步骤。",
				getting_started_upload_client_title: "将固件上传到客户端板",
				getting_started_upload_client_description:
					"现在，让我们对客户端板重复此过程。你可以从 ESP-NOW MIDI Arduino 库上传 example/client，或使用本应用中的固件上传器工具来刷写预编译的客户端固件。",
				getting_started_configuration_title: "配置",
				getting_started_configuration_description:
					"有趣的部分！使用配置器将 MIDI 消息映射到引脚，反之亦然，并在你的设备之间设置无线 MIDI 连接。",
				getting_started_debugging_title: "调试",
				getting_started_debugging_description:
					"当出现意外情况时，使用本应用中的 MIDI 监视器工具查看传入和传出的 MIDI 消息以进行调试。",
				launch_configurator: "启动配置器",
				firmware_uploader: "固件上传器",
				midi_monitor: "MIDI 监视器",
				connect: "连接",
				disconnect: "断开连接",
				clear: "清除",
				made_with_love: "用 ♡️ 制作 由",
				tooltip_pin_to_midi: "配置微控制器上的输入引脚如何映射到 MIDI 消息。",
				tooltip_midi_to_pin: "根据 MIDI 消息设置引脚值",
				tooltip_wireless_midi: "设置与其他设备的 ESP-NOW MIDI 连接",
				tooltip_global: "适用于整个开发板的设备级设置",
				tooltip_midi_loopback:
					"启用后，传出的通道和实时 MIDI 会在本地软通到接收处理程序。SysEx 不会被回环。",
				tooltip_power_save:
					"启用后会降低功耗（调制解调器休眠和更低发射功率），但会增加延迟。默认关闭以获得更低延迟。",
				tooltip_save_configuration_to_file: "将当前配置保存到文件",
				tooltip_load_configuration_from_file: "从文件加载配置",
				tooltip_clear_configuration: "清除当前配置",
				tooltip_load_configuration_from_device: "从设备加载配置",
				tooltip_pin_modes: "引脚模式和电路板引脚图",
				tooltip_midi_monitor: "查看传入和传出的 MIDI 消息以进行调试",
				tooltip_tools: "更多页面：测试开发板，或演奏 Grantulator 合成器",
				tooltip_serial_monitor: "查看已连接微控制器的串行输出以进行调试",
				tooltip_midi_composer: "编写并向已连接设备发送自定义 MIDI 消息",
				configurator_info:
					"为了配置你的 enomik 客户端设备，你需要先将相应的固件刷写到它们上面。你可以使用便捷的固件上传器工具将预编译的固件上传到基于 ESP32 的客户端板。",
				state_on: "开",
				state_off: "关",
				deploy_toast_summary_reset_ok:
					"设备重置已确认。已发送 {{pinConfigs}} 个引脚配置、{{peerCount}} 个无线 MIDI 地址、MIDI 回环 {{midiLoopback}} 和安全省电模式 {{powerSave}}。",
				deploy_toast_summary_reset_timeout:
					"未收到重置确认（超时）。已发送 {{pinConfigs}} 个引脚配置、{{peerCount}} 个无线 MIDI 地址、MIDI 回环 {{midiLoopback}} 和安全省电模式 {{powerSave}}。如果此错误持续存在，请将客户端固件更新到最新版本。",
				deploy_toast_globals_unsupported:
					"全局设置需要固件 0.14+（设备报告为 {{version}}）。",
				load_from_device_toast_ok:
					"已从设备加载 {{pinConfigs}} 个引脚配置、{{peerCount}} 个无线 MIDI 地址、MIDI 回环 {{midiLoopback}} 和安全省电模式 {{powerSave}}。",
				load_from_file_kind_mismatch:
					"这是 {{file}} 配置，但当前选择的是 {{selected}}。请切换到 {{file}} 后再导入。",
				port_switched: "MIDI 端口已切换到 {{port}}。",
				port_kind_not_found: "未找到 {{kind}} 端口，保留 {{port}}。",
				port_kind_not_found_none:
					"未找到 {{kind}} 端口。请连接一个或选择端口。",
				open_tester: "开发板测试",
				open_grantulator: "Grantulator",
				device_kind: "设备类型",
				device_kind_client: "客户端",
				device_kind_dongle: "Dongle",
				tooltip_device_kind:
					"客户端或 Dongle。根据端口名称推测，如有误请更改。",
				deploy_toast_dongle_summary: "已发送 {{peerCount}} 个无线 MIDI 地址。",
				deploy_toast_dongle_summary_reset_ok:
					"设备重置已确认。已发送 {{peerCount}} 个无线 MIDI 地址。",
				deploy_toast_dongle_summary_reset_timeout:
					"未收到重置确认（超时）。已发送 {{peerCount}} 个无线 MIDI 地址。如果此错误持续存在，请将 Dongle 固件更新到最新版本。",
				load_from_device_toast_dongle_ok:
					"已从设备加载 {{peerCount}} 个无线 MIDI 地址。",
				load_from_device_toast_timeout:
					"无法从设备加载配置（超时或无响应）。请选择设备并确保固件支持 GET_CONFIG。",
				load_from_device_toast_no_device:
					"从设备加载配置前请先选择 MIDI 设备。",
				firmwareuploader_intro:
					"这是一项实验性功能，在 Chrome 浏览器中效果最佳。如遇到任何问题，请向我们报告。",
				firmwareuploader_releases_link:
					"找不到你的固件，或需要特定版本？你可以从我们的",
				firmwareuploader_custom_bin: "或上传自定义 .bin 文件",
				firmwareuploader_bootloader_mode:
					"某些开发板（如 LOLIN S2 Mini）必须通过按住 BOOT 并按下 RESET 手动进入引导加载程序模式。这是刷写所必需的，与任何软件设置无关。",
				firmwareuploader_bootloader_mode_instruction:
					"将设备置于手动引导加载程序模式：按住 BOOT 并按下 RESET。",
				firmwareuploader_bootloader_mode_confirmation:
					"我已将设备置于引导加载程序模式",
				browser_warning:
					"此应用在 Chrome 或基于 Chromium 的浏览器中效果最佳。某些功能（例如串行、固件上传器）在你的浏览器中可能不可用。",
				browser_warning_unsupported_title: "不支持的浏览器",
				browser_warning_unsupported:
					"你的浏览器不支持 Web Serial API，而连接设备和上传固件需要该 API。强烈建议使用 Chrome 以获得最佳体验。",
				browser_warning_brave_title: "检测到 Brave 浏览器",
				browser_warning_brave:
					"Brave 的隐私护盾可能会阻止 Web Serial 和 Web MIDI API。如果遇到连接问题，请尝试为此页面禁用护盾。强烈建议使用 Chrome 以获得最佳体验。",
				browser_warning_chromium_title: "浏览器兼容性",
				browser_warning_chromium:
					"大多数功能应该可以在你的浏览器中正常工作，但强烈建议使用 Chrome 以获得最佳体验。",
				browser_warning_unknown_title: "未知浏览器",
				browser_warning_unknown:
					"无法识别你的浏览器。此应用需要 Web Serial API 支持。强烈建议使用 Chrome 以获得最佳体验。",
				browser_warning_dismiss: "关闭",
				install_app: "安装应用",
				uninstall_app: "卸载应用",
				uninstall_app_copied:
					"无法从此处打开应用管理页。已复制 {{url}}，请粘贴到地址栏以管理已安装应用。",
				uninstall_app_open_failed:
					"无法从此处打开应用管理页。请在地址栏打开 {{url}} 以管理已安装应用。",
				settings: "设置",
				show_hints: "显示提示",
				language: "语言",
				dark_theme: "深色主题",
				close: "关闭",
				configurator: "配置器",
				debugger: "调试器",
				inspector: "检查器",
				main_navigation: "主导航",
				getting_started: "入门指南",
				deploy: "部署",
				init_midi: "初始化 MIDI",
				midi_output: "MIDI 输出",
				filter: "筛选",
				filters_active: "（{{count}} 个生效）",
				history: "历史记录",
				direction: "方向",
				timestamp: "时间戳",
				device: "设备",
				channel: "通道",
				type: "类型",
				note_cc_prg: "音符/CC/PRG",
				vel_value: "力度/值",
				data: "数据",
				inputs: "输入",
				outputs: "输出",
				channels: "通道",
				types: "类型",
				all: "全部",
				none: "无",
				console_placeholder: "输入消息……",
				console_no_data: "暂无数据……",
				all_rights_reserved: "。保留所有权利。",
				not_found: "404 - 页面未找到",
				duplicate: "复制",
				delete: "删除",
				confirmed: "已确认",
				connected: "已连接",
				flashing: "刷写中",
				connect_and_flash: "连接并刷写",
				flashing_progress: "刷写中……",
				pin: "引脚",
				mode: "模式",
				threshold: "阈值",
				midi_type: "MIDI 类型",
				controller: "控制器",
				note: "音符",
				min: "最小值",
				max: "最大值",
				deploy_toast_duplicate_pins:
					"未部署：引脚 {{pins}} 被多次使用。每个引脚只能有一个配置。",
				pin_conflict: "引脚 {{pin}} 被多次使用",
				pin_mode_analog_desc: "读取连续值（例如来自电位器或传感器）。",
				pin_mode_digital_in_desc:
					"数字输入。读取 LOW/HIGH，与开关或按钮配合使用（需外接电阻）。",
				pin_mode_digital_in_pullup_desc:
					"带内部上拉的数字输入。用于接地的按钮；空闲时为 HIGH，按下时为 LOW。",
				pin_mode_touch_desc:
					"电容式触摸输入。阈值为相对未触摸读数的变化百分比（1–127）：达到阈值时发送 max，低于其 ¾ 时发送 min。0 = 连续值。可在检查器的实时数值中调整。",
				pin_mode_digital_out_desc:
					"数字输出。为 LED、继电器或其他数字负载提供 LOW/HIGH。",
				pin_mode_pwm_desc: "PWM 输出。用于调暗 LED 或以类模拟值控制电机速度。",
				pitch_bend_precision_info:
					"最小/最大值以 7 位值传输，你可能会损失精度。底层配置 API 还需要一些调整。实际的弯音值以 14 位值发送，无需担心。",
				composer_start_byte: "起始字节",
				composer_manufacturer_id: "厂商 ID (*)",
				composer_data_hex: "数据（十六进制）",
				composer_end_byte: "结束字节",
				composer_program: "程序",
				composer_velocity: "力度",
				composer_value: "值",
				composer_pitch_bend: "弯音 (-8192 至 +8191)",
				composer_send_midi: "发送 MIDI",
				firmwareuploader_issue_tracker: "GitHub 问题追踪器",
				firmwareuploader_step1: "步骤 1 — 选择版本",
				firmwareuploader_step2: "步骤 2 — 选择开发板",
				firmwareuploader_step3: "步骤 3 — 选择固件",
				firmwareuploader_step4: "步骤 4 — 引导加载程序模式",
				firmwareuploader_step5: "步骤 5 — 刷写固件",
				firmwareuploader_releases_page: "GitHub 发布页面",
				firmwareuploader_manual_bootloader_required:
					"需要手动引导加载程序（按住 BOOT + RESET）",
				firmwareuploader_load_failed: "加载固件失败。",
				firmwareuploader_flash_success: "固件烧录成功。开发板已复位。",
				firmwareuploader_flash_success_reset_manual:
					"固件烧录成功。请按下开发板上的 RESET 以启动。",
				firmwareuploader_select_board: "开发板",
				firmwareuploader_select_version: "版本",
				firmwareuploader_version_latest: "{{version}}（最新）",
				firmwareuploader_clear_nvs: "清除 NVS（重置已保存的设置）",
				firmwareuploader_clear_nvs_help:
					"擦除已保存的设置（例如对端配置）。普通更新请保持未勾选。适用于标准 Arduino ESP32 固件 / 本上传器的预设。",
				debugger_init_prompt: "要使用 MIDI 功能，请先初始化 MIDI 系统。",
				section_global: "全局",
				section_input_pin_to_midi: "输入引脚到 MIDI 映射",
				section_midi_to_output_pin: "MIDI 到输出引脚映射",
				section_wireless_midi: "无线 MIDI 配置",
				section_midi_composer: "MIDI 编辑器",
				section_midi_monitor: "MIDI 监视器",
				section_serial_monitor: "串行监视器",
				section_tools: "工具",
				midi_loopback: "MIDI 回环",
				power_save: "安全省电模式",
				client_name: "客户端名称",
				client_name_placeholder: "固件默认",
				tooltip_client_name:
					"用于区分客户端的名称。部署时保存到设备上。留空则保留固件设置的名称。仅限 ASCII 字符，最多 16 个。",
				deploy_toast_name_unsupported:
					"客户端名称需要固件 0.19+（设备报告 {{version}}）。",
				inspector_info:
					"检查器允许你选择 MIDI 设备并同步设置。因为谁还记得几个月前做了什么呢。",
				inspector_sync: "同步",
				inspector_input_to_midi: "输入引脚到 MIDI",
				inspector_midi_to_output: "MIDI 到输出引脚",
				inspector_esp_now_midi: "ESP-NOW MIDI",
				inspector_global: "全局",
				inspector_no_peers: "未添加无线 MIDI 地址",
				inspector_firmware: "固件",
				inspector_mac_address: "MAC 地址",
				inspector_protocol_version: "协议版本",
				inspector_raw_stream: "实时数值",
				inspector_raw_stream_toggle: "传输输入原始值",
				inspector_raw_stream_hint:
					"所有已配置输入引脚的实时读数（固件 0.19+，仅限 USB）。调整触摸板：触摸它，读取百分比，并将阈值设置为轻触所达到值的一半左右。",
				inspector_raw_stream_error:
					"原始值传输不可用（{{error}}）。需要固件 0.19+、已配置的输入引脚和 USB 连接。",
				configurator_raw_stream_not_deployed:
					"仅在部署此引脚后才会显示实时数值。",
				cc_or_note: "CC / 音符",
				live: "实时",
				pwm_min: "PWM 最小",
				pwm_max: "PWM 最大",
				live_after_deploy: "部署后",
				configurator_raw_stream_broadcast:
					"选择一个设备（非广播）以传输实时数值。",
				inspector_raw_stream_waiting: "等待数值…",
				raw: "原始值",
				baseline: "基准值",
				peak: "峰值",
				percent: "变化",
				normalized: "归一化",
				touched: "已触摸",
			},
		},
	},
	lng: getStoredLanguage() || "en",
	fallbackLng: "en",

	interpolation: {
		escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
	},
});

i18n.on("languageChanged", (lng) => {
	try {
		localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
	} catch {
		// ignore persistence errors (e.g. storage disabled)
	}
	if (typeof document !== "undefined") {
		document.documentElement.lang = lng;
	}
});

if (typeof document !== "undefined") {
	document.documentElement.lang = i18n.language;
}

export default i18n;
