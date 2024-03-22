import { motion } from "framer-motion";
import { useEffect } from "react";

function StaffGame({ onCleanup }) {
  useEffect(() => {
    function handleCleanup() {
      onCleanup(async function () {
        return;
      });
    }

    document.addEventListener("gameCleanup", handleCleanup);
    return () => {
      document.removeEventListener("gameCleanup", handleCleanup);
    };
  }, []);

  return <motion.div>this is staff game</motion.div>;
}

export default StaffGame;
