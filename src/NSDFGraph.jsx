import { useEffect, useState } from "react";
import * as d3 from "d3";
import ToggleGraphButton from "./ToggleGraphButton";

const mainColorHex = "#af1f0e";
const MAX_TAU = 600;

const GRAPH_WIDTH_PX = 700;
const GRAPH_HEIGHT_PX = 400;

const GRAPH_UPDATE_MS = 50;

const boxStyle = {
  borderRadius: "25px",
  border: "2px solid " + mainColorHex,
  padding: "20px",
};

function NSDFGraph({ vals }) {
  const [enabled, setEnabled] = useState(false);

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
    <div style={boxStyle}>
      {enabled ?? (
        <div className="nsdfgraphframe">
          <svg
            className="graph"
            width={GRAPH_WIDTH_PX}
            height={GRAPH_HEIGHT_PX}
          ></svg>
        </div>
      )}
      <ToggleGraphButton setEnabled={(e) => setEnabled(!e)} />
    </div>
  );
}

export default NSDFGraph;
