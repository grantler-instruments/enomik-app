// Strings of the workshop page (components/Workshop.tsx), spread into each language in i18n.ts.
// Keys must exist in every language: src/i18n.test.ts checks.

const en = {
	workshop_title: "Workshop",
	workshop_intro:
		"In this hands-on workshop you build your own wireless MIDI devices, of two kinds. Controllers turn touch, movement, buttons and knobs into MIDI. MIDI-reactive objects work the other way round: lights, motors and installations that do something when MIDI arrives. Both run on enomik 3000 boards over ESP-NOW MIDI and work with a DAW, a synth or the tools on this site, and with each other. No prior electronics or coding experience needed.",
	workshop_facts_title: "At a glance",
	workshop_participants: "Up to {{count}} participants",
	workshop_participants_desc:
		"Small groups, so everyone gets hands-on time and help when something doesn't work right away.",
	workshop_kits: "Kits included",
	workshop_kits_desc:
		"I bring all the hardware: dongles, client boards, sensors, actuators and cables. Nothing to order in advance.",
	workshop_buy: "Kits for sale",
	workshop_buy_desc:
		"Want to keep building? Participants can buy their kit at the end of the workshop and take it home.",
	workshop_bring: "Bring a laptop",
	workshop_bring_desc:
		"With Chrome or Edge for the web tools, and optionally your favourite DAW or synth.",
	workshop_use_cases_title: "What you can build",
	workshop_controllers_title: "Controllers: send MIDI",
	workshop_controllers_desc:
		"Sensors, buttons and knobs become notes and CCs that play your DAW, a synth or anything else that speaks MIDI.",
	workshop_reactive_title: "MIDI-reactive objects: respond to MIDI",
	workshop_reactive_desc:
		"Lights, motors and switches listen to notes and controllers from a DAW or a controller, and act on them.",
	workshop_use_case_touch: "Touch instruments",
	workshop_use_case_touch_desc:
		"Capacitive touch pads turn copper tape, fruit or conductive paint into playable keys.",
	workshop_use_case_motion: "Motion controllers",
	workshop_use_case_motion_desc:
		"Accelerometers on hands, instruments or dancers send gestures as MIDI CC.",
	workshop_use_case_installation: "Interactive installations",
	workshop_use_case_installation_desc:
		"Spaces where light, motion and sound follow the MIDI of a show, with sensors or NFC tags letting visitors join in.",
	workshop_use_case_light: "Light that follows the music",
	workshop_use_case_light_desc:
		"NeoPixel strips react to notes and controllers coming from the DAW.",
	workshop_use_case_kinetic: "Kinetic objects",
	workshop_use_case_kinetic_desc:
		"Servos and relays let MIDI notes move things, strike drums or switch devices.",
	workshop_use_case_controller: "Custom MIDI controllers",
	workshop_use_case_controller_desc:
		"Buttons and knobs in a box of your own design, without a cable to the computer.",
	workshop_past_title: "Where the workshop has been given",
	workshop_post_title: "Workshop post by @{{author}} on Instagram",
	instagram_consent:
		"This post is hosted on Instagram. Showing it loads content from Meta, which may set cookies and receive data about your visit.",
	instagram_load: "Show post",
	instagram_open: "Open on Instagram",
	workshop_contact_title: "Interested in a workshop?",
	workshop_contact_desc:
		"For schools, universities, makerspaces, festivals and teams. Get in touch to plan dates, length and focus.",
	workshop_contact: "Contact",
	workshop_kits_link: "See the kits",
};

const de: typeof en = {
	workshop_title: "Workshop",
	workshop_intro:
		"Im Workshop entstehen eigene drahtlose MIDI-Geräte, und zwar zwei Arten. Controller verwandeln Berührung, Bewegung, Taster und Drehregler in MIDI. MIDI-reaktive Objekte funktionieren umgekehrt: Lichter, Motoren und Installationen, die etwas tun, wenn MIDI ankommt. Beide laufen auf enomik-3000-Boards über ESP-NOW MIDI und arbeiten mit einer DAW, einem Synth oder den Tools dieser Seite zusammen, und auch miteinander. Keine Vorkenntnisse in Elektronik oder Programmieren nötig.",
	workshop_facts_title: "Auf einen Blick",
	workshop_participants: "Bis zu {{count}} Teilnehmende",
	workshop_participants_desc:
		"Kleine Gruppen, damit alle selbst bauen können und Hilfe bekommen, wenn etwas nicht gleich klappt.",
	workshop_kits: "Kits inklusive",
	workshop_kits_desc:
		"Ich bringe die komplette Hardware mit: Dongles, Client-Boards, Sensoren, Aktoren und Kabel. Nichts vorab zu bestellen.",
	workshop_buy: "Kits zum Kaufen",
	workshop_buy_desc:
		"Lust, weiterzubauen? Die Teilnehmenden können ihr Kit am Ende des Workshops kaufen und mitnehmen.",
	workshop_bring: "Laptop mitbringen",
	workshop_bring_desc:
		"Mit Chrome oder Edge für die Web-Tools, gerne auch mit der eigenen DAW oder einem Synth.",
	workshop_use_cases_title: "Was gebaut wird",
	workshop_controllers_title: "Controller: senden MIDI",
	workshop_controllers_desc:
		"Sensoren, Taster und Drehregler werden zu Noten und CCs, die eine DAW, einen Synth oder alles andere spielen, was MIDI versteht.",
	workshop_reactive_title: "MIDI-reaktive Objekte: reagieren auf MIDI",
	workshop_reactive_desc:
		"Lichter, Motoren und Schalter hören auf Noten und Controller aus einer DAW oder von einem Controller und setzen sie um.",
	workshop_use_case_touch: "Touch-Instrumente",
	workshop_use_case_touch_desc:
		"Kapazitive Touch-Pads machen Kupferband, Obst oder leitfähige Farbe zu spielbaren Tasten.",
	workshop_use_case_motion: "Bewegungscontroller",
	workshop_use_case_motion_desc:
		"Beschleunigungssensoren an Händen, Instrumenten oder Tänzer*innen senden Gesten als MIDI-CC.",
	workshop_use_case_installation: "Interaktive Installationen",
	workshop_use_case_installation_desc:
		"Räume, in denen Licht, Bewegung und Klang dem MIDI einer Show folgen, und Sensoren oder NFC-Tags Besucher*innen mitspielen lassen.",
	workshop_use_case_light: "Licht, das der Musik folgt",
	workshop_use_case_light_desc:
		"NeoPixel-Streifen reagieren auf Noten und Controller aus der DAW.",
	workshop_use_case_kinetic: "Kinetische Objekte",
	workshop_use_case_kinetic_desc:
		"Servos und Relais lassen MIDI-Noten Dinge bewegen, Trommeln anschlagen oder Geräte schalten.",
	workshop_use_case_controller: "Eigene MIDI-Controller",
	workshop_use_case_controller_desc:
		"Taster und Drehregler in einem selbst gestalteten Gehäuse, ohne Kabel zum Computer.",
	workshop_past_title: "Wo der Workshop schon stattgefunden hat",
	workshop_post_title: "Workshop-Beitrag von @{{author}} auf Instagram",
	instagram_consent:
		"Dieser Beitrag liegt auf Instagram. Beim Anzeigen werden Inhalte von Meta geladen; dabei können Cookies gesetzt und Daten über den Besuch übertragen werden.",
	instagram_load: "Beitrag anzeigen",
	instagram_open: "Auf Instagram öffnen",
	workshop_contact_title: "Interesse an einem Workshop?",
	workshop_contact_desc:
		"Für Schulen, Hochschulen, Makerspaces, Festivals und Teams. Termine, Dauer und Schwerpunkt lassen sich gemeinsam planen.",
	workshop_contact: "Kontakt",
	workshop_kits_link: "Zu den Kits",
};

const es: typeof en = {
	workshop_title: "Taller",
	workshop_intro:
		"En este taller práctico construyes tus propios dispositivos MIDI inalámbricos, de dos tipos. Los controladores convierten el tacto, el movimiento, los botones y los potenciómetros en MIDI. Los objetos reactivos a MIDI funcionan al revés: luces, motores e instalaciones que hacen algo cuando llega MIDI. Ambos funcionan en placas enomik 3000 por ESP-NOW MIDI y trabajan con un DAW, un sintetizador o las herramientas de este sitio, y también entre sí. No se necesita experiencia previa en electrónica ni programación.",
	workshop_facts_title: "En resumen",
	workshop_participants: "Hasta {{count}} participantes",
	workshop_participants_desc:
		"Grupos pequeños, para que todos construyan y reciban ayuda cuando algo no funciona a la primera.",
	workshop_kits: "Kits incluidos",
	workshop_kits_desc:
		"Llevo todo el hardware: dongles, placas cliente, sensores, actuadores y cables. No hay que pedir nada por adelantado.",
	workshop_buy: "Kits a la venta",
	workshop_buy_desc:
		"¿Quieres seguir construyendo? Los participantes pueden comprar su kit al final del taller y llevárselo.",
	workshop_bring: "Trae un portátil",
	workshop_bring_desc:
		"Con Chrome o Edge para las herramientas web y, si quieres, tu DAW o sintetizador favorito.",
	workshop_use_cases_title: "Qué puedes construir",
	workshop_controllers_title: "Controladores: envían MIDI",
	workshop_controllers_desc:
		"Sensores, botones y potenciómetros se convierten en notas y CC que tocan tu DAW, un sintetizador o cualquier cosa que hable MIDI.",
	workshop_reactive_title: "Objetos reactivos a MIDI: responden a MIDI",
	workshop_reactive_desc:
		"Luces, motores e interruptores escuchan notas y controladores de un DAW o de un controlador, y actúan en consecuencia.",
	workshop_use_case_touch: "Instrumentos táctiles",
	workshop_use_case_touch_desc:
		"Los pads táctiles capacitivos convierten cinta de cobre, fruta o pintura conductora en teclas.",
	workshop_use_case_motion: "Controladores de movimiento",
	workshop_use_case_motion_desc:
		"Acelerómetros en manos, instrumentos o bailarines envían gestos como MIDI CC.",
	workshop_use_case_installation: "Instalaciones interactivas",
	workshop_use_case_installation_desc:
		"Espacios donde la luz, el movimiento y el sonido siguen el MIDI de un espectáculo, y sensores o etiquetas NFC dejan participar a los visitantes.",
	workshop_use_case_light: "Luz que sigue a la música",
	workshop_use_case_light_desc:
		"Tiras NeoPixel reaccionan a notas y controladores que llegan del DAW.",
	workshop_use_case_kinetic: "Objetos cinéticos",
	workshop_use_case_kinetic_desc:
		"Servos y relés permiten que las notas MIDI muevan cosas, golpeen tambores o enciendan aparatos.",
	workshop_use_case_controller: "Controladores MIDI propios",
	workshop_use_case_controller_desc:
		"Botones y potenciómetros en una caja de tu propio diseño, sin cable al ordenador.",
	workshop_past_title: "Dónde se ha impartido el taller",
	workshop_post_title: "Publicación del taller de @{{author}} en Instagram",
	instagram_consent:
		"Esta publicación está alojada en Instagram. Al mostrarla se carga contenido de Meta, que puede instalar cookies y recibir datos sobre la visita.",
	instagram_load: "Mostrar publicación",
	instagram_open: "Abrir en Instagram",
	workshop_contact_title: "¿Te interesa un taller?",
	workshop_contact_desc:
		"Para escuelas, universidades, makerspaces, festivales y equipos. Escríbeme para planificar fechas, duración y enfoque.",
	workshop_contact: "Contacto",
	workshop_kits_link: "Ver los kits",
};

const zh: typeof en = {
	workshop_title: "工作坊",
	workshop_intro:
		"在这个动手工作坊中，你将制作自己的无线 MIDI 设备，分为两类。控制器把触摸、动作、按钮和旋钮转换成 MIDI。MIDI 响应装置则正好相反：灯光、电机和装置在收到 MIDI 时做出反应。两者都运行在 enomik 3000 板上，通过 ESP-NOW MIDI 通信，可以与 DAW、合成器或本网站的工具配合使用，也可以彼此联动。无需电子或编程经验。",
	workshop_facts_title: "概览",
	workshop_participants: "最多 {{count}} 名参与者",
	workshop_participants_desc:
		"小班教学，每个人都能亲自动手，遇到问题时也能及时得到帮助。",
	workshop_kits: "包含套件",
	workshop_kits_desc:
		"我会带来全部硬件：适配器、客户端板、传感器、执行器和线缆。无需提前订购。",
	workshop_buy: "套件可购买",
	workshop_buy_desc: "想继续制作？参与者可以在工作坊结束时购买套件并带回家。",
	workshop_bring: "请带笔记本电脑",
	workshop_bring_desc:
		"安装 Chrome 或 Edge 以使用网页工具，也可以带上你喜欢的 DAW 或合成器。",
	workshop_use_cases_title: "你可以制作什么",
	workshop_controllers_title: "控制器：发送 MIDI",
	workshop_controllers_desc:
		"传感器、按钮和旋钮变成音符和 CC，用来演奏你的 DAW、合成器或任何支持 MIDI 的设备。",
	workshop_reactive_title: "MIDI 响应装置：响应 MIDI",
	workshop_reactive_desc:
		"灯光、电机和开关接收来自 DAW 或控制器的音符和控制信息，并据此动作。",
	workshop_use_case_touch: "触摸乐器",
	workshop_use_case_touch_desc:
		"电容触摸板可以把铜胶带、水果或导电颜料变成可演奏的按键。",
	workshop_use_case_motion: "动作控制器",
	workshop_use_case_motion_desc:
		"戴在手上、乐器上或舞者身上的加速度计将手势作为 MIDI CC 发送。",
	workshop_use_case_installation: "互动装置",
	workshop_use_case_installation_desc:
		"灯光、动作和声音随演出的 MIDI 而变化的空间，传感器或 NFC 标签让观众也能参与其中。",
	workshop_use_case_light: "随音乐变化的灯光",
	workshop_use_case_light_desc: "NeoPixel 灯带响应来自 DAW 的音符和控制器。",
	workshop_use_case_kinetic: "动态装置",
	workshop_use_case_kinetic_desc:
		"舵机和继电器让 MIDI 音符移动物体、敲击鼓或开关设备。",
	workshop_use_case_controller: "定制 MIDI 控制器",
	workshop_use_case_controller_desc:
		"按钮和旋钮装进你自己设计的盒子里，无需连接电脑的线缆。",
	workshop_past_title: "工作坊举办过的地方",
	workshop_post_title: "@{{author}} 在 Instagram 上的工作坊帖子",
	instagram_consent:
		"此帖子托管在 Instagram 上。显示它会加载来自 Meta 的内容，Meta 可能设置 Cookie 并获取有关此次访问的数据。",
	instagram_load: "显示帖子",
	instagram_open: "在 Instagram 上打开",
	workshop_contact_title: "对工作坊感兴趣？",
	workshop_contact_desc:
		"面向学校、大学、创客空间、音乐节和团队。联系我商定日期、时长和主题。",
	workshop_contact: "联系",
	workshop_kits_link: "查看套件",
};

export const workshopTranslations = { en, de, es, zh };
