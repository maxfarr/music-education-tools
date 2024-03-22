import { motion, useAnimate } from "framer-motion";
import { useEffect, useState } from "react";
import { GAMES } from "./Defs";
import Ladder from "./assets/Ladder";

function ScaleGame() {
  const [ladderScope, animateLadder] = useAnimate();
  const [gameStarted, setGameStarted] = useState();

  useEffect(() => {
    animateLadder(ladderScope.current, { y: 300 }, { duration: 1 });
  }, []);

  return (
    <div className="grid grid-cols-2 h-screen overflow-hidden text-[#973532]">
      <motion.div
        ref={ladderScope}
        className="self-end overflow-hidden mr-3"
        initial={{ y: -(window.innerHeight + 50) }}
      >
        <Ladder className={"fill-[#973532]"} />
      </motion.div>
      {gameStarted ? (
        <div>
          <p>game is started</p>
        </div>
      ) : (
        <div
          style={{ textShadow: "3px 3px 0px #bb513e" }}
          className="flex flex-col gap-6 self-center ml-3 text-6xl font-sans font-semibold"
        >
          <p className="">root: C</p>
          <p className="">scale: major</p>
          <p className="">setting 3: X</p>
          <p className="">setting 4: X</p>
        </div>
      )}
    </div>
  );
}

export default ScaleGame;
