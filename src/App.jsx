import { useRef, useState } from "react";
import Sidebar from "./Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import { GAMES, INPUT_BUFFER_BATCHES } from "./Defs";
import ScaleGame from "./ScaleGame";
import StaffGame from "./StaffGame";
import FireballVillage from "./FireballVillage";
import * as Tone from "tone";

//bg-orange-100
function App() {
  const navigate = useNavigate();
  let params = useParams();
  const [currentGame, setCurrentGame] = useState("/" + params.game);
  const samples = useRef([]);
  const nextGameID = useRef();

  let INPUT_SAMPLE_RATE = 48000.0;

  async function micInputSetup() {
    function handleSampleBatch(batch) {
      if (batch === undefined) return;

      function newSampleBuffer(s) {
        let local_samples = s.concat(Array.from(batch));

        if (local_samples.length > 128 * INPUT_BUFFER_BATCHES) {
          local_samples = local_samples.slice(
            local_samples.length - 128 * INPUT_BUFFER_BATCHES,
          );
        }

        return local_samples;
      }

      samples.current = newSampleBuffer(samples.current);
    }

    await Tone.start();
    INPUT_SAMPLE_RATE = Tone.getContext().sampleRate;
    console.log("sample rate: " + INPUT_SAMPLE_RATE.toString());

    const meter = new Tone.Meter();
    const mic = new Tone.UserMedia().connect(meter);

    samples.current = [];

    mic
      .open()
      .then(() => {
        console.log("mic started");
      })
      .catch((e) => {
        console.log(e);
      });

    async function launchGraphWorker() {
      try {
        await Tone.getContext().addAudioWorkletModule(
          "/modules/worker.js",
          "worker",
        );
        let node = Tone.getContext().createAudioWorkletNode("worker");
        meter.connect(node);
        node.port.onmessage = (e) => handleSampleBatch(e.data[0][0]);
      } catch (e) {
        console.log(e);
      }
    }

    await launchGraphWorker();
  }

  function onSelectedGame(id) {
    if (GAMES[id].route !== currentGame) {
      nextGameID.current = id;

      const event = new Event("gameCleanup");
      document.dispatchEvent(event);
    }
  }

  async function onGameCleanup(animationPromise) {
    await animationPromise;

    setCurrentGame(GAMES[nextGameID.current].route);
    navigate("/app" + GAMES[nextGameID.current].route);
  }

  function getGameComponent() {
    switch (currentGame) {
      case "/scalegame":
        return (
          <ScaleGame
            startInput={micInputSetup}
            onCleanup={onGameCleanup}
            samples={samples}
            sampleRate={INPUT_SAMPLE_RATE}
          />
        );
      case "/staffgame":
        return <StaffGame onCleanup={onGameCleanup} />;
      case "/fireballvillage":
        return <FireballVillage onCleanup={onGameCleanup} />;
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
