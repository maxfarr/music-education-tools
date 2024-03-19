import { useEffect, useState } from "react";
import "./index.css";
import { useCycle } from "framer-motion";
import GameSelector from "./GameSelector";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { getSideBarCoords } from "./Utils";

function App() {
  //document.body.className = `bg-orange-400/100`;
  //document.body.style = "background-color: #ffedd5; color-scheme: light;";
  document.body.style = "background-color: #ffedd5;";
  const [primaryColor, setPrimaryColor] = useState("");

  useEffect(() => {
    document.addEventListener("click", (e) => {
      console.log(e.x, e.y);
    });
  }, []);

  return (
    //<div className="grid grid-cols-[150px_1fr_150px] place-items-center h-screen">
    //<div style={{ backgroundColor: "#ffedd5", height: "100%" }}>
    <div>
      <GameSelector />
    </div>

    //</div>
  );
}

export default App;
