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
    case MIDI_STATUS.CHANNEL_PRESSURE:
      return "Aftertouch";
    case MIDI_STATUS.POLY_PRESSURE:
      return "Polyphonic Aftertouch";

    default:
      return "Unknown";
  }
};

export { typeToLabel };

// midi-constants.ts

export const MIDI_MASK = {
  STATUS: 0xf0,
  CHANNEL: 0x0f,
} as const;

export const MIDI_STATUS = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  POLY_PRESSURE: 0xa0,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
  CHANNEL_PRESSURE: 0xd0,
  PITCH_BEND: 0xe0,

  SYSEX_START: 0xf0,
  MTC_QUARTER: 0xf1,
  SONG_POSITION: 0xf2,
  SONG_SELECT: 0xf3,
  TUNE_REQUEST: 0xf6,
  SYSEX_END: 0xf7,

  TIMING_CLOCK: 0xf8,
  START: 0xfa,
  CONTINUE: 0xfb,
  STOP: 0xfc,
  ACTIVE_SENSING: 0xfe,
  RESET: 0xff,
} as const;

export const MIDI_CC = {
  MOD_WHEEL: 1,
  BREATH: 2,
  FOOT: 4,
  PORTAMENTO_TIME: 5,
  DATA_ENTRY: 6,
  VOLUME: 7,
  BALANCE: 8,
  PAN: 10,
  EXPRESSION: 11,

  GENERAL_1: 16,
  GENERAL_2: 17,
  GENERAL_3: 18,
  GENERAL_4: 19,

  SUSTAIN: 64,
  PORTAMENTO: 65,
  SOSTENUTO: 66,
  SOFT: 67,
  LEGATO: 68,
  HOLD_2: 69,
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
