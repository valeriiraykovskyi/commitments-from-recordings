import { ASR_DIARIZER, ASR_MODEL, AsrError, transcribe } from "@/lib/asr/deepgram";
import { probeDuration } from "@/lib/audio/duration";
import { buildCommitments } from "@/lib/commitments/build";
import { DEFAULT_LLM_CONFIG, type LlmConfig } from "@/lib/extraction/deepseek";
import {
  ExtractionError,
  extractCommitments,
  type ExtractionResult,
  type LlmAttempt,
} from "@/lib/extraction/extract";
import { PROMPT_VERSION } from "@/lib/extraction/prompt";
import { formatTimestamp } from "@/lib/format-time";
import { MAX_DURATION_SEC } from "@/lib/limits";
import { asrCost, blobCost, isDeepSeekPeak, llmCost } from "@/lib/pricing";

import {
  toTranscriptView,
  type CostEstimate,
  type DeclineReason,
  type Metrics,
  type PipelineEvent,
  type PipelineResult,
  type TranscriptView,
} from "./types";

export type RunOptions = {
  /** Separates app, eval and test requests in provider usage reports. */
  tag: string;
  mimeType?: string;
  /** Duration measured by the browser, used when the file itself has none. */
  clientDurationSec?: number;
  /** The Blob download for an upload; omitted for samples. */
  storage?: { bytes: number; fetchMs: number };
  llmConfig?: LlmConfig;
  onEvent?: (event: PipelineEvent) => void;
  now?: () => Date;
};

/** Small tolerance for rounding between the file's duration and Deepgram's. */
const DURATION_TOLERANCE_SEC = 1;

const since = (start: number) => Math.round(performance.now() - start);

/**
 * The whole pipeline for one recording, shared by the API route and the eval:
 * duration check before any paid call, speech recognition, language check,
 * extraction, verification. Never throws for expected failures; they come back
 * as "declined" or "failed" with metrics.
 */
export async function runPipeline(audio: Buffer, options: RunOptions): Promise<PipelineResult> {
  const started = performance.now();
  const requestedAt = (options.now ?? (() => new Date()))();
  const llmConfig = options.llmConfig ?? DEFAULT_LLM_CONFIG;
  const emit = options.onEvent ?? (() => {});

  const timings: Metrics["timings"] = {
    fetchMs: options.storage?.fetchMs ?? 0,
    probeMs: 0,
    asrMs: 0,
    llmMs: 0,
    verifyMs: 0,
    totalMs: 0,
  };
  const calls = { asr: 0, llm: 0 };
  let audioSec: number | null = null;
  let billedAudioSec = 0;
  let asr: Metrics["asr"] = null;
  let llmAttempts: LlmAttempt[] = [];
  let llmModel: string = llmConfig.model;
  let transcript: TranscriptView | null = null;

  const metrics = (): Metrics => {
    timings.totalMs = since(started) + timings.fetchMs;
    return {
      audioSec,
      timings: { ...timings },
      calls: { ...calls },
      asr,
      llm:
        calls.llm > 0
          ? {
              model: llmModel,
              promptVersion: PROMPT_VERSION,
              thinking: llmConfig.thinking,
              reasoningEffort: llmConfig.reasoningEffort,
              attempts: llmAttempts,
            }
          : null,
      cost: estimateCost({
        billedAudioSec,
        audioSec,
        llmConfig,
        llmAttempts,
        peak: isDeepSeekPeak(requestedAt),
        storageBytes: options.storage?.bytes,
      }),
    };
  };
  const decline = (reason: DeclineReason, message: string): PipelineResult => ({
    outcome: "declined",
    reason,
    message,
    transcript,
    metrics: metrics(),
  });
  const fail = (message: string): PipelineResult => ({
    outcome: "failed",
    message,
    transcript,
    metrics: metrics(),
  });
  const tooLong = (seconds: number) =>
    decline("too_long", `The recording is ${formatTimestamp(seconds)} long; the limit is 3:00.`);

  // 1. Duration, before any paid call.
  emit({ type: "stage", stage: "checking" });
  const probeStart = performance.now();
  const fileDuration = await probeDuration(audio, options.mimeType);
  timings.probeMs = since(probeStart);
  audioSec = fileDuration ?? options.clientDurationSec ?? null;
  if (audioSec !== null && audioSec > MAX_DURATION_SEC) return tooLong(audioSec);

  // 2. Speech recognition.
  emit({ type: "stage", stage: "transcribing" });
  const asrStart = performance.now();
  let asrResult;
  try {
    asrResult = await transcribe(audio, { tag: options.tag });
  } catch (error) {
    timings.asrMs = since(asrStart);
    if (!(error instanceof AsrError)) throw error;
    calls.asr = error.attempts;
    return error.status === 400
      ? decline("unreadable_audio", "The file could not be read as audio.")
      : fail("Speech recognition failed. Please try again.");
  }
  timings.asrMs = since(asrStart);
  calls.asr = asrResult.attempts;

  const recognized = asrResult.transcript;
  audioSec = recognized.durationSec;
  billedAudioSec = recognized.durationSec;
  asr = {
    model: ASR_MODEL,
    diarizer: ASR_DIARIZER,
    requestId: recognized.source.requestId,
    attempts: asrResult.attempts,
  };
  transcript = toTranscriptView(recognized);
  emit({ type: "transcript", transcript });

  if (recognized.durationSec > MAX_DURATION_SEC + DURATION_TOLERANCE_SEC) {
    return tooLong(recognized.durationSec);
  }
  if (recognized.words.length === 0) {
    return decline("no_speech", "No speech was found in the recording.");
  }
  const language = recognized.language?.toLowerCase();
  if (language && !language.startsWith("en")) {
    return decline(
      "unsupported_language",
      `The recording seems to be in "${recognized.language}". Only English is supported.`,
    );
  }

  // 3. Extraction.
  emit({ type: "stage", stage: "extracting" });
  const llmStart = performance.now();
  let extraction: ExtractionResult;
  try {
    extraction = await extractCommitments(recognized, llmConfig);
  } catch (error) {
    timings.llmMs = since(llmStart);
    if (!(error instanceof ExtractionError)) throw error;
    llmAttempts = error.attempts;
    calls.llm = error.attempts.length;
    return fail("The language model did not return a usable answer. Please try again.");
  }
  timings.llmMs = since(llmStart);
  llmAttempts = extraction.attempts;
  llmModel = extraction.model;
  calls.llm = extraction.attempts.length;

  // 4. Verification.
  emit({ type: "stage", stage: "verifying" });
  const verifyStart = performance.now();
  const commitments = buildCommitments(recognized, extraction.extraction);
  timings.verifyMs = since(verifyStart);

  return { outcome: "ok", transcript, commitments, metrics: metrics() };
}

function estimateCost(input: {
  billedAudioSec: number;
  audioSec: number | null;
  llmConfig: LlmConfig;
  llmAttempts: LlmAttempt[];
  peak: boolean;
  storageBytes?: number;
}): CostEstimate {
  const { llmConfig, llmAttempts, peak } = input;
  const recognitionUsd = asrCost(input.billedAudioSec);
  const billed = llmAttempts.filter((attempt) => attempt.usage !== null);
  const successful = billed.filter((attempt) => attempt.ok);
  const failed = billed.filter((attempt) => !attempt.ok);
  const sum = (attempts: LlmAttempt[], atPeak: boolean) =>
    attempts.reduce(
      (total, attempt) => total + (attempt.usage ? llmCost(llmConfig.model, attempt.usage, atPeak) : 0),
      0,
    );

  const reasoningUsd = sum(successful, peak);
  const retriesUsd = sum(failed, peak);
  const operationUsd = recognitionUsd + reasoningUsd + retriesUsd;
  return {
    tariff: peak ? "peak" : "off_peak",
    recognitionUsd,
    reasoningUsd,
    retriesUsd,
    speechUsd: 0,
    intermediariesUsd: 0,
    operationUsd,
    operationPeakUsd: recognitionUsd + sum(billed, true),
    perAudioMinuteUsd:
      input.audioSec && input.audioSec > 0 ? operationUsd / (input.audioSec / 60) : null,
    hostingUsd: input.storageBytes === undefined ? 0 : blobCost(input.storageBytes),
  };
}
