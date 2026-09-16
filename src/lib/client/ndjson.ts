/**
 * Reads newline-delimited JSON from a byte stream and hands each object to
 * `onValue` as soon as its line is complete, so the caller sees progress
 * while the response is still open. A final line without a newline is
 * delivered when the stream ends.
 */
export async function readNdjson<T>(
  body: ReadableStream<Uint8Array>,
  onValue: (value: T) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const deliver = (line: string) => {
    const trimmed = line.trim();
    if (trimmed) onValue(JSON.parse(trimmed) as T);
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        deliver(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
      }
    }
    deliver(buffer + decoder.decode());
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
