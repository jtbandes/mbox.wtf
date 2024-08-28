import type { ReadLinesValue } from "./readLines";

type ReadMessagesValue = {
  length: number;
  bytesRead: number;
  from: { name: string; address: string } | string | undefined;
};

type CurrentMessageState = {
  length: number;
  from: { name: string; address: string } | string | undefined;
};

/** Force the string to be copied: https://issues.chromium.org/issues/41480525 */
function cloneString(str: string): string {
  return JSON.parse(JSON.stringify(str)) as string;
}

const ENCODED_WORD_REGEX = /=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi;
/** https://www.rfc-editor.org/rfc/rfc2047 */
function decodeQuotedPrintable(str: string): string {
  return str.replace(
    ENCODED_WORD_REGEX,
    (match, charset: string, encoding: string, text: string) => {
      const charsetLower = charset.toLowerCase();
      if (
        charsetLower !== "utf-8" &&
        charsetLower !== "us-ascii" &&
        charsetLower !== "iso-8859-1"
      ) {
        console.warn(`Unsupported charset: ${charset}`, match);
        return match;
      }
      // TODO: need to actually run through TextDecoder
      if (encoding.toLowerCase() === "b") {
        return atob(text);
      } else {
        return text.replace(/=([0-9A-F]{2})|_/gi, (substring, hex: string) =>
          substring.length === 1 ? " " : String.fromCharCode(Number.parseInt(hex, 16)),
        );
      }
    },
  );
}

const NAME_WITH_ADDRESS_REGEX = /^\s*"?(.+?)"?\s*<([^@>]+@[^>]+)>\s*$/i;

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
        const from = decodeQuotedPrintable(line.substring("From: ".length));
        const addrMatch = NAME_WITH_ADDRESS_REGEX.exec(from);
        if (addrMatch) {
          curMessage.from = {
            name: cloneString(addrMatch[1]!),
            address: cloneString(addrMatch[2]!),
          };
        } else {
          curMessage.from = cloneString(from);
        }
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
