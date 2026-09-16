import { z } from "zod";

import type { Transcript } from "@/lib/asr/transcript";

import {
  chat,
  DEFAULT_LLM_CONFIG,
  DeepSeekError,
  type ChatMessage,
  type ChatResult,
  type LlmConfig,
  type LlmUsage,
} from "./deepseek";
import { formatTranscript, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt";
import { extractionSchema, type Extraction } from "./schema";

export const MAX_LLM_ATTEMPTS = 2;

/** One paid (or failed) call to the model; every attempt is kept for the metrics. */
export type LlmAttempt = {
  ok: boolean;
  error: string | null;
  finishReason: string | null;
  latencyMs: number;
  /** null when no completion came back (network error, HTTP error). */
  usage: LlmUsage | null;
};

export type ExtractionResult = {
  extraction: Extraction;
  model: string;
  promptVersion: string;
  config: LlmConfig;
  attempts: LlmAttempt[];
};

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly attempts: LlmAttempt[],
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

type Parsed = { ok: true; value: Extraction } | { ok: false; error: string };

function parseCompletion(result: ChatResult): Parsed {
  if (result.finishReason !== "stop") {
    return { ok: false, error: `Generation did not finish (finish_reason: ${result.finishReason}).` };
  }
  if (!result.content.trim()) return { ok: false, error: "The response was empty." };

  let json: unknown;
  try {
    json = JSON.parse(result.content);
  } catch {
    return { ok: false, error: "The response was not valid JSON." };
  }
  const parsed = extractionSchema.safeParse(json);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: z.prettifyError(parsed.error) };
}

/**
 * Asks the model for the items and events in a transcript. A failed attempt is
 * retried once; if the model answered with invalid output, the retry shows it
 * that output and the validation error.
 */
export async function extractCommitments(
  transcript: Transcript,
  config: LlmConfig = DEFAULT_LLM_CONFIG,
  fetchImpl?: typeof fetch,
): Promise<ExtractionResult> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Transcript:\n${formatTranscript(transcript)}` },
  ];
  const attempts: LlmAttempt[] = [];

  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);

    let result: ChatResult;
    try {
      result = await chat(messages, config, fetchImpl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      attempts.push({ ok: false, error: message, finishReason: null, latencyMs: elapsed(), usage: null });
      if (error instanceof DeepSeekError && error.retryable) continue;
      throw new ExtractionError(message, attempts);
    }

    const parsed = parseCompletion(result);
    attempts.push({
      ok: parsed.ok,
      error: parsed.ok ? null : parsed.error,
      finishReason: result.finishReason,
      latencyMs: elapsed(),
      usage: result.usage,
    });
    if (parsed.ok) {
      return {
        extraction: parsed.value,
        model: result.model,
        promptVersion: PROMPT_VERSION,
        config,
        attempts,
      };
    }
    // A complete but invalid answer is shown back with the error; a truncated or
    // empty one is simply requested again.
    if (result.finishReason === "stop" && result.content.trim()) {
      messages.push(
        { role: "assistant", content: result.content },
        {
          role: "user",
          content: `That output is invalid:\n${parsed.error}\nReturn the corrected json object only.`,
        },
      );
    }
  }

  const lastError = attempts.at(-1)?.error ?? "unknown error";
  throw new ExtractionError(`The model did not return a valid extraction: ${lastError}`, attempts);
}
