import Fv from "./assets/chips/Fv";
import Sc from "./assets/chips/Sc";
import St from "./assets/chips/St";

const GAMES = [
  {
    route: "/scalegame",
    title: "Scale Game",
    colorName: "[#973532]",
    icon: <Sc className="fill-[#973532]" />,
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

const SCALES = {
  C: {
    major: ["C", "D", "E", "F", "G", "A", "B"],
  },
  G: {
    major: ["G", "A", "B", "C", "D", "E", "F#"],
  },
  D: {
    major: ["D", "E", "F#", "G", "A", "B", "C#"],
  },
  A: {
    major: ["A", "B", "C#", "D", "E", "F#", "G#"],
  },
  E: {
    major: ["E", "F#", "G#", "A", "B", "C#", "D#"],
  },
  B: {
    major: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  },
};

const SIDEBAR_CHIP_SIZE = "96px";

export { GAMES, SCALES, SIDEBAR_CHIP_SIZE };
