import { useRef, useState } from "react";
import ScaleGame from "./DevScaleGame";
import * as Tone from "tone";
import SignalGraph from "./SignalGraph";
import NSDFGraph from "./NSDFGraph";

let INPUT_SAMPLE_RATE = 48000.0;
const BATCHES = 80;

const mainColorHex = "#af1f0e";

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

function DevTools() {
  const samples = useRef([]);
  const NSDFvals = useRef([]);

  async function micInputSetup() {
    function handleSampleBatch(batch) {
      if (batch === undefined) return;

      function newSampleBuffer(s) {
        let local_samples = s.concat(Array.from(batch));

        if (local_samples.length > 128 * BATCHES) {
          local_samples = local_samples.slice(
            local_samples.length - 128 * BATCHES,
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
        <SignalGraph samples={samples} />
        <NSDFGraph vals={NSDFvals} />
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

export default DevTools;
