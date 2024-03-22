import { motion, useAnimate, useCycle } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { GAMES, SCALES } from "./Defs";
import Ladder from "./assets/Ladder";
import PitchDetector from "./PitchDetector";

function ScaleGame({ id, onCleanup }) {
  const [ladderScope, animateLadder] = useAnimate();
  const [gameRunning, setGameRunning] = useState();
  const [targetDegree, setTargetDegree] = useState(0);

  const [rootNote, cycleRootNote] = useCycle("C", "G", "D", "A", "E", "B");

  const scale = SCALES[rootNote]["major"];

  const previousDetectedNote = useRef("");
  const currentCounter = useRef(0);

  const detector = useRef();

  useEffect(() => {
    animateLadder(ladderScope.current, { y: 300 }, { duration: 1 });

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

  // function onDetectNote(note) {
  //   if (isNoteCorrect(note)) {
  //     console.log("setting increment callback");
  //     setTargetDegree((d) => {
  //       console.log("incrementing from ", d);
  //       return (d + 1) % 7;
  //     });
  //   }
  // }

  // function onDetectFreq(freq, clarity) {
  //   if (freq > 1300.0) return;

  //   //console.log(freq);
  //   const note = noteFromFreq(freq);
  //   if (note === previousDetectedNote.current) {
  //     currentCounter.current += 1;
  //     if (currentCounter.current === 14) {
  //       if (clarity > CLARITY_THRESHOLD) {
  //         console.log(`note ${note} with clarity ${clarity}`);

  //         if (isNoteCorrect(note)) {
  //           console.log("setting increment callback");
  //           setTargetDegree((d) => {
  //             console.log("incrementing from ", d);
  //             return (d + 1) % 7;
  //           });
  //         }
  //       }
  //     }
  //   } else {
  //     currentCounter.current = 0;
  //   }

  //   previousDetectedNote.current = note;
  // }

  // function onComputeNSDF(datavals) {
  //   NSDFvals.current = datavals;
  // }

  // async function startGame() {
  //   await initAudioInput();
  //   detector.current.start();
  //   setGameRunning(true);
  // }

  // function stopGame() {
  //   detector.current.stop();
  //   setGameRunning(false);
  // }

  // useEffect(() => {
  //   detector.current = new PitchDetector(
  //     samples,
  //     sampleRate,
  //     PITCH_DETECT_MS,
  //     WINDOW_SIZE,
  //     0.9,
  //     onDetectFreq,
  //     onComputeNSDF,
  //   );

  //   return () => {
  //     detector.current.stop();
  //   };
  // }, []);

  // useEffect(() => {
  //   detector.current.freqCallback = onDetectFreq;
  // }, [targetDegree]);

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
      {gameRunning ? (
        <div>
          <p>game is started</p>
        </div>
      ) : (
        <div
          style={{ textShadow: "3px 3px 0px #bb513e" }}
          className="flex flex-col gap-6 self-center ml-3 text-7xl font-sans font-normal"
        >
          <p>root: {rootNote}</p>
          <p>scale: major</p>
          <p>infinite: X</p>
          <p>start!</p>
        </div>
      )}
    </div>
  );
}

export default ScaleGame;
