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
	tutorial_source_link: "{{path}} on GitHub",
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
		"An enomik setup has three parts: a MIDI host, a dongle and one or more clients. The clients connect to your sensors and actuators. An optional extender adds more pins to a client. A client can also be plugged into the host directly via USB, without a dongle.",
	],
	tutorial_architecture_host: "MIDI host",
	tutorial_architecture_host_desc:
		"Computer, phone or anything that speaks USB MIDI: DAW, Max, Pure Data, the browser.",
	tutorial_architecture_dongle_desc:
		"Class-compliant USB MIDI device. Bridges USB MIDI to ESP-NOW and back.",
	tutorial_architecture_clients: "Clients",
	tutorial_architecture_client_desc:
		"Read inputs and send MIDI. Receive MIDI and drive outputs.",
	tutorial_architecture_extender: "Extender (optional)",
	tutorial_architecture_extender_desc:
		"More inputs and outputs, connected to the client with a ribbon cable.",
	tutorial_architecture_pins: "Pins",
	tutorial_architecture_sensors: "Sensors",
	tutorial_architecture_sensors_desc:
		"Inputs: the client reads them and sends MIDI.",
	tutorial_architecture_sensors_examples: [
		"Buttons",
		"Knobs",
		"Touch pads",
		"Distance sensor (VL53L0X)",
		"Motion sensor (MPU6500)",
	],
	tutorial_architecture_actuators: "Actuators",
	tutorial_architecture_actuators_desc:
		"Outputs: the client drives them from incoming MIDI.",
	tutorial_architecture_actuators_examples: [
		"LEDs",
		"NeoPixels",
		"Servos",
		"Relays",
		"DMX lights",
	],
	tutorial_architecture_usb_direct: "USB MIDI (wired, no dongle)",
	tutorial_architecture_usb: "USB MIDI",
	tutorial_architecture_details: [
		"ESP-NOW is a connectionless protocol by Espressif that runs on the Wi-Fi radio. Boards talk to each other directly, addressed by their MAC address. There is no router, no network to join and no Bluetooth pairing, which keeps latency low.",
		"The dongle forwards everything it receives over USB to its wireless peers, and everything from its peers back to USB. Your DAW only sees one ordinary MIDI device.",
		"The client firmware is generic: it does nothing until you tell it which pins to read and which messages to send. The web app sends this configuration as MIDI SysEx over USB, and the board stores it in its flash memory. It survives reboots, so you configure once and then run the board from a battery or power bank.",
		"Messages flow both ways. A client can be a controller (pin to MIDI), an instrument or actuator (MIDI to pin), or both at the same time.",
	],

	tutorial_electronics_title: "Basic electronics",
	tutorial_electronics_text: [
		"A few basics before you wire up your first project. This chapter explains the terms used throughout the tutorial and in the Configurator.",
	],
	tutorial_electronics_sensor_title: "What is a sensor?",
	tutorial_electronics_sensor: [
		"A sensor turns something from the physical world into an electrical signal the board can read: a press, a position, light, distance or motion.",
		"Simple sensors such as buttons and potentiometers change the voltage on a pin. More complex ones, like distance or motion sensors, contain their own chip and send numbers over a bus such as I2C.",
		"In enomik, sensors are inputs: the client reads them and sends MIDI. A button sends a note, a knob sends a control change.",
	],
	tutorial_electronics_actuator_title: "What is an actuator?",
	tutorial_electronics_actuator: [
		"An actuator does the opposite: it turns an electrical signal into something you can see, hear or feel. LEDs light up, servos and motors move, relays switch other devices on and off, solenoids strike.",
		"In enomik, actuators are outputs: the client receives MIDI and drives them. A note switches an LED on, a controller value sets the angle of a servo.",
	],
	tutorial_electronics_digital_title: "What is digital?",
	tutorial_electronics_switch_intro:
		"Think of a light switch: the light is either off or on, there is nothing in between. A digital signal works the same way.",
	tutorial_electronics_switch_off: "Off",
	tutorial_electronics_switch_on: "On",
	tutorial_electronics_switch_label: "A light switch, off and on",
	tutorial_electronics_digital: [
		"A digital signal knows only two states: on or off, HIGH or LOW. On ESP32 boards HIGH is 3.3 V and LOW is 0 V (GND).",
		"A button is a typical digital input: pressed or not pressed. So that the pin does not float while the button is open, it uses a pull-up resistor: the pin reads HIGH until the button connects it to GND. That is why a pressed button often reads LOW.",
		"Digital outputs switch something fully on or off, like an LED or a relay. In MIDI terms, digital fits note on and note off.",
	],
	tutorial_electronics_analog_title: "What is analog?",
	tutorial_electronics_dimmer_intro:
		"Now think of a dimmer: you can turn the light to any brightness between off and full. An analog signal works the same way, with any voltage between 0 V and 3.3 V. The client turns that voltage into a MIDI value from 0 to 127.",
	tutorial_electronics_dimmer_label:
		"A dimmer at off, half and full, with the matching voltage and MIDI value",
	tutorial_electronics_analog: [
		"An analog signal can take any value between two limits, for example any voltage between 0 V and 3.3 V. Potentiometers, light sensors and pressure sensors produce such a varying voltage.",
		"The board measures it with an analog-to-digital converter (ADC), which turns the voltage into a number. The client scales that number to the MIDI range 0–127.",
		"Only some pins can read analog values, so check the board layout. In MIDI terms, analog fits control change messages: a knob sends a stream of values as you turn it.",
	],
	tutorial_electronics_pwm_title: "What is PWM?",
	tutorial_electronics_pwm: [
		"Most microcontroller pins cannot output a real analog voltage. PWM (pulse-width modulation) fakes one: the pin switches on and off very fast, and the share of on-time, the duty cycle, sets the average power.",
		"At 25 % duty cycle an LED glows dimly, at 100 % it is fully on. The pin switches thousands of times per second, so your eye sees a steady brightness instead of flicker.",
		"Servos use a special kind of PWM: the length of each pulse sets the angle (see the servo example). In the Configurator, choose PWM for an output to dim an LED with the note velocity or a controller value.",
	],
	tutorial_electronics_actuator_note:
		"A pin can only deliver a small current, around 20 mA. That is enough for an LED with a resistor, but not for motors, solenoids or long LED strips. Use a transistor, a driver board or a relay for those, and a separate power supply.",
	tutorial_electronics_digital_note:
		"ESP32 pins work with 3.3 V. Never connect a 5 V signal directly to a pin, it can damage the board.",
	tutorial_photo_credit: "Photo",
	tutorial_photo_button: "Push buttons",
	tutorial_photo_potentiometer: "Potentiometer",
	tutorial_photo_photoresistor: "Light sensors (photoresistors)",
	tutorial_photo_motion: "Motion sensor (MPU-6050)",
	tutorial_photo_leds: "LEDs",
	tutorial_photo_neopixels: "Addressable LEDs (WS2812B)",
	tutorial_photo_servo: "Servo (SG90)",
	tutorial_photo_relay: "Relay module",
	tutorial_electronics_pwm_dim: "25 % on: dim",
	tutorial_electronics_pwm_bright: "75 % on: bright",

	tutorial_midi_title: "MIDI basics",
	tutorial_midi_text: [
		"MIDI (Musical Instrument Digital Interface) is the language instruments, controllers and computers have used to talk to each other since 1983. enomik speaks it on both ends: over USB to your computer and wirelessly between boards.",
		'MIDI does not carry sound. It carries messages like "play note 60 now, fairly loud" or "set the volume to 100". The synth, sampler or DAW that receives them decides what that sounds like.',
	],
	tutorial_midi_messages_title: "Messages",
	tutorial_midi_messages: [
		"Every MIDI message starts with a status byte that says what kind of message it is and which channel it is on. One or two data bytes follow. Data values always range from 0 to 127.",
	],
	tutorial_midi_status: "Status",
	tutorial_midi_channel: "channel",
	tutorial_midi_note: "Note",
	tutorial_midi_velocity: "Velocity",
	tutorial_midi_controller: "Controller",
	tutorial_midi_value: "Value",
	tutorial_midi_table_head: [
		"Message",
		"What it does",
		"Values",
		"Typical use",
	],
	tutorial_midi_table: [
		[
			"Note On / Note Off",
			"Starts and stops a note",
			"Note 0–127, velocity 0–127",
			"Button press and release, LED on and off",
		],
		[
			"Control Change (CC)",
			"Changes a parameter",
			"Controller 0–127, value 0–127",
			"Knob, distance sensor, servo angle, LED brightness",
		],
		[
			"Program Change",
			"Switches to another sound or preset",
			"Program 0–127",
			"Switching presets with a button",
		],
		[
			"Pitch Bend",
			"Bends the pitch up or down",
			"−8192 to 8191 (14 bit)",
			"Tilting a motion sensor",
		],
		["Aftertouch", "Pressure while a note is held", "0–127", "Pressure sensor"],
		[
			"System Exclusive (SysEx)",
			"Device-specific data",
			"Any length",
			"enomik sends the board configuration this way",
		],
	],
	tutorial_midi_notes_title: "Notes and velocity",
	tutorial_midi_notes: [
		"Each note has a number from 0 to 127. Note 60 is middle C, which software calls C4 or C3 depending on the manufacturer. One octave up adds 12.",
		"Velocity says how hard the note is played, from 1 (softest) to 127 (hardest). A note on with velocity 0 counts as note off.",
	],
	tutorial_midi_keyboard_label:
		"One octave of a keyboard with MIDI note numbers 60 to 72, middle C highlighted",
	tutorial_midi_keyboard_caption: "Middle C = note 60. One octave up = 72.",
	tutorial_midi_cc_title: "Control change",
	tutorial_midi_cc: [
		"Control change messages move knobs and faders in your software. The controller number says which parameter, the value says where to set it.",
		"Some numbers have a common meaning: 1 is the modulation wheel, 7 volume, 10 pan, 64 the sustain pedal. Most DAWs let you assign any other number with MIDI learn: click a parameter, move your knob, done.",
	],
	tutorial_midi_channels_title: "Channels",
	tutorial_midi_channels: [
		"A MIDI connection has 16 channels. Every message is sent on one of them, so several instruments can share one connection and each one listens only to its own channel.",
		"With enomik, all clients share one connection through the dongle. Give each client or each sensor its own channel, or its own note and CC numbers, to keep them apart.",
	],
	tutorial_midi_enomik_title: "MIDI in enomik",
	tutorial_midi_enomik: [
		"The dongle shows up in your DAW as an ordinary USB MIDI device, just like a wired controller.",
		"In the Configurator you pick for every pin which message it sends or reacts to: a button sends note on and note off, a knob sends a CC, an LED lights up on a note. Use the MIDI monitor to watch the messages live.",
	],

	tutorial_platforms_title: "Ways to use enomik",
	tutorial_platforms_text: [
		"All paths share the same open source library, ESP-NOW MIDI, and the same packet format. Pick the one that fits your project, or mix them: a board running your own sketch talks to a dongle flashed from the web app.",
	],
	tutorial_platforms_webapp_title: "Web app (no code)",
	tutorial_platforms_webapp:
		"Flash precompiled firmware with the Firmware Uploader and map pins in the Configurator. Best for getting started, workshops and most controller projects. The rest of this tutorial follows this path.",
	tutorial_platforms_code_title: "Your own code",
	tutorial_platforms_code:
		"Prefer to write code yourself? The library is available for several environments. Each one has its own subchapter:",
	tutorial_platforms_arduino_title: "Arduino",
	tutorial_platforms_circuitpython_title: "CircuitPython",
	tutorial_platforms_platformio_title: "PlatformIO",
	tutorial_platforms_idf_title: "ESP-IDF",
	tutorial_platforms_arduino_install_title: "Installation",
	tutorial_platforms_arduino_install: [
		'Install the ESP32 boards: open Tools → Board → Boards Manager, search for "esp32" and install "esp32 by Espressif Systems" (version 3.3.0 or newer).',
		'Install the library: open Sketch → Include Library → Manage Libraries, search for "ESP-NOW MIDI" and install it.',
	],
	tutorial_lightbox_previous: "Previous image",
	tutorial_lightbox_next: "Next image",
	tutorial_lightbox_close: "Close",
	tutorial_screenshot_credit: "Screenshots",
	tutorial_screenshot_cropped: "cropped",
	tutorial_arduino_boards_1:
		"Click the Boards Manager icon in the left sidebar.",
	tutorial_arduino_boards_2:
		'Type "esp32" into the search field and click Install on "esp32 by Espressif Systems".',
	tutorial_arduino_boards_3: "When it is done, the package shows as installed.",
	tutorial_arduino_library_1:
		"Click the Library Manager icon in the left sidebar.",
	tutorial_arduino_library_2:
		'Type "ESP-NOW MIDI" into the search field and click Install.',
	tutorial_arduino_library_3:
		"When it is done, the library shows as installed.",
	tutorial_arduino_screenshots_note:
		'These screenshots come from the Arduino documentation and show a different board package and library. The steps are the same: just search for "esp32" and "ESP-NOW MIDI".',
	tutorial_platforms_arduino_usage_title: "Usage",
	tutorial_platforms_arduino:
		"Open one of the library examples via File → Examples → ESP-NOW MIDI. The client example uses enomik::Client, the same code as the precompiled firmware, so your own sketch stays configurable from the web app.",
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
		"Every board needs firmware: once for the dongle and once for every client. There are two ways to upload it. The web uploader needs nothing but a browser. The Arduino IDE builds the firmware from the library examples, so you can change the code.",
	],
	tutorial_firmware_web_title: "Via web uploader",
	tutorial_firmware_arduino_title: "Via Arduino IDE",
	tutorial_firmware_arduino_text: [
		"Build and upload the firmware yourself from the library examples. First install the ESP32 boards and the ESP-NOW MIDI library as described in the Arduino chapter.",
	],
	tutorial_firmware_arduino_link: "Arduino installation",
	tutorial_firmware_arduino_steps: [
		"Open the example: File → Examples → ESP-NOW MIDI → client for client boards, or File → Examples → ESP-NOW MIDI → grantler_instruments → dongle for the dongle.",
		"Select your board under Tools → Board → esp32, e.g. LOLIN S2 Mini or ESP32S3 Dev Module.",
		"Put ESP32-S2 boards into bootloader mode: hold BOOT, press and release RESET, then release BOOT.",
		"Select the port under Tools → Port and click Upload.",
		"Press RESET when the upload has finished. The board now runs the new firmware.",
	],
	tutorial_firmware_arduino_tip:
		"The client example uses the same code as the precompiled client firmware, so the board stays configurable from the web app.",
	tutorial_firmware_web_text: [
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

	tutorial_examples_title: "Examples",
	tutorial_examples_text: [
		"Small projects that show what a client can do. Configure the precompiled client firmware in the web app, or build your own firmware from code:",
	],
	tutorial_examples_webapp_title: "Via web app",
	tutorial_examples_webapp_text: [
		"These examples use the precompiled client firmware. Wire up the hardware and set everything up in the Configurator, no code needed:",
	],
	tutorial_examples_code_title: "Via code",
	tutorial_examples_code_text: [
		"These examples use sketches from the library that you build and upload with the Arduino IDE. Use them for hardware that needs its own driver code, such as I2C sensors:",
	],

	tutorial_pairing_title: "Wireless pairing",
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

	tutorial_button_title: "Button to note",
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

	tutorial_knob_title: "Knob to CC",
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

	tutorial_led_title: "MIDI to LED",
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

	tutorial_i2c_title: "I2C distance sensor (VL53L0X)",
	tutorial_i2c_text: [
		"In this example a VL53L0X time-of-flight sensor measures the distance to your hand, and the client turns it into MIDI. The sensor talks to the board over I2C.",
	],
	tutorial_i2c_about_title: "What is I2C?",
	tutorial_i2c_about: [
		'I2C (Inter-Integrated Circuit, spoken "I-squared-C") is a bus: a shared set of wires that lets the board talk to many chips over just two signal lines. The board is the controller and starts every conversation; sensors and displays answer as targets.',
		"SDA (serial data) carries the bits back and forth. SCL (serial clock) is a steady pulse from the controller that tells every device when to read the next bit. Together with GND and VCC for power, an I2C device needs four wires.",
		"Every device has a fixed address, the VL53L0X for example 0x29. The controller calls an address and only that device answers. That is why several sensors can hang on the same two wires, as long as each has a different address.",
		"I2C is meant for short distances, on a board or over a few tens of centimeters of cable. Longer cables make the signal unreliable.",
		"Many common parts speak I2C: distance sensors, accelerometers and gyroscopes, OLED displays, port expanders. Unlike a button or a knob, each of these chips has its own register layout and needs driver code, so this example uses a dedicated sketch instead of the generic client firmware.",
	],
	tutorial_i2c_wiring:
		"Every I2C sensor has four pins. Connect them to the board with jumper wires:",
	tutorial_i2c_pins: [
		"SDA (data) to the SDA pin of the board.",
		"SCL (clock) to the SCL pin of the board.",
		"GND to GND.",
		"VCC to 3.3V (most breakout boards also accept 5V, check your sensor).",
	],
	tutorial_i2c_board_note:
		"Using an enomik board? Check the board layout on the Kits & Boards page: the I2C bus is already broken out to the Grove ports, so you can plug the sensor in without jumper wires.",
	tutorial_i2c_upload_title: "Upload",
	tutorial_i2c_upload: [
		"Open the VL53L0X example in the Arduino IDE: File → Examples → ESP-NOW MIDI → client_vl53l0x.",
		"Select your board and port and click Upload, as described in the Arduino IDE firmware chapter.",
		"Press RESET when the upload has finished.",
	],
	tutorial_i2c_upload_link: "Firmware via Arduino IDE",
	tutorial_i2c_test:
		"Open the MIDI monitor and move your hand above the sensor. The MIDI messages change with the distance.",

	tutorial_servo_title: "Servo motor",
	tutorial_servo_text: [
		"In this example the client receives MIDI and turns a hobby servo to a matching angle. Use it for moving parts in installations, puppets or mechanical instruments.",
	],
	tutorial_servo_about_title: "How a servo works",
	tutorial_servo_about: [
		"A hobby servo is a small motor with a gearbox and built-in position control. It turns to an angle, usually between 0° and 180°, and holds it.",
		"The angle is set by a pulse on the signal wire, repeated about 50 times per second: roughly 1 ms means one end, 2 ms the other end, 1.5 ms the middle. The sketch generates these pulses and maps the incoming MIDI value to an angle.",
	],
	tutorial_servo_wiring: "A servo has three wires. Their colors vary by brand:",
	tutorial_servo_pins: [
		"Brown or black: GND to GND of the board.",
		"Red: VCC to 5V.",
		"Orange, yellow or white: signal to GPIO 40 (SERVO_PIN in the sketch).",
	],
	tutorial_servo_power:
		"Servos draw a lot of current when they move, often more than the board's USB port can deliver, which can make the board reset. For larger servos or several at once, use a separate 5V supply and connect its GND to the board's GND.",
	tutorial_servo_code_title: "Code",
	tutorial_servo_code_before: "The whole sketch:",
	tutorial_servo_code_after: [
		"The sketch uses enomik::Client for the wireless MIDI part and the ESP32Servo library for the pulses. onControlChange ignores everything except CC 40 on channel 1 and maps the value 0–127 to 0–180°. The servo itself is moved in loop(), outside the ESP-NOW receive callback.",
		"To use another pin, change SERVO_PIN; the CC number follows it. Set SERVO_CC_VALUE_IS_DEGREES to 1 if you prefer the CC value to be the angle directly (then only 0–127° are reachable).",
	],
	tutorial_servo_upload: [
		'Install the ESP32Servo library: Sketch → Include Library → Manage Libraries, search for "ESP32Servo" and install it.',
		"Open the servo example in the Arduino IDE: File → Examples → ESP-NOW MIDI → client_servo.",
		"Select your board and port and click Upload, as described in the Arduino IDE firmware chapter.",
		"Press RESET when the upload has finished.",
	],
	tutorial_servo_test:
		"Send CC 40 on MIDI channel 1 from your DAW through the dongle. Value 0 turns the servo to 0°, 64 to about the middle, 127 to 180°.",

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
	tutorial_source_link: "{{path}} auf GitHub",
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
		"Ein enomik-Setup besteht aus drei Teilen: einem MIDI-Host, einem Dongle und einem oder mehreren Clients. Die Clients verbinden sich mit deinen Sensoren und Aktoren. Eine optionale Erweiterung gibt einem Client weitere Pins. Ein Client kann auch direkt per USB am Host hängen, ganz ohne Dongle.",
	],
	tutorial_architecture_host: "MIDI-Host",
	tutorial_architecture_host_desc:
		"Computer, Smartphone oder alles, was USB-MIDI spricht: DAW, Max, Pure Data, der Browser.",
	tutorial_architecture_dongle_desc:
		"Class-compliant USB-MIDI-Gerät. Überträgt USB-MIDI auf ESP-NOW und zurück.",
	tutorial_architecture_clients: "Clients",
	tutorial_architecture_client_desc:
		"Lesen Eingänge und senden MIDI. Empfangen MIDI und steuern Ausgänge.",
	tutorial_architecture_extender: "Erweiterung (optional)",
	tutorial_architecture_extender_desc:
		"Mehr Ein- und Ausgänge, per Flachbandkabel mit dem Client verbunden.",
	tutorial_architecture_pins: "Pins",
	tutorial_architecture_sensors: "Sensoren",
	tutorial_architecture_sensors_desc:
		"Eingänge: Der Client liest sie und sendet MIDI.",
	tutorial_architecture_sensors_examples: [
		"Taster",
		"Drehregler",
		"Touch-Pads",
		"Abstandssensor (VL53L0X)",
		"Bewegungssensor (MPU6500)",
	],
	tutorial_architecture_actuators: "Aktoren",
	tutorial_architecture_actuators_desc:
		"Ausgänge: Der Client steuert sie per MIDI.",
	tutorial_architecture_actuators_examples: [
		"LEDs",
		"NeoPixels",
		"Servos",
		"Relais",
		"DMX-Licht",
	],
	tutorial_architecture_usb_direct: "USB-MIDI (Kabel, ohne Dongle)",
	tutorial_architecture_usb: "USB-MIDI",
	tutorial_architecture_details: [
		"ESP-NOW ist ein verbindungsloses Protokoll von Espressif, das über das WLAN-Funkmodul läuft. Die Boards sprechen direkt miteinander, adressiert über ihre MAC-Adresse. Kein Router, kein Netzwerk, kein Bluetooth-Pairing, und dadurch geringe Latenz.",
		"Der Dongle leitet alles, was über USB ankommt, an seine Funk-Peers weiter, und alles von den Peers zurück an USB. Deine DAW sieht nur ein gewöhnliches MIDI-Gerät.",
		"Die Client-Firmware ist generisch: Sie tut nichts, bis du ihr sagst, welche Pins sie lesen und welche Nachrichten sie senden soll. Die Web-App schickt diese Konfiguration als MIDI-SysEx über USB, und das Board speichert sie im Flash. Sie übersteht Neustarts, du konfigurierst also einmal und betreibst das Board danach mit Akku oder Powerbank.",
		"Nachrichten fließen in beide Richtungen. Ein Client kann Controller sein (Pin zu MIDI), Instrument oder Aktor (MIDI zu Pin), oder beides gleichzeitig.",
	],

	tutorial_electronics_title: "Elektronik-Grundlagen",
	tutorial_electronics_text: [
		"Ein paar Grundlagen, bevor du dein erstes Projekt verdrahtest. Dieses Kapitel erklärt die Begriffe, die im Tutorial und im Konfigurator vorkommen.",
	],
	tutorial_electronics_sensor_title: "Was ist ein Sensor?",
	tutorial_electronics_sensor: [
		"Ein Sensor macht aus etwas in der physischen Welt ein elektrisches Signal, das das Board lesen kann: einen Druck, eine Position, Licht, Abstand oder Bewegung.",
		"Einfache Sensoren wie Taster und Potentiometer verändern die Spannung an einem Pin. Komplexere wie Abstands- oder Bewegungssensoren haben einen eigenen Chip und schicken Zahlen über einen Bus wie I2C.",
		"Bei enomik sind Sensoren Eingänge: Der Client liest sie und sendet MIDI. Ein Taster sendet eine Note, ein Drehregler einen Control Change.",
	],
	tutorial_electronics_actuator_title: "Was ist ein Aktor?",
	tutorial_electronics_actuator: [
		"Ein Aktor macht das Gegenteil: Er macht aus einem elektrischen Signal etwas, das man sehen, hören oder fühlen kann. LEDs leuchten, Servos und Motoren bewegen sich, Relais schalten andere Geräte ein und aus, Hubmagnete schlagen an.",
		"Bei enomik sind Aktoren Ausgänge: Der Client empfängt MIDI und steuert sie. Eine Note schaltet eine LED ein, ein Controller-Wert stellt den Winkel eines Servos ein.",
	],
	tutorial_electronics_digital_title: "Was ist digital?",
	tutorial_electronics_switch_intro:
		"Denk an einen Lichtschalter: Das Licht ist entweder aus oder an, dazwischen gibt es nichts. Ein digitales Signal funktioniert genauso.",
	tutorial_electronics_switch_off: "Aus",
	tutorial_electronics_switch_on: "An",
	tutorial_electronics_switch_label: "Ein Lichtschalter, aus und an",
	tutorial_electronics_digital: [
		"Ein digitales Signal kennt nur zwei Zustände: an oder aus, HIGH oder LOW. Bei ESP32-Boards ist HIGH 3,3 V und LOW 0 V (GND).",
		"Ein Taster ist ein typischer digitaler Eingang: gedrückt oder nicht gedrückt. Damit der Pin bei offenem Taster nicht in der Luft hängt, nutzt er einen Pull-up-Widerstand: Der Pin liest HIGH, bis der Taster ihn mit GND verbindet. Deshalb liest ein gedrückter Taster oft LOW.",
		"Digitale Ausgänge schalten etwas ganz ein oder aus, etwa eine LED oder ein Relais. In MIDI passt digital zu Note On und Note Off.",
	],
	tutorial_electronics_analog_title: "Was ist analog?",
	tutorial_electronics_dimmer_intro:
		"Denk jetzt an einen Dimmer: Du kannst das Licht auf jede Helligkeit zwischen aus und voll drehen. Ein analoges Signal funktioniert genauso, mit jeder Spannung zwischen 0 V und 3,3 V. Der Client macht aus dieser Spannung einen MIDI-Wert von 0 bis 127.",
	tutorial_electronics_dimmer_label:
		"Ein Dimmer auf aus, halb und voll, mit passender Spannung und passendem MIDI-Wert",
	tutorial_electronics_analog: [
		"Ein analoges Signal kann jeden Wert zwischen zwei Grenzen annehmen, zum Beispiel jede Spannung zwischen 0 V und 3,3 V. Potentiometer, Lichtsensoren und Drucksensoren liefern so eine veränderliche Spannung.",
		"Das Board misst sie mit einem Analog-Digital-Wandler (ADC), der die Spannung in eine Zahl umwandelt. Der Client rechnet diese Zahl auf den MIDI-Bereich 0–127 um.",
		"Nur manche Pins können analoge Werte lesen, prüfe also das Board-Layout. In MIDI passt analog zu Control-Change-Nachrichten: Ein Drehregler sendet beim Drehen eine Folge von Werten.",
	],
	tutorial_electronics_pwm_title: "Was ist PWM?",
	tutorial_electronics_pwm: [
		"Die meisten Mikrocontroller-Pins können keine echte analoge Spannung ausgeben. PWM (Pulsweitenmodulation) täuscht eine vor: Der Pin schaltet sehr schnell ein und aus, und der Anteil der Einschaltzeit, das Tastverhältnis, bestimmt die mittlere Leistung.",
		"Bei 25 % Tastverhältnis leuchtet eine LED schwach, bei 100 % voll. Der Pin schaltet tausende Male pro Sekunde, deshalb sieht dein Auge eine gleichmäßige Helligkeit statt Flackern.",
		"Servos nutzen eine besondere Form von PWM: Die Länge jedes Impulses bestimmt den Winkel (siehe Servo-Beispiel). Wähle im Konfigurator PWM für einen Ausgang, um eine LED über die Anschlagstärke oder einen Controller-Wert zu dimmen.",
	],
	tutorial_electronics_actuator_note:
		"Ein Pin liefert nur wenig Strom, etwa 20 mA. Das reicht für eine LED mit Vorwiderstand, aber nicht für Motoren, Hubmagnete oder lange LED-Streifen. Nutze dafür einen Transistor, ein Treiberboard oder ein Relais und ein eigenes Netzteil.",
	tutorial_electronics_digital_note:
		"ESP32-Pins arbeiten mit 3,3 V. Schließe nie ein 5-V-Signal direkt an einen Pin an, das kann das Board beschädigen.",
	tutorial_photo_credit: "Foto",
	tutorial_photo_button: "Taster",
	tutorial_photo_potentiometer: "Potentiometer",
	tutorial_photo_photoresistor: "Lichtsensoren (Fotowiderstände)",
	tutorial_photo_motion: "Bewegungssensor (MPU-6050)",
	tutorial_photo_leds: "LEDs",
	tutorial_photo_neopixels: "Adressierbare LEDs (WS2812B)",
	tutorial_photo_servo: "Servo (SG90)",
	tutorial_photo_relay: "Relais-Modul",
	tutorial_electronics_pwm_dim: "25 % an: schwach",
	tutorial_electronics_pwm_bright: "75 % an: hell",

	tutorial_midi_title: "MIDI-Grundlagen",
	tutorial_midi_text: [
		"MIDI (Musical Instrument Digital Interface) ist die Sprache, in der Instrumente, Controller und Computer seit 1983 miteinander sprechen. enomik spricht sie auf beiden Seiten: über USB mit deinem Computer und kabellos zwischen den Boards.",
		'MIDI überträgt keinen Klang. Es überträgt Nachrichten wie "spiel jetzt Note 60, ziemlich laut" oder "stell die Lautstärke auf 100". Wie das klingt, entscheidet der Synth, Sampler oder die DAW, die sie empfängt.',
	],
	tutorial_midi_messages_title: "Nachrichten",
	tutorial_midi_messages: [
		"Jede MIDI-Nachricht beginnt mit einem Status-Byte, das sagt, welche Art Nachricht es ist und auf welchem Kanal sie liegt. Danach folgen ein oder zwei Daten-Bytes. Datenwerte reichen immer von 0 bis 127.",
	],
	tutorial_midi_status: "Status",
	tutorial_midi_channel: "Kanal",
	tutorial_midi_note: "Note",
	tutorial_midi_velocity: "Anschlagstärke",
	tutorial_midi_controller: "Controller",
	tutorial_midi_value: "Wert",
	tutorial_midi_table_head: [
		"Nachricht",
		"Was sie tut",
		"Werte",
		"Typische Nutzung",
	],
	tutorial_midi_table: [
		[
			"Note On / Note Off",
			"Startet und stoppt eine Note",
			"Note 0–127, Anschlagstärke 0–127",
			"Taster drücken und loslassen, LED an und aus",
		],
		[
			"Control Change (CC)",
			"Ändert einen Parameter",
			"Controller 0–127, Wert 0–127",
			"Drehregler, Abstandssensor, Servo-Winkel, LED-Helligkeit",
		],
		[
			"Program Change",
			"Wechselt zu einem anderen Klang oder Preset",
			"Programm 0–127",
			"Presets per Taster umschalten",
		],
		[
			"Pitch Bend",
			"Verbiegt die Tonhöhe nach oben oder unten",
			"−8192 bis 8191 (14 Bit)",
			"Bewegungssensor kippen",
		],
		[
			"Aftertouch",
			"Druck, während eine Note gehalten wird",
			"0–127",
			"Drucksensor",
		],
		[
			"System Exclusive (SysEx)",
			"Gerätespezifische Daten",
			"Beliebige Länge",
			"So sendet enomik die Board-Konfiguration",
		],
	],
	tutorial_midi_notes_title: "Noten und Anschlagstärke",
	tutorial_midi_notes: [
		"Jede Note hat eine Nummer von 0 bis 127. Note 60 ist das mittlere C, das Software je nach Hersteller C4 oder C3 nennt. Eine Oktave höher heißt plus 12.",
		"Die Anschlagstärke (Velocity) sagt, wie stark die Note gespielt wird, von 1 (am leisesten) bis 127 (am stärksten). Ein Note On mit Anschlagstärke 0 gilt als Note Off.",
	],
	tutorial_midi_keyboard_label:
		"Eine Oktave einer Klaviatur mit den MIDI-Notennummern 60 bis 72, mittleres C hervorgehoben",
	tutorial_midi_keyboard_caption:
		"Mittleres C = Note 60. Eine Oktave höher = 72.",
	tutorial_midi_cc_title: "Control Change",
	tutorial_midi_cc: [
		"Control-Change-Nachrichten bewegen Regler und Fader in deiner Software. Die Controller-Nummer sagt, welcher Parameter, der Wert sagt, wohin.",
		"Manche Nummern haben eine übliche Bedeutung: 1 ist das Modulationsrad, 7 die Lautstärke, 10 das Panorama, 64 das Haltepedal. In den meisten DAWs kannst du jede andere Nummer per MIDI Learn zuweisen: Parameter anklicken, Regler bewegen, fertig.",
	],
	tutorial_midi_channels_title: "Kanäle",
	tutorial_midi_channels: [
		"Eine MIDI-Verbindung hat 16 Kanäle. Jede Nachricht wird auf einem davon gesendet, so können sich mehrere Instrumente eine Verbindung teilen und jedes hört nur auf seinen Kanal.",
		"Bei enomik teilen sich alle Clients über den Dongle eine Verbindung. Gib jedem Client oder jedem Sensor einen eigenen Kanal oder eigene Noten- und CC-Nummern, damit sie unterscheidbar bleiben.",
	],
	tutorial_midi_enomik_title: "MIDI bei enomik",
	tutorial_midi_enomik: [
		"Der Dongle erscheint in deiner DAW als gewöhnliches USB-MIDI-Gerät, genau wie ein Controller mit Kabel.",
		"Im Konfigurator legst du für jeden Pin fest, welche Nachricht er sendet oder auf welche er reagiert: Ein Taster sendet Note On und Note Off, ein Drehregler einen CC, eine LED leuchtet bei einer Note. Mit dem MIDI-Monitor siehst du die Nachrichten live.",
	],

	tutorial_platforms_title: "Wege, enomik zu nutzen",
	tutorial_platforms_text: [
		"Alle Wege nutzen dieselbe Open-Source-Bibliothek, ESP-NOW MIDI, und dasselbe Paketformat. Wähle, was zu deinem Projekt passt, oder kombiniere: Ein Board mit eigenem Sketch spricht mit einem Dongle, der über die Web-App geflasht wurde.",
	],
	tutorial_platforms_webapp_title: "Web-App (ohne Code)",
	tutorial_platforms_webapp:
		"Vorkompilierte Firmware mit dem Firmware Uploader flashen und Pins im Konfigurator mappen. Ideal für den Einstieg, Workshops und die meisten Controller-Projekte. Der Rest dieses Tutorials folgt diesem Weg.",
	tutorial_platforms_code_title: "Eigener Code",
	tutorial_platforms_code:
		"Lieber selbst programmieren? Die Bibliothek gibt es für mehrere Umgebungen. Jede hat ihr eigenes Unterkapitel:",
	tutorial_platforms_arduino_title: "Arduino",
	tutorial_platforms_circuitpython_title: "CircuitPython",
	tutorial_platforms_platformio_title: "PlatformIO",
	tutorial_platforms_idf_title: "ESP-IDF",
	tutorial_platforms_arduino_install_title: "Installation",
	tutorial_platforms_arduino_install: [
		'ESP32-Boards installieren: Öffne Werkzeuge → Board → Boardverwalter, suche nach "esp32" und installiere "esp32 by Espressif Systems" (Version 3.3.0 oder neuer).',
		'Bibliothek installieren: Öffne Sketch → Bibliothek einbinden → Bibliotheken verwalten, suche nach "ESP-NOW MIDI" und installiere sie.',
	],
	tutorial_lightbox_previous: "Vorheriges Bild",
	tutorial_lightbox_next: "Nächstes Bild",
	tutorial_lightbox_close: "Schließen",
	tutorial_screenshot_credit: "Screenshots",
	tutorial_screenshot_cropped: "zugeschnitten",
	tutorial_arduino_boards_1:
		"Klicke links in der Seitenleiste auf das Symbol für den Boardverwalter.",
	tutorial_arduino_boards_2:
		'Gib "esp32" ins Suchfeld ein und klicke bei "esp32 by Espressif Systems" auf Installieren.',
	tutorial_arduino_boards_3: "Danach wird das Paket als installiert angezeigt.",
	tutorial_arduino_library_1:
		"Klicke links in der Seitenleiste auf das Symbol für die Bibliotheksverwaltung.",
	tutorial_arduino_library_2:
		'Gib "ESP-NOW MIDI" ins Suchfeld ein und klicke auf Installieren.',
	tutorial_arduino_library_3:
		"Danach wird die Bibliothek als installiert angezeigt.",
	tutorial_arduino_screenshots_note:
		'Diese Screenshots stammen aus der Arduino-Dokumentation und zeigen ein anderes Board-Paket und eine andere Bibliothek. Die Schritte sind dieselben: Suche einfach nach "esp32" und "ESP-NOW MIDI".',
	tutorial_platforms_arduino_usage_title: "Verwendung",
	tutorial_platforms_arduino:
		"Öffne eines der Beispiele der Bibliothek über Datei → Beispiele → ESP-NOW MIDI. Das Client-Beispiel nutzt enomik::Client, denselben Code wie die vorkompilierte Firmware, dein eigener Sketch bleibt also über die Web-App konfigurierbar.",
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
		"Jedes Board braucht Firmware: einmal für den Dongle und einmal für jeden Client. Es gibt zwei Wege, sie hochzuladen. Der Web-Uploader braucht nur einen Browser. Die Arduino IDE baut die Firmware aus den Beispielen der Bibliothek, so kannst du den Code anpassen.",
	],
	tutorial_firmware_web_title: "Über den Web-Uploader",
	tutorial_firmware_arduino_title: "Über die Arduino IDE",
	tutorial_firmware_arduino_text: [
		"Baue die Firmware selbst aus den Beispielen der Bibliothek und lade sie hoch. Installiere zuerst die ESP32-Boards und die ESP-NOW-MIDI-Bibliothek wie im Arduino-Kapitel beschrieben.",
	],
	tutorial_firmware_arduino_link: "Arduino-Installation",
	tutorial_firmware_arduino_steps: [
		"Beispiel öffnen: Datei → Beispiele → ESP-NOW MIDI → client für Client-Boards, oder Datei → Beispiele → ESP-NOW MIDI → grantler_instruments → dongle für den Dongle.",
		"Wähle dein Board unter Werkzeuge → Board → esp32, z. B. LOLIN S2 Mini oder ESP32S3 Dev Module.",
		"ESP32-S2-Boards in den Bootloader-Modus versetzen: BOOT halten, RESET drücken und loslassen, dann BOOT loslassen.",
		"Wähle den Port unter Werkzeuge → Port und klicke auf Hochladen.",
		"Drücke RESET, wenn das Hochladen abgeschlossen ist. Das Board läuft jetzt mit der neuen Firmware.",
	],
	tutorial_firmware_arduino_tip:
		"Das Client-Beispiel nutzt denselben Code wie die vorkompilierte Client-Firmware, das Board bleibt also über die Web-App konfigurierbar.",
	tutorial_firmware_web_text: [
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

	tutorial_examples_title: "Beispiele",
	tutorial_examples_text: [
		"Kleine Projekte, die zeigen, was ein Client kann. Konfiguriere die vorkompilierte Client-Firmware in der Web-App oder baue deine eigene Firmware aus Code:",
	],
	tutorial_examples_webapp_title: "Über die Web-App",
	tutorial_examples_webapp_text: [
		"Diese Beispiele nutzen die vorkompilierte Client-Firmware. Verdrahte die Hardware und richte alles im Konfigurator ein, ganz ohne Code:",
	],
	tutorial_examples_code_title: "Über Code",
	tutorial_examples_code_text: [
		"Diese Beispiele nutzen Sketches aus der Bibliothek, die du mit der Arduino IDE baust und hochlädst. Nutze sie für Hardware, die eigenen Treibercode braucht, etwa I2C-Sensoren:",
	],

	tutorial_pairing_title: "Kabellos koppeln",
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

	tutorial_button_title: "Taster zu Note",
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

	tutorial_knob_title: "Drehregler zu CC",
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

	tutorial_led_title: "MIDI zu LED",
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

	tutorial_i2c_title: "I2C-Abstandssensor (VL53L0X)",
	tutorial_i2c_text: [
		"In diesem Beispiel misst ein VL53L0X Time-of-Flight-Sensor den Abstand zu deiner Hand, und der Client macht daraus MIDI. Der Sensor spricht über I2C mit dem Board.",
	],
	tutorial_i2c_about_title: "Was ist I2C?",
	tutorial_i2c_about: [
		'I2C (Inter-Integrated Circuit, gesprochen "I-Quadrat-C") ist ein Bus: gemeinsame Leitungen, über die das Board mit vielen Chips über nur zwei Signalleitungen spricht. Das Board ist der Controller und beginnt jedes Gespräch; Sensoren und Displays antworten als Targets.',
		"SDA (Serial Data) überträgt die Bits in beide Richtungen. SCL (Serial Clock) ist ein gleichmäßiger Takt vom Controller, der allen Geräten sagt, wann sie das nächste Bit lesen. Zusammen mit GND und VCC für die Versorgung braucht ein I2C-Gerät vier Leitungen.",
		"Jedes Gerät hat eine feste Adresse, der VL53L0X zum Beispiel 0x29. Der Controller ruft eine Adresse auf und nur dieses Gerät antwortet. Deshalb können mehrere Sensoren an denselben zwei Leitungen hängen, solange jeder eine andere Adresse hat.",
		"I2C ist für kurze Strecken gedacht, auf einer Platine oder über einige zehn Zentimeter Kabel. Längere Kabel machen das Signal unzuverlässig.",
		"Viele gängige Bauteile sprechen I2C: Abstandssensoren, Beschleunigungs- und Drehratensensoren, OLED-Displays, Port-Expander. Anders als ein Taster oder Drehregler hat jeder dieser Chips eigene Register und braucht Treibercode. Deshalb nutzt dieses Beispiel einen eigenen Sketch statt der generischen Client-Firmware.",
	],
	tutorial_i2c_wiring:
		"Jeder I2C-Sensor hat vier Pins. Verbinde sie mit Jumper-Kabeln mit dem Board:",
	tutorial_i2c_pins: [
		"SDA (Daten) an den SDA-Pin des Boards.",
		"SCL (Takt) an den SCL-Pin des Boards.",
		"GND an GND.",
		"VCC an 3,3 V (die meisten Breakout-Boards vertragen auch 5 V, prüfe deinen Sensor).",
	],
	tutorial_i2c_board_note:
		"Du nutzt ein enomik-Board? Prüfe das Board-Layout auf der Seite Kits & Boards: Der I2C-Bus ist bereits auf die Grove-Ports herausgeführt, du kannst den Sensor also ohne Jumper-Kabel anstecken.",
	tutorial_i2c_upload_title: "Hochladen",
	tutorial_i2c_upload: [
		"Öffne das VL53L0X-Beispiel in der Arduino IDE: Datei → Beispiele → ESP-NOW MIDI → client_vl53l0x.",
		"Wähle Board und Port und klicke auf Hochladen, wie im Kapitel zur Firmware über die Arduino IDE beschrieben.",
		"Drücke RESET, wenn das Hochladen abgeschlossen ist.",
	],
	tutorial_i2c_upload_link: "Firmware über die Arduino IDE",
	tutorial_i2c_test:
		"Öffne den MIDI-Monitor und bewege deine Hand über dem Sensor. Die MIDI-Nachrichten ändern sich mit dem Abstand.",

	tutorial_servo_title: "Servomotor",
	tutorial_servo_text: [
		"In diesem Beispiel empfängt der Client MIDI und dreht einen Modellbau-Servo auf einen passenden Winkel. Ideal für bewegliche Teile in Installationen, Puppen oder mechanischen Instrumenten.",
	],
	tutorial_servo_about_title: "So funktioniert ein Servo",
	tutorial_servo_about: [
		"Ein Modellbau-Servo ist ein kleiner Motor mit Getriebe und eingebauter Positionsregelung. Er dreht auf einen Winkel, meist zwischen 0° und 180°, und hält ihn.",
		"Der Winkel wird über einen Impuls auf der Signalleitung eingestellt, etwa 50-mal pro Sekunde wiederholt: rund 1 ms bedeutet ein Ende, 2 ms das andere Ende, 1,5 ms die Mitte. Der Sketch erzeugt diese Impulse und rechnet den eingehenden MIDI-Wert in einen Winkel um.",
	],
	tutorial_servo_wiring:
		"Ein Servo hat drei Leitungen. Die Farben unterscheiden sich je nach Hersteller:",
	tutorial_servo_pins: [
		"Braun oder schwarz: GND an GND des Boards.",
		"Rot: VCC an 5 V.",
		"Orange, gelb oder weiß: Signal an GPIO 40 (SERVO_PIN im Sketch).",
	],
	tutorial_servo_power:
		"Servos ziehen beim Bewegen viel Strom, oft mehr als der USB-Port des Boards liefern kann, was das Board neu starten lassen kann. Für größere oder mehrere Servos nutze ein eigenes 5-V-Netzteil und verbinde dessen GND mit dem GND des Boards.",
	tutorial_servo_code_title: "Code",
	tutorial_servo_code_before: "Der komplette Sketch:",
	tutorial_servo_code_after: [
		"Der Sketch nutzt enomik::Client für das kabellose MIDI und die Bibliothek ESP32Servo für die Impulse. onControlChange ignoriert alles außer CC 40 auf Kanal 1 und rechnet den Wert 0–127 in 0–180° um. Bewegt wird der Servo in loop(), außerhalb des ESP-NOW-Empfangs-Callbacks.",
		"Für einen anderen Pin änderst du SERVO_PIN; die CC-Nummer folgt ihm. Setze SERVO_CC_VALUE_IS_DEGREES auf 1, wenn der CC-Wert direkt der Winkel sein soll (dann sind nur 0–127° erreichbar).",
	],
	tutorial_servo_upload: [
		'Installiere die Bibliothek ESP32Servo: Sketch → Bibliothek einbinden → Bibliotheken verwalten, nach "ESP32Servo" suchen und installieren.',
		"Öffne das Servo-Beispiel in der Arduino IDE: Datei → Beispiele → ESP-NOW MIDI → client_servo.",
		"Wähle Board und Port und klicke auf Hochladen, wie im Kapitel zur Firmware über die Arduino IDE beschrieben.",
		"Drücke RESET, wenn das Hochladen abgeschlossen ist.",
	],
	tutorial_servo_test:
		"Sende CC 40 auf MIDI-Kanal 1 aus deiner DAW über den Dongle. Wert 0 dreht den Servo auf 0°, 64 etwa in die Mitte, 127 auf 180°.",

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
	tutorial_source_link: "{{path}} en GitHub",
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
		"Un sistema enomik tiene tres partes: un host MIDI, un dongle y uno o más clientes. Los clientes se conectan a tus sensores y actuadores. Una ampliación opcional añade más pines a un cliente. Un cliente también puede conectarse directamente al host por USB, sin dongle.",
	],
	tutorial_architecture_host: "Host MIDI",
	tutorial_architecture_host_desc:
		"Ordenador, teléfono o cualquier cosa que hable USB MIDI: DAW, Max, Pure Data, el navegador.",
	tutorial_architecture_dongle_desc:
		"Dispositivo USB MIDI class-compliant. Conecta USB MIDI con ESP-NOW y viceversa.",
	tutorial_architecture_clients: "Clientes",
	tutorial_architecture_client_desc:
		"Leen entradas y envían MIDI. Reciben MIDI y controlan salidas.",
	tutorial_architecture_extender: "Ampliación (opcional)",
	tutorial_architecture_extender_desc:
		"Más entradas y salidas, conectada al cliente con un cable plano.",
	tutorial_architecture_pins: "Pines",
	tutorial_architecture_sensors: "Sensores",
	tutorial_architecture_sensors_desc:
		"Entradas: el cliente las lee y envía MIDI.",
	tutorial_architecture_sensors_examples: [
		"Botones",
		"Potenciómetros",
		"Pads táctiles",
		"Sensor de distancia (VL53L0X)",
		"Sensor de movimiento (MPU6500)",
	],
	tutorial_architecture_actuators: "Actuadores",
	tutorial_architecture_actuators_desc:
		"Salidas: el cliente las controla con el MIDI recibido.",
	tutorial_architecture_actuators_examples: [
		"LEDs",
		"NeoPixels",
		"Servos",
		"Relés",
		"Luces DMX",
	],
	tutorial_architecture_usb_direct: "USB MIDI (cable, sin dongle)",
	tutorial_architecture_usb: "USB MIDI",
	tutorial_architecture_details: [
		"ESP-NOW es un protocolo sin conexión de Espressif que usa la radio Wi-Fi. Las placas se comunican directamente, direccionadas por su MAC. Sin router, sin red y sin emparejamiento Bluetooth, lo que mantiene la latencia baja.",
		"El dongle reenvía todo lo que recibe por USB a sus peers inalámbricos, y todo lo que viene de ellos de vuelta a USB. Tu DAW solo ve un dispositivo MIDI normal.",
		"El firmware de cliente es genérico: no hace nada hasta que le indicas qué pines leer y qué mensajes enviar. La app web envía esta configuración como SysEx MIDI por USB y la placa la guarda en su memoria flash. Sobrevive a los reinicios: configuras una vez y luego usas la placa con batería o power bank.",
		"Los mensajes van en ambas direcciones. Un cliente puede ser controlador (pin a MIDI), instrumento o actuador (MIDI a pin), o ambos a la vez.",
	],

	tutorial_electronics_title: "Electrónica básica",
	tutorial_electronics_text: [
		"Algunos conceptos básicos antes de cablear tu primer proyecto. Este capítulo explica los términos que se usan en el tutorial y en el Configurador.",
	],
	tutorial_electronics_sensor_title: "¿Qué es un sensor?",
	tutorial_electronics_sensor: [
		"Un sensor convierte algo del mundo físico en una señal eléctrica que la placa puede leer: una pulsación, una posición, luz, distancia o movimiento.",
		"Los sensores simples, como botones y potenciómetros, cambian la tensión en un pin. Los más complejos, como los sensores de distancia o de movimiento, tienen su propio chip y envían números por un bus como I2C.",
		"En enomik, los sensores son entradas: el cliente los lee y envía MIDI. Un botón envía una nota, un potenciómetro un control change.",
	],
	tutorial_electronics_actuator_title: "¿Qué es un actuador?",
	tutorial_electronics_actuator: [
		"Un actuador hace lo contrario: convierte una señal eléctrica en algo que puedes ver, oír o sentir. Los LEDs se encienden, los servos y motores se mueven, los relés encienden y apagan otros aparatos, los solenoides golpean.",
		"En enomik, los actuadores son salidas: el cliente recibe MIDI y los controla. Una nota enciende un LED, un valor de controlador fija el ángulo de un servo.",
	],
	tutorial_electronics_digital_title: "¿Qué es digital?",
	tutorial_electronics_switch_intro:
		"Piensa en un interruptor de la luz: la luz está apagada o encendida, no hay nada intermedio. Una señal digital funciona igual.",
	tutorial_electronics_switch_off: "Apagado",
	tutorial_electronics_switch_on: "Encendido",
	tutorial_electronics_switch_label:
		"Un interruptor de la luz, apagado y encendido",
	tutorial_electronics_digital: [
		"Una señal digital solo conoce dos estados: encendido o apagado, HIGH o LOW. En las placas ESP32, HIGH es 3,3 V y LOW es 0 V (GND).",
		"Un botón es una entrada digital típica: pulsado o no pulsado. Para que el pin no quede flotando con el botón abierto, usa una resistencia pull-up: el pin lee HIGH hasta que el botón lo conecta a GND. Por eso un botón pulsado suele leer LOW.",
		"Las salidas digitales encienden o apagan algo por completo, como un LED o un relé. En MIDI, lo digital encaja con note on y note off.",
	],
	tutorial_electronics_analog_title: "¿Qué es analógico?",
	tutorial_electronics_dimmer_intro:
		"Ahora piensa en un regulador de luz: puedes girar la luz a cualquier brillo entre apagado y máximo. Una señal analógica funciona igual, con cualquier tensión entre 0 V y 3,3 V. El cliente convierte esa tensión en un valor MIDI de 0 a 127.",
	tutorial_electronics_dimmer_label:
		"Un regulador de luz en apagado, medio y máximo, con la tensión y el valor MIDI correspondientes",
	tutorial_electronics_analog: [
		"Una señal analógica puede tomar cualquier valor entre dos límites, por ejemplo cualquier tensión entre 0 V y 3,3 V. Potenciómetros, sensores de luz y de presión producen una tensión así.",
		"La placa la mide con un convertidor analógico-digital (ADC), que convierte la tensión en un número. El cliente escala ese número al rango MIDI 0–127.",
		"Solo algunos pines pueden leer valores analógicos, así que consulta el diseño de la placa. En MIDI, lo analógico encaja con mensajes control change: un potenciómetro envía una serie de valores al girarlo.",
	],
	tutorial_electronics_pwm_title: "¿Qué es PWM?",
	tutorial_electronics_pwm: [
		"La mayoría de los pines de un microcontrolador no pueden dar una tensión analógica real. PWM (modulación por ancho de pulso) la simula: el pin se enciende y apaga muy rápido, y la proporción de tiempo encendido, el ciclo de trabajo, fija la potencia media.",
		"Con un ciclo de trabajo del 25 % un LED brilla poco, con el 100 % brilla al máximo. El pin conmuta miles de veces por segundo, así que tu ojo ve un brillo constante en lugar de parpadeo.",
		"Los servos usan un tipo especial de PWM: la duración de cada pulso fija el ángulo (ver el ejemplo del servo). En el Configurador, elige PWM para una salida y podrás regular un LED con la velocidad de la nota o un valor de controlador.",
	],
	tutorial_electronics_actuator_note:
		"Un pin solo puede dar poca corriente, unos 20 mA. Basta para un LED con resistencia, pero no para motores, solenoides o tiras de LED largas. Para eso usa un transistor, una placa driver o un relé, y una fuente de alimentación aparte.",
	tutorial_electronics_digital_note:
		"Los pines del ESP32 funcionan a 3,3 V. Nunca conectes una señal de 5 V directamente a un pin, puede dañar la placa.",
	tutorial_photo_credit: "Foto",
	tutorial_photo_button: "Pulsadores",
	tutorial_photo_potentiometer: "Potenciómetro",
	tutorial_photo_photoresistor: "Sensores de luz (fotorresistencias)",
	tutorial_photo_motion: "Sensor de movimiento (MPU-6050)",
	tutorial_photo_leds: "LEDs",
	tutorial_photo_neopixels: "LEDs direccionables (WS2812B)",
	tutorial_photo_servo: "Servo (SG90)",
	tutorial_photo_relay: "Módulo de relé",
	tutorial_electronics_pwm_dim: "25 % encendido: tenue",
	tutorial_electronics_pwm_bright: "75 % encendido: brillante",

	tutorial_midi_title: "Conceptos básicos de MIDI",
	tutorial_midi_text: [
		"MIDI (Musical Instrument Digital Interface) es el lenguaje con el que instrumentos, controladores y ordenadores se comunican desde 1983. enomik lo habla en ambos extremos: por USB con tu ordenador y de forma inalámbrica entre placas.",
		'MIDI no transporta sonido. Transporta mensajes como "toca ahora la nota 60, bastante fuerte" o "pon el volumen a 100". El sintetizador, sampler o DAW que los recibe decide cómo suena.',
	],
	tutorial_midi_messages_title: "Mensajes",
	tutorial_midi_messages: [
		"Cada mensaje MIDI empieza con un byte de estado que indica qué tipo de mensaje es y en qué canal va. Le siguen uno o dos bytes de datos. Los valores de datos siempre van de 0 a 127.",
	],
	tutorial_midi_status: "Estado",
	tutorial_midi_channel: "canal",
	tutorial_midi_note: "Nota",
	tutorial_midi_velocity: "Velocidad",
	tutorial_midi_controller: "Controlador",
	tutorial_midi_value: "Valor",
	tutorial_midi_table_head: ["Mensaje", "Qué hace", "Valores", "Uso típico"],
	tutorial_midi_table: [
		[
			"Note On / Note Off",
			"Inicia y detiene una nota",
			"Nota 0–127, velocidad 0–127",
			"Pulsar y soltar un botón, encender y apagar un LED",
		],
		[
			"Control Change (CC)",
			"Cambia un parámetro",
			"Controlador 0–127, valor 0–127",
			"Potenciómetro, sensor de distancia, ángulo de servo, brillo de LED",
		],
		[
			"Program Change",
			"Cambia a otro sonido o preset",
			"Programa 0–127",
			"Cambiar presets con un botón",
		],
		[
			"Pitch Bend",
			"Desplaza la afinación arriba o abajo",
			"−8192 a 8191 (14 bits)",
			"Inclinar un sensor de movimiento",
		],
		[
			"Aftertouch",
			"Presión mientras se mantiene una nota",
			"0–127",
			"Sensor de presión",
		],
		[
			"System Exclusive (SysEx)",
			"Datos específicos del dispositivo",
			"Cualquier longitud",
			"Así envía enomik la configuración a la placa",
		],
	],
	tutorial_midi_notes_title: "Notas y velocidad",
	tutorial_midi_notes: [
		"Cada nota tiene un número de 0 a 127. La nota 60 es el do central, que el software llama C4 o C3 según el fabricante. Una octava más arriba suma 12.",
		"La velocidad indica con qué fuerza se toca la nota, de 1 (más suave) a 127 (más fuerte). Un note on con velocidad 0 cuenta como note off.",
	],
	tutorial_midi_keyboard_label:
		"Una octava de teclado con los números de nota MIDI 60 a 72, do central resaltado",
	tutorial_midi_keyboard_caption:
		"Do central = nota 60. Una octava más arriba = 72.",
	tutorial_midi_cc_title: "Control change",
	tutorial_midi_cc: [
		"Los mensajes control change mueven potenciómetros y faders en tu software. El número de controlador indica qué parámetro y el valor dónde ponerlo.",
		"Algunos números tienen un significado habitual: 1 es la rueda de modulación, 7 el volumen, 10 el panorama, 64 el pedal de sustain. La mayoría de DAWs permiten asignar cualquier otro número con MIDI learn: haz clic en un parámetro, mueve tu potenciómetro y listo.",
	],
	tutorial_midi_channels_title: "Canales",
	tutorial_midi_channels: [
		"Una conexión MIDI tiene 16 canales. Cada mensaje se envía por uno de ellos, así varios instrumentos pueden compartir una conexión y cada uno escucha solo su canal.",
		"Con enomik, todos los clientes comparten una conexión a través del dongle. Da a cada cliente o sensor su propio canal, o sus propios números de nota y CC, para distinguirlos.",
	],
	tutorial_midi_enomik_title: "MIDI en enomik",
	tutorial_midi_enomik: [
		"El dongle aparece en tu DAW como un dispositivo USB MIDI normal, igual que un controlador con cable.",
		"En el Configurador eliges para cada pin qué mensaje envía o a cuál reacciona: un botón envía note on y note off, un potenciómetro un CC, un LED se enciende con una nota. Usa el monitor MIDI para ver los mensajes en directo.",
	],

	tutorial_platforms_title: "Formas de usar enomik",
	tutorial_platforms_text: [
		"Todas las opciones comparten la misma biblioteca de código abierto, ESP-NOW MIDI, y el mismo formato de paquetes. Elige la que encaje con tu proyecto o combínalas: una placa con tu propio sketch habla con un dongle flasheado desde la app web.",
	],
	tutorial_platforms_webapp_title: "App web (sin código)",
	tutorial_platforms_webapp:
		"Flashea firmware precompilado con el Cargador de Firmware y asigna pines en el Configurador. Ideal para empezar, talleres y la mayoría de proyectos de controladores. El resto del tutorial sigue este camino.",
	tutorial_platforms_code_title: "Tu propio código",
	tutorial_platforms_code:
		"¿Prefieres programar tú mismo? La biblioteca está disponible para varios entornos. Cada uno tiene su propio subcapítulo:",
	tutorial_platforms_arduino_title: "Arduino",
	tutorial_platforms_circuitpython_title: "CircuitPython",
	tutorial_platforms_platformio_title: "PlatformIO",
	tutorial_platforms_idf_title: "ESP-IDF",
	tutorial_platforms_arduino_install_title: "Instalación",
	tutorial_platforms_arduino_install: [
		'Instala las placas ESP32: abre Herramientas → Placa → Gestor de placas, busca "esp32" e instala "esp32 by Espressif Systems" (versión 3.3.0 o superior).',
		'Instala la biblioteca: abre Programa → Incluir biblioteca → Administrar bibliotecas, busca "ESP-NOW MIDI" e instálala.',
	],
	tutorial_lightbox_previous: "Imagen anterior",
	tutorial_lightbox_next: "Imagen siguiente",
	tutorial_lightbox_close: "Cerrar",
	tutorial_screenshot_credit: "Capturas",
	tutorial_screenshot_cropped: "recortadas",
	tutorial_arduino_boards_1:
		"Haz clic en el icono del Gestor de placas en la barra lateral izquierda.",
	tutorial_arduino_boards_2:
		'Escribe "esp32" en el campo de búsqueda y haz clic en Instalar en "esp32 by Espressif Systems".',
	tutorial_arduino_boards_3: "Al terminar, el paquete aparece como instalado.",
	tutorial_arduino_library_1:
		"Haz clic en el icono del Gestor de bibliotecas en la barra lateral izquierda.",
	tutorial_arduino_library_2:
		'Escribe "ESP-NOW MIDI" en el campo de búsqueda y haz clic en Instalar.',
	tutorial_arduino_library_3:
		"Al terminar, la biblioteca aparece como instalada.",
	tutorial_arduino_screenshots_note:
		'Estas capturas proceden de la documentación de Arduino y muestran otro paquete de placas y otra biblioteca. Los pasos son los mismos: busca "esp32" y "ESP-NOW MIDI".',
	tutorial_platforms_arduino_usage_title: "Uso",
	tutorial_platforms_arduino:
		"Abre uno de los ejemplos de la biblioteca en Archivo → Ejemplos → ESP-NOW MIDI. El ejemplo client usa enomik::Client, el mismo código que el firmware precompilado, así que tu sketch sigue siendo configurable desde la app web.",
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
		"Cada placa necesita firmware: una vez para el dongle y una vez para cada cliente. Hay dos formas de subirlo. El cargador web solo necesita un navegador. El Arduino IDE compila el firmware a partir de los ejemplos de la biblioteca, así puedes modificar el código.",
	],
	tutorial_firmware_web_title: "Con el cargador web",
	tutorial_firmware_arduino_title: "Con el Arduino IDE",
	tutorial_firmware_arduino_text: [
		"Compila y sube el firmware tú mismo a partir de los ejemplos de la biblioteca. Primero instala las placas ESP32 y la biblioteca ESP-NOW MIDI como se describe en el capítulo de Arduino.",
	],
	tutorial_firmware_arduino_link: "Instalación de Arduino",
	tutorial_firmware_arduino_steps: [
		"Abre el ejemplo: Archivo → Ejemplos → ESP-NOW MIDI → client para placas cliente, o Archivo → Ejemplos → ESP-NOW MIDI → grantler_instruments → dongle para el dongle.",
		"Selecciona tu placa en Herramientas → Placa → esp32, p. ej. LOLIN S2 Mini o ESP32S3 Dev Module.",
		"Pon las placas ESP32-S2 en modo bootloader: mantén BOOT, pulsa y suelta RESET y luego suelta BOOT.",
		"Selecciona el puerto en Herramientas → Puerto y haz clic en Subir.",
		"Pulsa RESET cuando termine la subida. La placa ya ejecuta el nuevo firmware.",
	],
	tutorial_firmware_arduino_tip:
		"El ejemplo client usa el mismo código que el firmware de cliente precompilado, así que la placa sigue siendo configurable desde la app web.",
	tutorial_firmware_web_text: [
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

	tutorial_examples_title: "Ejemplos",
	tutorial_examples_text: [
		"Pequeños proyectos que muestran lo que puede hacer un cliente. Configura el firmware de cliente precompilado en la app web o crea tu propio firmware con código:",
	],
	tutorial_examples_webapp_title: "Con la app web",
	tutorial_examples_webapp_text: [
		"Estos ejemplos usan el firmware de cliente precompilado. Conecta el hardware y configúralo todo en el Configurador, sin código:",
	],
	tutorial_examples_code_title: "Con código",
	tutorial_examples_code_text: [
		"Estos ejemplos usan sketches de la biblioteca que compilas y subes con el Arduino IDE. Úsalos para hardware que necesita su propio código de driver, como sensores I2C:",
	],

	tutorial_pairing_title: "Emparejamiento inalámbrico",
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

	tutorial_button_title: "Botón a nota",
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

	tutorial_knob_title: "Potenciómetro a CC",
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

	tutorial_led_title: "MIDI a LED",
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

	tutorial_i2c_title: "Sensor de distancia I2C (VL53L0X)",
	tutorial_i2c_text: [
		"En este ejemplo, un sensor time-of-flight VL53L0X mide la distancia a tu mano y el cliente la convierte en MIDI. El sensor se comunica con la placa por I2C.",
	],
	tutorial_i2c_about_title: "¿Qué es I2C?",
	tutorial_i2c_about: [
		'I2C (Inter-Integrated Circuit, pronunciado "I-cuadrado-C") es un bus: un conjunto de cables compartidos que permite a la placa comunicarse con muchos chips usando solo dos líneas de señal. La placa es el controlador e inicia cada conversación; sensores y pantallas responden como targets.',
		"SDA (serial data) transporta los bits en ambas direcciones. SCL (serial clock) es un pulso constante del controlador que indica a todos los dispositivos cuándo leer el siguiente bit. Junto con GND y VCC para la alimentación, un dispositivo I2C necesita cuatro cables.",
		"Cada dispositivo tiene una dirección fija, el VL53L0X por ejemplo 0x29. El controlador llama a una dirección y solo ese dispositivo responde. Por eso varios sensores pueden compartir los mismos dos cables, siempre que cada uno tenga una dirección distinta.",
		"I2C está pensado para distancias cortas, dentro de una placa o con unas decenas de centímetros de cable. Los cables más largos hacen que la señal sea poco fiable.",
		"Muchos componentes comunes usan I2C: sensores de distancia, acelerómetros y giroscopios, pantallas OLED, expansores de puertos. A diferencia de un botón o un potenciómetro, cada uno de estos chips tiene sus propios registros y necesita código de driver, así que este ejemplo usa un sketch propio en lugar del firmware de cliente genérico.",
	],
	tutorial_i2c_wiring:
		"Cada sensor I2C tiene cuatro pines. Conéctalos a la placa con cables jumper:",
	tutorial_i2c_pins: [
		"SDA (datos) al pin SDA de la placa.",
		"SCL (reloj) al pin SCL de la placa.",
		"GND a GND.",
		"VCC a 3,3 V (la mayoría de módulos también aceptan 5 V, comprueba tu sensor).",
	],
	tutorial_i2c_board_note:
		"¿Usas una placa enomik? Consulta el diseño de la placa en la página Kits y placas: el bus I2C ya está disponible en los puertos Grove, así que puedes conectar el sensor sin cables jumper.",
	tutorial_i2c_upload_title: "Subir",
	tutorial_i2c_upload: [
		"Abre el ejemplo VL53L0X en el Arduino IDE: Archivo → Ejemplos → ESP-NOW MIDI → client_vl53l0x.",
		"Selecciona la placa y el puerto y haz clic en Subir, como se describe en el capítulo de firmware con el Arduino IDE.",
		"Pulsa RESET cuando termine la subida.",
	],
	tutorial_i2c_upload_link: "Firmware con el Arduino IDE",
	tutorial_i2c_test:
		"Abre el monitor MIDI y mueve la mano sobre el sensor. Los mensajes MIDI cambian con la distancia.",

	tutorial_servo_title: "Servomotor",
	tutorial_servo_text: [
		"En este ejemplo el cliente recibe MIDI y gira un servo de modelismo al ángulo correspondiente. Úsalo para partes móviles en instalaciones, marionetas o instrumentos mecánicos.",
	],
	tutorial_servo_about_title: "Cómo funciona un servo",
	tutorial_servo_about: [
		"Un servo de modelismo es un pequeño motor con reductora y control de posición integrado. Gira hasta un ángulo, normalmente entre 0° y 180°, y lo mantiene.",
		"El ángulo se fija con un pulso en el cable de señal, repetido unas 50 veces por segundo: alrededor de 1 ms es un extremo, 2 ms el otro, 1,5 ms el centro. El sketch genera estos pulsos y convierte el valor MIDI recibido en un ángulo.",
	],
	tutorial_servo_wiring:
		"Un servo tiene tres cables. Sus colores varían según el fabricante:",
	tutorial_servo_pins: [
		"Marrón o negro: GND a GND de la placa.",
		"Rojo: VCC a 5 V.",
		"Naranja, amarillo o blanco: señal a GPIO 40 (SERVO_PIN en el sketch).",
	],
	tutorial_servo_power:
		"Los servos consumen mucha corriente al moverse, a menudo más de la que puede dar el puerto USB de la placa, lo que puede reiniciarla. Para servos grandes o varios a la vez, usa una fuente de 5 V aparte y conecta su GND al GND de la placa.",
	tutorial_servo_code_title: "Código",
	tutorial_servo_code_before: "El sketch completo:",
	tutorial_servo_code_after: [
		"El sketch usa enomik::Client para el MIDI inalámbrico y la biblioteca ESP32Servo para los pulsos. onControlChange ignora todo excepto el CC 40 en el canal 1 y convierte el valor 0–127 en 0–180°. El servo se mueve en loop(), fuera del callback de recepción de ESP-NOW.",
		"Para usar otro pin, cambia SERVO_PIN; el número de CC lo sigue. Pon SERVO_CC_VALUE_IS_DEGREES a 1 si prefieres que el valor del CC sea directamente el ángulo (entonces solo se alcanzan 0–127°).",
	],
	tutorial_servo_upload: [
		'Instala la biblioteca ESP32Servo: Programa → Incluir biblioteca → Administrar bibliotecas, busca "ESP32Servo" e instálala.',
		"Abre el ejemplo del servo en el Arduino IDE: Archivo → Ejemplos → ESP-NOW MIDI → client_servo.",
		"Selecciona la placa y el puerto y haz clic en Subir, como se describe en el capítulo de firmware con el Arduino IDE.",
		"Pulsa RESET cuando termine la subida.",
	],
	tutorial_servo_test:
		"Envía el CC 40 en el canal MIDI 1 desde tu DAW a través del dongle. El valor 0 gira el servo a 0°, 64 aproximadamente al centro, 127 a 180°.",

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
	tutorial_source_link: "GitHub 上的 {{path}}",
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
		"一个 enomik 系统由三部分组成：MIDI 主机、适配器和一个或多个客户端。客户端连接你的传感器和执行器。可选的扩展板可为客户端增加更多引脚。客户端也可以通过 USB 直接连接到主机，无需适配器。",
	],
	tutorial_architecture_host: "MIDI 主机",
	tutorial_architecture_host_desc:
		"电脑、手机或任何支持 USB MIDI 的设备：DAW、Max、Pure Data、浏览器。",
	tutorial_architecture_dongle_desc:
		"免驱 USB MIDI 设备，在 USB MIDI 与 ESP-NOW 之间双向桥接。",
	tutorial_architecture_clients: "客户端",
	tutorial_architecture_client_desc:
		"读取输入并发送 MIDI；接收 MIDI 并驱动输出。",
	tutorial_architecture_extender: "扩展板（可选）",
	tutorial_architecture_extender_desc: "更多输入和输出，通过排线连接到客户端。",
	tutorial_architecture_pins: "引脚",
	tutorial_architecture_sensors: "传感器",
	tutorial_architecture_sensors_desc: "输入：客户端读取并发送 MIDI。",
	tutorial_architecture_sensors_examples: [
		"按钮",
		"旋钮",
		"触摸板",
		"距离传感器 (VL53L0X)",
		"运动传感器 (MPU6500)",
	],
	tutorial_architecture_actuators: "执行器",
	tutorial_architecture_actuators_desc:
		"输出：客户端根据收到的 MIDI 驱动它们。",
	tutorial_architecture_actuators_examples: [
		"LED",
		"NeoPixel",
		"舵机",
		"继电器",
		"DMX 灯光",
	],
	tutorial_architecture_usb_direct: "USB MIDI（有线，无需适配器）",
	tutorial_architecture_usb: "USB MIDI",
	tutorial_architecture_details: [
		"ESP-NOW 是乐鑫推出的无连接协议，运行在 Wi-Fi 射频上。开发板之间通过 MAC 地址直接通信，无需路由器、无需加入网络、也无需蓝牙配对，因此延迟很低。",
		"适配器将通过 USB 收到的所有内容转发给无线对端，并将对端的消息转发回 USB。你的 DAW 只看到一个普通的 MIDI 设备。",
		"客户端固件是通用的：在你告诉它读取哪些引脚、发送哪些消息之前，它什么也不做。网页应用通过 USB 以 MIDI SysEx 发送配置，开发板将其保存在闪存中。重启后配置依然保留，所以只需配置一次，之后即可用电池或充电宝供电运行。",
		"消息双向流动。客户端可以是控制器（引脚到 MIDI）、乐器或执行器（MIDI 到引脚），也可以同时兼任。",
	],

	tutorial_electronics_title: "电子基础",
	tutorial_electronics_text: [
		"在连接第一个项目之前，先了解一些基础知识。本章解释教程和配置器中用到的术语。",
	],
	tutorial_electronics_sensor_title: "什么是传感器？",
	tutorial_electronics_sensor: [
		"传感器把物理世界中的事物转换为开发板可以读取的电信号：按压、位置、光线、距离或运动。",
		"按钮和电位器等简单传感器会改变引脚上的电压。距离或运动传感器等复杂传感器自带芯片，通过 I2C 等总线发送数值。",
		"在 enomik 中，传感器是输入：客户端读取它们并发送 MIDI。按钮发送音符，旋钮发送控制变化（CC）。",
	],
	tutorial_electronics_actuator_title: "什么是执行器？",
	tutorial_electronics_actuator: [
		"执行器的作用正好相反：它把电信号变成可以看到、听到或感觉到的东西。LED 发光，舵机和电机转动，继电器开关其他设备，电磁铁敲击。",
		"在 enomik 中，执行器是输出：客户端接收 MIDI 并驱动它们。音符可以点亮 LED，控制器数值可以设置舵机角度。",
	],
	tutorial_electronics_digital_title: "什么是数字信号？",
	tutorial_electronics_switch_intro:
		"想想电灯开关：灯要么关，要么开，没有中间状态。数字信号也是这样。",
	tutorial_electronics_switch_off: "关",
	tutorial_electronics_switch_on: "开",
	tutorial_electronics_switch_label: "电灯开关的关和开两种状态",
	tutorial_electronics_digital: [
		"数字信号只有两种状态：开或关，HIGH 或 LOW。在 ESP32 开发板上，HIGH 为 3.3 V，LOW 为 0 V（GND）。",
		"按钮是典型的数字输入：按下或未按下。为了在按钮断开时引脚不处于悬空状态，会使用上拉电阻：引脚读数为 HIGH，直到按钮将其连接到 GND。因此按下的按钮通常读数为 LOW。",
		"数字输出把设备完全打开或关闭，例如 LED 或继电器。在 MIDI 中，数字信号对应 note on 和 note off。",
	],
	tutorial_electronics_analog_title: "什么是模拟信号？",
	tutorial_electronics_dimmer_intro:
		"再想想调光器：你可以把灯调到关和最亮之间的任意亮度。模拟信号也是这样，电压可以是 0 V 到 3.3 V 之间的任意值。客户端把这个电压转换为 0 到 127 的 MIDI 值。",
	tutorial_electronics_dimmer_label:
		"调光器处于关、一半和最亮三种状态，并显示对应的电压和 MIDI 值",
	tutorial_electronics_analog: [
		"模拟信号可以取两个界限之间的任意值，例如 0 V 到 3.3 V 之间的任意电压。电位器、光线传感器和压力传感器都会产生这种变化的电压。",
		"开发板用模数转换器（ADC）测量电压，并将其转换为数字。客户端再把这个数字换算到 MIDI 范围 0–127。",
		"只有部分引脚可以读取模拟值，请查看开发板布局。在 MIDI 中，模拟信号对应控制变化（CC）消息：转动旋钮时会发送一连串数值。",
	],
	tutorial_electronics_pwm_title: "什么是 PWM？",
	tutorial_electronics_pwm: [
		"大多数微控制器引脚无法输出真正的模拟电压。PWM（脉冲宽度调制）用一种方式来模拟：引脚非常快速地开关，导通时间所占的比例（占空比）决定平均功率。",
		"占空比为 25 % 时 LED 较暗，100 % 时最亮。引脚每秒切换数千次，因此人眼看到的是稳定的亮度，而不是闪烁。",
		"舵机使用一种特殊的 PWM：每个脉冲的长度决定角度（见舵机示例）。在配置器中为输出选择 PWM，即可用音符力度或控制器数值调节 LED 亮度。",
	],
	tutorial_electronics_actuator_note:
		"一个引脚只能提供很小的电流，约 20 mA。这足以驱动带限流电阻的 LED，但不足以驱动电机、电磁铁或长 LED 灯带。这些设备请使用晶体管、驱动板或继电器，并配备独立电源。",
	tutorial_electronics_digital_note:
		"ESP32 引脚工作电压为 3.3 V。切勿将 5 V 信号直接接到引脚上，否则可能损坏开发板。",
	tutorial_photo_credit: "照片",
	tutorial_photo_button: "按钮",
	tutorial_photo_potentiometer: "电位器",
	tutorial_photo_photoresistor: "光线传感器（光敏电阻）",
	tutorial_photo_motion: "运动传感器 (MPU-6050)",
	tutorial_photo_leds: "LED",
	tutorial_photo_neopixels: "可寻址 LED (WS2812B)",
	tutorial_photo_servo: "舵机 (SG90)",
	tutorial_photo_relay: "继电器模块",
	tutorial_electronics_pwm_dim: "25 % 导通：暗",
	tutorial_electronics_pwm_bright: "75 % 导通：亮",

	tutorial_midi_title: "MIDI 基础",
	tutorial_midi_text: [
		"MIDI（Musical Instrument Digital Interface，乐器数字接口）是乐器、控制器和计算机自 1983 年以来相互通信的语言。enomik 在两端都使用它：通过 USB 与计算机通信，并在开发板之间无线通信。",
		"MIDI 不传输声音，而是传输消息，例如“现在演奏音符 60，力度较大”或“把音量设为 100”。声音由接收这些消息的合成器、采样器或 DAW 决定。",
	],
	tutorial_midi_messages_title: "消息",
	tutorial_midi_messages: [
		"每条 MIDI 消息都以状态字节开头，说明消息类型和所在通道，后面跟一个或两个数据字节。数据值的范围始终是 0 到 127。",
	],
	tutorial_midi_status: "状态",
	tutorial_midi_channel: "通道",
	tutorial_midi_note: "音符",
	tutorial_midi_velocity: "力度",
	tutorial_midi_controller: "控制器",
	tutorial_midi_value: "值",
	tutorial_midi_table_head: ["消息", "作用", "取值", "典型用途"],
	tutorial_midi_table: [
		[
			"Note On / Note Off",
			"开始和结束一个音符",
			"音符 0–127，力度 0–127",
			"按下和松开按钮，LED 开和关",
		],
		[
			"Control Change (CC)",
			"改变一个参数",
			"控制器 0–127，值 0–127",
			"旋钮、距离传感器、舵机角度、LED 亮度",
		],
		[
			"Program Change",
			"切换到另一个音色或预设",
			"程序 0–127",
			"用按钮切换预设",
		],
		[
			"Pitch Bend",
			"向上或向下弯音",
			"−8192 到 8191（14 位）",
			"倾斜运动传感器",
		],
		["Aftertouch", "按住音符时的压力", "0–127", "压力传感器"],
		[
			"System Exclusive (SysEx)",
			"设备专用数据",
			"任意长度",
			"enomik 用它向开发板发送配置",
		],
	],
	tutorial_midi_notes_title: "音符和力度",
	tutorial_midi_notes: [
		"每个音符都有一个 0 到 127 的编号。音符 60 是中央 C，不同厂商的软件称之为 C4 或 C3。升高一个八度就加 12。",
		"力度表示演奏音符的力量，从 1（最轻）到 127（最重）。力度为 0 的 note on 等同于 note off。",
	],
	tutorial_midi_keyboard_label:
		"一个八度的键盘，标有 MIDI 音符编号 60 到 72，中央 C 高亮显示",
	tutorial_midi_keyboard_caption: "中央 C = 音符 60。高一个八度 = 72。",
	tutorial_midi_cc_title: "控制变化（CC）",
	tutorial_midi_cc: [
		"控制变化消息用于调节软件中的旋钮和推子。控制器编号表示哪个参数，值表示调到哪里。",
		"有些编号有通用含义：1 是调制轮，7 是音量，10 是声像，64 是延音踏板。大多数 DAW 支持 MIDI learn 来分配其他编号：点击参数，转动旋钮，完成。",
	],
	tutorial_midi_channels_title: "通道",
	tutorial_midi_channels: [
		"一个 MIDI 连接有 16 个通道。每条消息都在其中一个通道上发送，因此多个乐器可以共用一个连接，各自只监听自己的通道。",
		"在 enomik 中，所有客户端都通过适配器共用一个连接。给每个客户端或每个传感器分配独立的通道，或独立的音符和 CC 编号，以便区分。",
	],
	tutorial_midi_enomik_title: "enomik 中的 MIDI",
	tutorial_midi_enomik: [
		"适配器在 DAW 中显示为普通的 USB MIDI 设备，和有线控制器一样。",
		"在配置器中，你可以为每个引脚选择它发送或响应的消息：按钮发送 note on 和 note off，旋钮发送 CC，LED 在收到音符时点亮。用 MIDI 监视器可以实时查看消息。",
	],

	tutorial_platforms_title: "使用 enomik 的方式",
	tutorial_platforms_text: [
		"所有方式都基于同一个开源库 ESP-NOW MIDI 和同一种数据包格式。选择适合你项目的方式，或混合使用：运行自定义程序的开发板可以与通过网页应用烧录的适配器通信。",
	],
	tutorial_platforms_webapp_title: "网页应用（无需代码）",
	tutorial_platforms_webapp:
		"用固件上传器烧录预编译固件，在配置器中映射引脚。最适合入门、工作坊和大多数控制器项目。本教程其余部分都采用这种方式。",
	tutorial_platforms_code_title: "自己编写代码",
	tutorial_platforms_code:
		"想自己写代码？该库支持多种开发环境，每种环境都有单独的小节：",
	tutorial_platforms_arduino_title: "Arduino",
	tutorial_platforms_circuitpython_title: "CircuitPython",
	tutorial_platforms_platformio_title: "PlatformIO",
	tutorial_platforms_idf_title: "ESP-IDF",
	tutorial_platforms_arduino_install_title: "安装",
	tutorial_platforms_arduino_install: [
		'安装 ESP32 开发板：打开 工具 → 开发板 → 开发板管理器，搜索 "esp32"，安装 "esp32 by Espressif Systems"（3.3.0 或更高版本）。',
		'安装库：打开 项目 → 导入库 → 管理库，搜索 "ESP-NOW MIDI" 并安装。',
	],
	tutorial_lightbox_previous: "上一张",
	tutorial_lightbox_next: "下一张",
	tutorial_lightbox_close: "关闭",
	tutorial_screenshot_credit: "截图",
	tutorial_screenshot_cropped: "已裁剪",
	tutorial_arduino_boards_1: "点击左侧边栏中的开发板管理器图标。",
	tutorial_arduino_boards_2:
		'在搜索框中输入 "esp32"，然后在 "esp32 by Espressif Systems" 上点击 安装。',
	tutorial_arduino_boards_3: "完成后，该软件包显示为已安装。",
	tutorial_arduino_library_1: "点击左侧边栏中的库管理器图标。",
	tutorial_arduino_library_2: '在搜索框中输入 "ESP-NOW MIDI"，然后点击 安装。',
	tutorial_arduino_library_3: "完成后，该库显示为已安装。",
	tutorial_arduino_screenshots_note:
		'这些截图来自 Arduino 官方文档，显示的是其他开发板软件包和库。步骤相同：只需搜索 "esp32" 和 "ESP-NOW MIDI"。',
	tutorial_platforms_arduino_usage_title: "使用",
	tutorial_platforms_arduino:
		"通过 文件 → 示例 → ESP-NOW MIDI 打开库中的一个示例。client 示例使用 enomik::Client，与预编译固件代码相同，因此你自己的程序仍可通过网页应用配置。",
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
		"每块开发板都需要固件：适配器烧录一次，每个客户端各烧录一次。有两种上传方式：网页上传器只需要浏览器；Arduino IDE 从库示例编译固件，你可以修改代码。",
	],
	tutorial_firmware_web_title: "通过网页上传器",
	tutorial_firmware_arduino_title: "通过 Arduino IDE",
	tutorial_firmware_arduino_text: [
		"从库示例自行编译并上传固件。请先按照 Arduino 章节的说明安装 ESP32 开发板和 ESP-NOW MIDI 库。",
	],
	tutorial_firmware_arduino_link: "Arduino 安装",
	tutorial_firmware_arduino_steps: [
		"打开示例：客户端开发板选择 文件 → 示例 → ESP-NOW MIDI → client，适配器选择 文件 → 示例 → ESP-NOW MIDI → grantler_instruments → dongle。",
		"在 工具 → 开发板 → esp32 中选择你的开发板，例如 LOLIN S2 Mini 或 ESP32S3 Dev Module。",
		"将 ESP32-S2 开发板置于引导模式：按住 BOOT，按下并松开 RESET，然后松开 BOOT。",
		"在 工具 → 端口 中选择端口，然后点击 上传。",
		"上传完成后按 RESET。开发板现在运行新固件。",
	],
	tutorial_firmware_arduino_tip:
		"client 示例与预编译的客户端固件使用相同代码，因此开发板仍可通过网页应用配置。",
	tutorial_firmware_web_text: [
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

	tutorial_examples_title: "示例",
	tutorial_examples_text: [
		"展示客户端功能的小项目。可以在网页应用中配置预编译的客户端固件，也可以用代码构建自己的固件：",
	],
	tutorial_examples_webapp_title: "通过网页应用",
	tutorial_examples_webapp_text: [
		"这些示例使用预编译的客户端固件。连接好硬件，在配置器中完成所有设置，无需代码：",
	],
	tutorial_examples_code_title: "通过代码",
	tutorial_examples_code_text: [
		"这些示例使用库中的程序，用 Arduino IDE 编译并上传。适用于需要专门驱动代码的硬件，例如 I2C 传感器：",
	],

	tutorial_pairing_title: "无线配对",
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

	tutorial_button_title: "按钮到音符",
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

	tutorial_knob_title: "旋钮到 CC",
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

	tutorial_led_title: "MIDI 到 LED",
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

	tutorial_i2c_title: "I2C 距离传感器 (VL53L0X)",
	tutorial_i2c_text: [
		"在本示例中，VL53L0X 飞行时间传感器测量到你手的距离，客户端将其转换为 MIDI。传感器通过 I2C 与开发板通信。",
	],
	tutorial_i2c_about_title: "什么是 I2C？",
	tutorial_i2c_about: [
		'I2C（Inter-Integrated Circuit，读作 "I 方 C"）是一种总线：一组共用的导线，让开发板只用两根信号线就能与多个芯片通信。开发板是控制器，负责发起每次通信；传感器和显示屏作为目标设备应答。',
		"SDA（串行数据）双向传输数据位。SCL（串行时钟）是控制器发出的稳定脉冲，告诉所有设备何时读取下一位。再加上供电用的 GND 和 VCC，一个 I2C 设备共需要四根线。",
		"每个设备都有固定地址，例如 VL53L0X 的地址是 0x29。控制器呼叫某个地址，只有该设备会应答。因此只要地址各不相同，多个传感器就可以挂在同样的两根线上。",
		"I2C 适用于短距离，即同一块电路板上或几十厘米的导线。导线过长会导致信号不可靠。",
		"许多常见元件都使用 I2C：距离传感器、加速度计和陀螺仪、OLED 显示屏、端口扩展器。与按钮或旋钮不同，这些芯片各有自己的寄存器，需要驱动代码，因此本示例使用专用程序，而不是通用客户端固件。",
	],
	tutorial_i2c_wiring:
		"每个 I2C 传感器有四个引脚。用杜邦线将它们连接到开发板：",
	tutorial_i2c_pins: [
		"SDA（数据）接开发板的 SDA 引脚。",
		"SCL（时钟）接开发板的 SCL 引脚。",
		"GND 接 GND。",
		"VCC 接 3.3V（大多数模块也支持 5V，请查看你的传感器）。",
	],
	tutorial_i2c_board_note:
		"使用 enomik 开发板？请在 套件与电路板 页面查看开发板布局：I2C 总线已引出到 Grove 接口，无需杜邦线即可直接插上传感器。",
	tutorial_i2c_upload_title: "上传",
	tutorial_i2c_upload: [
		"在 Arduino IDE 中打开 VL53L0X 示例：文件 → 示例 → ESP-NOW MIDI → client_vl53l0x。",
		"选择开发板和端口，然后点击 上传，具体见“通过 Arduino IDE”固件章节。",
		"上传完成后按 RESET。",
	],
	tutorial_i2c_upload_link: "通过 Arduino IDE 上传固件",
	tutorial_i2c_test:
		"打开 MIDI 监视器，在传感器上方移动你的手。MIDI 消息会随距离变化。",

	tutorial_servo_title: "舵机",
	tutorial_servo_text: [
		"在本示例中，客户端接收 MIDI 并将舵机转到相应角度。适用于装置、木偶或机械乐器中的活动部件。",
	],
	tutorial_servo_about_title: "舵机的工作原理",
	tutorial_servo_about: [
		"舵机是带有减速齿轮和内置位置控制的小型电机。它会转到某个角度（通常在 0° 到 180° 之间）并保持住。",
		"角度由信号线上的脉冲决定，每秒重复约 50 次：约 1 ms 对应一端，2 ms 对应另一端，1.5 ms 对应中间。程序生成这些脉冲，并将收到的 MIDI 值换算为角度。",
	],
	tutorial_servo_wiring: "舵机有三根线，颜色因品牌而异：",
	tutorial_servo_pins: [
		"棕色或黑色：GND 接开发板的 GND。",
		"红色：VCC 接 5V。",
		"橙色、黄色或白色：信号线接 GPIO 40（程序中的 SERVO_PIN）。",
	],
	tutorial_servo_power:
		"舵机运动时电流较大，常常超过开发板 USB 口的供电能力，可能导致开发板重启。使用较大或多个舵机时，请使用独立的 5V 电源，并将其 GND 与开发板的 GND 相连。",
	tutorial_servo_code_title: "代码",
	tutorial_servo_code_before: "完整程序：",
	tutorial_servo_code_after: [
		"程序使用 enomik::Client 处理无线 MIDI，使用 ESP32Servo 库生成脉冲。onControlChange 只处理通道 1 上的 CC 40，并将 0–127 的值换算为 0–180°。舵机在 loop() 中转动，而不是在 ESP-NOW 接收回调中。",
		"要使用其他引脚，修改 SERVO_PIN 即可，CC 编号会随之改变。如果希望 CC 值直接表示角度，将 SERVO_CC_VALUE_IS_DEGREES 设为 1（此时只能达到 0–127°）。",
	],
	tutorial_servo_upload: [
		'安装 ESP32Servo 库：打开 项目 → 导入库 → 管理库，搜索 "ESP32Servo" 并安装。',
		"在 Arduino IDE 中打开舵机示例：文件 → 示例 → ESP-NOW MIDI → client_servo。",
		"选择开发板和端口，然后点击 上传，具体见“通过 Arduino IDE”固件章节。",
		"上传完成后按 RESET。",
	],
	tutorial_servo_test:
		"从 DAW 经由适配器在 MIDI 通道 1 上发送 CC 40。值 0 使舵机转到 0°，64 大约到中间，127 到 180°。",

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
