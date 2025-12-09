const typeToLabel = (type: number) => {
  switch (type) {
    case MIDI_STATUS.NOTE_OFF:
      return "Note Off";
    case MIDI_STATUS.NOTE_ON:
      return "Note On";
    case MIDI_STATUS.CONTROL_CHANGE:
      return "Control Change";
    case MIDI_STATUS.PROGRAM_CHANGE:
      return "Program Change";
    case MIDI_STATUS.PITCH_BEND:
      return "Pitch Bend";
    case MIDI_STATUS.SYSEX_START:
      return "SysEx";
    case MIDI_STATUS.START:
      return "Start";
    case MIDI_STATUS.STOP:
      return "Stop";
    case MIDI_STATUS.CONTINUE:
      return "Continue";

    default:
      return "Unknown";
  }
};

export { typeToLabel };

// midi-constants.ts

export const MIDI_MASK = {
  STATUS: 0xF0,
  CHANNEL: 0x0F,
} as const;

export const MIDI_STATUS = {
  NOTE_OFF:         0x80,
  NOTE_ON:          0x90,
  POLY_PRESSURE:    0xA0,
  CONTROL_CHANGE:   0xB0,
  PROGRAM_CHANGE:   0xC0,
  CHANNEL_PRESSURE: 0xD0,
  PITCH_BEND:       0xE0,

  SYSEX_START:      0xF0,
  MTC_QUARTER:      0xF1,
  SONG_POSITION:    0xF2,
  SONG_SELECT:      0xF3,
  TUNE_REQUEST:     0xF6,
  SYSEX_END:        0xF7,

  TIMING_CLOCK:     0xF8,
  START:            0xFA,
  CONTINUE:         0xFB,
  STOP:             0xFC,
  ACTIVE_SENSING:   0xFE,
  RESET:            0xFF,
} as const;

export const MIDI_CC = {
  MOD_WHEEL:       1,
  BREATH:          2,
  FOOT:            4,
  PORTAMENTO_TIME: 5,
  DATA_ENTRY:      6,
  VOLUME:          7,
  BALANCE:         8,
  PAN:             10,
  EXPRESSION:      11,

  GENERAL_1:       16,
  GENERAL_2:       17,
  GENERAL_3:       18,
  GENERAL_4:       19,

  SUSTAIN:         64,
  PORTAMENTO:      65,
  SOSTENUTO:       66,
  SOFT:            67,
  LEGATO:          68,
  HOLD_2:          69,
} as const;

// Utility functions

export function isStatus(byte: number): boolean {
  return byte >= 0x80;
}

export function getStatus(byte: number): number {
  return byte & MIDI_MASK.STATUS;
}

export function getChannel(byte: number): number {
  return byte & MIDI_MASK.CHANNEL;
}

export function isNoteOn(status: number, velocity: number): boolean {
  return status === MIDI_STATUS.NOTE_ON && velocity > 0;
}

export function isNoteOff(status: number, velocity: number): boolean {
  return (
    status === MIDI_STATUS.NOTE_OFF ||
    (status === MIDI_STATUS.NOTE_ON && velocity === 0)
  );
}
