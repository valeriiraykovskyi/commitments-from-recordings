import { describe, expect, it } from "vitest";

import { readNdjson } from "./ndjson";

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

const encode = (text: string) => new TextEncoder().encode(text);

describe("readNdjson", () => {
  it("delivers objects split across chunks, skips blank lines, and reads a last line without a newline", async () => {
    const seen: unknown[] = [];
    await readNdjson(streamOf([encode('{"a":1}\n{"b":'), encode('2}\n\n{"c":3}')]), (value) =>
      seen.push(value),
    );
    expect(seen).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it("decodes a multi-byte character split across chunks", async () => {
    const bytes = encode('{"text":"café"}\n');
    const cut = bytes.length - 4; // inside the two-byte "é"
    const seen: unknown[] = [];
    await readNdjson(streamOf([bytes.slice(0, cut), bytes.slice(cut)]), (value) => seen.push(value));
    expect(seen).toEqual([{ text: "café" }]);
  });

  it("delivers each line before reading the next chunk", async () => {
    const order: string[] = [];
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        order.push("pull");
        if (order.filter((entry) => entry === "pull").length === 1) {
          controller.enqueue(encode('{"first":true}\n'));
        } else {
          controller.close();
        }
      },
    });
    await readNdjson(stream, () => order.push("value"));
    expect(order).toEqual(["pull", "value", "pull"]);
  });

  it("rejects on invalid JSON and propagates errors thrown by the consumer", async () => {
    await expect(readNdjson(streamOf([encode("not json\n")]), () => {})).rejects.toThrow(
      SyntaxError,
    );
    await expect(
      readNdjson(streamOf([encode('{"type":"error"}\n')]), () => {
        throw new Error("stop");
      }),
    ).rejects.toThrow("stop");
  });
});
