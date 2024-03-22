import { useCycle, motion, animate, useAnimate } from "framer-motion";
import { getSideBarCoords } from "./Utils";
import { useEffect, useRef, useState } from "react";

const transition = { duration: 3, ease: "easeInOut" };

function GameChip({ onClick, id, icon, children }) {
  const [scope, animate] = useAnimate();
  //const [className, setClassName] = useState("size-40");

  return (
    <motion.div
      layout
      ref={scope}
      id={id}
      // initial={{ x: initialPos.x, y: initialPos.y }}
      className={"size-24 grow-0"} //className + " transition-all duration-1000"}
      onClick={() => onClick(id)}
      // style={{
      //   position: "absolute",
      // }}
    >
      {icon}
    </motion.div>
  );
}

export default GameChip;
