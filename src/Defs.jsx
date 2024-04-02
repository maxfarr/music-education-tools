import Fv from "./assets/chips/Fv";
import Sc from "./assets/chips/Sc";
import St from "./assets/chips/St";

const GAMES = [
  {
    route: "/scalegame",
    title: "Scale Game",
    colorName: "[#ef4444]",
    icon: <Sc className="fill-[#ef4444]" />,
  },
  {
    route: "/staffgame",
    title: "Staff Game",
    colorName: "[#607A51]",
    icon: <St className="fill-[#607A51]" />,
  },
  {
    route: "/fireballvillage",
    title: "Fireball Village",
    colorName: "[#6E65C5]",
    icon: <Fv className="fill-[#6E65C5]" />,
  },
];

const NOTE_LETTERS = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
];

const CIRCLE_OF_FIFTHS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "Ab",
  "Eb",
  "Bb",
  "F",
];

const SCALES = {
  C: {
    major: ["C", "D", "E", "F", "G", "A", "B"],
    minor: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
  },
  "C#": {},
  G: {
    major: ["G", "A", "B", "C", "D", "E", "F#"],
    minor: ["G", "A", "Bb", "C", "D", "Eb", "F"],
  },
  D: {
    major: ["D", "E", "F#", "G", "A", "B", "C#"],
    minor: ["D", "E", "F", "G", "A", "Bb", "C"],
  },
  A: {
    major: ["A", "B", "C#", "D", "E", "F#", "G#"],
    minor: ["A", "B", "C", "D", "E", "F", "G"],
  },
  E: {
    major: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    minor: ["E", "F#", "G", "A", "B", "C", "D"],
  },
  B: {
    major: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
    minor: ["B", "C#", "D", "E", "F#", "G", "A"],
  },
};

const SIDEBAR_CHIP_SIZE = "96px";

const INPUT_BUFFER_BATCHES = 80;

// constants for mcleod pitch detection method
const MCLEOD_CLARITY_THRESHOLD = 0.8;
const MCLEOD_WINDOW_SIZE = INPUT_BUFFER_BATCHES * 128;

const MCLEOD_DETECTOR_TICK_MS = 10;

export {
  GAMES,
  NOTE_LETTERS,
  CIRCLE_OF_FIFTHS,
  SCALES,
  SIDEBAR_CHIP_SIZE,
  INPUT_BUFFER_BATCHES,
  MCLEOD_CLARITY_THRESHOLD,
  MCLEOD_WINDOW_SIZE,
  MCLEOD_DETECTOR_TICK_MS,
};
