import { describe, expect, it } from "vitest";

import { formatDuration, formatTimestamp } from "@/lib/format-time";

describe("formatDuration", () => {
  it.each([
    [0, "0 ms"],
    [7.6, "8 ms"],
    [999.4, "999 ms"],
    [1000, "1.0 s"],
    [2612, "2.6 s"],
    [19_540, "19.5 s"],
  ])("formats %s ms as %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  it("rejects negative and non-finite values", () => {
    expect(() => formatDuration(-1)).toThrow(RangeError);
    expect(() => formatDuration(Number.NaN)).toThrow(RangeError);
  });
});

describe("formatTimestamp", () => {
  it.each([
    [0, "0:00"],
    [5.9, "0:05"],
    [65, "1:05"],
    [180, "3:00"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatTimestamp(seconds)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %s",
    (seconds) => {
      expect(() => formatTimestamp(seconds)).toThrow(RangeError);
    },
  );
});
