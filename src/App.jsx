import { createContext, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import * as d3 from "d3";

const GRAPH_WIDTH_PX = 700;
const GRAPH_HEIGHT_PX = 400;

const GRAPH_UPDATE_MS = 40;
const PITCH_DETECT_MS = 100;

const MAX_TAU = 600;
const BATCHES = 80;
const WINDOW_SIZE = BATCHES * 128;

let INPUT_SAMPLE_RATE = 44100.0;

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
    // draw axis
    var svg = d3.select(".detectorFrame").select(".graph");

    var x = d3.scaleLinear().domain([1, MAX_TAU]).range([0, GRAPH_WIDTH_PX]);

    svg
      .append("g")
      .attr("transform", `translate(0,${GRAPH_HEIGHT_PX * 0.9})`)
      .style("color", mainColorHex)
      .call(d3.axisBottom(x));

    svg
      .append("line")
      .style("stroke", mainColorHex)
      .attr("x1", 0)
      .attr("y1", GRAPH_HEIGHT_PX / 2)
      .attr("x2", GRAPH_WIDTH_PX)
      .attr("y2", GRAPH_HEIGHT_PX / 2)
      .style("stroke-dasharray", "3, 3");
  });

  function initDetection() {
    setInterval(() => {
      let datavals = [];

      let positiveZeroCrossings = [];
      let negativeZeroCrossings = [];

      if (samples.current === undefined || samples.current.length === 0) {
        return;
      }

      for (let i = 0; i < MAX_TAU; i++) {
        let val = NSDF(i + 1, samples);
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

      // TODO: figure this mess out
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
            setPeakTau(i);
            break;
          }
        }
      }

      d3.select(".detectorFrame").select(".graph").selectAll("path").remove();
      let svg = d3
        .select(".detectorFrame")
        .select(".graph")
        .append("path")
        .datum(datavals)
        .attr("d", line)
        .attr("width", GRAPH_WIDTH_PX)
        .attr("height", GRAPH_HEIGHT_PX)
        .attr(
          "transform",
          `translate(0, ${GRAPH_HEIGHT_PX / 2}) scale(${
            GRAPH_WIDTH_PX / 600
          }, 1.0)`
        )
        .style("stroke", mainColorHex)
        .style("stroke-width", 3)
        .style("fill", "none");
    }, PITCH_DETECT_MS);
  }

  return (
    <div className="detectorFrame" style={widgetStyle}>
      <svg
        className="graph"
        width={GRAPH_WIDTH_PX}
        height={GRAPH_HEIGHT_PX}
        ref={svgRef}
      ></svg>
      <p style={textStyle}>
        detected peak: {peakTau.toString()} samples (
        {peakTau === 0 ? "NaN" : (INPUT_SAMPLE_RATE / peakTau).toString()} Hz)
      </p>
      <p style={textStyle}>detected note: {note}</p>
      <button onClick={initDetection} style={buttonStyle}>
        start pitch detection
      </button>
    </div>
  );
}

export default App;
