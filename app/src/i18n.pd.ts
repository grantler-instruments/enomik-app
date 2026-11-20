// Strings of the Pd page (components/Pd.tsx), spread into each language in i18n.ts.
// Keys must exist in every language: src/i18n.test.ts checks.

const en = {
	pd_intro:
		"Uploads Pure Data patches and other files (samples, text) to a board running a Pd client (ESP-NOW-MIDI enomik_pd). Connect the board over USB, or reach it wirelessly through the dongle. Files stay on the board until they are uploaded again.",
	pd_add_files: "Add files",
	pd_clear_files: "Remove all files",
	pd_device_id: "Device ID",
	pd_device_id_hint: "127 = every Pd client",
	pd_drop_here: "Drop files here, or add them with the button above.",
	pd_main_hint:
		"{{main}} is sent last: when it arrives, the board reloads the patch.",
	pd_upload: "Upload",
	pd_cancel: "Cancel",
	pd_file: "File",
	pd_type: "Type",
	pd_size: "Size",
	pd_status: "Status",
	pd_remove_file: "Remove file",
	pd_status_queued: "waiting",
	pd_status_sending: "sending",
	pd_status_done: "stored",
	pd_status_error: "failed",
	pd_status_invalid: "invalid name",
	pd_status_too_large: "too large",
	pd_invalid_names:
		"{{count}} file name(s) the board won't take: only letters, digits and . _ - ~, not starting with a dot, at most {{max}} characters. Rename them before uploading.",
	pd_too_large: "Files larger than {{max}} are skipped.",
	pd_send_failed: "Could not send: pick a connected MIDI output.",
	pd_no_answer:
		"No answer from the board. Is it running a Pd client, and does the device ID match (or use 127)?",
	pd_cancelled:
		"The board cancelled the upload of {{name}} (name, size or space).",
	pd_aborted: "Upload cancelled.",
	pd_log: "Events",
	pd_no_events: "Nothing uploaded yet.",
	pd_log_start: "Uploading {{count}} file(s) to device {{device}}",
	pd_log_stored: "{{name}} stored ({{size}})",
	pd_log_failed: "{{name}} failed: {{error}}",
	pd_log_reload: "{{main}} arrived: the board reloads the patch",
	pd_log_done: "Upload finished",
};

const de: typeof en = {
	pd_intro:
		"Lädt Pure-Data-Patches und andere Dateien (Samples, Text) auf ein Board mit Pd-Client (ESP-NOW-MIDI enomik_pd). Verbinde das Board per USB oder erreiche es drahtlos über den Dongle. Die Dateien bleiben auf dem Board, bis sie neu hochgeladen werden.",
	pd_add_files: "Dateien hinzufügen",
	pd_clear_files: "Alle Dateien entfernen",
	pd_device_id: "Geräte-ID",
	pd_device_id_hint: "127 = alle Pd-Clients",
	pd_drop_here: "Dateien hier ablegen oder mit dem Button oben hinzufügen.",
	pd_main_hint:
		"{{main}} wird zuletzt gesendet: Sobald sie ankommt, lädt das Board den Patch neu.",
	pd_upload: "Hochladen",
	pd_cancel: "Abbrechen",
	pd_file: "Datei",
	pd_type: "Typ",
	pd_size: "Größe",
	pd_status: "Status",
	pd_remove_file: "Datei entfernen",
	pd_status_queued: "wartet",
	pd_status_sending: "wird gesendet",
	pd_status_done: "gespeichert",
	pd_status_error: "fehlgeschlagen",
	pd_status_invalid: "ungültiger Name",
	pd_status_too_large: "zu groß",
	pd_invalid_names:
		"{{count}} Dateiname(n) nimmt das Board nicht an: nur Buchstaben, Ziffern und . _ - ~, nicht mit einem Punkt beginnend, höchstens {{max}} Zeichen. Benenne sie vor dem Hochladen um.",
	pd_too_large: "Dateien größer als {{max}} werden übersprungen.",
	pd_send_failed:
		"Senden fehlgeschlagen: Wähle einen verbundenen MIDI-Ausgang.",
	pd_no_answer:
		"Keine Antwort vom Board. Läuft darauf ein Pd-Client, und stimmt die Geräte-ID (oder nimm 127)?",
	pd_cancelled:
		"Das Board hat das Hochladen von {{name}} abgebrochen (Name, Größe oder Speicherplatz).",
	pd_aborted: "Hochladen abgebrochen.",
	pd_log: "Ereignisse",
	pd_no_events: "Noch nichts hochgeladen.",
	pd_log_start: "Lade {{count}} Datei(en) auf Gerät {{device}}",
	pd_log_stored: "{{name}} gespeichert ({{size}})",
	pd_log_failed: "{{name}} fehlgeschlagen: {{error}}",
	pd_log_reload: "{{main}} ist angekommen: Das Board lädt den Patch neu",
	pd_log_done: "Hochladen fertig",
};

const es: typeof en = {
	pd_intro:
		"Sube patches de Pure Data y otros archivos (samples, texto) a una placa con un cliente Pd (ESP-NOW-MIDI enomik_pd). Conecta la placa por USB o llega a ella sin cables a través del dongle. Los archivos se quedan en la placa hasta que se vuelvan a subir.",
	pd_add_files: "Añadir archivos",
	pd_clear_files: "Quitar todos los archivos",
	pd_device_id: "ID de dispositivo",
	pd_device_id_hint: "127 = todos los clientes Pd",
	pd_drop_here: "Suelta archivos aquí o añádelos con el botón de arriba.",
	pd_main_hint:
		"{{main}} se envía al final: cuando llega, la placa recarga el patch.",
	pd_upload: "Subir",
	pd_cancel: "Cancelar",
	pd_file: "Archivo",
	pd_type: "Tipo",
	pd_size: "Tamaño",
	pd_status: "Estado",
	pd_remove_file: "Quitar archivo",
	pd_status_queued: "en espera",
	pd_status_sending: "enviando",
	pd_status_done: "guardado",
	pd_status_error: "error",
	pd_status_invalid: "nombre no válido",
	pd_status_too_large: "demasiado grande",
	pd_invalid_names:
		"{{count}} nombre(s) de archivo que la placa no acepta: solo letras, dígitos y . _ - ~, sin empezar por un punto, como máximo {{max}} caracteres. Renómbralos antes de subirlos.",
	pd_too_large: "Los archivos de más de {{max}} se omiten.",
	pd_send_failed: "No se pudo enviar: elige una salida MIDI conectada.",
	pd_no_answer:
		"La placa no responde. ¿Tiene un cliente Pd y coincide el ID de dispositivo (o usa 127)?",
	pd_cancelled:
		"La placa canceló la subida de {{name}} (nombre, tamaño o espacio).",
	pd_aborted: "Subida cancelada.",
	pd_log: "Eventos",
	pd_no_events: "Todavía no se ha subido nada.",
	pd_log_start: "Subiendo {{count}} archivo(s) al dispositivo {{device}}",
	pd_log_stored: "{{name}} guardado ({{size}})",
	pd_log_failed: "{{name}} falló: {{error}}",
	pd_log_reload: "Llegó {{main}}: la placa recarga el patch",
	pd_log_done: "Subida terminada",
};

const zh: typeof en = {
	pd_intro:
		"将 Pure Data 补丁和其他文件（采样、文本）上传到运行 Pd 客户端（ESP-NOW-MIDI enomik_pd）的板子。通过 USB 连接板子，或通过 dongle 无线连接。文件会一直保存在板子上，直到再次上传。",
	pd_add_files: "添加文件",
	pd_clear_files: "移除所有文件",
	pd_device_id: "设备 ID",
	pd_device_id_hint: "127 = 所有 Pd 客户端",
	pd_drop_here: "将文件拖放到这里，或用上方的按钮添加。",
	pd_main_hint: "{{main}} 最后发送：收到后板子会重新加载补丁。",
	pd_upload: "上传",
	pd_cancel: "取消",
	pd_file: "文件",
	pd_type: "类型",
	pd_size: "大小",
	pd_status: "状态",
	pd_remove_file: "移除文件",
	pd_status_queued: "等待中",
	pd_status_sending: "发送中",
	pd_status_done: "已保存",
	pd_status_error: "失败",
	pd_status_invalid: "名称无效",
	pd_status_too_large: "太大",
	pd_invalid_names:
		"{{count}} 个文件名板子不接受：只能包含字母、数字和 . _ - ~，不能以点开头，最多 {{max}} 个字符。请在上传前重命名。",
	pd_too_large: "大于 {{max}} 的文件将被跳过。",
	pd_send_failed: "无法发送：请选择一个已连接的 MIDI 输出。",
	pd_no_answer:
		"板子没有回应。它是否运行 Pd 客户端，设备 ID 是否匹配（或使用 127）？",
	pd_cancelled: "板子取消了 {{name}} 的上传（名称、大小或空间）。",
	pd_aborted: "上传已取消。",
	pd_log: "事件",
	pd_no_events: "尚未上传任何内容。",
	pd_log_start: "正在上传 {{count}} 个文件到设备 {{device}}",
	pd_log_stored: "{{name}} 已保存（{{size}}）",
	pd_log_failed: "{{name}} 失败：{{error}}",
	pd_log_reload: "{{main}} 已到达：板子重新加载补丁",
	pd_log_done: "上传完成",
};

export const pdTranslations = { en, de, es, zh };
