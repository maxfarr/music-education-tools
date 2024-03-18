const mainColorHex = "#af1f0e";
const backgroundHex = "#202020";

const graphButtonStyle = {
  borderRadius: "10px",
  margin: "3px",
  border: "2px solid " + mainColorHex,
  backgroundColor: backgroundHex,
  padding: "6px",
  color: mainColorHex,
  fontFamily: "donegal",
  fontSize: 18,
};

function ToggleGraphButton({ setEnabled }) {
  async function stop() {
    setEnabled((e) => !e);
  }

  return (
    <button onClick={stop} style={graphButtonStyle}>
      toggle graph
    </button>
  );
}

export default ToggleGraphButton;
