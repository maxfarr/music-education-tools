import { AnimatePresence, motion, useCycle } from "framer-motion";
import { CIRCLE_OF_FIFTHS, SCALES } from "./Defs";
import { useState } from "react";

function ScaleSelector({ onSelectScale, divClassName }) {
  const [rootNote, setRootNote] = useState("C");
  const [scaleType, cycleScaleType] = useCycle("major", "minor");

  function onChangeRootNote(root) {
    setRootNote(root);
    onSelectScale(SCALES[root][scaleType]);
  }

  function onCycleScaleType() {
    cycleScaleType();
    onSelectScale(SCALES[rootNote][scaleType === "major" ? "minor" : "major"]);
  }

  return (
    <div className={"flex place-items-center " + divClassName}>
      <CircleOfFifthsFlyout
        rootNote={rootNote}
        onChangeRootNote={onChangeRootNote}
      />
      <div className="m-3 ml-0 place-self-center bg-red-500 px-5 py-8 text-7xl">
        <button className="w-[300px]" onClick={onCycleScaleType}>
          {scaleType}
        </button>
      </div>
    </div>
  );
}

const CIRCLE_SVG_SIZE = 800;

function CircleOfFifthsFlyout({ rootNote, onChangeRootNote }) {
  const [open, cycleOpen] = useCycle(false, true);

  const initialOffset = {
    x: -(CIRCLE_SVG_SIZE / 2 - 90 / 2),
    y: -(CIRCLE_SVG_SIZE / 2 - 96 / 2),
  };

  function handleSelectRootNote(note) {
    cycleOpen();
    onChangeRootNote(note);
  }

  return (
    <div
      z-index="1"
      className="m-3 place-self-center bg-red-500 px-7 pb-4 pt-6 text-8xl"
      onClick={cycleOpen}
    >
      <div className="relative size-max">
        <AnimatePresence>
          {open ? (
            <motion.svg
              //style={{ originX: "65px", originY: "65px" }}
              className="absolute inset-0 origin-center"
              initial={{ ...initialOffset, opacity: "0%", scale: "0%" }}
              animate={{ ...initialOffset, opacity: "100%", scale: "100%" }}
              //   exit={{
              //     ...initialOffset,
              //     opacity: "0%",
              //     scale: "0%",
              //     transition: {
              //       ease: "easeIn",
              //       type: "tween",
              //       duration: 0.25,
              //       opacity: {
              //         duration: 0.2,
              //         type: "tween",
              //         ease: [0.31, 0.12, 0.02, 0.99],
              //       },
              //     },
              //   }}
              transition={{
                ease: "easeOut",
                type: "spring",
                duration: 0.25,
                opacity: {
                  duration: 0.2,
                  type: "tween",
                  ease: [0.98, -0.01, 0.69, 0.88],
                },
              }}
              width={`${CIRCLE_SVG_SIZE}`}
              height={`${CIRCLE_SVG_SIZE}`}
              viewBox="0 0 79.374998 79.375"
              version="1.1"
              id="svg1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:svg="http://www.w3.org/2000/svg"
            >
              {CIRCLE_OF_FIFTHS.map((e, i) => {
                return (
                  <CircleOfFifthsWedge
                    note={CIRCLE_OF_FIFTHS[i]}
                    angleDeg={30 * i}
                    key={i}
                    onSelectRootNote={handleSelectRootNote}
                  />
                );
              })}
            </motion.svg>
          ) : null}
        </AnimatePresence>

        <div className="relative m-auto size-[96px] text-center">
          <p transform-origin="center" className="relative w-auto text-center">
            {rootNote}
          </p>
        </div>
      </div>
    </div>
  );
}

function CircleOfFifthsWedge({ angleDeg, note, onSelectRootNote }) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const offsetDist = 100;
  const offset = {
    x: offsetDist * Math.sin(angleRad),
    y: -(offsetDist * Math.cos(angleRad)),
  };

  return (
    <g
      transform-origin="center"
      transform={`scale(0.17) translate(${offset.x}, ${offset.y})`}
      className="hover:cursor-pointer"
    >
      <path
        className="fill-red-400"
        id="path1"
        d="m 39.687511,13.056835 c -10.39069,0.08928 -20.731387,1.450289 -30.7913276,4.052622 L 22.060036,66.240526 c 5.58564,-1.392016 11.310732,-2.148205 17.066249,-2.254178 6.127759,0.04573 12.227736,0.828635 18.168434,2.331816 L 70.478817,17.109457 C 60.418885,14.507127 50.078202,13.146129 39.687511,13.056835 Z"
        transform-box="view-box"
        transform-origin="center"
        transform={`rotate(${angleDeg}, 0, 0)`}
        z-index="100"
        onClick={(e) => {
          e.stopPropagation();
          console.log(note);
          onSelectRootNote(note);
        }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="20px"
        className="fill-orange-100"
        z-index="101"
        onClick={(e) => {
          e.stopPropagation();
          console.log(note);
          onSelectRootNote(note);
        }}
      >
        {note}
      </text>
    </g>
  );
}

export default ScaleSelector;
