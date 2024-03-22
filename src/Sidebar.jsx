import { useState } from "react";
import { GAMES, SIDEBAR_CHIP_SIZE } from "./Defs";
import GameChip from "./GameChip";
import { useNavigate } from "react-router-dom";

function Sidebar({ onSelectedGame }) {
  const navigate = useNavigate();

  function handleClick(id) {
    onSelectedGame(id);
    navigate("/app" + GAMES[id].route);
  }

  return (
    <div className="self-center flex flex-col absolute ml-[80px] gap-y-[32px] justify-center size-fit">
      {GAMES.map((game, i) => (
        <GameChip onClick={handleClick} id={i} icon={game.icon} />
      ))}
    </div>
  );
}

export default Sidebar;
