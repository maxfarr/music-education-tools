class Worker extends AudioWorkletProcessor {
  process(inputList, outputList, parameters) {
    // Using the inputs (or not, as needed),
    // write the output into each of the outputs
    // …
    this.port.postMessage(inputList);
    return true;
  }
}

registerProcessor("worker", Worker);
