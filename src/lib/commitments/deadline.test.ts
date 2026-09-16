import { describe, expect, it } from "vitest";

import { isFullDate } from "@/lib/commitments/deadline";

describe("isFullDate", () => {
  it.each([
    "by September 30, 2026",
    "on 30 September 2026",
    "the 1st of Oct 2026",
    "2026-09-30",
    "30.09.2026",
    "9/30/2026",
  ])("accepts %j", (text) => {
    expect(isFullDate(text)).toBe(true);
  });

  it.each([
    "by Friday",
    "Monday",
    "next week",
    "before the launch",
    "by September 30",
    "by the 15th",
    "in May",
    "may take until 2026",
  ])("rejects %j", (text) => {
    expect(isFullDate(text)).toBe(false);
  });
});
