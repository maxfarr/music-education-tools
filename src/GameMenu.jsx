import { animate, motion, useCycle } from "framer-motion";
import MenuGameChip from "./MenuGameChip";
import { getMenuCoords } from "./Utils";
import { GAMES } from "./Defs.jsx";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

// col-start-1
// col-start-2
function GameMenu() {
  const navigate = useNavigate();
  const selectedRoute = useRef("");

  function onSelectedGame(id) {
    const selected_event = new Event("gameSelected");
    selectedRoute.current = GAMES[id].route;
    document.dispatchEvent(selected_event);
  }

  function onCompletedAnimation(id) {
    navigate("/app" + selectedRoute.current);
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
      }}
      className={`bg-orange-100`}
    >
      {GAMES.map((game, i) => (
        <MenuGameChip
          onClick={onSelectedGame}
          onFinishAnimation={onCompletedAnimation}
          id={i}
          key={i}
          initialPos={getMenuCoords(i)}
          icon={game.icon}
        />
      ))}
    </div>
  );
}

export default GameMenu;
