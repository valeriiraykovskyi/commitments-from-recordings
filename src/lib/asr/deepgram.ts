import "server-only";

import { DeepgramClient, DeepgramError, DeepgramTimeoutError } from "@deepgram/sdk";

import { toTranscript, type Transcript } from "./transcript";

export const ASR_MODEL = "nova-3";
/** Pinned: the deprecated `diarize=true` mislabelled a short reply in our fixtures. */
export const ASR_DIARIZER = "v2";

const MAX_ATTEMPTS = 2;

export class AsrError extends Error {
  constructor(
    message: string,
    readonly attempts: number,
    /** HTTP status from Deepgram, if a response came back. */
    readonly status: number | undefined,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AsrError";
  }
}

export type AsrResult = {
  transcript: Transcript;
  /** The provider's response as received, for snapshots and debugging. */
  raw: unknown;
  latencyMs: number;
  attempts: number;
};

let client: DeepgramClient | undefined;

function getClient(): DeepgramClient {
  // Trimmed: a pasted key with a trailing newline makes an invalid header.
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set");
  // Retries are handled below, so every attempt is counted in the metrics.
  client ??= new DeepgramClient({ apiKey, maxRetries: 0, timeoutInSeconds: 60 });
  return client;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof DeepgramTimeoutError) return true;
  if (!(error instanceof DeepgramError)) return false;
  const status = error.statusCode;
  // No status code means the request never got a response (network failure).
  return status === undefined || status === 429 || status >= 500;
}

/**
 * Transcribes a recording with Deepgram: word timings, speaker labels and the
 * detected language. `tag` separates app, eval and snapshot requests in
 * Deepgram's usage reports.
 */
export async function transcribe(audio: Buffer, { tag }: { tag: string }): Promise<AsrResult> {
  const started = performance.now();
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await getClient().listen.v1.media.transcribeFile(audio, {
        model: ASR_MODEL,
        diarize_model: ASR_DIARIZER,
        smart_format: true,
        detect_language: true,
        tag,
      });
      return {
        transcript: toTranscript(response),
        raw: response,
        latencyMs: Math.round(performance.now() - started),
        attempts: attempt,
      };
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isRetryable(error)) continue;
      const status = error instanceof DeepgramError ? error.statusCode : undefined;
      const suffix = status === undefined ? "" : ` (HTTP ${status})`;
      throw new AsrError(`Deepgram request failed${suffix}`, attempt, status, { cause: error });
    }
  }
}
