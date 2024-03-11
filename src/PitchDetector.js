const MAX_TAU = 600;

export default class PitchDetector {
  constructor(samples, sampleRate = 100, rateMS, W, k, onDetectFreq) {
    this.samples = samples;
    this.sampleRate = sampleRate;
    this.rateMS = rateMS;
    this.onDetectFreq = onDetectFreq;
    this.k = k;
    this.W = W;

    this.id = 0;
  }

  ACF(tau, samples) {
    let accum = 0.0;
    if (this.W > samples.current.length) {
      return 0.0;
    }
    for (let i = 0; i < this.W - tau; i++) {
      accum += samples.current[i] * samples.current[i + tau];
    }
    return accum;
  }

  NSDF(tau, samples) {
    let accum = 0.0;
    if (this.W > samples.current.length) {
      return 0.0;
    }
    for (let i = 0; i < this.W - tau; i++) {
      accum +=
        Math.pow(samples.current[i], 2) + Math.pow(samples.current[i + tau], 2);
    }
    return (2 * this.ACF(tau, samples)) / accum;
  }

  start() {
    console.log("started");
    this.id = setInterval(() => {
      let datavals = [];

      let positiveZeroCrossings = [];
      let negativeZeroCrossings = [];

      if (
        this.samples.current === undefined ||
        this.samples.current.length === 0
      ) {
        console.log("early return");
        return;
      }

      for (let i = 0; i < MAX_TAU; i++) {
        let val = this.NSDF(i + 1, this.samples);
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

        let threshold = maxval * this.k;

        for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
          if (datavals[i - 1] > threshold && datavals[i] < datavals[i - 1]) {
            this.onDetectFreq(this.sampleRate / (i - 1), datavals[i - 1]);
            break;
          }
        }
      }
    }, this.rateMS);
    console.log(this.id);
  }

  stop() {
    console.log(this.id);
    if (this.id) clearInterval(this.id);
  }
}

// export default function PitchDetector({
//   samples,
//   sample_rate = 100,
//   color,
//   button_style,
//   widget_style,
//   rate_ms,
//   onDetectFreq,
//   graph_params,
// }) {
//   const [peakTau, setPeakTau] = useState(0);

//   function freqFromTau(tau) {
//     return rate_ms / tau;
//   }

//   const k = 0.9;

//   function initDetection() {
//     setInterval(() => {
//       let datavals = [];

//       let positiveZeroCrossings = [];
//       let negativeZeroCrossings = [];

//       if (samples.current === undefined || samples.current.length === 0) {
//         return;
//       }

//       for (let i = 0; i < MAX_TAU; i++) {
//         let val = NSDF(i + 1, samples);
//         datavals.push(val);
//       }

//       for (let i = 1; i < MAX_TAU; i++) {
//         if (datavals[i] >= 0 && datavals[i - 1] < 0) {
//           positiveZeroCrossings.push(i);
//         }

//         if (datavals[i] <= 0 && datavals[i - 1] > 0) {
//           negativeZeroCrossings.push(i);
//         }
//       }

//       // TODO: figure this mess out
//       let calculatePeak = true;
//       if (positiveZeroCrossings.length === 0) {
//         //throw new Error("initDetection: no positive zero crossings");
//         //console.log("initDetection: no positive zero crossings");
//         calculatePeak = false;
//       }
//       if (negativeZeroCrossings.length === 0) {
//         //throw new Error("initDetection: no negative zero crossings");
//         //console.log("initDetection: no negative zero crossings");
//         calculatePeak = false;
//       }
//       if (negativeZeroCrossings[0] > positiveZeroCrossings[0]) {
//         //throw new Error("first crossing is not negative");
//         //console.log("first crossing is not negative");
//         calculatePeak = false;
//       }

//       if (calculatePeak) {
//         let maxval = datavals[positiveZeroCrossings[0]];
//         for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
//           let val = datavals[i];
//           if (val > maxval) {
//             maxval = val;
//           }
//         }

//         let threshold = maxval * k;

//         for (let i = positiveZeroCrossings[0]; i < MAX_TAU; i++) {
//           if (datavals[i - 1] > threshold && datavals[i] < datavals[i - 1]) {
//             setPeakTau(i);
//             onDetectFreq(freqFromTau(i));
//             break;
//           }
//         }
//       }
//     }, rate_ms);
//   }

//   return (
//     <div className="detectorFrame" style={widget_style}>
//       <svg
//         className="graph"
//         width={graph_params.width}
//         height={graph_params.height}
//         ref={svgRef}
//       ></svg>
//       <p style={textStyle}>
//         detected peak: {peakTau.toString()} samples (
//         {peakTau === 0 ? "NaN" : (INPUT_SAMPLE_RATE / peakTau).toString()} Hz)
//       </p>
//       <p style={textStyle}>detected note: {note}</p>
//       <button onClick={initDetection} style={button_style}>
//         start pitch detection
//       </button>
//     </div>
//   );
// }
