export function formatSize(size: number) {
  const suffixes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  let value = size;
  let suffix = 0;
  while (value > 1023.9 && suffix + 1 < suffixes.length) {
    value /= 1024;
    suffix++;
  }
  return `${value.toFixed(suffix === 0 ? 0 : 1)} ${suffixes[suffix]!}`;
}
