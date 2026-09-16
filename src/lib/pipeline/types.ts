import type { Transcript } from "@/lib/asr/transcript";
import type { Commitments } from "@/lib/commitments/types";
import type { LlmAttempt } from "@/lib/extraction/extract";

/** What the browser needs from the transcript: no internal word indexes. */
export type TranscriptView = {
  durationSec: number;
  language: string | null;
  speakers: number[];
  utterances: { id: string; speaker: number; start: number; end: number; text: string }[];
  words: { text: string; start: number; end: number; speaker: number }[];
};

export function toTranscriptView(transcript: Transcript): TranscriptView {
  return {
    durationSec: transcript.durationSec,
    language: transcript.language,
    speakers: transcript.speakers,
    utterances: transcript.utterances.map(({ id, speaker, start, end, text }) => ({
      id,
      speaker,
      start,
      end,
      text,
    })),
    words: transcript.words.map(({ text, start, end, speaker }) => ({ text, start, end, speaker })),
  };
}

export type Stage = "checking" | "transcribing" | "extracting" | "verifying";

export type DeclineReason = "too_long" | "unreadable_audio" | "no_speech" | "unsupported_language";

export type CostEstimate = {
  /** DeepSeek tariff at the time of the request. */
  tariff: "peak" | "off_peak";
  recognitionUsd: number;
  reasoningUsd: number;
  /** Failed model attempts that were still billed. */
  retriesUsd: number;
  /** The product does not synthesize speech. */
  speechUsd: number;
  /** No paid intermediaries between the app and the providers. */
  intermediariesUsd: number;
  /** Variable cost of this operation: the sum of the lines above. */
  operationUsd: number;
  /** The same operation at DeepSeek's peak tariff (worst case). */
  operationPeakUsd: number;
  perAudioMinuteUsd: number | null;
  /** Vercel Blob usage for an upload; hosting, reported separately. */
  hostingUsd: number;
};

export type Metrics = {
  /** Billed audio duration when known. */
  audioSec: number | null;
  timings: {
    fetchMs: number;
    probeMs: number;
    asrMs: number;
    llmMs: number;
    verifyMs: number;
    totalMs: number;
  };
  /** Paid requests made, including failed attempts. */
  calls: { asr: number; llm: number };
  asr: { model: string; diarizer: string; requestId: string | null; attempts: number } | null;
  llm: {
    model: string;
    promptVersion: string;
    thinking: boolean;
    reasoningEffort: string;
    attempts: LlmAttempt[];
  } | null;
  cost: CostEstimate;
};

export type PipelineResult =
  | {
      outcome: "ok";
      transcript: TranscriptView;
      commitments: Commitments;
      metrics: Metrics;
    }
  | {
      outcome: "declined";
      reason: DeclineReason;
      message: string;
      transcript: TranscriptView | null;
      metrics: Metrics;
    }
  | {
      outcome: "failed";
      message: string;
      transcript: TranscriptView | null;
      metrics: Metrics;
    };

/** Streamed to the browser, one JSON object per line. */
export type PipelineEvent =
  | { type: "stage"; stage: Stage }
  | { type: "transcript"; transcript: TranscriptView }
  | { type: "done"; result: PipelineResult }
  | { type: "error"; message: string };
