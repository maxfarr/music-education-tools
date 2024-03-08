import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import * as d3 from "d3";

const BATCHES = 100;
const GRAPH_WIDTH = 700;
const GRAPH_HEIGHT = 400;
const GRAPH_UPDATE_MS = 40;
const PITCH_DETECT_MS = 100;
const WINDOW_SIZE = BATCHES * 128;

const SamplesContext = createContext();

const lineGreenHex = "#73AD21";
const backgroundHex = "#202020";

const buttonStyle = {
  borderRadius: "10px",
  margin: "3px",
  border: "2px solid " + lineGreenHex,
  backgroundColor: backgroundHex,
  padding: "6px",
};

const widgetStyle = {
  borderRadius: "25px",
  border: "2px solid " + lineGreenHex,
  padding: "20px",
  float: "right",
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
            <PitchDetector samples={samples} />
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

function StartMicButton({ samples }) {
  const [context, setContext] = useState();

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
    setContext(new AudioContext());
    console.log("context:", context);

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
          "../public/worker.js",
          "worker"
        );
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
  const [, setSucks] = useState();

  let line = d3
    .line()
    .x((d) => {
      return d[0];
    })
    .y((d) => {
      return d[1] * 300;
    });

  setInterval(() => {
    setSucks();
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
      .attr("width", GRAPH_WIDTH)
      .attr("height", GRAPH_HEIGHT)
      .attr(
        "transform",
        `translate(0, ${GRAPH_HEIGHT / 2}) scale(${
          GRAPH_WIDTH / (128 * BATCHES)
        }, 1.0)`
      )
      .style("stroke", lineGreenHex)
      .style("stroke-width", 3)
      .style("fill", "none");
  }, GRAPH_UPDATE_MS);

  return (
    <div className="frame">
      <svg className="graph" width={GRAPH_WIDTH} height={GRAPH_HEIGHT}></svg>
    </div>
  );
}

function ACF(tau, samples) {
  let accum = 0.0;
  if (WINDOW_SIZE > samples.current.length) {
    return 0.0;
  }
  for (let i = 0; i < WINDOW_SIZE - tau; i++) {
    accum += samples.current[i] * samples.current[i + tau];
  }
  return accum;
}

function SDF(tau, samples) {
  let accum = 0.0;
  if (WINDOW_SIZE > samples.current.length) {
    return 0.0;
  }
  for (let i = 0; i < WINDOW_SIZE - tau; i++) {
    accum += Math.pow(samples.current[i] - samples.current[i + tau], 2);
  }
  return accum;
}

function NSDF(tau, samples) {
  let accum = 0.0;
  if (WINDOW_SIZE > samples.current.length) {
    return 0.0;
  }
  for (let i = 0; i < WINDOW_SIZE - tau; i++) {
    accum +=
      Math.pow(samples.current[i], 2) + Math.pow(samples.current[i + tau], 2);
  }
  return (2 * ACF(tau, samples)) / accum;
}

function PitchDetector({ samples }) {
  const [ACFtext, setACFtext] = useState("");
  const [SDFtext, setSDFtext] = useState("");
  const [NSDFtext, setNSDFtext] = useState("");

  function initDetection() {
    setInterval(() => {
      setACFtext(ACF(440, samples).toString());
      setSDFtext(SDF(440, samples).toString());
      setNSDFtext(NSDF(440, samples).toString());
    }, PITCH_DETECT_MS);
  }

  return (
    <div className="detectorFrame" style={widgetStyle}>
      <p>ACF: {ACFtext}</p>
      <p>SDF: {SDFtext}</p>
      <p>NSDF: {NSDFtext}</p>
      <button onClick={initDetection} style={buttonStyle}>
        start pitch detection
      </button>
    </div>
  );
}

export default App;
