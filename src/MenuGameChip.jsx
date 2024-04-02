import { useCycle, motion, animate, useAnimate } from "framer-motion";
import { getSideBarCoords } from "./utils.js";
import { useEffect, useRef, useState } from "react";

const transition = { duration: 3, ease: "easeInOut" };

function MenuGameChip({ onClick, id, initialPos, icon, onFinishAnimation }) {
  const [scope, animate] = useAnimate();
  //const [className, setClassName] = useState("size-40");

  function getLineToSidebarPos() {
    const target = getSideBarCoords(id);
    return `M ${initialPos.x},${initialPos.y} L ${target.x},${target.y}`;
  }

  useEffect(() => {
    async function moveToSidebarTarget() {
      await animate(
        scope.current,
        { offsetDistance: "100%", width: "96px", height: "96px" },
        { ease: "easeInOut", duration: 1 },
      );
      onFinishAnimation(id);
      //setClassName("size-24");
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
      className={"size-52"} //className + " transition-all duration-1000"}
      onClick={() => onClick(id)}
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

export default MenuGameChip;
