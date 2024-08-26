import type { ReadLinesValue } from "./readLines";

type ReadMessagesValue = {
  length: number;
  bytesRead: number;
};

export async function* readMessages(
  linesReader: AsyncIterable<ReadLinesValue>,
): AsyncGenerator<ReadMessagesValue> {
  let curMessageLength = 0;
  for await (const { lines, bytesRead } of linesReader) {
    for (const line of lines) {
      if (line.startsWith("From ")) {
        yield { length: curMessageLength, bytesRead };
        curMessageLength = 0;
        continue;
      }
      curMessageLength += line.length;
    }
  }
}
