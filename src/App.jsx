import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import * as d3 from "d3";

const BATCHES = 70;
const GRAPH_WIDTH = 700;
const GRAPH_HEIGHT = 400;
const GRAPH_UPDATE_MS = 40;

const SamplesContext = createContext();

function App() {
  const samples = useRef([]);
  const [graphEnabled, setGraphEnabled] = useState(false);

  return (
    <>
      <SamplesContext.Provider value={{ samples: samples }}>
        <StartButton samples={samples} />

        <div>
          {graphEnabled ? <Graph data={samples} /> : <p>off</p>}
          <ToggleGraphButton setEnabled={setGraphEnabled} />
        </div>
      </SamplesContext.Provider>
    </>
  );
}

function StartButton({ samples }) {
  const [context, setContext] = useState();

  useEffect(() => {
    function handleSampleBatch(batch) {
      if (batch === undefined) return;

      function newSampleBuffer(s) {
        //console.log("batch: ", batch);

        let local_samples = s.concat(Array.from(batch));

        if (local_samples.length > 128 * BATCHES) {
          local_samples = local_samples.slice(
            local_samples.length - 128 * BATCHES
          );
        }

        //console.log("local_samples: ", local_samples);
        return local_samples;
      }

      samples.current = newSampleBuffer(samples.current);
      //setSamples((s) => newSampleBuffer(s));
      //console.log("samples: ", samples);
    }

    const meter = new Tone.Meter();
    const mic = new Tone.UserMedia().connect(meter);

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
          "../public/worklet/worker.js",
          "worker"
        );
        let node = Tone.getContext().createAudioWorkletNode("worker");
        meter.connect(node);
        node.port.onmessage = (e) => handleSampleBatch(e.data[0][0]);
      } catch (e) {}
    }

    launchGraphWorker();
  }, [context, samples]);

  async function start() {
    await Tone.start();
    setContext(new AudioContext());
    console.log(context);
  }

  return <button onClick={start}>start mic input</button>;
}

function ToggleGraphButton({ setEnabled }) {
  async function stop() {
    setEnabled((e) => !e);
  }

  return <button onClick={stop}>toggle graph</button>;
}

function Graph({ data }) {
  const [, setSucks] = useState();

  let line = d3
    .line()
    .x((d) => {
      return d[0];
    })
    .y((d) => {
      return d[1] * 300;
    });

  useEffect(() => {
    let id = setInterval(() => {
      setSucks();
      let datavals = [];
      if (!(data.current === undefined || data.current.length === 0)) {
        data.current.map((value, index) => {
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
        .style("stroke", "red")
        .style("stroke-width", 3)
        .style("fill", "none");
    }, GRAPH_UPDATE_MS);
    return () => clearInterval(id);
  }, [data, line]);

  return (
    <div className="frame">
      <svg className="graph" width={GRAPH_WIDTH} height={GRAPH_HEIGHT}></svg>
    </div>
  );
}

export default App;
