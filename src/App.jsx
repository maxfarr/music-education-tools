import { useState } from "react";
import Sidebar from "./Sidebar";
import { useParams } from "react-router-dom";
import { GAMES } from "./Defs";
import ScaleGame from "./ScaleGame";
import StaffGame from "./StaffGame";
import FireballVillage from "./FireballVillage";

// bg-orange-100
// bg-fuschia-700
// bg-red-700
// bg-emerald-700
// bg-[#607A51]
// bg-[#973532]
// bg-[#6E65C5]
function App() {
  let params = useParams();
  const [currentGame, setCurrentGame] = useState("/" + params.game);
  console.log(params.game);

  function onSelectedGame(id) {
    setCurrentGame(GAMES[id].route);
  }

  function getGameComponent() {
    switch (currentGame) {
      case "/scalegame":
        return <ScaleGame />;
      case "/staffgame":
        return <StaffGame />;
      case "/fireballvillage":
        return <FireballVillage />;
      default:
        break;
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
      }}
      className={`bg-orange-100 relative justify-center`}
    >
      <div className="grid grid-cols-[150px_1fr_150px] grid-flow-col h-screen">
        <Sidebar onSelectedGame={onSelectedGame} />
        <div className="col-start-2 place-self-center">
          {getGameComponent()}
        </div>
      </div>
    </div>
  );
}

export default App;
