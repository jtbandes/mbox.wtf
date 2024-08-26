import type { AnalyzerMessageFromWorker, AnalyzerMessageToWorker } from "./Analyzer.worker";

type AnalyzerResult = {
  sizesBySender: [sender: string, totalSize: number][];
};

export class Analyzer {
  #totalSize = 0;
  #startTime = 0;
  progress = $state<number | undefined>();
  #running = false;
  result = $state<AnalyzerResult | undefined>();
  avgBytesPerSec = $state<number | undefined>();
  error = $state<string | undefined>();

  #worker: Worker;

  constructor() {
    this.#worker = new Worker(new URL("./Analyzer.worker", import.meta.url), { type: "module" });
    //TODO: handle worker error
    this.#worker.addEventListener("message", (event) => {
      const msg = event.data as AnalyzerMessageFromWorker;
      switch (msg.op) {
        case "progress":
          this.progress = msg.bytesRead / this.#totalSize;
          this.avgBytesPerSec = (msg.bytesRead / (performance.now() - this.#startTime)) * 1000;
          break;
        case "done":
          this.#running = false;
          this.progress = 1;
          this.result = { sizesBySender: msg.sizesBySender };
          break;
        case "error":
          this.#running = false;
          this.error = msg.message;
          break;
      }
    });
  }

  run(file: File) {
    if (this.#running) {
      throw new Error("Analyzer is already running");
    }
    this.#running = true;
    this.#totalSize = file.size;
    this.error = undefined;
    this.progress = 0;

    this.#startTime = performance.now();
    this.#worker.postMessage({ op: "start", file } satisfies AnalyzerMessageToWorker);
  }
}
