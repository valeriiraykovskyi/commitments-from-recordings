import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AsrError } from "@/lib/asr/deepgram";
import { makeTranscript } from "@/lib/asr/testing";
import { toTranscript, type Transcript } from "@/lib/asr/transcript";
import { ExtractionError, type LlmAttempt } from "@/lib/extraction/extract";
import { extractionSchema } from "@/lib/extraction/schema";
import { runPipeline } from "@/lib/pipeline/run";
import type { PipelineEvent } from "@/lib/pipeline/types";
import { asrCost, llmCost } from "@/lib/pricing";

const mocks = vi.hoisted(() => ({
  probeDuration: vi.fn(),
  transcribe: vi.fn(),
  extractCommitments: vi.fn(),
}));

vi.mock("@/lib/audio/duration", () => ({ probeDuration: mocks.probeDuration }));

vi.mock("@/lib/asr/deepgram", () => {
  class AsrError extends Error {
    constructor(
      message: string,
      readonly attempts: number,
      readonly status: number | undefined,
      options?: { cause?: unknown },
    ) {
      super(message, options);
    }
  }
  return { ASR_MODEL: "nova-3", ASR_DIARIZER: "v2", AsrError, transcribe: mocks.transcribe };
});

vi.mock("@/lib/extraction/extract", () => {
  class ExtractionError extends Error {
    constructor(
      message: string,
      readonly attempts: LlmAttempt[],
    ) {
      super(message);
    }
  }
  return { ExtractionError, extractCommitments: mocks.extractCommitments };
});

const fixture = (file: string) =>
  JSON.parse(readFileSync(path.join("fixtures", "t1-launch-sync", file), "utf8"));
const t1Transcript = toTranscript(fixture("asr-response.json"));
const t1Extraction = extractionSchema.parse(fixture("llm-response.json").extraction);

const usage = { cacheHitTokens: 1000, cacheMissTokens: 500, outputTokens: 3000, reasoningTokens: 2000 };
const attempt = (ok: boolean): LlmAttempt => ({
  ok,
  error: ok ? null : "The response was not valid JSON.",
  finishReason: "stop",
  latencyMs: 5000,
  usage,
});

const asrOk = (transcript: Transcript) => ({ transcript, raw: {}, latencyMs: 2000, attempts: 1 });
// Monday 12:00 UTC: DeepSeek off-peak.
const offPeak = () => new Date("2026-09-14T12:00:00Z");

async function run(options: Partial<Parameters<typeof runPipeline>[1]> = {}) {
  const events: PipelineEvent[] = [];
  const failures: string[] = [];
  const result = await runPipeline(Buffer.from("audio"), {
    tag: "test",
    now: offPeak,
    onEvent: (event) => events.push(event),
    logFailure: (stage, detail) => failures.push(`${stage}: ${detail}`),
    ...options,
  });
  return { result, events, failures };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.probeDuration.mockResolvedValue(72.25);
  mocks.transcribe.mockResolvedValue(asrOk(t1Transcript));
  mocks.extractCommitments.mockResolvedValue({
    extraction: t1Extraction,
    model: "deepseek-flash",
    promptVersion: "test",
    attempts: [attempt(true)],
  });
});

describe("runPipeline", () => {
  it("processes a recording end to end and reports stages, calls and cost", async () => {
    const { result, events } = await run();

    expect(result.outcome).toBe("ok");
    expect(events.map((e) => (e.type === "stage" ? e.stage : e.type))).toEqual([
      "checking",
      "transcribing",
      "transcript",
      "extracting",
      "verifying",
    ]);
    if (result.outcome !== "ok") return;
    expect(result.commitments.items.filter((i) => i.status === "agreed")).toHaveLength(3);
    expect(result.metrics.calls).toEqual({ asr: 1, llm: 1 });
    expect(result.metrics.cost).toMatchObject({
      tariff: "off_peak",
      recognitionUsd: asrCost(72.25),
      reasoningUsd: llmCost("deepseek-flash", usage, false),
      retriesUsd: 0,
      speechUsd: 0,
      intermediariesUsd: 0,
      hostingUsd: 0,
    });
    const { cost } = result.metrics;
    expect(cost.operationUsd).toBeCloseTo(cost.recognitionUsd + cost.reasoningUsd);
    expect(cost.operationPeakUsd).toBeCloseTo(asrCost(72.25) + llmCost("deepseek-flash", usage, true));
    expect(cost.perAudioMinuteUsd).toBeCloseTo(cost.operationUsd / (72.25 / 60));
  });

  it("rejects a long recording before any paid call", async () => {
    mocks.probeDuration.mockResolvedValue(216.75);

    const { result } = await run();

    expect(result).toMatchObject({ outcome: "declined", reason: "too_long" });
    expect(result.metrics.calls).toEqual({ asr: 0, llm: 0 });
    expect(result.metrics.cost.operationUsd).toBe(0);
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });

  it("falls back to the browser's duration when the file has none", async () => {
    mocks.probeDuration.mockResolvedValue(null);

    const { result } = await run({ clientDurationSec: 200 });

    expect(result).toMatchObject({ outcome: "declined", reason: "too_long" });
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });

  it("rejects a recording that turns out to be too long after recognition", async () => {
    mocks.probeDuration.mockResolvedValue(null);
    mocks.transcribe.mockResolvedValue(asrOk({ ...t1Transcript, durationSec: 240 }));

    const { result } = await run();

    expect(result).toMatchObject({ outcome: "declined", reason: "too_long" });
    expect(result.metrics.calls).toEqual({ asr: 1, llm: 0 });
    expect(result.metrics.cost.recognitionUsd).toBeCloseTo(asrCost(240));
  });

  it("rejects a non-English recording without calling the model", async () => {
    mocks.transcribe.mockResolvedValue(asrOk({ ...t1Transcript, language: "es" }));

    const { result, events } = await run();

    expect(result).toMatchObject({ outcome: "declined", reason: "unsupported_language" });
    expect(result.metrics.calls).toEqual({ asr: 1, llm: 0 });
    expect(events.some((e) => e.type === "transcript")).toBe(true);
    expect(mocks.extractCommitments).not.toHaveBeenCalled();
  });

  it("rejects a recording without speech", async () => {
    mocks.transcribe.mockResolvedValue(asrOk({ ...makeTranscript([]), durationSec: 12 }));

    const { result } = await run();

    expect(result).toMatchObject({ outcome: "declined", reason: "no_speech" });
  });

  it("rejects a file that the recognizer cannot read", async () => {
    mocks.transcribe.mockRejectedValue(new AsrError("Deepgram request failed (HTTP 400)", 1, 400));

    const { result } = await run();

    expect(result).toMatchObject({ outcome: "declined", reason: "unreadable_audio" });
    expect(result.metrics.calls).toEqual({ asr: 1, llm: 0 });
    expect(result.metrics.cost.recognitionUsd).toBe(0);
  });

  it("reports a recognition outage as a failure with both attempts", async () => {
    mocks.transcribe.mockRejectedValue(new AsrError("Deepgram request failed (HTTP 503)", 2, 503));

    const { result } = await run();

    expect(result.outcome).toBe("failed");
    expect(result.metrics.calls.asr).toBe(2);
  });

  it("logs the real cause of a failure but shows the user a generic message", async () => {
    mocks.transcribe.mockRejectedValue(
      new AsrError("Deepgram request failed", 1, undefined, {
        cause: new Error("DEEPGRAM_API_KEY is not set"),
      }),
    );

    const { result, failures } = await run();

    expect(failures).toEqual(["asr: Deepgram request failed: DEEPGRAM_API_KEY is not set"]);
    expect(result).toMatchObject({
      outcome: "failed",
      message: "Speech recognition failed. Please try again.",
    });
  });

  it("counts failed model attempts as retries", async () => {
    mocks.extractCommitments.mockRejectedValue(
      new ExtractionError("invalid", [attempt(false), attempt(false)]),
    );

    const { result, failures } = await run();

    expect(failures).toEqual(["llm: invalid"]);
    expect(result.outcome).toBe("failed");
    expect(result.metrics.calls).toEqual({ asr: 1, llm: 2 });
    expect(result.metrics.cost.reasoningUsd).toBe(0);
    expect(result.metrics.cost.retriesUsd).toBeCloseTo(2 * llmCost("deepseek-flash", usage, false));
  });

  it("adds Blob usage for uploads as hosting cost", async () => {
    const { result } = await run({ storage: { bytes: 3_000_000, fetchMs: 120 } });

    expect(result.metrics.cost.hostingUsd).toBeGreaterThan(0);
    expect(result.metrics.timings.fetchMs).toBe(120);
  });
});
