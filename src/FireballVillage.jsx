import { motion } from "framer-motion";
import { useEffect } from "react";

function FireballVillage({ onCleanup }) {
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

  return <motion.div>protect your village buddy</motion.div>;
}

export default FireballVillage;
