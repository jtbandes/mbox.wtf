import { readLines } from "./readLines";
import { readMessages } from "./readMessages";

export type AnalyzerMessageToWorker = {
  op: "start";
  file: File;
};

export type AnalyzerMessageFromWorker =
  | { op: "progress"; bytesRead: number }
  | { op: "done"; sizesBySender: [sender: string, totalSize: number][] }
  | { op: "error"; message: string };

self.addEventListener("message", (event) => {
  const msg = event.data as AnalyzerMessageToWorker;
  const { file } = msg;

  void (async () => {
    try {
      const sizesBySender = new Map<string, number>();
      for await (const { bytesRead, from, length } of readMessages(readLines(file))) {
        self.postMessage({ op: "progress", bytesRead } satisfies AnalyzerMessageFromWorker);
        const key = typeof from === "object" ? from.address : (from ?? "");
        sizesBySender.set(key, (sizesBySender.get(key) ?? 0) + length);
      }
      const entries = Array.from(sizesBySender);
      entries.sort((a, b) => b[1] - a[1]);
      self.postMessage({ op: "done", sizesBySender: entries } satisfies AnalyzerMessageFromWorker);
    } catch (err) {
      self.postMessage({ op: "error", message: String(err) } satisfies AnalyzerMessageFromWorker);
    }
  })();
});
