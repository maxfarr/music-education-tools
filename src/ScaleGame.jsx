import { motion, useAnimate, useCycle } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  SCALES,
  MCLEOD_CLARITY_THRESHOLD,
  MCLEOD_WINDOW_SIZE,
  MCLEOD_DETECTOR_TICK_MS,
} from "./Defs";
import Ladder from "./assets/Ladder";
import PitchDetector from "./PitchDetector";
import { freqToNote } from "./Utils";

function ScaleGame({ startInput, samples, sampleRate, onCleanup }) {
  const [ladderScope, animateLadder] = useAnimate();
  const [gameRunning, setGameRunning] = useState();
  const [targetDegree, setTargetDegree] = useState(0);
  const animationFinished = useRef(false);

  const [rootNote, cycleRootNote] = useCycle("C", "G", "D", "A", "E", "B");

  const scale = SCALES[rootNote]["major"];

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

  function isNoteCorrect(note) {
    return note === scale[targetDegree];
  }

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
    <div className="grid grid-cols-2 h-screen overflow-hidden text-[#973532]">
      <motion.div
        ref={ladderScope}
        className="self-end overflow-hidden mr-3"
        initial={{ y: -(window.innerHeight + 50) }}
      >
        <Ladder className={"fill-[#973532]"} />
      </motion.div>
      <div
        style={{ textShadow: "3px 3px 0px #bb513e" }}
        className="flex flex-col gap-6 self-center ml-3 text-7xl font-sans font-normal"
      >
        {gameRunning ? (
          <p>{scale[targetDegree]}</p>
        ) : (
          <>
            <p>root: {rootNote}</p>
            <p>scale: major</p>
            <p>infinite: X</p>
            <p onClick={startGame}>start!</p>
          </>
        )}
      </div>
    </div>
  );
}

export default ScaleGame;
