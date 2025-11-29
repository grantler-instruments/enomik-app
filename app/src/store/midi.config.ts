const MIDI_NOTE_OFF = 0x80;
const MIDI_NOTE_ON = 0x90;
const MIDI_POLY_AFTERTOUCH = 0xa0;
const MIDI_CONTROL_CHANGE = 0xb0;
const MIDI_PROGRAM_CHANGE = 0xc0;
const MIDI_CHANNEL_AFTERTOUCH = 0xd0;
const MIDI_PITCH_BEND = 0xe0;
const MIDI_SYSEX_START = 0xf0;
const MIDI_MIDI_TIME_CODE = 0xf1;
const MIDI_SONG_POSITION_POINTER = 0xf2;
const MIDI_SONG_SELECT = 0xf3;
const MIDI_TUNE_REQUEST = 0xf6;
const MIDI_SYSEX_END = 0xf7;
const MIDI_TIMING_CLOCK = 0xf8;
const MIDI_START = 0xfa;
const MIDI_CONTINUE = 0xfb;
const MIDI_STOP = 0xfc;
const MIDI_ACTIVE_SENSING = 0xfe;
const MIDI_SYSTEM_RESET = 0xff;

const sysexManufacturerId = 0x7d;
const sysexStart = 0xf0;
const sysexEnd = 0xf7;
const sysexInput = 0x01;
const sysexOutput = 0x02;
const sysexPinModeDigitalIn = 0x00;
const sysexPinModeDigitalOut = 0x01;
const sysexPinModeDigitalInPullup = 0x02;
// #define INPUT 0x0
// #define OUTPUT 0x1
// #define INPUT_PULLUP 0x2
const sysexPinModeAnalogIn = 0x03;
const sysexPinModePWMOut = 0x04;

export {
  MIDI_NOTE_OFF,
  MIDI_NOTE_ON,
  MIDI_POLY_AFTERTOUCH,
  MIDI_CONTROL_CHANGE,
  MIDI_PROGRAM_CHANGE,
  MIDI_CHANNEL_AFTERTOUCH,
  MIDI_PITCH_BEND,
  MIDI_SYSEX_START,
  MIDI_MIDI_TIME_CODE,
  MIDI_SONG_POSITION_POINTER,
  MIDI_SONG_SELECT,
  MIDI_TUNE_REQUEST,
  MIDI_SYSEX_END,
  MIDI_TIMING_CLOCK,
  MIDI_START,
  MIDI_CONTINUE,
  MIDI_STOP,
  MIDI_ACTIVE_SENSING,
  MIDI_SYSTEM_RESET,
  sysexManufacturerId,
  sysexStart,
  sysexEnd,
  sysexInput,
  sysexOutput,
  sysexPinModeDigitalIn,
  sysexPinModeDigitalOut,
  sysexPinModeDigitalInPullup,
  sysexPinModeAnalogIn,
  sysexPinModePWMOut,
};


const MIDI_TYPE_LABELS: Record<number, string> = {
  [MIDI_CONTROL_CHANGE]: "Control Change",
  [MIDI_NOTE_ON]: "Note On",
  [MIDI_PITCH_BEND]: "Pitch Bend",
  [MIDI_PROGRAM_CHANGE]: "Program Change",
  [MIDI_POLY_AFTERTOUCH]: "Aftertouch",
};

export { MIDI_TYPE_LABELS };