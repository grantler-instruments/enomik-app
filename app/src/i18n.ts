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
				tooltip_save_configuration_to_file:
					"Save current configuration to a file",
				tooltip_load_configuration_from_file: "Load configuration from a file",
				tooltip_clear_configuration: "Clear current configuration",
				tooltip_load_configuration_from_device:
					"Load configuration from a device",
				tooltip_midi_monitor:
					"View incoming and outgoing MIDI messages for debugging purposes",
				tooltip_serial_monitor:
					"View serial output from the connected microcontroller for debugging purposes",
				tooltip_midi_composer:
					"Compose and send custom MIDI messages to connected devices",
				configurator_info:
					"In order to configure your enomik client devices, you need to flash the appropriate firmware onto them first. You can use the handy Firmware Uploader utility to upload the precompiled firmware to your ESP32-based client boards.",
				deploy_toast_summary:
					"Sent {{pinConfigs}} pin configs and {{peerCount}} wireless MIDI addresses.",
				deploy_toast_summary_reset_ok:
					"Device reset confirmed. Sent {{pinConfigs}} pin configs and {{peerCount}} wireless MIDI addresses.",
				deploy_toast_summary_reset_timeout:
					"Reset confirmation not received (timed out). Sent {{pinConfigs}} pin configs and {{peerCount}} wireless MIDI addresses. If this error persists, please update the client firmware to the latest version.",
				load_from_device_toast_ok:
					"Loaded {{pinConfigs}} pin configs and {{peerCount}} wireless MIDI addresses from device.",
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
				getting_started: "Getting Started",
				deploy: "Deploy",
				init_midi: "Init MIDI",
				midi_output: "MIDI Output",
				all_outputs: "All outputs",
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
				work_in_progress: "WORK IN PROGRESS",
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
				pin_conflict: "Pin {{pin}} is used as both an input and an output",
				pin_mode_analog_desc:
					"Read a continuous value (e.g. from a potentiometer or sensor).",
				pin_mode_digital_in_desc:
					"Digital input. Reads LOW/HIGH, use with switches or buttons (with external resistors).",
				pin_mode_digital_in_pullup_desc:
					"Digital input with internal pull-up. Use for buttons wired to ground; idle HIGH, pressed = LOW.",
				pin_mode_touch_desc:
					"Capacitive touch input. Use Threshold to tune touch sensitivity.",
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
				debugger_init_prompt:
					"To use the MIDI features, please initialize the MIDI system.",
				section_input_pin_to_midi: "Input Pin to MIDI Mapping",
				section_midi_to_output_pin: "MIDI to Output Pin Mapping",
				section_wireless_midi: "Wireless MIDI Configuration",
				section_midi_composer: "MIDI Composer",
				section_midi_monitor: "MIDI Monitor",
				section_serial_monitor: "Serial Monitor",
				inspector_info:
					"The Inspector allows you to select MIDI devices and synchronize settings. Because who knows what one did months ago.",
				inspector_sync: "sync",
				inspector_input_to_midi: "Input PIN to MIDI",
				inspector_midi_to_output: "MIDI to Output PIN",
				inspector_esp_now_midi: "ESP-NOW MIDI",
			},
		},
		de: {
			translation: {
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
				tooltip_save_configuration_to_file:
					"Aktuelle Konfiguration in einer Datei speichern",
				tooltip_load_configuration_from_file:
					"Konfiguration aus einer Datei laden",
				tooltip_clear_configuration: "Aktuelle Konfiguration löschen",
				tooltip_load_configuration_from_device:
					"Konfiguration von einem Gerät laden",
				tooltip_midi_monitor:
					"Eingehende und ausgehende MIDI-Nachrichten zu Debugging-Zwecken anzeigen",
				tooltip_serial_monitor:
					"Serielle Ausgabe des verbundenen Mikrocontrollers zu Debugging-Zwecken anzeigen",
				tooltip_midi_composer:
					"Erstelle und sende benutzerdefinierte MIDI-Nachrichten an verbundene Geräte",
				configurator_info:
					"Um deine enomik-Clientgeräte zu konfigurieren, musst du zuerst die entsprechende Firmware auf ihnen flashen. Du kannst das praktische Firmware-Uploader-Dienstprogramm verwenden, um die vorcompilierte Firmware auf deine ESP32-basierten Client-Boards hochzuladen.",
				deploy_toast_summary:
					"{{pinConfigs}} Pin-Konfigurationen und {{peerCount}} drahtlose MIDI-Adressen gesendet.",
				deploy_toast_summary_reset_ok:
					"Geräte-Reset bestätigt. {{pinConfigs}} Pin-Konfigurationen und {{peerCount}} drahtlose MIDI-Adressen gesendet.",
				deploy_toast_summary_reset_timeout:
					"Keine Reset-Bestätigung (Zeitüberschreitung). {{pinConfigs}} Pin-Konfigurationen und {{peerCount}} drahtlose MIDI-Adressen gesendet. Wenn dieser Fehler weiterhin auftritt, aktualisiere bitte die Client-Firmware auf die neueste Version.",
				load_from_device_toast_ok:
					"{{pinConfigs}} Pin-Konfigurationen und {{peerCount}} drahtlose MIDI-Adressen vom Gerät geladen.",
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
				getting_started: "Erste Schritte",
				deploy: "Bereitstellen",
				init_midi: "MIDI initialisieren",
				midi_output: "MIDI-Ausgang",
				all_outputs: "Alle Ausgänge",
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
				work_in_progress: "IN ARBEIT",
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
				pin_conflict:
					"Pin {{pin}} wird sowohl als Eingang als auch als Ausgang verwendet",
				pin_mode_analog_desc:
					"Liest einen kontinuierlichen Wert (z. B. von einem Potentiometer oder Sensor).",
				pin_mode_digital_in_desc:
					"Digitaler Eingang. Liest LOW/HIGH, für Schalter oder Taster (mit externen Widerständen).",
				pin_mode_digital_in_pullup_desc:
					"Digitaler Eingang mit internem Pull-up. Für Taster gegen Masse; im Ruhezustand HIGH, gedrückt = LOW.",
				pin_mode_touch_desc:
					"Kapazitiver Touch-Eingang. Verwende den Schwellenwert, um die Berührungsempfindlichkeit einzustellen.",
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
				debugger_init_prompt:
					"Um die MIDI-Funktionen zu nutzen, initialisiere bitte das MIDI-System.",
				section_input_pin_to_midi: "Eingangs-Pin-zu-MIDI-Zuordnung",
				section_midi_to_output_pin: "MIDI-zu-Ausgangs-Pin-Zuordnung",
				section_wireless_midi: "Drahtlose MIDI-Konfiguration",
				section_midi_composer: "MIDI-Composer",
				section_midi_monitor: "MIDI-Monitor",
				section_serial_monitor: "Serieller Monitor",
				inspector_info:
					"Der Inspector ermöglicht es dir, MIDI-Geräte auszuwählen und Einstellungen zu synchronisieren. Denn wer weiß schon, was man vor Monaten gemacht hat.",
				inspector_sync: "Synchronisieren",
				inspector_input_to_midi: "Eingangs-PIN zu MIDI",
				inspector_midi_to_output: "MIDI zu Ausgangs-PIN",
				inspector_esp_now_midi: "ESP-NOW MIDI",
			},
		},
		es: {
			translation: {
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
				tooltip_save_configuration_to_file:
					"Guardar la configuración actual en un archivo",
				tooltip_load_configuration_from_file:
					"Cargar configuración desde un archivo",
				tooltip_clear_configuration: "Limpiar la configuración actual",
				tooltip_load_configuration_from_device:
					"Cargar configuración desde un dispositivo",
				tooltip_midi_monitor:
					"Ver mensajes MIDI entrantes y salientes para fines de depuración",
				tooltip_serial_monitor:
					"Ver la salida serial del microcontrolador conectado para fines de depuración",
				tooltip_midi_composer:
					"Componer y enviar mensajes MIDI personalizados a dispositivos conectados",
				configurator_info:
					"Para configurar tus dispositivos cliente enomik, primero debes flashear el firmware apropiado en ellos. Puedes usar la práctica utilidad Firmware Uploader para cargar el firmware precompilado en tus placas cliente basadas en ESP32.",
				deploy_toast_summary:
					"Enviadas {{pinConfigs}} configuraciones de pin y {{peerCount}} direcciones MIDI inalámbricas.",
				deploy_toast_summary_reset_ok:
					"Reinicio del dispositivo confirmado. Enviadas {{pinConfigs}} configuraciones de pin y {{peerCount}} direcciones MIDI inalámbricas.",
				deploy_toast_summary_reset_timeout:
					"No se recibió confirmación de reinicio (tiempo agotado). Enviadas {{pinConfigs}} configuraciones de pin y {{peerCount}} direcciones MIDI inalámbricas. Si este error persiste, actualiza el firmware del cliente a la última versión.",
				load_from_device_toast_ok:
					"Se cargaron {{pinConfigs}} configuraciones de pin y {{peerCount}} direcciones MIDI inalámbricas desde el dispositivo.",
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
				getting_started: "Introducción",
				deploy: "Desplegar",
				init_midi: "Iniciar MIDI",
				midi_output: "Salida MIDI",
				all_outputs: "Todas las salidas",
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
				work_in_progress: "EN CONSTRUCCIÓN",
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
				pin_conflict: "El pin {{pin}} se usa como entrada y como salida",
				pin_mode_analog_desc:
					"Lee un valor continuo (p. ej. de un potenciómetro o sensor).",
				pin_mode_digital_in_desc:
					"Entrada digital. Lee LOW/HIGH, úsalo con interruptores o botones (con resistencias externas).",
				pin_mode_digital_in_pullup_desc:
					"Entrada digital con pull-up interno. Para botones conectados a tierra; en reposo HIGH, presionado = LOW.",
				pin_mode_touch_desc:
					"Entrada táctil capacitiva. Usa el umbral para ajustar la sensibilidad al tacto.",
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
				debugger_init_prompt:
					"Para usar las funciones MIDI, inicializa el sistema MIDI.",
				section_input_pin_to_midi: "Asignación de pin de entrada a MIDI",
				section_midi_to_output_pin: "Asignación de MIDI a pin de salida",
				section_wireless_midi: "Configuración de MIDI inalámbrico",
				section_midi_composer: "Compositor MIDI",
				section_midi_monitor: "Monitor MIDI",
				section_serial_monitor: "Monitor serial",
				inspector_info:
					"El Inspector te permite seleccionar dispositivos MIDI y sincronizar la configuración. Porque quién sabe lo que uno hizo hace meses.",
				inspector_sync: "sincronizar",
				inspector_input_to_midi: "PIN de entrada a MIDI",
				inspector_midi_to_output: "MIDI a PIN de salida",
				inspector_esp_now_midi: "ESP-NOW MIDI",
			},
		},
		zh: {
			translation: {
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
				tooltip_save_configuration_to_file: "将当前配置保存到文件",
				tooltip_load_configuration_from_file: "从文件加载配置",
				tooltip_clear_configuration: "清除当前配置",
				tooltip_load_configuration_from_device: "从设备加载配置",
				tooltip_midi_monitor: "查看传入和传出的 MIDI 消息以进行调试",
				tooltip_serial_monitor: "查看已连接微控制器的串行输出以进行调试",
				tooltip_midi_composer: "编写并向已连接设备发送自定义 MIDI 消息",
				configurator_info:
					"为了配置你的 enomik 客户端设备，你需要先将相应的固件刷写到它们上面。你可以使用便捷的固件上传器工具将预编译的固件上传到基于 ESP32 的客户端板。",
				deploy_toast_summary:
					"已发送 {{pinConfigs}} 个引脚配置和 {{peerCount}} 个无线 MIDI 地址。",
				deploy_toast_summary_reset_ok:
					"设备重置已确认。已发送 {{pinConfigs}} 个引脚配置和 {{peerCount}} 个无线 MIDI 地址。",
				deploy_toast_summary_reset_timeout:
					"未收到重置确认（超时）。已发送 {{pinConfigs}} 个引脚配置和 {{peerCount}} 个无线 MIDI 地址。如果此错误持续存在，请将客户端固件更新到最新版本。",
				load_from_device_toast_ok:
					"已从设备加载 {{pinConfigs}} 个引脚配置和 {{peerCount}} 个无线 MIDI 地址。",
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
				getting_started: "入门指南",
				deploy: "部署",
				init_midi: "初始化 MIDI",
				midi_output: "MIDI 输出",
				all_outputs: "所有输出",
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
				work_in_progress: "正在开发中",
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
				pin_conflict: "引脚 {{pin}} 同时用作输入和输出",
				pin_mode_analog_desc: "读取连续值（例如来自电位器或传感器）。",
				pin_mode_digital_in_desc:
					"数字输入。读取 LOW/HIGH，与开关或按钮配合使用（需外接电阻）。",
				pin_mode_digital_in_pullup_desc:
					"带内部上拉的数字输入。用于接地的按钮；空闲时为 HIGH，按下时为 LOW。",
				pin_mode_touch_desc: "电容式触摸输入。使用阈值来调整触摸灵敏度。",
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
				debugger_init_prompt: "要使用 MIDI 功能，请先初始化 MIDI 系统。",
				section_input_pin_to_midi: "输入引脚到 MIDI 映射",
				section_midi_to_output_pin: "MIDI 到输出引脚映射",
				section_wireless_midi: "无线 MIDI 配置",
				section_midi_composer: "MIDI 编辑器",
				section_midi_monitor: "MIDI 监视器",
				section_serial_monitor: "串行监视器",
				inspector_info:
					"检查器允许你选择 MIDI 设备并同步设置。因为谁还记得几个月前做了什么呢。",
				inspector_sync: "同步",
				inspector_input_to_midi: "输入引脚到 MIDI",
				inspector_midi_to_output: "MIDI 到输出引脚",
				inspector_esp_now_midi: "ESP-NOW MIDI",
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
