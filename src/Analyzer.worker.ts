import { readLines } from "./readLines";
import { readMessages } from "./readMessages";

export type AnalyzerMessageToWorker = {
  op: "start";
  file: File;
};

export type AnalyzerMessageFromWorker =
  | { op: "progress"; bytesRead: number; done: boolean }
  | { op: "result"; sizesBySender: [sender: string, totalSize: number][] }
  | { op: "error"; message: string };

function send(msg: AnalyzerMessageFromWorker) {
  self.postMessage(msg);
}

const BYTES_PER_UPDATE = 500 * 1024 * 1024; // 500MB

self.addEventListener("message", (event) => {
  const msg = event.data as AnalyzerMessageToWorker;
  const { file } = msg;

  void (async () => {
    try {
      const sizesBySender = new Map<string, number>();
      let bytesReadAtLastUpdate = 0;
      let lastProgressUpdateTime = performance.now();
      for await (const { bytesRead, from, length } of readMessages(readLines(file))) {
        const now = performance.now();
        if (now - lastProgressUpdateTime > 33) {
          // no need to send updates to main thread at more than ~30fps
          send({ op: "progress", bytesRead, done: false });
          lastProgressUpdateTime = now;
        }
        const key = typeof from === "object" ? from.address : (from ?? "");
        sizesBySender.set(key, (sizesBySender.get(key) ?? 0) + length);
        if (bytesRead - bytesReadAtLastUpdate > BYTES_PER_UPDATE) {
          send({
            op: "result",
            sizesBySender: Array.from(sizesBySender).sort((a, b) => b[1] - a[1]),
          });
          bytesReadAtLastUpdate = bytesRead;
        }
      }
      send({ op: "result", sizesBySender: Array.from(sizesBySender).sort((a, b) => b[1] - a[1]) });
      send({ op: "progress", bytesRead: file.size, done: true });
    } catch (err) {
      send({ op: "error", message: String(err) });
    }
  })();
});
