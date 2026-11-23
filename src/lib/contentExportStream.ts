import { open } from "node:fs/promises";
import { basename, join } from "node:path";

/** Stream JSON and one asset at a time; never build an entire export in memory. */
export function createContentExportStream(payload: Record<string, unknown>, filenames: readonly string[] | undefined, uploadsDir: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  async function* chunks(): AsyncGenerator<string> {
    yield "{";
    let first = true;
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      yield `${first ? "" : ","}${JSON.stringify(key)}:`;
      first = false;
      // Serialize array elements separately instead of creating a second copy of
      // a potentially large content group as one JSON string.
      if (Array.isArray(value)) {
        yield "[";
        for (let i = 0; i < value.length; i++) yield `${i ? "," : ""}${JSON.stringify(value[i])}`;
        yield "]";
      } else if (key === "configuration" && value && typeof value === "object") {
        yield "{";
        let firstField = true;
        for (const [field, fieldValue] of Object.entries(value)) {
          yield `${firstField ? "" : ","}${JSON.stringify(field)}:`;
          firstField = false;
          if (Array.isArray(fieldValue)) {
            yield "[";
            for (let i = 0; i < fieldValue.length; i++) yield `${i ? "," : ""}${JSON.stringify(fieldValue[i])}`;
            yield "]";
          } else yield JSON.stringify(fieldValue);
        }
        yield "}";
      } else yield JSON.stringify(value);
    }
    if (filenames) {
      yield `${first ? "" : ","}"assets":[`;
      let firstAsset = true;
      for (const name of filenames) {
        const filename = basename(name);
        let file;
        try { file = await open(join(uploadsDir, filename), "r"); } catch { continue; }
        try {
          // Only regular files are exported. The chunk size is divisible by 3,
          // so independently encoded chunks form valid continuous base64.
          if (!(await file.stat()).isFile()) continue;
          yield `${firstAsset ? "" : ","}{"filename":${JSON.stringify(filename)},"content":"`;
          firstAsset = false;
          const buffer = Buffer.allocUnsafe(48 * 1024);
          let carry = Buffer.alloc(0);
          for (;;) {
            const { bytesRead } = await file.read(buffer, 0, buffer.length, null);
            if (!bytesRead) break;
            const bytes = carry.length ? Buffer.concat([carry, buffer.subarray(0, bytesRead)]) : buffer.subarray(0, bytesRead);
            const complete = bytes.length - bytes.length % 3;
            if (complete) yield bytes.subarray(0, complete).toString("base64");
            carry = Buffer.from(bytes.subarray(complete));
          }
          if (carry.length) yield carry.toString("base64");
          yield '"}';
        } finally { await file.close(); }
      }
      yield "]";
    }
    yield "}";
  }
  const iterator = chunks();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) { controller.error(error); }
    },
    async cancel() { await iterator.return(undefined); },
  });
}
