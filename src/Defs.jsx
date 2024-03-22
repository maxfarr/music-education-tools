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

const SIDEBAR_CHIP_SIZE = "96px";

export { GAMES, SIDEBAR_CHIP_SIZE };
