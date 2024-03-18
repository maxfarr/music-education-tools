import { createContext, useEffect, useRef, useState } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import PitchDetector from "./PitchDetector";
import * as Tone from "tone";
import * as d3 from "d3";

const GRAPH_WIDTH_PX = 700;
const GRAPH_HEIGHT_PX = 400;

const GRAPH_UPDATE_MS = 50;
const PITCH_DETECT_MS = 10;

const BATCHES = 80;
const WINDOW_SIZE = BATCHES * 128;

let INPUT_SAMPLE_RATE = 48000.0;

const CLARITY_THRESHOLD = 0.85;
const MAX_TAU = 600;

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/dev",
    element: <DevTools />,
  },
]);

const NOTE_LETTERS = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
];

const C_MAJOR = ["C", "D", "E", "F", "G", "A", "B"];
const G_MAJOR = ["G", "A", "B", "C", "D", "E", "F#"];
const D_MAJOR = ["D", "E", "F#", "G", "A", "B", "C#"];

const NOTE_TO_FREQ_DENOM = Math.log10(Math.pow(2, 1 / 12));
function noteFromFreq(freq) {
  const midi = Math.log10(freq / 27.5) / NOTE_TO_FREQ_DENOM;
  return NOTE_LETTERS[Math.round(midi) % 12];
}

const mainColorHex = "#af1f0e";
const backgroundHex = "#202020";

const buttonStyle = {
  borderRadius: "10px",
  margin: "3px",
  border: "2px solid " + mainColorHex,
  backgroundColor: backgroundHex,
  padding: "6px",
  color: mainColorHex,
  fontFamily: "donegal",
  fontSize: 24,
};

const graphButtonStyle = {
  borderRadius: "10px",
  margin: "3px",
  border: "2px solid " + mainColorHex,
  backgroundColor: backgroundHex,
  padding: "6px",
  color: mainColorHex,
  fontFamily: "donegal",
  fontSize: 18,
};

const widgetStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "20px",
  float: "right",
};

const boxStyle = {
  borderRadius: "25px",
  border: "2px solid " + mainColorHex,
  padding: "20px",
};

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

function AppRouter() {
  return <RouterProvider router={router} />;
}

function DevTools() {
  const samples = useRef([]);
  const NSDFvals = useRef([]);
  const [graphEnabled, setGraphEnabled] = useState(false);
  const [NSDFGraphEnabled, setNSDFGraphEnabled] = useState(false);

  async function micInputSetup() {
    function handleSampleBatch(batch) {
      if (batch === undefined) return;

      function newSampleBuffer(s) {
        let local_samples = s.concat(Array.from(batch));

        if (local_samples.length > 128 * BATCHES) {
          local_samples = local_samples.slice(
            local_samples.length - 128 * BATCHES
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
        await Tone.getContext().addAudioWorkletModule("./worker.js", "worker");
        let node = Tone.getContext().createAudioWorkletNode("worker");
        meter.connect(node);
        node.port.onmessage = (e) => handleSampleBatch(e.data[0][0]);
      } catch (e) {}
    }

    await launchGraphWorker();
  }

  return (
    <>
      <div className="graphWidget" style={widgetStyle}>
        <div style={boxStyle}>
          {graphEnabled ? <Graph samples={samples} /> : null}
          <ToggleGraphButton setEnabled={setGraphEnabled} />
        </div>

        <div style={boxStyle}>
          {NSDFGraphEnabled ? <NSDFGraph vals={NSDFvals} /> : null}
          <ToggleGraphButton setEnabled={setNSDFGraphEnabled} />
        </div>
      </div>

      {/* <PitchDetector samples={samples} /> */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ScaleGame
          samples={samples}
          sampleRate={INPUT_SAMPLE_RATE}
          NSDFvals={NSDFvals}
          initAudioInput={micInputSetup}
        />
      </div>
    </>
  );
}

function App() {
  return <div>try going to /dev you sillyhead</div>;
}

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
    const note = noteFromFreq(freq);
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
      PITCH_DETECT_MS,
      WINDOW_SIZE,
      0.9,
      onDetectFreq,
      onComputeNSDF
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

function ToggleGraphButton({ setEnabled }) {
  async function stop() {
    setEnabled((e) => !e);
  }

  return (
    <button onClick={stop} style={graphButtonStyle}>
      toggle graph
    </button>
  );
}

function Graph({ samples }) {
  let line = d3
    .line()
    .x((_, i) => {
      return i;
    })
    .y((d) => {
      return d * 150;
    });

  useEffect(() => {
    let id = setInterval(() => {
      d3.select(".frame").select(".graph").selectAll("path").remove();
      d3.select(".frame")
        .select(".graph")
        .append("path")
        .datum(samples.current)
        .attr("d", line)
        .attr("width", GRAPH_WIDTH_PX)
        .attr("height", GRAPH_HEIGHT_PX)
        .attr(
          "transform",
          `translate(0, ${GRAPH_HEIGHT_PX / 2}) scale(${
            GRAPH_WIDTH_PX / (128 * BATCHES)
          }, 1.0)`
        )
        .style("stroke", mainColorHex)
        .style("stroke-width", 3)
        .style("fill", "none");
    }, GRAPH_UPDATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="frame">
      <svg
        className="graph"
        width={GRAPH_WIDTH_PX}
        height={GRAPH_HEIGHT_PX}
      ></svg>
    </div>
  );
}

function NSDFGraph({ vals }) {
  let line = d3
    .line()
    .x((_, i) => {
      return i;
    })
    .y((d) => {
      return d * -150;
    });

  useEffect(() => {
    let id = setInterval(() => {
      d3.select(".nsdfgraphframe").select(".graph").selectAll("path").remove();
      d3.select(".nsdfgraphframe")
        .select(".graph")
        .append("path")
        .datum(vals.current)
        .attr("d", line)
        .attr("width", GRAPH_WIDTH_PX)
        .attr("height", GRAPH_HEIGHT_PX)
        .attr(
          "transform",
          `translate(0, ${GRAPH_HEIGHT_PX / 2}) scale(${
            GRAPH_WIDTH_PX / MAX_TAU
          }, 1.0)`
        )
        .style("stroke", mainColorHex)
        .style("stroke-width", 3)
        .style("fill", "none");
    }, GRAPH_UPDATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="nsdfgraphframe">
      <svg
        className="graph"
        width={GRAPH_WIDTH_PX}
        height={GRAPH_HEIGHT_PX}
      ></svg>
    </div>
  );
}

export default AppRouter;
