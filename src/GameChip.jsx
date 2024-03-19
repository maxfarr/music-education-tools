import { useCycle, motion, animate, useAnimate } from "framer-motion";
import { getSideBarCoords } from "./Utils";
import "./index.css";
import { useEffect } from "react";

const transition = { duration: 3, ease: "easeInOut" };

function GameChip({ onClick, id, initialPos, icon, children }) {
  const [scope, animate] = useAnimate();

  function getLineToSidebarPos() {
    const [target_x, target_y] = getSideBarCoords(id);
    return `M ${initialPos.x},${initialPos.y} L ${target_x},${target_y}`;
  }

  useEffect(() => {
    function moveToSidebarTarget() {
      animate(scope.current, { offsetDistance: "100%" });
    }

    document.addEventListener("gameSelected", moveToSidebarTarget);
    return () => {
      document.removeEventListener("gameSelected", moveToSidebarTarget);
    };
  }, []);

  return (
    <motion.div
      layout
      ref={scope}
      id={id}
      // initial={{ x: initialPos.x, y: initialPos.y }}
      className="size-40"
      onClick={onClick}
      style={{
        offsetPath: `path("${getLineToSidebarPos()}")`,
        offsetRotate: "0deg",
        position: "absolute",
      }}
    >
      {icon}
    </motion.div>
  );
}

export default GameChip;
