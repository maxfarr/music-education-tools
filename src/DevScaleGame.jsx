import { useEffect, useRef, useState } from "react";
import PitchDetector from "./pitch-detector";
import { MCLEOD_DETECTOR_TICK_MS } from "./Defs";
import { freqToNote } from "./utils";

const C_MAJOR = ["C", "D", "E", "F", "G", "A", "B"];
const G_MAJOR = ["G", "A", "B", "C", "D", "E", "F#"];
const D_MAJOR = ["D", "E", "F#", "G", "A", "B", "C#"];

const mainColorHex = "#af1f0e";
const backgroundHex = "#202020";

const CLARITY_THRESHOLD = 0.8;

const BATCHES = 80;
const WINDOW_SIZE = BATCHES * 128;

const textStyle = {
  color: mainColorHex,
  fontFamily: "donegal",
  fontSize: 24,
  textAlign: "center",
};

const mainTextStyle = {
  color: mainColorHex,
  fontFamily: "donegal",
  textAlign: "center",
  fontSize: 80,
};

const boxStyle = {
  borderRadius: "25px",
  border: "2px solid " + mainColorHex,
  padding: "20px",
};

function ScaleGame({ samples, sampleRate, NSDFvals, initAudioInput }) {
  const [gameRunning, setGameRunning] = useState(false);
  const [targetDegree, setTargetDegree] = useState(0);
  const previousDetectedNote = useRef("");
  const currentCounter = useRef(0);

  const detector = useRef();

  const scale = C_MAJOR;

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

  function onDetectFreq(freq, clarity) {
    if (freq > 1300.0) return;

    //console.log(freq);
    const note = freqToNote(freq);
    if (note === previousDetectedNote.current) {
      currentCounter.current += 1;
      if (currentCounter.current === 14) {
        if (clarity > CLARITY_THRESHOLD) {
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

  function onComputeNSDF(datavals) {
    NSDFvals.current = datavals;
  }

  async function startGame() {
    await initAudioInput();
    detector.current.start();
    setGameRunning(true);
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
      WINDOW_SIZE,
      0.9,
      onDetectFreq,
      onComputeNSDF,
    );

    return () => {
      detector.current.stop();
    };
  }, []);

  useEffect(() => {
    detector.current.freqCallback = onDetectFreq;
  }, [targetDegree]);

  return (
    <div style={{ ...boxStyle, alignItems: "center" }}>
      {gameRunning ? (
        <>
          <p style={{ ...textStyle, textAlign: "left" }}>
            play this note, please:
          </p>
          <p style={mainTextStyle}>{scale[targetDegree]}</p>
        </>
      ) : (
        <p style={textStyle}>i am asleep</p>
      )}
      <StartGameButton startGame={startGame} />
      <StopGameButton stopGame={stopGame} />
    </div>
  );
}

const buttonStyle = {
  borderRadius: "10px",
  margin: "3px",
  border: "2px solid " + mainColorHex,
  padding: "6px",
  color: mainColorHex,
  backgroundColor: backgroundHex,
  fontFamily: "donegal",
  fontSize: 24,
};

function StartGameButton({ startGame }) {
  return (
    <button style={buttonStyle} onClick={() => startGame()}>
      start
    </button>
  );
}

function StopGameButton({ stopGame }) {
  return (
    <button style={buttonStyle} onClick={() => stopGame()}>
      stop
    </button>
  );
}

export default ScaleGame;
