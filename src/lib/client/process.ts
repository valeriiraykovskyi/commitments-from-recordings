import type { PipelineEvent, PipelineResult } from "@/lib/pipeline/types";

import { readNdjson } from "./ndjson";

export type ProcessInput = { sample: string } | { upload: string; durationSec?: number };

/** A failure reported by the server or the connection, worded for people. */
export class ProcessError extends Error {}

/**
 * Asks the server to process a sample or an uploaded recording. Progress
 * events (stages, the early transcript) are passed on as they arrive; the
 * promise resolves with the final result.
 */
export async function processRecording(
  input: ProcessInput,
  onEvent: (event: PipelineEvent) => void,
  signal?: AbortSignal,
): Promise<PipelineResult> {
  const response = await fetch("/api/process", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ProcessError(body?.error ?? `The server answered with status ${response.status}.`);
  }

  const outcome: { result: PipelineResult | null } = { result: null };
  await readNdjson<PipelineEvent>(response.body, (event) => {
    if (event.type === "error") throw new ProcessError(event.message);
    onEvent(event);
    if (event.type === "done") outcome.result = event.result;
  });
  if (!outcome.result) {
    throw new ProcessError("The connection closed before the result arrived. Please try again.");
  }
  return outcome.result;
}
