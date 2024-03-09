import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import * as d3 from "d3";

const BATCHES = 80;
const GRAPH_WIDTH = 700;
const GRAPH_HEIGHT = 400;
const GRAPH_UPDATE_MS = 40;
const PITCH_DETECT_MS = 100;
const WINDOW_SIZE = BATCHES * 128;

const MAX_TAU = 600;

const INPUT_SAMPLE_RATE = 44100.0;

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
    setContext(new AudioContext({ sampleRate: INPUT_SAMPLE_RATE }));
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
  const [, setSucks] = useState();

  let line = d3
    .line()
    .x((d) => {
      return d[0];
    })
    .y((d) => {
      return d[1] * 150;
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

const MATH_DENOM = Math.log10(Math.pow(2, 1 / 12));
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

function PitchDetector({ samples }) {
  const svgRef = useRef();
  const [peakTau, setPeakTau] = useState(0);

  function noteFromTau(tau) {
    const freq = INPUT_SAMPLE_RATE / tau;
    const midi = Math.log10(freq / 27.5) / MATH_DENOM;
    return NOTE_LETTERS[Math.round(midi) % 12];
  }

  const note = noteFromTau(peakTau);

  let line = d3
    .line()
    .x((d) => {
      return d[0];
    })
    .y((d) => {
      return d[1] * -150;
    });

  const k = 0.9;

  useEffect(() => {
    // create svg element
    var svg = d3.select(".detectorFrame").select(".graph");

    // Create the scale
    var x = d3
      .scaleLinear()
      .domain([1, MAX_TAU]) // This is what is written on the Axis: from 0 to 100
      .range([0, GRAPH_WIDTH]); // This is where the axis is placed: from 100px to 800px

    // Draw the axis
    svg
      .append("g")
      .attr("transform", `translate(0,${GRAPH_HEIGHT * 0.9})`) // This controls the vertical position of the Axis
      .call(d3.axisBottom(x));

    svg
      .append("line")
      .style("stroke", lineGreenHex)
      .attr("x1", 0)
      .attr("y1", GRAPH_HEIGHT / 2)
      .attr("x2", GRAPH_WIDTH)
      .attr("y2", GRAPH_HEIGHT / 2)
      .style("stroke-dasharray", "3, 3");
  });

  function initDetection() {
    setInterval(() => {
      let datavals = [];

      let positiveZeroCrossings = [];
      let negativeZeroCrossings = [];

      //console.log(maxval);
      if (samples.current === undefined || samples.current.length === 0) {
        return;
      }

      //console.log("like, hello!!!!");
      for (let i = 0; i < MAX_TAU; i++) {
        let val = NSDF(i + 1, samples);
        //console.log("val " + i.toString() + ": ", val);
        //console.log("before");
        //console.log("val: ", val, "maxval: ", maxval);

        //console.log("after");
        //console.log("val: ", val, "maxval: ", maxval);
        datavals.push([i, val]);
      }

      for (let i = 1; i < MAX_TAU; i++) {
        if (datavals[i][1] >= 0 && datavals[i - 1][1] < 0) {
          positiveZeroCrossings.push(i);
        }

        if (datavals[i][1] <= 0 && datavals[i - 1][1] > 0) {
          negativeZeroCrossings.push(i);
        }
      }

      let calculatePeak = true;
      if (positiveZeroCrossings.length === 0) {
        //throw new Error("initDetection: no positive zero crossings");
        //console.log("initDetection: no positive zero crossings");
        calculatePeak = false;
      }
      if (negativeZeroCrossings.length === 0) {
        //throw new Error("initDetection: no negative zero crossings");
        //console.log("initDetection: no negative zero crossings");
        calculatePeak = false;
      }
      if (negativeZeroCrossings[0] > positiveZeroCrossings[0]) {
        //throw new Error("first crossing is not negative");
        //console.log("first crossing is not negative");
        calculatePeak = false;
      }

      if (calculatePeak) {
        let maxval = datavals[positiveZeroCrossings[0]][1];
        for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
          let val = datavals[i][1];
          if (val > maxval) {
            maxval = val;
          }
        }

        let threshold = maxval * k;

        for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
          if (
            datavals[i - 1][1] > threshold &&
            datavals[i][1] < datavals[i - 1][1]
          ) {
            setPeakTau(i - 1);
            break;
          }
        }
      }

      //console.log("maxval: ", maxval);

      d3.select(".detectorFrame").select(".graph").selectAll("path").remove();
      let svg = d3
        .select(".detectorFrame")
        .select(".graph")
        .append("path")
        .datum(datavals)
        .attr("d", line)
        .attr("width", GRAPH_WIDTH)
        .attr("height", GRAPH_HEIGHT)
        .attr(
          "transform",
          `translate(0, ${GRAPH_HEIGHT / 2}) scale(${GRAPH_WIDTH / 600}, 1.0)`
        )
        .style("stroke", lineGreenHex)
        .style("stroke-width", 3)
        .style("fill", "none");

      // for (let i = 25; i < 600; i++) {
      //   // console.log(
      //   //   "i: ",
      //   //   i,
      //   //   "maxval * k: ",
      //   //   maxval * k,
      //   //   "datavals[i]: ",
      //   //   datavals[i]
      //   // );
      //   if (
      //     datavals[i][1] < datavals[i - 1][1] &&
      //     datavals[i - 1][1] > maxval * k
      //   ) {
      //     setPeakTau(i + 1);
      //     console.log("set peak ", i + 1);
      //     return;
      //   }
      // }
    }, PITCH_DETECT_MS);
  }

  return (
    <div className="detectorFrame" style={widgetStyle}>
      <svg
        className="graph"
        width={GRAPH_WIDTH}
        height={GRAPH_HEIGHT}
        ref={svgRef}
      ></svg>
      <p>
        detected peak: {peakTau.toString()} samples (
        {peakTau === 0 ? "NaN" : (INPUT_SAMPLE_RATE / peakTau).toString()} Hz)
      </p>
      <p>detected note: {note}</p>
      <button onClick={initDetection} style={buttonStyle}>
        start pitch detection
      </button>
    </div>
  );
}

export default App;
