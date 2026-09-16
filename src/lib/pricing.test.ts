import { describe, expect, it } from "vitest";

import { asrCost, blobCost, isDeepSeekPeak, llmCost } from "@/lib/pricing";

describe("isDeepSeekPeak", () => {
  it.each([
    ["2026-09-14T01:00:00Z", true], // Monday
    ["2026-09-14T03:59:59Z", true],
    ["2026-09-14T04:00:00Z", false],
    ["2026-09-18T09:59:00Z", true], // Friday
    ["2026-09-18T10:00:00Z", false],
    ["2026-09-19T02:00:00Z", false], // Saturday
    ["2026-09-20T07:00:00Z", false], // Sunday
  ])("%s → %s", (iso, peak) => {
    expect(isDeepSeekPeak(new Date(iso))).toBe(peak);
  });
});

describe("costs", () => {
  it("prices DeepSeek tokens by cache use and tariff", () => {
    const usage = { cacheHitTokens: 1_000_000, cacheMissTokens: 1_000_000, outputTokens: 1_000_000 };

    expect(llmCost("deepseek-flash", usage, true)).toBeCloseTo(0.006 + 0.3 + 1.2);
    expect(llmCost("deepseek-flash", usage, false)).toBeCloseTo(0.003 + 0.15 + 0.6);
  });

  it("prices a minute of recognition with diarization", () => {
    expect(asrCost(60)).toBeCloseTo(0.0063);
    expect(asrCost(0)).toBe(0);
  });

  it("prices one Blob upload and download", () => {
    expect(blobCost(1024 ** 3)).toBeCloseTo(0.000005 + 0.0000004 + 0.05);
  });
});
