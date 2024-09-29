import { generateDemoLines } from "./demo";
import { readLines } from "./readLines";
import { readMessages } from "./readMessages";

export type AnalyzerMessageToWorker = { op: "start"; file: File } | { op: "start-demo" };

export type AnalyzerMessageFromWorker =
  | { op: "progress"; bytesRead: number; done: boolean }
  | { op: "result"; sizesBySender: [sender: string, totalSize: number][] }
  | { op: "error"; message: string };

function send(msg: AnalyzerMessageFromWorker) {
  self.postMessage(msg);
}

const MAX_BYTES_PER_UPDATE = 500 * 1024 * 1024; // 500MB

console.info("Worker initialized");

self.addEventListener("message", (event) => {
  const msg = event.data as AnalyzerMessageToWorker;

  void (async () => {
    try {
      const sizesBySender = new Map<string, number>();
      let bytesReadAtLastUpdate = 0;
      let lastProgressUpdateTime = performance.now();
      const lines = msg.op === "start" ? readLines(msg.file) : generateDemoLines();
      let lastBytesRead = 0;
      for await (const { bytesRead, from, length } of readMessages(lines)) {
        lastBytesRead = bytesRead;
        const now = performance.now();
        if (now - lastProgressUpdateTime > 33) {
          // no need to send updates to main thread at more than ~30fps
          send({ op: "progress", bytesRead, done: false });
          lastProgressUpdateTime = now;
        }
        const key = typeof from === "object" ? from.address : (from ?? "");
        sizesBySender.set(key, (sizesBySender.get(key) ?? 0) + length);
        if (bytesRead - bytesReadAtLastUpdate > MAX_BYTES_PER_UPDATE) {
          send({
            op: "result",
            sizesBySender: Array.from(sizesBySender).sort((a, b) => b[1] - a[1]),
          });
          bytesReadAtLastUpdate = bytesRead;
        }
      }
      send({ op: "result", sizesBySender: Array.from(sizesBySender).sort((a, b) => b[1] - a[1]) });
      send({ op: "progress", bytesRead: lastBytesRead, done: true });
      console.info("Analyzer done!");
    } catch (err) {
      console.error(err);
      send({ op: "error", message: String(err) });
    }
  })();
});
