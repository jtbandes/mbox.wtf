import { readLines } from "./readLines";
import { readMessages } from "./readMessages";

export type AnalyzerMessageToWorker = {
  op: "start";
  file: File;
};

export type AnalyzerMessageFromWorker =
  | { op: "progress"; bytesRead: number }
  | { op: "done"; totalSize: number }
  | { op: "error"; message: string };

self.addEventListener("message", (event) => {
  const msg = event.data as AnalyzerMessageToWorker;
  const { file } = msg;

  void (async () => {
    try {
      let totalSize = 0;
      for await (const { length, bytesRead } of readMessages(readLines(file))) {
        self.postMessage({ op: "progress", bytesRead } satisfies AnalyzerMessageFromWorker);
        totalSize += length;
      }
      self.postMessage({ op: "done", totalSize } satisfies AnalyzerMessageFromWorker);
    } catch (err) {
      self.postMessage({ op: "error", message: String(err) } satisfies AnalyzerMessageFromWorker);
    }
  })();
});
