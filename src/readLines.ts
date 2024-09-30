export type ReadLinesValue = {
  lines: readonly string[];
  bytesRead: number;
};

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
export async function* readLines(file: File): AsyncGenerator<ReadLinesValue> {
  let decoder = new TextDecoder();
  let bytesSinceNewDecoder = 0;
  let str = "";
  for (let fileOffset = 0; fileOffset < file.size; fileOffset += CHUNK_SIZE) {
    const done = fileOffset + CHUNK_SIZE >= file.size;
    // Note: one reason to use slice() instead of stream().getReader() is that
    // as of writing, Safari doesn't support >4GB files via the stream() API,
    // although this will probably be fixed in subsequent releases:
    // https://bugs.webkit.org/show_bug.cgi?id=272600
    const chunk = await file.slice(fileOffset, fileOffset + CHUNK_SIZE).arrayBuffer();
    str += decoder.decode(chunk, { stream: !done });

    // Workaround for Safari TextDecoder crashing after >2GB. Lazily assuming
    // we'll eventually hit a chunk that ends with an ASCII byte
    // https://bugs.webkit.org/show_bug.cgi?id=280593
    bytesSinceNewDecoder += chunk.byteLength;
    if (bytesSinceNewDecoder > 1024 * 1024 * 1024) {
      const u8 = new Uint8Array(chunk);
      const lastByte = u8[u8.length - 1];
      if (lastByte == undefined || (lastByte & 0x80) === 0) {
        // Ended on an ASCII byte, safe to reset decoder
        decoder = new TextDecoder();
        bytesSinceNewDecoder = 0;
      }
    }

    let offset = 0;
    let newlineOffset;
    const lines: string[] = [];
    while ((newlineOffset = str.indexOf("\n", offset)) >= 0) {
      lines.push(
        str.slice(
          offset,
          newlineOffset > 0 && str.charCodeAt(newlineOffset - 1) === /*\r*/ 0x0d
            ? newlineOffset - 1
            : newlineOffset,
        ),
      );
      offset = newlineOffset + 1;
    }
    if (lines.length > 0) {
      yield { lines, bytesRead: fileOffset + chunk.byteLength };
    }
    if (offset > 0) {
      str = str.slice(offset);
    }
  }

  if (str.length) {
    yield { lines: [str], bytesRead: file.size };
  }
}
