import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import * as d3 from "d3";

const BATCHES = 150;
const GRAPH_WIDTH = 1100;
const GRAPH_HEIGHT = 400;
const GRAPH_UPDATE_MS = 40;

const SamplesContext = createContext();

function App() {
  const samples = useRef([]);
  const [graphEnabled, setGraphEnabled] = useState(false);

  return (
    <>
      <SamplesContext.Provider value={{ samples: samples }}>
        {graphEnabled ? <Graph data={samples} /> : <p>off</p>}
        <StartButton samples={samples} setEnabled={setGraphEnabled} />
        <StopButton setEnabled={setGraphEnabled} />
      </SamplesContext.Provider>
    </>
  );
}

function StartButton({ samples, setEnabled }) {
  const [context, setContext] = useState();

  // useEffect(() => {
  //   //console.log(context);

  //   //const meter = new Tone.Meter();
  //   // const mic = new Tone.UserMedia({ options: { context: context } }).connect(
  //   //   meter
  //   // );

  //   //const mic = new Tone.UserMedia().connect(meter);

  //   //console.log(mic);

  //   // mic
  //   //   .open()
  //   //   .then(() => {
  //   //     // promise resolves when input is available
  //   //     console.log("mic open");
  //   //     // print the incoming mic levels in decibels
  //   //     let id = setInterval(() => console.log(meter.getValue()), 100);
  //   //     return () => clearInterval(id);
  //   //   })
  //   //   .catch((e) => {
  //   //     // promise is rejected when the user doesn't have or allow mic access
  //   //     console.log("mic not open");
  //   //   });

  //   return () => {};
  // }, []);

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

    if (!context) {
      console.log("skipped");
      return;
    }

    const meter = new Tone.Meter();
    const mic = new Tone.UserMedia().connect(meter);

    mic
      .open()
      .then(() => {
        console.log("we aaareeee oppeeennnn");

        // let id = setInterval(() => console.log(meter.output.getValue()), 4);
        // return () => clearInterval(id);
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
        //console.log(node.output);
        node.port.onmessage = (e) => handleSampleBatch(e.data[0][0]);
      } catch (e) {
        //console.log(`hello ${e}`);
      }
      //console.log("hello");
    }

    launchGraphWorker();

    // Tone.getContext()
    //   .addAudioWorkletModule("./worker.js", "worker")
    //   .then(() => {})
    //   .catch((e) => {
    //     console.log(e);
    //   });
  }, [context, samples]);

  async function start() {
    await Tone.start();
    setContext(new AudioContext());
    console.log(context);
    setEnabled(true);
  }

  return <button onClick={start}>hey</button>;
}

function StopButton({ setEnabled }) {
  async function stop() {
    setEnabled(false);
  }

  return <button onClick={stop}>be quite idiot</button>;
}

function Graph({ data }) {
  const [, setSucks] = useState();

  // const { data } = useContext(SamplesContext);

  let line = d3
    .line()
    .x((d) => {
      //console.log("x: ", d[0]);
      return d[0];
    })
    .y((d) => {
      //console.log("y: ", d[1] * 1000);
      return d[1] * 300;
    });

  useEffect(() => {
    let id = setInterval(() => {
      setSucks();
      //console.log(data.current);
      let datavals = [];
      if (!(data.current === undefined || data.current.length === 0)) {
        data.current.map((value, index) => {
          //console.log("index: ", index, "value: ", value);
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

  //console.log("preyo: ", data);

  // console.log("datavals: ", datavals);
  // datavals.forEach((element) =>
  //   console.log("xv: ", element[0], "yv: ", element[1])
  // );

  return (
    <div className="frame">
      <svg className="graph" width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        fuckyou
      </svg>
    </div>
  );
}

export default App;
