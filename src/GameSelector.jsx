import "./index.css";
import { animate, motion, useCycle } from "framer-motion";
import Sc from "./assets/chips/Sc";
import St from "./assets/chips/St";
import Fv from "./assets/chips/Fv";
// import { ReactComponent as Sc } from "../public/Sc.svg";
// import { ReactComponent as St } from "../public/St.svg";
// import { ReactComponent as Fv } from "../public/Fv.svg";
import GameChip from "./GameChip";
import { getSideBarCoords } from "./Utils";

// const GAMES = [
//   { route: "/scalegame", name: "Scale Game", colorClass: "fill-emerald-700" },
//   { route: "/scalegame", name: "Scale Game", colorClass: "fill-emerald-700" },
//   { route: "/scalegame", name: "Scale Game", colorClass: "fill-emerald-700" },
// ];

const GAMES = [
  {
    route: "/scalegame",
    title: "Scale Game",
    icon: <Sc className="fill-emerald-700" />,
  },
  {
    route: "/staffgame",
    title: "Staff Game",
    icon: <St className="fill-fuchsia-700" />,
  },
  {
    route: "/fireballvillage",
    title: "Fireball Village",
    icon: <Fv className="fill-red-700" />,
  },
];

const MENU_CHIP_SIZE = "100px";

// col-start-1
// col-start-2
function GameSelector() {
  const [minimized, cycleMinimized] = useCycle(false, true);

  function onSelectedGame(id) {
    const event = new Event("gameSelected");
    document.dispatchEvent(event);
  }

  return (
    <div>
      {GAMES.map((game, i) => (
        <GameChip
          onClick={onSelectedGame}
          id={i}
          size={MENU_CHIP_SIZE}
          initialPos={{ x: 800 + 200 * i, y: 500 }}
          icon={game.icon}
        />
      ))}
    </div>
  );
}

export default GameSelector;
