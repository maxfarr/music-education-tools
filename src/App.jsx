import { createContext, useEffect, useRef, useState } from "react";
import PitchDetector from "./PitchDetector";
import * as Tone from "tone";
import * as d3 from "d3";

const GRAPH_WIDTH_PX = 700;
const GRAPH_HEIGHT_PX = 400;

const GRAPH_UPDATE_MS = 40;
const PITCH_DETECT_MS = 10;

const BATCHES = 80;
const WINDOW_SIZE = BATCHES * 128;

let INPUT_SAMPLE_RATE = 48000.0;

const CLARITY_THRESHOLD = 0.75;

const SamplesContext = createContext();

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
};

const widgetStyle = {
  borderRadius: "25px",
  border: "2px solid " + mainColorHex,
  padding: "20px",
  float: "right",
};

const textStyle = {
  color: mainColorHex,
};

function App() {
  const samples = useRef([]);
  const [graphEnabled, setGraphEnabled] = useState(false);

  return (
    <>
      <SamplesContext.Provider value={{ samples: samples }}>
        <div className="buttons" style={{ float: "left" }}>
          <div>
            <StartMicButton samples={samples} />
          </div>
          <div>
            {/* <PitchDetector samples={samples} /> */}
            <ScaleGame samples={samples} sampleRate={INPUT_SAMPLE_RATE} />
          </div>
        </div>

        <div className="graphWidget" style={widgetStyle}>
          {graphEnabled ? <Graph samples={samples} /> : null}
          <ToggleGraphButton setEnabled={setGraphEnabled} />
        </div>
      </SamplesContext.Provider>
    </>
  );
}

function ScaleGame({ samples, sampleRate }) {
  const [gameRunning, setGameRunning] = useState(false);
  const detectedNote = useRef("");
  const previousDetectedNote = useRef("");
  const currentCounter = useRef(0);

  const detector = useRef();

  function onDetectFreq(freq, clarity) {
    const note = noteFromFreq(freq);
    if (note === previousDetectedNote.current) {
      currentCounter.current += 1;
      if (currentCounter.current === 14) {
        // console.log("note", note);
        // console.log("clarity", clarity);
        if (clarity > CLARITY_THRESHOLD) {
          console.log(`note ${note} with clarity ${clarity}`);
        }
      }
    } else {
      //console.log("reset");
      currentCounter.current = 0;
    }
    previousDetectedNote.current = detectedNote.current;
    detectedNote.current = note;
  }

  function startGame() {
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
      onDetectFreq
    );

    return () => {
      detector.current.stop();
    };
  }, []);

  return (
    <>
      {gameRunning ? <p>yes</p> : <p>no</p>}
      <StartGameButton startGame={startGame} />
      <StopGameButton stopGame={stopGame} />
    </>
  );
}

function StartGameButton({ startGame }) {
  return <button onClick={() => startGame()}>start</button>;
}

function StopGameButton({ stopGame }) {
  return <button onClick={() => stopGame()}>stop</button>;
}

function StartMicButton({ samples }) {
  async function start() {
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

    launchGraphWorker();
  }

  return (
    <button onClick={start} style={buttonStyle}>
      start mic input
    </button>
  );
}

function ToggleGraphButton({ setEnabled }) {
  async function stop() {
    setEnabled((e) => !e);
  }

  return (
    <button onClick={stop} style={buttonStyle}>
      toggle graph
    </button>
  );
}

function Graph({ samples }) {
  let line = d3
    .line()
    .x((d) => {
      return d[0];
    })
    .y((d) => {
      return d[1] * 150;
    });

  setInterval(() => {
    let datavals = [];
    if (!(samples.current === undefined || samples.current.length === 0)) {
      samples.current.map((value, index) => {
        datavals.push([index, value]);
        return value;
      });
    }

    d3.select(".frame").select(".graph").selectAll("path").remove();
    let svg = d3
      .select(".frame")
      .select(".graph")
      .append("path")
      .datum(datavals)
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

export default App;
