export type ReadLinesValue = {
  lines: string[];
  bytesRead: number;
};

export async function* readLines(file: File): AsyncGenerator<ReadLinesValue> {
  const decoder = new TextDecoder();
  const reader = file.stream().getReader();
  let str = "";
  let bytesRead = 0;
  while (true) {
    const { value: chunk, done: done } = await reader.read();
    str += decoder.decode(chunk, { stream: !done });
    bytesRead += chunk?.byteLength ?? 0;

    let offset = 0;
    let newlineOffset;
    const lines: string[] = [];
    while ((newlineOffset = str.indexOf("\n", offset)) >= 0) {
      lines.push(str.slice(offset, newlineOffset));
      offset = newlineOffset + 1;
    }
    if (lines.length > 0) {
      yield { lines, bytesRead };
    }
    if (offset > 0) {
      str = str.slice(offset);
    }
    if (done) {
      break;
    }
  }

  if (str.length) {
    yield { lines: [str], bytesRead: file.size };
  }
}
