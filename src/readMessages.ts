import type { ReadLinesValue } from "./readLines";

type ReadMessagesValue = {
  length: number;
  bytesRead: number;
  from: string | undefined;
};

type CurrentMessageState = {
  length: number;
  from: string | undefined;
};

export async function* readMessages(
  linesReader: AsyncIterable<ReadLinesValue>,
): AsyncGenerator<ReadMessagesValue> {
  let firstMessage = true;
  let curMessage: CurrentMessageState | undefined;
  let lines, bytesRead;
  for await ({ lines, bytesRead } of linesReader) {
    for (const line of lines) {
      if (!curMessage) {
        curMessage = { length: 0, from: undefined };
      }

      if (line.startsWith("From ")) {
        if (firstMessage) {
          firstMessage = false;
        } else {
          yield {
            length: curMessage.length,
            from: curMessage.from,
            bytesRead,
          };
        }
        curMessage = { length: 0, from: undefined };
        continue;
      }

      curMessage.length += line.length;
      if (line.startsWith("From: ")) {
        // Force the string to be copied: https://issues.chromium.org/issues/41480525
        curMessage.from = JSON.parse(JSON.stringify(line.substring("From: ".length))) as string;
      }
    }
  }

  if (curMessage) {
    yield {
      length: curMessage.length,
      from: curMessage.from,
      bytesRead: bytesRead ?? 0,
    };
  }
}
