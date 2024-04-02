import { motion, useAnimate, useCycle } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SCALES,
  MCLEOD_CLARITY_THRESHOLD,
  MCLEOD_WINDOW_SIZE,
  MCLEOD_DETECTOR_TICK_MS,
} from "./Defs";
import Ladder from "./assets/Ladder";
import PitchDetector from "./pitch-detector";
import { freqToNote } from "./utils";
import ScaleSelector from "./ScaleSelector";

function ScaleGame({ startInput, samples, sampleRate, onCleanup }) {
  const [ladderScope, animateLadder] = useAnimate();
  const [gameRunning, setGameRunning] = useState(false);
  const [targetDegree, setTargetDegree] = useState(0);
  const animationFinished = useRef(false);

  const scale = useRef(SCALES["C"]["major"]);
  console.log("scale", scale);

  const previousDetectedNote = useRef("");
  const currentCounter = useRef(0);

  const detector = useRef();

  useEffect(() => {
    animateLadder(ladderScope.current, { y: 300 }, { duration: 1 }).then(() => {
      animationFinished.current = true;
    });

    function handleCleanup() {
      console.log("handleCleanup");
      onCleanup(
        animateLadder(
          ladderScope.current,
          { y: -(window.innerHeight + 50) },
          { duration: 1 },
        ),
      );
    }

    document.addEventListener("gameCleanup", handleCleanup);
    return () => {
      document.removeEventListener("gameCleanup", handleCleanup);
    };
  }, []);

  function onSelectScale(scale) {
    console.log(scale);
    scale.current = scale;
  }

  // function isNoteCorrect(note) {
  //   console.log("note", note);
  //   console.log("target note", scale.current[targetDegree]);
  //   return note === scale.current[targetDegree];
  // }

  const isNoteCorrect = useCallback(
    (note) => {
      console.log("note", note);
      console.log("target note", scale.current[targetDegree]);
      return note === scale.current[targetDegree];
    },
    [targetDegree, scale],
  );

  function onDetectFreq(freq, clarity) {
    if (freq > 1300.0) return;

    //console.log(freq);
    const note = freqToNote(freq);
    if (note === previousDetectedNote.current) {
      currentCounter.current += 1;
      if (currentCounter.current === 14) {
        if (clarity > MCLEOD_CLARITY_THRESHOLD) {
          console.log(`note ${note} with clarity ${clarity}`);

          if (isNoteCorrect(note)) {
            console.log("setting increment callback");
            setTargetDegree((d) => {
              console.log("incrementing from ", d);
              return (d + 1) % 7;
            });
          }
        }
      }
    } else {
      currentCounter.current = 0;
    }

    previousDetectedNote.current = note;
  }

  async function startGame() {
    if (animationFinished.current) {
      await startInput();
      detector.current.start();
      setGameRunning(true);
      //console.log("rootNote", rootNote);
    }
  }

  function stopGame() {
    detector.current.stop();
    setGameRunning(false);
  }

  useEffect(() => {
    detector.current = new PitchDetector(
      samples,
      sampleRate,
      MCLEOD_DETECTOR_TICK_MS,
      MCLEOD_WINDOW_SIZE,
      0.9,
      onDetectFreq,
    );

    return () => {
      detector.current.stop();
    };
  }, []);

  useEffect(() => {
    detector.current.freqCallback = onDetectFreq;
  }, [targetDegree]);

  // return (
  //   <div style={{ ...boxStyle, alignItems: "center" }}>
  //     {gameRunning ? (
  //       <>
  //         <p style={{ ...textStyle, textAlign: "left" }}>
  //           play this note, please:
  //         </p>
  //         <p style={mainTextStyle}>{scale[targetDegree]}</p>
  //       </>
  //     ) : (
  //       <p style={textStyle}>i am asleep</p>
  //     )}
  //     <StartGameButton startGame={startGame} />
  //     <StopGameButton stopGame={stopGame} />
  //   </div>
  // );

  return (
    <div className="grid h-screen grid-cols-[465px_auto] overflow-hidden text-red-500">
      <motion.div
        ref={ladderScope}
        className="self-end overflow-hidden"
        initial={{ y: -(window.innerHeight + 50) }}
      >
        <Ladder className={"fill-red-500"} />
      </motion.div>
      <div className="ml-3 mr-auto flex flex-col gap-6 self-center font-sans text-4xl font-normal">
        {gameRunning ? (
          <p className="text-center text-[150px]">
            {scale.current[targetDegree]}
          </p>
        ) : (
          <ScaleGameSettings
            startGame={startGame}
            onSelectScale={onSelectScale}
          />
        )}
      </div>
    </div>
  );
}

function ScaleGameSettings({ startGame, onSelectScale }) {
  return (
    <div className="flex flex-col place-content-center text-orange-100">
      <ScaleSelector onSelectScale={onSelectScale} />
      <button
        onClick={startGame}
        className="m-3 mt-0 bg-red-500 py-1 text-7xl italic text-orange-100"
      >
        start!
      </button>
    </div>
  );
}

export default ScaleGame;
