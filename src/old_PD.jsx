import { useEffect, useState } from "react";
import * as d3 from "d3";
const MAX_TAU = 600;

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

export default function PitchDetector({
  samples,
  sample_rate,
  color,
  button_style,
  widget_style,
  rate_ms,
  onDetectNote,
  graph_params,
}) {
  const svgRef = useRef();
  const [peakTau, setPeakTau] = useState(0);

  function freqFromTau(tau) {
    return rate_ms / tau;
  }

  let line = d3
    .line()
    .x((_, i) => {
      return i;
    })
    .y((d) => {
      return d * -150;
    });

  const k = 0.9;

  useEffect(() => {
    // draw axis
    var svg = d3.select(".detectorFrame").select(".graph");

    var x = d3.scaleLinear().domain([1, MAX_TAU]).range([0, GRAPH_WIDTH_PX]);

    svg
      .append("g")
      .attr("transform", `translate(0,${GRAPH_HEIGHT_PX * 0.9})`)
      .style("color", color)
      .call(d3.axisBottom(x));

    svg
      .append("line")
      .style("stroke", color)
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
        datavals.push(val);
      }

      for (let i = 1; i < MAX_TAU; i++) {
        if (datavals[i] >= 0 && datavals[i - 1] < 0) {
          positiveZeroCrossings.push(i);
        }

        if (datavals[i] <= 0 && datavals[i - 1] > 0) {
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
        let maxval = datavals[positiveZeroCrossings[0]];
        for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
          let val = datavals[i];
          if (val > maxval) {
            maxval = val;
          }
        }

        let threshold = maxval * k;

        for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
          if (datavals[i - 1] > threshold && datavals[i] < datavals[i - 1]) {
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
        .attr("width", graph_params.width)
        .attr("height", GRAPH_HEIGHT_PX)
        .attr(
          "transform",
          `translate(0, ${GRAPH_HEIGHT_PX / 2}) scale(${
            graph_params.width / 600
          }, 1.0)`
        )
        .style("stroke", color)
        .style("stroke-width", 3)
        .style("fill", "none");
    }, rate_ms);
  }

  return (
    <div className="detectorFrame" style={widget_style}>
      <svg
        className="graph"
        width={graph_params.width}
        height={GRAPH_HEIGHT_PX}
        ref={svgRef}
      ></svg>
      <p style={textStyle}>
        detected peak: {peakTau.toString()} samples (
        {peakTau === 0 ? "NaN" : (INPUT_SAMPLE_RATE / peakTau).toString()} Hz)
      </p>
      <p style={textStyle}>detected note: {note}</p>
      <button onClick={initDetection} style={button_style}>
        start pitch detection
      </button>
    </div>
  );
}
