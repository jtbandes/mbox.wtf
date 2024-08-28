import type { AnalyzerMessageFromWorker, AnalyzerMessageToWorker } from "./Analyzer.worker";

type AnalyzerResult = {
  sizesBySender: [sender: string, totalSize: number][];
};

/** Manages a worker thread that parses an mbox file asynchronously. */
export class Analyzer {
  #worker: Worker;
  #totalSize = 0;
  #startTime = 0;
  #running = false;

  /** 0-1 indicating current progress */
  progress = $state<number | undefined>();
  /** Parsing speed in bytes per second */
  avgBytesPerSec = $state<number | undefined>();
  /** Result of parsing the mbox file. May update more than once throughout decoding. */
  result = $state<AnalyzerResult | undefined>();
  /** Error encountered during parsing. */
  error = $state<string | undefined>();
  /** Total elapsed time (ms) */
  elapsed = $state<number | undefined>();

  #reset() {
    this.progress = 0;
    this.avgBytesPerSec = undefined;
    this.result = undefined;
    this.error = undefined;
    this.elapsed = undefined;
  }

  constructor() {
    this.#worker = new Worker(new URL("./Analyzer.worker", import.meta.url), { type: "module" });
    this.#worker.addEventListener("message", (event) => {
      const msg = event.data as AnalyzerMessageFromWorker;
      switch (msg.op) {
        case "progress": {
          this.progress = msg.bytesRead / this.#totalSize;
          const elapsed = performance.now() - this.#startTime;
          this.avgBytesPerSec = (msg.bytesRead / elapsed) * 1000;
          this.elapsed = elapsed;
          this.#running = !msg.done;
          break;
        }
        case "result":
          this.result = { sizesBySender: msg.sizesBySender };
          break;
        case "error":
          this.#running = false;
          this.error = msg.message;
          break;
      }
    });
    this.#worker.addEventListener("error", (event) => {
      this.#running = false;
      this.error = event.message;
    });
  }

  run(file: File) {
    if (this.#running) {
      throw new Error("Analyzer is already running");
    }
    this.#reset();
    this.#running = true;
    this.#totalSize = file.size;

    this.#startTime = performance.now();
    this.#worker.postMessage({ op: "start", file } satisfies AnalyzerMessageToWorker);
  }
}
