import type { AnalyzerMessageFromWorker, AnalyzerMessageToWorker } from "./Analyzer.worker";
import AnalyzerWorker from "./Analyzer.worker?worker&inline";
import { DEMO_FILE_SIZE_ESTIMATE } from "./demo";

type AnalyzerResult = {
  sizesBySender: [sender: string, totalSize: number][];
};

/** Manages a worker thread that parses an mbox file asynchronously. */
export class Analyzer {
  #worker: Worker | undefined;
  #totalSizeEstimate = 0;
  #startTime = 0;
  #running = $state(false);

  running = $derived(this.#running);
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
    try {
      this.#worker = new AnalyzerWorker();
      this.#worker.addEventListener("message", (event) => {
        const msg = event.data as AnalyzerMessageFromWorker;
        switch (msg.op) {
          case "progress": {
            this.progress = msg.done ? 1 : msg.bytesRead / this.#totalSizeEstimate;
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
        console.error(event);
        this.#running = false;
        this.error = String(event.error);
      });
    } catch (err) {
      console.error(err);
      this.#running = false;
      this.error = String(err);
    }
  }

  run(file: File) {
    this.#run({ op: "start", file }, file.size);
  }

  runDemo() {
    this.#run({ op: "start-demo" }, DEMO_FILE_SIZE_ESTIMATE);
  }

  #run(msg: AnalyzerMessageToWorker, sizeEstimate: number) {
    if (this.#running) {
      throw new Error("Analyzer is already running");
    }
    if (!this.#worker) {
      return;
    }
    this.#reset();
    this.#running = true;
    this.#totalSizeEstimate = sizeEstimate;

    this.#startTime = performance.now();
    this.#worker.postMessage(msg);
  }
}
