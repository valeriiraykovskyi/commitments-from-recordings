import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Transcript } from "@/lib/asr/transcript";
import { DEFAULT_LLM_CONFIG } from "@/lib/extraction/deepseek";
import { ExtractionError, extractCommitments } from "@/lib/extraction/extract";
import { SYSTEM_PROMPT } from "@/lib/extraction/prompt";

const transcript: Transcript = {
  durationSec: 3,
  language: "en",
  languageConfidence: 0.99,
  speakers: [0, 1],
  words: [],
  utterances: [
    { id: "U01", speaker: 0, start: 0, end: 1, text: "Can you send it?", firstWord: 0, lastWord: 3 },
    { id: "U02", speaker: 1, start: 1.5, end: 2, text: "Sure.", firstWord: 4, lastWord: 4 },
  ],
  source: { requestId: "req", models: [], diarizer: "v2" },
};

const validOutput = JSON.stringify({
  speakers: [{ label: "S0", name: null, utterance: null, quote: null }],
  items: [
    {
      kind: "task",
      title: "Send it",
      events: [
        { type: "requested", utterance: "U01", by: "S0", owner: null, deadline: null, quote: "Can you send it?" },
        { type: "accepted", utterance: "U02", by: "S1", owner: null, deadline: null, quote: "Sure." },
      ],
    },
  ],
});

const usage = {
  prompt_tokens: 100,
  completion_tokens: 50,
  prompt_cache_hit_tokens: 60,
  prompt_cache_miss_tokens: 40,
  completion_tokens_details: { reasoning_tokens: 30 },
};

const completion = (content: string | null, finishReason = "stop") =>
  new Response(
    JSON.stringify({
      model: "deepseek-flash",
      choices: [{ finish_reason: finishReason, message: { content } }],
      usage,
    }),
    { status: 200 },
  );

/** A fetch mock that returns the given responses in order and records request bodies. */
function mockFetch(...responses: (Response | Error)[]) {
  const bodies: Record<string, unknown>[] = [];
  const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)));
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    if (next instanceof Error) throw next;
    return next;
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, bodies };
}

beforeEach(() => {
  vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
});

describe("extractCommitments", () => {
  it("sends the transcript in JSON mode and returns the parsed extraction", async () => {
    const { fetchImpl, bodies } = mockFetch(completion(validOutput));

    const result = await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl);

    expect(result.extraction.items[0].title).toBe("Send it");
    expect(result.attempts).toEqual([
      {
        ok: true,
        error: null,
        finishReason: "stop",
        latencyMs: expect.any(Number),
        usage: { cacheHitTokens: 60, cacheMissTokens: 40, outputTokens: 50, reasoningTokens: 30 },
      },
    ]);
    expect(bodies[0]).toMatchObject({
      model: "deepseek-flash",
      response_format: { type: "json_object" },
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Transcript:\n[U01] 0:00 S0: Can you send it?\n[U02] 0:01 S1: Sure." },
      ],
    });
  });

  it("trims whitespace around the API key", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "  test-key\n");
    const { fetchImpl } = mockFetch(completion(validOutput));

    await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl);

    const init = vi.mocked(fetchImpl).mock.calls[0][1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-key");
  });

  it("does not send reasoning_effort when thinking is disabled", async () => {
    const { fetchImpl, bodies } = mockFetch(completion(validOutput));

    await extractCommitments(transcript, { ...DEFAULT_LLM_CONFIG, thinking: false }, fetchImpl);

    expect(bodies[0].thinking).toEqual({ type: "disabled" });
    expect(bodies[0]).not.toHaveProperty("reasoning_effort");
  });

  it("shows the model its invalid answer and the error, then accepts the fix", async () => {
    const invalid = JSON.stringify({ speakers: [], items: [{ kind: "task", title: "X", events: [] }] });
    const { fetchImpl, bodies } = mockFetch(completion(invalid), completion(validOutput));

    const result = await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl);

    expect(result.attempts.map((a) => a.ok)).toEqual([false, true]);
    expect(result.attempts[0].error).toContain("events");
    const retryMessages = bodies[1].messages as { role: string; content: string }[];
    expect(retryMessages.slice(2)).toEqual([
      { role: "assistant", content: invalid },
      { role: "user", content: expect.stringContaining("That output is invalid") },
    ]);
  });

  it("repeats the request unchanged after an empty or truncated answer", async () => {
    const { fetchImpl, bodies } = mockFetch(completion("{\"speakers\": [", "length"), completion(validOutput));

    const result = await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl);

    expect(result.attempts[0]).toMatchObject({ ok: false, finishReason: "length" });
    expect(bodies[1].messages).toHaveLength(2);
  });

  it("retries after a server error and records the attempt without usage", async () => {
    const { fetchImpl } = mockFetch(new Response("busy", { status: 503 }), completion(validOutput));

    const result = await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl);

    expect(result.attempts[0]).toMatchObject({ ok: false, usage: null });
    expect(result.attempts[0].error).toContain("HTTP 503");
    expect(result.attempts[1].ok).toBe(true);
  });

  it("does not retry an authentication error", async () => {
    const { fetchImpl } = mockFetch(new Response("bad key", { status: 401 }));

    const error = await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl).catch((e) => e);

    expect(error).toBeInstanceOf(ExtractionError);
    expect((error as ExtractionError).attempts).toHaveLength(1);
  });

  it("gives up after two failed attempts and reports both", async () => {
    const { fetchImpl } = mockFetch(completion(""), completion("not json"));

    const error = await extractCommitments(transcript, DEFAULT_LLM_CONFIG, fetchImpl).catch((e) => e);

    expect(error).toBeInstanceOf(ExtractionError);
    expect((error as ExtractionError).attempts.map((a) => a.error)).toEqual([
      "The response was empty.",
      "The response was not valid JSON.",
    ]);
  });
});
