// Tutorial texts, spread into each language in i18n.ts.
// Arrays are read with `returnObjects: true` (paragraphs and list items).

const en = {
	tutorial: "Tutorial",
	tutorial_chapters: "Chapters",
	tutorial_chapter_n: "Chapter {{n}}",
	tutorial_wiring: "Wiring",
	tutorial_configuration: "Configuration",
	tutorial_test: "Test",
	tutorial_troubleshooting: "Troubleshooting",
	tutorial_library_docs: "Library documentation",
	tutorial_library_github: "Library on GitHub",

	tutorial_intro_title: "Introduction",
	tutorial_intro_text: [
		"enomik 3000 turns ESP32 boards into wireless MIDI devices. Buttons, knobs, touch pads and sensors become MIDI controllers; LEDs, relays and motors react to MIDI from your DAW.",
		"This tutorial walks you through the whole setup, from flashing the firmware to your first wireless MIDI note. No coding is required, but if you like to code, the same building blocks are available as libraries.",
	],
	tutorial_intro_needs_title: "What you need",
	tutorial_intro_needs: [
		"A dongle board: an ESP32-S2 or ESP32-S3 with native USB, e.g. a LOLIN S2 Mini. It plugs into your computer and shows up as a USB MIDI device.",
		"One or more client boards: ESP32-S2 or ESP32-S3 boards (an enomik 3000 client works out of the box). They carry your buttons, knobs and LEDs.",
		"A USB cable that carries data, not only power.",
		"A Chromium-based browser such as Chrome or Edge. The app uses Web Serial to flash firmware and Web MIDI to configure boards.",
		"Optional for the examples: a push button, a potentiometer, jumper wires and a breadboard.",
	],
	tutorial_intro_steps_title: "The steps at a glance",
	tutorial_intro_steps: [
		"Flash the dongle firmware onto the dongle board.",
		"Flash the client firmware onto each client board.",
		"Map pins to MIDI messages in the Configurator and deploy.",
		"Check the messages in the MIDI Monitor or in your DAW.",
		"Pair the client with the dongle by entering the dongle's MAC address and go wireless.",
	],
	tutorial_intro_wired_note:
		"No wireless needed? A client board also works on its own as a wired USB MIDI device. Then you can skip the dongle and the pairing.",

	tutorial_architecture_title: "Architecture",
	tutorial_architecture_text: [
		"An enomik setup has three parts: a MIDI host, a dongle and one or more clients.",
	],
	tutorial_architecture_host: "MIDI host",
	tutorial_architecture_host_desc:
		"Computer, phone or anything that speaks USB MIDI: DAW, Max, Pure Data, the browser.",
	tutorial_architecture_dongle_desc:
		"Class-compliant USB MIDI device. Bridges USB MIDI to ESP-NOW and back.",
	tutorial_architecture_clients: "Clients",
	tutorial_architecture_client_desc:
		"Read inputs and send MIDI. Receive MIDI and drive outputs.",
	tutorial_architecture_usb: "USB MIDI",
	tutorial_architecture_details: [
		"ESP-NOW is a connectionless protocol by Espressif that runs on the Wi-Fi radio. Boards talk to each other directly, addressed by their MAC address. There is no router, no network to join and no Bluetooth pairing, which keeps latency low.",
		"The dongle forwards everything it receives over USB to its wireless peers, and everything from its peers back to USB. Your DAW only sees one ordinary MIDI device.",
		"The client firmware is generic: it does nothing until you tell it which pins to read and which messages to send. The web app sends this configuration as MIDI SysEx over USB, and the board stores it in its flash memory. It survives reboots, so you configure once and then run the board from a battery or power bank.",
		"Messages flow both ways. A client can be a controller (pin to MIDI), an instrument or actuator (MIDI to pin), or both at the same time.",
	],

	tutorial_platforms_title: "Ways to use enomik",
	tutorial_platforms_text: [
		"All paths share the same open source library, ESP-NOW MIDI, and the same packet format. Pick the one that fits your project, or mix them: a board running your own sketch talks to a dongle flashed from the web app.",
	],
	tutorial_platforms_webapp_title: "Web app (no code)",
	tutorial_platforms_webapp:
		"Flash precompiled firmware with the Firmware Uploader and map pins in the Configurator. Best for getting started, workshops and most controller projects. The rest of this tutorial follows this path.",
	tutorial_platforms_arduino:
		'Install "ESP-NOW MIDI" from the Library Manager (requires the Arduino-ESP32 core 3.3.0 or newer) and open one of its examples. The client example uses enomik::Client, the same code as the precompiled firmware, so your own sketch stays configurable from the web app.',
	tutorial_platforms_arduino_plain:
		"For full control, use the plain esp_now_midi class. Its API is similar to the Arduino MIDI library:",
	tutorial_platforms_arduino_s3:
		"Uploading a dongle sketch to an ESP32-S3? Set Tools → USB Mode to USB-OTG (TinyUSB).",
	tutorial_platforms_platformio:
		"Every Arduino example ships with a platformio.ini. For your own project, add the library and its dependencies to lib_deps. The pioarduino platform is needed because the official espressif32 platform does not support Arduino core 3.x. On ESP32-S3 boards with USB MIDI, also set board_build.usb_mode = tinyusb.",
	tutorial_platforms_circuitpython:
		"Copy esp_now_midi.py from the library onto your board. It uses the same packet format as the C++ library. This port is largely untested, contributions are welcome.",
	tutorial_platforms_idf:
		"Pure ESP-IDF (5.5 or newer), without the Arduino core. Add the repository as a component, e.g. as a git submodule under components/. The examples_idf folder contains client and dongle ports.",

	tutorial_firmware_title: "Uploading firmware",
	tutorial_firmware_text: [
		"The Firmware Uploader flashes precompiled firmware right from the browser, no toolchain needed. Do this once for the dongle and once for every client.",
	],
	tutorial_firmware_steps: [
		"Connect the board via USB and open the Firmware Uploader.",
		"Step 1: select a version. Use the latest unless you have a reason not to.",
		"Step 2: select your board: LOLIN S2 Mini, ESP32-S2 or ESP32-S3.",
		"Step 3: select the firmware. Dongle for the board at your computer (Grantler Dongle if it has a display), Client for boards with sensors and actuators.",
		"Step 4: put ESP32-S2 boards into bootloader mode: hold BOOT, press and release RESET, then release BOOT. ESP32-S3 boards do this automatically.",
		"Step 5: click Connect & Flash, pick the serial port in the browser dialog and wait for the progress bar to finish.",
		"Press RESET if the app asks you to. The board now runs the new firmware.",
	],
	tutorial_firmware_nvs:
		'Leave "Clear NVS" unchecked for normal updates: it erases saved settings such as pins and peers. Check it only for a fresh start.',
	tutorial_firmware_troubleshooting: [
		"No port shows up: try another cable (many carry power only) and another USB port.",
		"Flashing fails on an S2 board: repeat the bootloader sequence. In bootloader mode the board shows up under a different port name.",
		"Something else? Upload a .bin from the GitHub releases page, or open an issue.",
	],

	tutorial_pairing_title: "Example: wireless pairing",
	tutorial_pairing_text: [
		"A client sends to the MAC addresses in its peer list. Add the dongle's address once and the client finds the dongle after every reboot. The dongle learns the client as soon as the client sends its first message.",
	],
	tutorial_pairing_mac_title: "1. Find the dongle's MAC address",
	tutorial_pairing_mac: [
		"Plug in the dongle, open the Inspector, select the dongle and note its MAC address.",
		"Alternatively: dongles with a display show it on screen, or flash the Print MAC firmware and read the address in the serial monitor.",
	],
	tutorial_pairing_peer_title: "2. Add the dongle as peer of the client",
	tutorial_pairing_peer: [
		"Connect the client via USB and open the Configurator.",
		"Click Init MIDI if asked, select the client as MIDI output and set the device type to Client.",
		"Open Wireless MIDI Configuration, add a row and replace the placeholder FF:FF:FF:FF:FF:FF with the dongle's MAC address.",
		"Click Deploy. The configuration is stored on the client.",
	],
	tutorial_pairing_test_title: "3. Go wireless",
	tutorial_pairing_test:
		"Unplug the client and power it from a power bank or battery. Plug in the dongle. Messages from the client now arrive through the dongle's MIDI port.",
	tutorial_pairing_tip:
		"Several clients can share one dongle: repeat step 2 for every client.",

	tutorial_button_title: "Example: button to note",
	tutorial_button_text: [
		"Your first controller: a push button that plays a note.",
	],
	tutorial_button_wiring:
		"The enomik client has two buttons on pins 16 and 17, already wired to GND. On another board, connect a button between GPIO 16 (and 17) and GND. No resistor needed: the internal pull-up keeps the pin high until the button pulls it to ground.",
	tutorial_button_config: [
		"Open the Configurator with the client connected and selected.",
		"In Input Pin to MIDI Mapping, add two rows.",
		"First row: pin 16, mode INPUT_PULLUP (digital), channel 1, MIDI type Note On, note 16, min 0, max 127.",
		"Second row: the same with pin 17 and note 17. On enomik boards the note number matches the pin number.",
		"Click Deploy.",
	],
	tutorial_button_test:
		"Open the MIDI Monitor and select the client. Pressing the button on pin 16 sends note 16 with velocity 127 (max), the one on pin 17 note 17; releasing sends velocity 0 (min), which synths treat as note off.",
	tutorial_button_tip:
		"Want a switch or a sustain pedal? Choose Control Change instead: pressing sends the max value, releasing the min value.",

	tutorial_knob_title: "Example: knob to CC",
	tutorial_knob_text: [
		"A potentiometer gives you a continuous controller, e.g. for a filter cutoff.",
	],
	tutorial_knob_wiring:
		"Connect the outer legs to 3V3 and GND and the middle leg (wiper) to an analog capable pin. Kits & Boards shows which pins read analog values.",
	tutorial_knob_config: [
		"In Input Pin to MIDI Mapping, add a row.",
		"Set the pin, mode ANALOG, channel 1, MIDI type Control Change, controller 1 (modulation wheel), min 0, max 127.",
		"Click Deploy.",
	],
	tutorial_knob_test:
		"Turn the knob and watch the values in the MIDI Monitor, or MIDI-learn the controller in your DAW. Use min and max to narrow the range.",
	tutorial_knob_tip:
		"No potentiometer at hand? Choose INPUT_TOUCH on a touch capable pin and touch a wire or a piece of foil.",

	tutorial_led_title: "Example: MIDI to LED",
	tutorial_led_text: [
		"The other direction: MIDI from your computer switches the onboard LED on pin 15.",
	],
	tutorial_led_wiring:
		"Nothing to wire: the LOLIN S2 Mini has an onboard LED on GPIO 15. No extra parts needed.",
	tutorial_led_config: [
		"In MIDI to Output Pin Mapping, add a row.",
		"Set channel 1, MIDI type Note On, note 16, pin 15, mode OUTPUT (digital).",
		"Click Deploy.",
	],
	tutorial_led_test:
		"Open the MIDI Monitor and use the MIDI Composer to send note 16 on channel 1: the LED lights up, note off switches it off. Playing the note from your DAW works the same way.",
	tutorial_led_tip_pwm:
		"Choose PWM (analog) to dim the LED instead: the velocity or controller value sets the brightness.",
	tutorial_led_tip_loopback:
		"Combine it with the button example and enable MIDI loopback under Global: the button on pin 16 (note 16) now lights the LED directly on the board, no computer involved.",

	tutorial_next_steps_title: "Next steps",
	tutorial_next_steps_text: [
		"You have built your first wireless MIDI device. Where to go from here:",
	],
	tutorial_next_steps_list: [
		"Save your configuration to a file and load it later, or read it back from a board.",
		"Look up pinouts and pin capabilities in Kits & Boards.",
		"Check a freshly soldered board with the Board tester.",
		"Play the Grantulator, a granular synth in the browser, with your enomik boards.",
		"Dive into the library documentation and examples.",
	],
};

const de: typeof en = {
	tutorial: "Tutorial",
	tutorial_chapters: "Kapitel",
	tutorial_chapter_n: "Kapitel {{n}}",
	tutorial_wiring: "Verkabelung",
	tutorial_configuration: "Konfiguration",
	tutorial_test: "Test",
	tutorial_troubleshooting: "Fehlerbehebung",
	tutorial_library_docs: "Dokumentation der Bibliothek",
	tutorial_library_github: "Bibliothek auf GitHub",

	tutorial_intro_title: "Einführung",
	tutorial_intro_text: [
		"enomik 3000 macht aus ESP32-Boards kabellose MIDI-Geräte. Taster, Drehregler, Touch-Flächen und Sensoren werden zu MIDI-Controllern; LEDs, Relais und Motoren reagieren auf MIDI aus deiner DAW.",
		"Dieses Tutorial führt dich durch das ganze Setup, vom Flashen der Firmware bis zur ersten kabellosen MIDI-Note. Programmieren ist nicht nötig, aber wer gerne programmiert, findet dieselben Bausteine als Bibliotheken.",
	],
	tutorial_intro_needs_title: "Was du brauchst",
	tutorial_intro_needs: [
		"Ein Dongle-Board: ein ESP32-S2 oder ESP32-S3 mit nativem USB, z. B. ein LOLIN S2 Mini. Es steckt am Computer und erscheint als USB-MIDI-Gerät.",
		"Ein oder mehrere Client-Boards: ESP32-S2- oder ESP32-S3-Boards (ein enomik 3000 Client funktioniert sofort). Daran hängen deine Taster, Regler und LEDs.",
		"Ein USB-Kabel, das Daten überträgt, nicht nur Strom.",
		"Ein Chromium-basierter Browser wie Chrome oder Edge. Die App nutzt Web Serial zum Flashen und Web MIDI zum Konfigurieren.",
		"Optional für die Beispiele: ein Taster, ein Potentiometer, Jumper-Kabel und ein Steckbrett.",
	],
	tutorial_intro_steps_title: "Die Schritte im Überblick",
	tutorial_intro_steps: [
		"Dongle-Firmware auf das Dongle-Board flashen.",
		"Client-Firmware auf jedes Client-Board flashen.",
		"Im Konfigurator Pins auf MIDI-Nachrichten mappen und bereitstellen.",
		"Die Nachrichten im MIDI-Monitor oder in deiner DAW prüfen.",
		"Client mit dem Dongle koppeln, indem du die MAC-Adresse des Dongles einträgst, und kabellos loslegen.",
	],
	tutorial_intro_wired_note:
		"Kein Funk nötig? Ein Client-Board funktioniert auch allein als kabelgebundenes USB-MIDI-Gerät. Dann kannst du Dongle und Kopplung überspringen.",

	tutorial_architecture_title: "Architektur",
	tutorial_architecture_text: [
		"Ein enomik-Setup besteht aus drei Teilen: einem MIDI-Host, einem Dongle und einem oder mehreren Clients.",
	],
	tutorial_architecture_host: "MIDI-Host",
	tutorial_architecture_host_desc:
		"Computer, Smartphone oder alles, was USB-MIDI spricht: DAW, Max, Pure Data, der Browser.",
	tutorial_architecture_dongle_desc:
		"Class-compliant USB-MIDI-Gerät. Überträgt USB-MIDI auf ESP-NOW und zurück.",
	tutorial_architecture_clients: "Clients",
	tutorial_architecture_client_desc:
		"Lesen Eingänge und senden MIDI. Empfangen MIDI und steuern Ausgänge.",
	tutorial_architecture_usb: "USB-MIDI",
	tutorial_architecture_details: [
		"ESP-NOW ist ein verbindungsloses Protokoll von Espressif, das über das WLAN-Funkmodul läuft. Die Boards sprechen direkt miteinander, adressiert über ihre MAC-Adresse. Kein Router, kein Netzwerk, kein Bluetooth-Pairing, und dadurch geringe Latenz.",
		"Der Dongle leitet alles, was über USB ankommt, an seine Funk-Peers weiter, und alles von den Peers zurück an USB. Deine DAW sieht nur ein gewöhnliches MIDI-Gerät.",
		"Die Client-Firmware ist generisch: Sie tut nichts, bis du ihr sagst, welche Pins sie lesen und welche Nachrichten sie senden soll. Die Web-App schickt diese Konfiguration als MIDI-SysEx über USB, und das Board speichert sie im Flash. Sie übersteht Neustarts, du konfigurierst also einmal und betreibst das Board danach mit Akku oder Powerbank.",
		"Nachrichten fließen in beide Richtungen. Ein Client kann Controller sein (Pin zu MIDI), Instrument oder Aktor (MIDI zu Pin), oder beides gleichzeitig.",
	],

	tutorial_platforms_title: "Wege, enomik zu nutzen",
	tutorial_platforms_text: [
		"Alle Wege nutzen dieselbe Open-Source-Bibliothek, ESP-NOW MIDI, und dasselbe Paketformat. Wähle, was zu deinem Projekt passt, oder kombiniere: Ein Board mit eigenem Sketch spricht mit einem Dongle, der über die Web-App geflasht wurde.",
	],
	tutorial_platforms_webapp_title: "Web-App (ohne Code)",
	tutorial_platforms_webapp:
		"Vorkompilierte Firmware mit dem Firmware Uploader flashen und Pins im Konfigurator mappen. Ideal für den Einstieg, Workshops und die meisten Controller-Projekte. Der Rest dieses Tutorials folgt diesem Weg.",
	tutorial_platforms_arduino:
		'Installiere "ESP-NOW MIDI" über den Bibliotheksverwalter (benötigt den Arduino-ESP32-Core 3.3.0 oder neuer) und öffne eines der Beispiele. Das Client-Beispiel nutzt enomik::Client, denselben Code wie die vorkompilierte Firmware, dein eigener Sketch bleibt also über die Web-App konfigurierbar.',
	tutorial_platforms_arduino_plain:
		"Für volle Kontrolle nutze die Klasse esp_now_midi direkt. Ihre API ähnelt der Arduino MIDI Library:",
	tutorial_platforms_arduino_s3:
		"Dongle-Sketch auf einen ESP32-S3 laden? Stelle Werkzeuge → USB Mode auf USB-OTG (TinyUSB).",
	tutorial_platforms_platformio:
		"Jedes Arduino-Beispiel enthält eine platformio.ini. Für eigene Projekte trägst du die Bibliothek und ihre Abhängigkeiten in lib_deps ein. Die pioarduino-Plattform ist nötig, weil die offizielle espressif32-Plattform den Arduino-Core 3.x nicht unterstützt. Auf ESP32-S3-Boards mit USB-MIDI zusätzlich board_build.usb_mode = tinyusb setzen.",
	tutorial_platforms_circuitpython:
		"Kopiere esp_now_midi.py aus der Bibliothek auf dein Board. Es nutzt dasselbe Paketformat wie die C++-Bibliothek. Dieser Port ist weitgehend ungetestet, Beiträge sind willkommen.",
	tutorial_platforms_idf:
		"Reines ESP-IDF (5.5 oder neuer), ohne Arduino-Core. Binde das Repository als Komponente ein, z. B. als Git-Submodul unter components/. Der Ordner examples_idf enthält Client- und Dongle-Portierungen.",

	tutorial_firmware_title: "Firmware hochladen",
	tutorial_firmware_text: [
		"Der Firmware Uploader flasht vorkompilierte Firmware direkt aus dem Browser, ganz ohne Toolchain. Einmal für den Dongle und einmal für jeden Client.",
	],
	tutorial_firmware_steps: [
		"Board per USB anschließen und den Firmware Uploader öffnen.",
		"Schritt 1: Version wählen. Nimm die neueste, außer du hast einen Grund dagegen.",
		"Schritt 2: Board wählen: LOLIN S2 Mini, ESP32-S2 oder ESP32-S3.",
		"Schritt 3: Firmware wählen. Dongle für das Board am Computer (Grantler Dongle, wenn es ein Display hat), Client für Boards mit Sensoren und Aktoren.",
		"Schritt 4: ESP32-S2-Boards in den Bootloader-Modus bringen: BOOT halten, RESET drücken und loslassen, dann BOOT loslassen. ESP32-S3-Boards machen das automatisch.",
		"Schritt 5: Auf Verbinden & Flashen klicken, im Browser-Dialog den seriellen Port wählen und warten, bis der Fortschrittsbalken voll ist.",
		"RESET drücken, wenn die App dazu auffordert. Das Board läuft jetzt mit der neuen Firmware.",
	],
	tutorial_firmware_nvs:
		'"NVS löschen" bei normalen Updates deaktiviert lassen: Es löscht gespeicherte Einstellungen wie Pins und Peers. Nur für einen Neuanfang aktivieren.',
	tutorial_firmware_troubleshooting: [
		"Kein Port erscheint: anderes Kabel (viele laden nur) und anderen USB-Anschluss probieren.",
		"Flashen schlägt bei einem S2-Board fehl: Bootloader-Sequenz wiederholen. Im Bootloader-Modus erscheint das Board unter einem anderen Portnamen.",
		"Etwas anderes? Lade eine .bin von der GitHub-Releases-Seite hoch oder eröffne ein Issue.",
	],

	tutorial_pairing_title: "Beispiel: kabellos koppeln",
	tutorial_pairing_text: [
		"Ein Client sendet an die MAC-Adressen in seiner Peer-Liste. Trage die Adresse des Dongles einmal ein, und der Client findet den Dongle nach jedem Neustart. Der Dongle lernt den Client kennen, sobald dieser seine erste Nachricht sendet.",
	],
	tutorial_pairing_mac_title: "1. MAC-Adresse des Dongles herausfinden",
	tutorial_pairing_mac: [
		"Dongle einstecken, den Inspector öffnen, den Dongle auswählen und seine MAC-Adresse notieren.",
		"Alternativ: Dongles mit Display zeigen sie an, oder flashe die Print-MAC-Firmware und lies die Adresse im seriellen Monitor.",
	],
	tutorial_pairing_peer_title: "2. Dongle als Peer des Clients eintragen",
	tutorial_pairing_peer: [
		"Client per USB anschließen und den Konfigurator öffnen.",
		"Falls nötig auf MIDI initialisieren klicken, den Client als MIDI-Ausgang wählen und den Gerätetyp auf Client stellen.",
		"Drahtlose MIDI-Konfiguration öffnen, eine Zeile hinzufügen und den Platzhalter FF:FF:FF:FF:FF:FF durch die MAC-Adresse des Dongles ersetzen.",
		"Auf Bereitstellen klicken. Die Konfiguration wird auf dem Client gespeichert.",
	],
	tutorial_pairing_test_title: "3. Kabellos werden",
	tutorial_pairing_test:
		"Client abstecken und mit Powerbank oder Akku versorgen. Dongle einstecken. Nachrichten vom Client kommen jetzt über den MIDI-Port des Dongles an.",
	tutorial_pairing_tip:
		"Mehrere Clients können sich einen Dongle teilen: Schritt 2 für jeden Client wiederholen.",

	tutorial_button_title: "Beispiel: Taster zu Note",
	tutorial_button_text: [
		"Dein erster Controller: ein Taster, der eine Note spielt.",
	],
	tutorial_button_wiring:
		"Der enomik Client hat zwei Taster an Pin 16 und 17, bereits mit GND verbunden. Auf einem anderen Board einen Taster zwischen GPIO 16 (und 17) und GND anschließen. Kein Widerstand nötig: Der interne Pull-up hält den Pin auf HIGH, bis der Taster ihn auf Masse zieht.",
	tutorial_button_config: [
		"Den Konfigurator öffnen, Client angeschlossen und ausgewählt.",
		"Unter Eingangs-Pin-zu-MIDI-Zuordnung zwei Zeilen hinzufügen.",
		"Erste Zeile: Pin 16, Modus INPUT_PULLUP (digital), Kanal 1, MIDI-Typ Note On, Note 16, Min 0, Max 127.",
		"Zweite Zeile: dasselbe mit Pin 17 und Note 17. Auf enomik-Boards entspricht die Notennummer der Pin-Nummer.",
		"Auf Bereitstellen klicken.",
	],
	tutorial_button_test:
		"Den MIDI-Monitor öffnen und den Client wählen. Der Taster an Pin 16 sendet beim Drücken Note 16 mit Velocity 127 (Max), der an Pin 17 Note 17; Loslassen sendet Velocity 0 (Min), was Synths als Note-Off behandeln.",
	tutorial_button_tip:
		"Lieber ein Schalter oder Sustain-Pedal? Wähle stattdessen Control Change: Drücken sendet den Max-Wert, Loslassen den Min-Wert.",

	tutorial_knob_title: "Beispiel: Drehregler zu CC",
	tutorial_knob_text: [
		"Ein Potentiometer ist ein stufenloser Controller, z. B. für die Filterfrequenz.",
	],
	tutorial_knob_wiring:
		"Äußere Beine an 3V3 und GND, das mittlere Bein (Schleifer) an einen analogfähigen Pin. Kits & Boards zeigt, welche Pins analoge Werte lesen.",
	tutorial_knob_config: [
		"Unter Eingangs-Pin-zu-MIDI-Zuordnung eine Zeile hinzufügen.",
		"Pin, Modus ANALOG, Kanal 1, MIDI-Typ Control Change, Controller 1 (Modulationsrad), Min 0, Max 127 einstellen.",
		"Auf Bereitstellen klicken.",
	],
	tutorial_knob_test:
		"Am Regler drehen und die Werte im MIDI-Monitor beobachten, oder den Controller in deiner DAW per MIDI-Learn zuweisen. Mit Min und Max schränkst du den Bereich ein.",
	tutorial_knob_tip:
		"Kein Potentiometer zur Hand? Wähle INPUT_TOUCH auf einem touchfähigen Pin und berühre ein Kabel oder ein Stück Alufolie.",

	tutorial_led_title: "Beispiel: MIDI zu LED",
	tutorial_led_text: [
		"Die andere Richtung: MIDI von deinem Computer schaltet die Onboard-LED an Pin 15.",
	],
	tutorial_led_wiring:
		"Nichts zu verkabeln: Der LOLIN S2 Mini hat eine Onboard-LED an GPIO 15. Keine zusätzlichen Bauteile nötig.",
	tutorial_led_config: [
		"Unter MIDI-zu-Ausgangs-Pin-Zuordnung eine Zeile hinzufügen.",
		"Kanal 1, MIDI-Typ Note On, Note 16, Pin 15, Modus OUTPUT (digital) einstellen.",
		"Auf Bereitstellen klicken.",
	],
	tutorial_led_test:
		"Den MIDI-Monitor öffnen und mit dem MIDI-Composer Note 16 auf Kanal 1 senden: Die LED leuchtet, Note-Off schaltet sie wieder aus. Aus der DAW gespielt funktioniert es genauso.",
	tutorial_led_tip_pwm:
		"Wähle PWM (analog), um die LED zu dimmen: Velocity oder Controller-Wert bestimmen die Helligkeit.",
	tutorial_led_tip_loopback:
		"Kombiniere es mit dem Taster-Beispiel und aktiviere MIDI-Loopback unter Global: Der Taster an Pin 16 (Note 16) schaltet die LED dann direkt auf dem Board, ganz ohne Computer.",

	tutorial_next_steps_title: "Wie geht's weiter",
	tutorial_next_steps_text: [
		"Du hast dein erstes kabelloses MIDI-Gerät gebaut. Wie es weitergehen kann:",
	],
	tutorial_next_steps_list: [
		"Konfiguration in eine Datei speichern und später laden, oder von einem Board zurücklesen.",
		"Pinouts und Pin-Fähigkeiten unter Kits & Boards nachschlagen.",
		"Ein frisch gelötetes Board mit dem Board-Tester prüfen.",
		"Den Grantulator, einen granularen Synth im Browser, mit deinen enomik-Boards spielen.",
		"In die Dokumentation und Beispiele der Bibliothek eintauchen.",
	],
};

const es: typeof en = {
	tutorial: "Tutorial",
	tutorial_chapters: "Capítulos",
	tutorial_chapter_n: "Capítulo {{n}}",
	tutorial_wiring: "Cableado",
	tutorial_configuration: "Configuración",
	tutorial_test: "Prueba",
	tutorial_troubleshooting: "Solución de problemas",
	tutorial_library_docs: "Documentación de la biblioteca",
	tutorial_library_github: "Biblioteca en GitHub",

	tutorial_intro_title: "Introducción",
	tutorial_intro_text: [
		"enomik 3000 convierte placas ESP32 en dispositivos MIDI inalámbricos. Botones, potenciómetros, superficies táctiles y sensores se convierten en controladores MIDI; LEDs, relés y motores reaccionan al MIDI de tu DAW.",
		"Este tutorial te guía por toda la configuración, desde flashear el firmware hasta tu primera nota MIDI inalámbrica. No hace falta programar, pero si te gusta, los mismos componentes están disponibles como bibliotecas.",
	],
	tutorial_intro_needs_title: "Qué necesitas",
	tutorial_intro_needs: [
		"Una placa dongle: un ESP32-S2 o ESP32-S3 con USB nativo, p. ej. una LOLIN S2 Mini. Se conecta al ordenador y aparece como dispositivo USB MIDI.",
		"Una o más placas cliente: placas ESP32-S2 o ESP32-S3 (un cliente enomik 3000 funciona de inmediato). En ellas van tus botones, potenciómetros y LEDs.",
		"Un cable USB que transmita datos, no solo corriente.",
		"Un navegador basado en Chromium, como Chrome o Edge. La app usa Web Serial para flashear y Web MIDI para configurar.",
		"Opcional para los ejemplos: un pulsador, un potenciómetro, cables jumper y una protoboard.",
	],
	tutorial_intro_steps_title: "Los pasos de un vistazo",
	tutorial_intro_steps: [
		"Flashea el firmware de dongle en la placa dongle.",
		"Flashea el firmware de cliente en cada placa cliente.",
		"Asigna pines a mensajes MIDI en el Configurador y despliega.",
		"Comprueba los mensajes en el Monitor MIDI o en tu DAW.",
		"Empareja el cliente con el dongle introduciendo la dirección MAC del dongle y quita los cables.",
	],
	tutorial_intro_wired_note:
		"¿No necesitas inalámbrico? Una placa cliente también funciona sola como dispositivo USB MIDI con cable. Entonces puedes omitir el dongle y el emparejamiento.",

	tutorial_architecture_title: "Arquitectura",
	tutorial_architecture_text: [
		"Un sistema enomik tiene tres partes: un host MIDI, un dongle y uno o más clientes.",
	],
	tutorial_architecture_host: "Host MIDI",
	tutorial_architecture_host_desc:
		"Ordenador, teléfono o cualquier cosa que hable USB MIDI: DAW, Max, Pure Data, el navegador.",
	tutorial_architecture_dongle_desc:
		"Dispositivo USB MIDI class-compliant. Conecta USB MIDI con ESP-NOW y viceversa.",
	tutorial_architecture_clients: "Clientes",
	tutorial_architecture_client_desc:
		"Leen entradas y envían MIDI. Reciben MIDI y controlan salidas.",
	tutorial_architecture_usb: "USB MIDI",
	tutorial_architecture_details: [
		"ESP-NOW es un protocolo sin conexión de Espressif que usa la radio Wi-Fi. Las placas se comunican directamente, direccionadas por su MAC. Sin router, sin red y sin emparejamiento Bluetooth, lo que mantiene la latencia baja.",
		"El dongle reenvía todo lo que recibe por USB a sus peers inalámbricos, y todo lo que viene de ellos de vuelta a USB. Tu DAW solo ve un dispositivo MIDI normal.",
		"El firmware de cliente es genérico: no hace nada hasta que le indicas qué pines leer y qué mensajes enviar. La app web envía esta configuración como SysEx MIDI por USB y la placa la guarda en su memoria flash. Sobrevive a los reinicios: configuras una vez y luego usas la placa con batería o power bank.",
		"Los mensajes van en ambas direcciones. Un cliente puede ser controlador (pin a MIDI), instrumento o actuador (MIDI a pin), o ambos a la vez.",
	],

	tutorial_platforms_title: "Formas de usar enomik",
	tutorial_platforms_text: [
		"Todas las opciones comparten la misma biblioteca de código abierto, ESP-NOW MIDI, y el mismo formato de paquetes. Elige la que encaje con tu proyecto o combínalas: una placa con tu propio sketch habla con un dongle flasheado desde la app web.",
	],
	tutorial_platforms_webapp_title: "App web (sin código)",
	tutorial_platforms_webapp:
		"Flashea firmware precompilado con el Cargador de Firmware y asigna pines en el Configurador. Ideal para empezar, talleres y la mayoría de proyectos de controladores. El resto del tutorial sigue este camino.",
	tutorial_platforms_arduino:
		'Instala "ESP-NOW MIDI" desde el Gestor de Bibliotecas (requiere el core Arduino-ESP32 3.3.0 o superior) y abre uno de sus ejemplos. El ejemplo client usa enomik::Client, el mismo código que el firmware precompilado, así que tu sketch sigue siendo configurable desde la app web.',
	tutorial_platforms_arduino_plain:
		"Para control total, usa directamente la clase esp_now_midi. Su API es similar a la Arduino MIDI Library:",
	tutorial_platforms_arduino_s3:
		"¿Subes un sketch de dongle a un ESP32-S3? Ajusta Herramientas → USB Mode a USB-OTG (TinyUSB).",
	tutorial_platforms_platformio:
		"Cada ejemplo de Arduino incluye un platformio.ini. Para tu propio proyecto, añade la biblioteca y sus dependencias a lib_deps. Se necesita la plataforma pioarduino porque la plataforma oficial espressif32 no soporta el core Arduino 3.x. En placas ESP32-S3 con USB MIDI, añade también board_build.usb_mode = tinyusb.",
	tutorial_platforms_circuitpython:
		"Copia esp_now_midi.py de la biblioteca a tu placa. Usa el mismo formato de paquetes que la biblioteca C++. Este port está en gran parte sin probar; las contribuciones son bienvenidas.",
	tutorial_platforms_idf:
		"ESP-IDF puro (5.5 o superior), sin el core de Arduino. Añade el repositorio como componente, p. ej. como submódulo git en components/. La carpeta examples_idf contiene versiones de cliente y dongle.",

	tutorial_firmware_title: "Subir firmware",
	tutorial_firmware_text: [
		"El Cargador de Firmware flashea firmware precompilado directamente desde el navegador, sin toolchain. Hazlo una vez para el dongle y una vez para cada cliente.",
	],
	tutorial_firmware_steps: [
		"Conecta la placa por USB y abre el Cargador de Firmware.",
		"Paso 1: elige una versión. Usa la más reciente salvo que tengas un motivo.",
		"Paso 2: elige tu placa: LOLIN S2 Mini, ESP32-S2 o ESP32-S3.",
		"Paso 3: elige el firmware. Dongle para la placa conectada al ordenador (Grantler Dongle si tiene pantalla), Client para placas con sensores y actuadores.",
		"Paso 4: pon las placas ESP32-S2 en modo bootloader: mantén BOOT, pulsa y suelta RESET y luego suelta BOOT. Las placas ESP32-S3 lo hacen automáticamente.",
		"Paso 5: pulsa Conectar y flashear, elige el puerto serie en el diálogo del navegador y espera a que termine la barra de progreso.",
		"Pulsa RESET si la app te lo pide. La placa ya ejecuta el nuevo firmware.",
	],
	tutorial_firmware_nvs:
		'Deja "Borrar NVS" desmarcado en actualizaciones normales: borra ajustes guardados como pines y peers. Márcalo solo para empezar de cero.',
	tutorial_firmware_troubleshooting: [
		"No aparece ningún puerto: prueba otro cable (muchos solo cargan) y otro puerto USB.",
		"Falla el flasheo en una placa S2: repite la secuencia de bootloader. En modo bootloader la placa aparece con otro nombre de puerto.",
		"¿Otra cosa? Sube un .bin desde la página de releases de GitHub o abre un issue.",
	],

	tutorial_pairing_title: "Ejemplo: emparejamiento inalámbrico",
	tutorial_pairing_text: [
		"Un cliente envía a las direcciones MAC de su lista de peers. Añade la dirección del dongle una vez y el cliente lo encontrará tras cada reinicio. El dongle conoce al cliente en cuanto este envía su primer mensaje.",
	],
	tutorial_pairing_mac_title: "1. Averigua la dirección MAC del dongle",
	tutorial_pairing_mac: [
		"Conecta el dongle, abre el Inspector, selecciona el dongle y anota su dirección MAC.",
		"Alternativa: los dongles con pantalla la muestran, o flashea el firmware Print MAC y léela en el monitor serie.",
	],
	tutorial_pairing_peer_title: "2. Añade el dongle como peer del cliente",
	tutorial_pairing_peer: [
		"Conecta el cliente por USB y abre el Configurador.",
		"Pulsa Iniciar MIDI si se te pide, selecciona el cliente como salida MIDI y ajusta el tipo de dispositivo a Cliente.",
		"Abre Configuración de MIDI inalámbrico, añade una fila y sustituye FF:FF:FF:FF:FF:FF por la dirección MAC del dongle.",
		"Pulsa Desplegar. La configuración se guarda en el cliente.",
	],
	tutorial_pairing_test_title: "3. Sin cables",
	tutorial_pairing_test:
		"Desconecta el cliente y aliméntalo con un power bank o batería. Conecta el dongle. Los mensajes del cliente llegan ahora por el puerto MIDI del dongle.",
	tutorial_pairing_tip:
		"Varios clientes pueden compartir un dongle: repite el paso 2 para cada cliente.",

	tutorial_button_title: "Ejemplo: botón a nota",
	tutorial_button_text: [
		"Tu primer controlador: un pulsador que toca una nota.",
	],
	tutorial_button_wiring:
		"El cliente enomik tiene dos pulsadores en los pines 16 y 17, ya conectados a GND. En otra placa, conecta un pulsador entre GPIO 16 (y 17) y GND. No hace falta resistencia: el pull-up interno mantiene el pin en alto hasta que el pulsador lo lleva a masa.",
	tutorial_button_config: [
		"Abre el Configurador con el cliente conectado y seleccionado.",
		"En Asignación de pin de entrada a MIDI, añade dos filas.",
		"Primera fila: pin 16, modo INPUT_PULLUP (digital), canal 1, tipo MIDI Note On, nota 16, mín 0, máx 127.",
		"Segunda fila: lo mismo con el pin 17 y la nota 17. En las placas enomik el número de nota coincide con el número de pin.",
		"Pulsa Desplegar.",
	],
	tutorial_button_test:
		"Abre el Monitor MIDI y selecciona el cliente. Al pulsar el botón del pin 16 se envía la nota 16 con velocidad 127 (máx), el del pin 17 la nota 17; al soltar, velocidad 0 (mín), que los sintetizadores tratan como note off.",
	tutorial_button_tip:
		"¿Prefieres un interruptor o un pedal de sustain? Elige Control Change: pulsar envía el valor máx, soltar el mín.",

	tutorial_knob_title: "Ejemplo: potenciómetro a CC",
	tutorial_knob_text: [
		"Un potenciómetro te da un controlador continuo, p. ej. para el corte de un filtro.",
	],
	tutorial_knob_wiring:
		"Conecta las patas exteriores a 3V3 y GND y la central (cursor) a un pin con capacidad analógica. Kits y placas muestra qué pines leen valores analógicos.",
	tutorial_knob_config: [
		"En Asignación de pin de entrada a MIDI, añade una fila.",
		"Ajusta el pin, modo ANALOG, canal 1, tipo MIDI Control Change, controlador 1 (rueda de modulación), mín 0, máx 127.",
		"Pulsa Desplegar.",
	],
	tutorial_knob_test:
		"Gira el potenciómetro y observa los valores en el Monitor MIDI, o asígnalo en tu DAW con MIDI learn. Usa mín y máx para acotar el rango.",
	tutorial_knob_tip:
		"¿No tienes potenciómetro? Elige INPUT_TOUCH en un pin táctil y toca un cable o un trozo de papel de aluminio.",

	tutorial_led_title: "Ejemplo: MIDI a LED",
	tutorial_led_text: [
		"La otra dirección: el MIDI de tu ordenador enciende el LED integrado en el pin 15.",
	],
	tutorial_led_wiring:
		"Nada que cablear: la LOLIN S2 Mini tiene un LED integrado en GPIO 15. No necesitas componentes adicionales.",
	tutorial_led_config: [
		"En Asignación de MIDI a pin de salida, añade una fila.",
		"Ajusta canal 1, tipo MIDI Note On, nota 16, pin 15, modo OUTPUT (digital).",
		"Pulsa Desplegar.",
	],
	tutorial_led_test:
		"Abre el Monitor MIDI y usa el Compositor MIDI para enviar la nota 16 en el canal 1: el LED se enciende y el note off lo apaga. Tocar la nota desde tu DAW funciona igual.",
	tutorial_led_tip_pwm:
		"Elige PWM (analog) para atenuar el LED: la velocidad o el valor del controlador fija el brillo.",
	tutorial_led_tip_loopback:
		"Combínalo con el ejemplo del botón y activa MIDI loopback en Global: el botón del pin 16 (nota 16) enciende el LED directamente en la placa, sin ordenador.",

	tutorial_next_steps_title: "Próximos pasos",
	tutorial_next_steps_text: [
		"Has construido tu primer dispositivo MIDI inalámbrico. Cómo seguir:",
	],
	tutorial_next_steps_list: [
		"Guarda tu configuración en un archivo y cárgala después, o léela de una placa.",
		"Consulta pinouts y capacidades de los pines en Kits y placas.",
		"Comprueba una placa recién soldada con el Probador de placas.",
		"Toca el Grantulator, un sintetizador granular en el navegador, con tus placas enomik.",
		"Profundiza en la documentación y los ejemplos de la biblioteca.",
	],
};

const zh: typeof en = {
	tutorial: "教程",
	tutorial_chapters: "章节",
	tutorial_chapter_n: "第 {{n}} 章",
	tutorial_wiring: "接线",
	tutorial_configuration: "配置",
	tutorial_test: "测试",
	tutorial_troubleshooting: "故障排除",
	tutorial_library_docs: "库文档",
	tutorial_library_github: "GitHub 上的库",

	tutorial_intro_title: "简介",
	tutorial_intro_text: [
		"enomik 3000 将 ESP32 开发板变成无线 MIDI 设备。按钮、旋钮、触摸板和传感器成为 MIDI 控制器；LED、继电器和电机响应来自 DAW 的 MIDI。",
		"本教程带你完成整个设置，从烧录固件到第一个无线 MIDI 音符。无需编程，但如果你喜欢写代码，同样的功能也以库的形式提供。",
	],
	tutorial_intro_needs_title: "你需要什么",
	tutorial_intro_needs: [
		"一块适配器板：带原生 USB 的 ESP32-S2 或 ESP32-S3，例如 LOLIN S2 Mini。它插在电脑上，显示为 USB MIDI 设备。",
		"一块或多块客户端板：ESP32-S2 或 ESP32-S3 开发板（enomik 3000 客户端开箱即用）。按钮、旋钮和 LED 接在上面。",
		"一根能传输数据的 USB 线，而不仅仅是充电线。",
		"基于 Chromium 的浏览器，如 Chrome 或 Edge。应用使用 Web Serial 烧录固件，使用 Web MIDI 配置开发板。",
		"示例可选材料：一个按钮、一个电位器、杜邦线和面包板。",
	],
	tutorial_intro_steps_title: "步骤一览",
	tutorial_intro_steps: [
		"将适配器固件烧录到适配器板。",
		"将客户端固件烧录到每块客户端板。",
		"在配置器中将引脚映射到 MIDI 消息并部署。",
		"在 MIDI 监视器或 DAW 中检查消息。",
		"输入适配器的 MAC 地址，将客户端与适配器配对，实现无线连接。",
	],
	tutorial_intro_wired_note:
		"不需要无线？客户端板也可以单独作为有线 USB MIDI 设备使用，这样可以跳过适配器和配对。",

	tutorial_architecture_title: "架构",
	tutorial_architecture_text: [
		"一个 enomik 系统由三部分组成：MIDI 主机、适配器和一个或多个客户端。",
	],
	tutorial_architecture_host: "MIDI 主机",
	tutorial_architecture_host_desc:
		"电脑、手机或任何支持 USB MIDI 的设备：DAW、Max、Pure Data、浏览器。",
	tutorial_architecture_dongle_desc:
		"免驱 USB MIDI 设备，在 USB MIDI 与 ESP-NOW 之间双向桥接。",
	tutorial_architecture_clients: "客户端",
	tutorial_architecture_client_desc:
		"读取输入并发送 MIDI；接收 MIDI 并驱动输出。",
	tutorial_architecture_usb: "USB MIDI",
	tutorial_architecture_details: [
		"ESP-NOW 是乐鑫推出的无连接协议，运行在 Wi-Fi 射频上。开发板之间通过 MAC 地址直接通信，无需路由器、无需加入网络、也无需蓝牙配对，因此延迟很低。",
		"适配器将通过 USB 收到的所有内容转发给无线对端，并将对端的消息转发回 USB。你的 DAW 只看到一个普通的 MIDI 设备。",
		"客户端固件是通用的：在你告诉它读取哪些引脚、发送哪些消息之前，它什么也不做。网页应用通过 USB 以 MIDI SysEx 发送配置，开发板将其保存在闪存中。重启后配置依然保留，所以只需配置一次，之后即可用电池或充电宝供电运行。",
		"消息双向流动。客户端可以是控制器（引脚到 MIDI）、乐器或执行器（MIDI 到引脚），也可以同时兼任。",
	],

	tutorial_platforms_title: "使用 enomik 的方式",
	tutorial_platforms_text: [
		"所有方式都基于同一个开源库 ESP-NOW MIDI 和同一种数据包格式。选择适合你项目的方式，或混合使用：运行自定义程序的开发板可以与通过网页应用烧录的适配器通信。",
	],
	tutorial_platforms_webapp_title: "网页应用（无需代码）",
	tutorial_platforms_webapp:
		"用固件上传器烧录预编译固件，在配置器中映射引脚。最适合入门、工作坊和大多数控制器项目。本教程其余部分都采用这种方式。",
	tutorial_platforms_arduino:
		'在库管理器中安装 "ESP-NOW MIDI"（需要 Arduino-ESP32 核心 3.3.0 或更高版本），然后打开其中一个示例。client 示例使用 enomik::Client，与预编译固件代码相同，因此你自己的程序仍可通过网页应用配置。',
	tutorial_platforms_arduino_plain:
		"如需完全控制，可直接使用 esp_now_midi 类，其 API 与 Arduino MIDI Library 类似：",
	tutorial_platforms_arduino_s3:
		"要将适配器程序上传到 ESP32-S3？请将 工具 → USB Mode 设置为 USB-OTG (TinyUSB)。",
	tutorial_platforms_platformio:
		"每个 Arduino 示例都附带 platformio.ini。在你自己的项目中，将库及其依赖添加到 lib_deps。需要使用 pioarduino 平台，因为官方 espressif32 平台不支持 Arduino 核心 3.x。对于带 USB MIDI 的 ESP32-S3 开发板，还需设置 board_build.usb_mode = tinyusb。",
	tutorial_platforms_circuitpython:
		"将库中的 esp_now_midi.py 复制到开发板。它与 C++ 库使用相同的数据包格式。此移植基本未经测试，欢迎贡献。",
	tutorial_platforms_idf:
		"纯 ESP-IDF（5.5 或更高版本），不依赖 Arduino 核心。将仓库作为组件添加，例如作为 git 子模块放在 components/ 下。examples_idf 文件夹中有客户端和适配器的移植版本。",

	tutorial_firmware_title: "上传固件",
	tutorial_firmware_text: [
		"固件上传器直接在浏览器中烧录预编译固件，无需工具链。适配器烧录一次，每个客户端各烧录一次。",
	],
	tutorial_firmware_steps: [
		"通过 USB 连接开发板，打开固件上传器。",
		"步骤 1：选择版本。如无特殊原因，请使用最新版本。",
		"步骤 2：选择开发板：LOLIN S2 Mini、ESP32-S2 或 ESP32-S3。",
		"步骤 3：选择固件。接在电脑上的板选 Dongle（带显示屏选 Grantler Dongle），连接传感器和执行器的板选 Client。",
		"步骤 4：让 ESP32-S2 开发板进入引导模式：按住 BOOT，按下并松开 RESET，再松开 BOOT。ESP32-S3 开发板会自动完成。",
		"步骤 5：点击连接并刷写，在浏览器对话框中选择串口，等待进度条完成。",
		"如果应用提示，请按 RESET。开发板现在运行新固件。",
	],
	tutorial_firmware_nvs:
		'普通更新时请不要勾选"清除 NVS"：它会删除引脚和对端等已保存设置。仅在需要完全重置时勾选。',
	tutorial_firmware_troubleshooting: [
		"没有出现端口：换一根线（很多线只能充电）并换一个 USB 接口。",
		"S2 开发板烧录失败：重复进入引导模式的步骤。在引导模式下，开发板会以不同的端口名出现。",
		"其他问题？从 GitHub 发布页面上传 .bin 文件，或提交 issue。",
	],

	tutorial_pairing_title: "示例：无线配对",
	tutorial_pairing_text: [
		"客户端会向其对端列表中的 MAC 地址发送消息。添加一次适配器地址后，客户端每次重启都能找到适配器。客户端发送第一条消息后，适配器就会认识它。",
	],
	tutorial_pairing_mac_title: "1. 查找适配器的 MAC 地址",
	tutorial_pairing_mac: [
		"插入适配器，打开检查器，选择适配器并记下它的 MAC 地址。",
		"或者：带显示屏的适配器会直接显示；也可以烧录 Print MAC 固件，在串口监视器中读取地址。",
	],
	tutorial_pairing_peer_title: "2. 将适配器添加为客户端的对端",
	tutorial_pairing_peer: [
		"通过 USB 连接客户端，打开配置器。",
		"如有提示，点击初始化 MIDI，选择客户端作为 MIDI 输出，并将设备类型设为客户端。",
		"打开无线 MIDI 配置，添加一行，将占位符 FF:FF:FF:FF:FF:FF 替换为适配器的 MAC 地址。",
		"点击部署。配置将保存在客户端上。",
	],
	tutorial_pairing_test_title: "3. 无线运行",
	tutorial_pairing_test:
		"拔下客户端，用充电宝或电池供电。插入适配器。客户端的消息现在通过适配器的 MIDI 端口到达。",
	tutorial_pairing_tip:
		"多个客户端可以共用一个适配器：对每个客户端重复步骤 2。",

	tutorial_button_title: "示例：按钮到音符",
	tutorial_button_text: ["你的第一个控制器：一个演奏音符的按钮。"],
	tutorial_button_wiring:
		"enomik 客户端在引脚 16 和 17 上有两个按钮，已接到 GND。使用其他开发板时，将按钮接在 GPIO 16（和 17）与 GND 之间。无需电阻：内部上拉使引脚保持高电平，直到按钮将其拉低到地。",
	tutorial_button_config: [
		"连接并选中客户端，打开配置器。",
		"在输入引脚到 MIDI 映射中添加两行。",
		"第一行：引脚 16、模式 INPUT_PULLUP (digital)、通道 1、MIDI 类型 Note On、音符 16、最小 0、最大 127。",
		"第二行：相同设置，引脚 17、音符 17。在 enomik 开发板上，音符编号与引脚编号相同。",
		"点击部署。",
	],
	tutorial_button_test:
		"打开 MIDI 监视器并选择客户端。按下引脚 16 上的按钮发送力度 127（最大）的音符 16，引脚 17 上的按钮发送音符 17；松开发送力度 0（最小），合成器会将其视为 note off。",
	tutorial_button_tip:
		"想要开关或延音踏板？改选 Control Change：按下发送最大值，松开发送最小值。",

	tutorial_knob_title: "示例：旋钮到 CC",
	tutorial_knob_text: ["电位器提供连续控制，例如用于滤波器截止频率。"],
	tutorial_knob_wiring:
		"将两侧引脚接 3V3 和 GND，中间引脚（滑动端）接支持模拟输入的引脚。套件与电路板页面显示哪些引脚可以读取模拟值。",
	tutorial_knob_config: [
		"在输入引脚到 MIDI 映射中添加一行。",
		"设置引脚、模式 ANALOG、通道 1、MIDI 类型 Control Change、控制器 1（调制轮）、最小 0、最大 127。",
		"点击部署。",
	],
	tutorial_knob_test:
		"转动旋钮，在 MIDI 监视器中观察数值，或在 DAW 中通过 MIDI 学习分配该控制器。用最小值和最大值缩小范围。",
	tutorial_knob_tip:
		"手边没有电位器？在支持触摸的引脚上选择 INPUT_TOUCH，然后触摸一根导线或一片铝箔。",

	tutorial_led_title: "示例：MIDI 到 LED",
	tutorial_led_text: ["另一个方向：来自电脑的 MIDI 控制引脚 15 上的板载 LED。"],
	tutorial_led_wiring:
		"无需接线：LOLIN S2 Mini 在 GPIO 15 上有板载 LED。无需额外元件。",
	tutorial_led_config: [
		"在 MIDI 到输出引脚映射中添加一行。",
		"设置通道 1、MIDI 类型 Note On、音符 16、引脚 15、模式 OUTPUT (digital)。",
		"点击部署。",
	],
	tutorial_led_test:
		"打开 MIDI 监视器，用 MIDI 编辑器在通道 1 上发送音符 16：LED 点亮，note off 将其熄灭。从 DAW 演奏该音符效果相同。",
	tutorial_led_tip_pwm:
		"改选 PWM (analog) 可调节 LED 亮度：力度或控制器值决定亮度。",
	tutorial_led_tip_loopback:
		"与按钮示例结合，并在全局中启用 MIDI 回环：引脚 16 上的按钮（音符 16）将直接在开发板上点亮 LED，无需电脑。",

	tutorial_next_steps_title: "下一步",
	tutorial_next_steps_text: ["你已经制作了第一个无线 MIDI 设备。接下来可以："],
	tutorial_next_steps_list: [
		"将配置保存到文件以便之后加载，或从开发板读回配置。",
		"在套件与电路板中查看引脚图和引脚功能。",
		"用开发板测试工具检查刚焊好的开发板。",
		"用你的 enomik 开发板演奏 Grantulator，一个浏览器中的粒子合成器。",
		"深入了解库的文档和示例。",
	],
};

export const tutorialTranslations = { en, de, es, zh };
