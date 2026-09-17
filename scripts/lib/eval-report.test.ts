import { describe, expect, it } from "vitest";

import type { Metrics } from "@/lib/pipeline/types";

import { buildReport, median, renderMarkdown, summarizeFixture, type EvalRun } from "./eval-report";

function metrics(overrides: { totalMs: number; llmMs: number; llm: number; usd: number }): Metrics {
  return {
    audioSec: 60,
    timings: { fetchMs: 0, probeMs: 1, asrMs: 500, llmMs: overrides.llmMs, verifyMs: 1, totalMs: overrides.totalMs },
    calls: { asr: 1, llm: overrides.llm },
    asr: { model: "nova-3", diarizer: "v2", requestId: null, attempts: 1 },
    llm:
      overrides.llm > 0
        ? {
            model: "deepseek-flash",
            promptVersion: "test.1",
            thinking: true,
            reasoningEffort: "high",
            attempts: Array.from({ length: overrides.llm }, (_, index) => ({
              ok: index === overrides.llm - 1,
              error: null,
              finishReason: "stop",
              latencyMs: overrides.llmMs / overrides.llm,
              usage: { cacheHitTokens: 1000, cacheMissTokens: 200, outputTokens: 3000, reasoningTokens: 2000 },
            })),
          }
        : null,
    cost: {
      tariff: "off_peak",
      recognitionUsd: 0.005,
      reasoningUsd: overrides.usd - 0.005,
      retriesUsd: 0,
      speechUsd: 0,
      intermediariesUsd: 0,
      operationUsd: overrides.usd,
      operationPeakUsd: overrides.usd * 1.5,
      perAudioMinuteUsd: overrides.usd,
      hostingUsd: 0,
    },
  };
}

function run(fixture: string, index: number, passed: boolean, overrides: Parameters<typeof metrics>[0]): EvalRun {
  return {
    fixture,
    run: index,
    outcome: "ok",
    reason: null,
    passed,
    failures: passed ? [] : ["item \"x\": status is not_agreed, expected agreed"],
    warnings: index === 2 ? ["dropped deadline in \"x\": quote not found"] : [],
    metrics: metrics(overrides),
    speakers: [{ label: 0, name: "Anna" }],
    clarifications: [],
    items: [
      {
        title: "Set up analytics",
        kind: "task",
        status: passed ? "agreed" : "not_agreed",
        owner: "Mark",
        deadline: "by Wednesday",
        flags: ["date_not_stated"],
        events: [{ type: "accepted", start: 19.2, end: 19.8 }],
      },
    ],
  };
}

const runs: EvalRun[] = [
  run("t1", 1, true, { totalMs: 10_000, llmMs: 8000, llm: 1, usd: 0.01 }),
  run("t1", 2, true, { totalMs: 20_000, llmMs: 18_000, llm: 2, usd: 0.02 }),
  run("t1", 3, false, { totalMs: 12_000, llmMs: 10_000, llm: 1, usd: 0.012 }),
  {
    ...run("g1", 1, true, { totalMs: 5, llmMs: 0, llm: 0, usd: 0 }),
    outcome: "declined",
    reason: "too_long",
    items: [],
    metrics: { ...metrics({ totalMs: 5, llmMs: 0, llm: 0, usd: 0 }), cost: { ...metrics({ totalMs: 5, llmMs: 0, llm: 0, usd: 0 }).cost, perAudioMinuteUsd: null } },
  },
];

describe("median", () => {
  it("handles odd and even counts", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(() => median([])).toThrow(RangeError);
  });
});

describe("summarizeFixture", () => {
  it("reports pass counts, medians and worst cases per fixture", () => {
    const summary = summarizeFixture("t1", runs);
    expect(summary).toMatchObject({
      runs: 3,
      passed: 2,
      outcomes: ["ok"],
      totalMs: { median: 12_000, worst: 20_000 },
      llmMs: { median: 10_000, worst: 18_000 },
      llmAttempts: { median: 1, worst: 2 },
      operationUsd: { median: 0.012, worst: 0.02 },
      perAudioMinuteUsd: 0.012,
    });
    expect(summary.failures).toEqual(['run 3: item "x": status is not_agreed, expected agreed']);
    expect(summary.warnings).toEqual(['run 2: dropped deadline in "x": quote not found']);
  });

  it("names the decline reason and leaves the per-minute cost empty without audio", () => {
    expect(summarizeFixture("g1", runs)).toMatchObject({
      outcomes: ["declined (too_long)"],
      perAudioMinuteUsd: null,
    });
  });
});

describe("renderMarkdown", () => {
  const report = buildReport({
    label: "test",
    createdAt: "2026-09-17T00:00:00.000Z",
    git: { sha: "abc1234", dirty: true },
    config: {
      asrModel: "nova-3",
      diarizer: "v2",
      llmModel: "deepseek-flash",
      thinking: true,
      reasoningEffort: "high",
      promptVersion: "test.1",
      runsPerFixture: 3,
    },
    runs,
  });
  const markdown = renderMarkdown(report);

  it("states the overall result and one summary row per fixture", () => {
    expect(report.summary).toEqual({ runs: 4, passed: 3 });
    expect(markdown).toContain("**3 of 4 runs passed.**");
    expect(markdown).toContain("| t1 | 2/3 | ok | 12.0 s / 20.0 s | 10.0 s / 18.0 s | 1 / 2 | $0.0120 / $0.0200 | $0.0180 | $0.0120 |");
    expect(markdown).toContain("| g1 | 1/1 | declined (too_long) | 0.0 s / 0.0 s | 0.0 s / 0.0 s | 0 / 0 | $0.0000 / $0.0000 | $0.0000 | — |");
  });

  it("lists failures, warnings, token counts and items", () => {
    expect(markdown).toContain('- t1, run 3: item "x": status is not_agreed, expected agreed');
    expect(markdown).toContain('- t1, run 2: dropped deadline in "x": quote not found');
    expect(markdown).toContain("| t1 | 2 | yes | ok | 20.0 s | 0.5 s | 18.0 s | 2 | 2400 (2000) / 6000 (4000) | $0.0200 / $0.0300 |");
    expect(markdown).toContain("- [task/agreed] Set up analytics — owner Mark, deadline \"by Wednesday\", flags date_not_stated — accepted @ 19.2–19.8 s");
    expect(markdown).toContain("No items (declined: too_long).");
    expect(markdown).toContain("`abc1234` (with uncommitted changes)");
  });
});
