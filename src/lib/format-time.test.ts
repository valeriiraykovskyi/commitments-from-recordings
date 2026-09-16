import { describe, expect, it } from "vitest";

import { formatTimestamp } from "@/lib/format-time";

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
