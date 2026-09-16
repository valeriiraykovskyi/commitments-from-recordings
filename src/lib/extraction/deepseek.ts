import "server-only";

import { z } from "zod";

// DeepSeek's OpenAI-compatible endpoint, called with fetch: the `thinking`
// parameter and the cache fields in `usage` are not part of the OpenAI SDK types.
const API_URL = "https://api.deepseek.com/chat/completions";

export type LlmConfig = {
  model: "deepseek-flash" | "deepseek-v4-pro";
  thinking: boolean;
  /** Only sent when thinking is enabled. */
  reasoningEffort: "low" | "high" | "max";
  /** In thinking mode this also covers the reasoning tokens. */
  maxTokens: number;
  timeoutMs: number;
};

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  model: "deepseek-flash",
  thinking: true,
  reasoningEffort: "high",
  maxTokens: 32_000,
  timeoutMs: 120_000,
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmUsage = {
  cacheHitTokens: number;
  cacheMissTokens: number;
  /** Includes reasoning tokens. */
  outputTokens: number;
  reasoningTokens: number;
};

export type ChatResult = {
  content: string;
  finishReason: string | null;
  model: string;
  usage: LlmUsage;
};

export class DeepSeekError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "DeepSeekError";
  }
}

const responseSchema = z.object({
  model: z.string(),
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable(),
        message: z.object({ content: z.string().nullable() }),
      }),
    )
    .min(1),
  usage: z.object({
    completion_tokens: z.number(),
    prompt_cache_hit_tokens: z.number(),
    prompt_cache_miss_tokens: z.number(),
    completion_tokens_details: z.object({ reasoning_tokens: z.number() }).optional(),
  }),
});

/** One chat completion in JSON mode. Throws DeepSeekError when no completion comes back. */
export async function chat(
  messages: ChatMessage[],
  config: LlmConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ChatResult> {
  // Trimmed: a pasted key with a trailing newline makes an invalid header.
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set");

  let response: Response;
  try {
    response = await fetchImpl(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        response_format: { type: "json_object" },
        thinking: { type: config.thinking ? "enabled" : "disabled" },
        ...(config.thinking && { reasoning_effort: config.reasoningEffort }),
        max_tokens: config.maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new DeepSeekError(`DeepSeek request failed: ${reason}`, true);
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    const retryable = response.status === 429 || response.status >= 500;
    throw new DeepSeekError(
      `DeepSeek returned HTTP ${response.status}: ${detail}`,
      retryable,
      response.status,
    );
  }

  const body = responseSchema.parse(await response.json());
  const [choice] = body.choices;
  return {
    content: choice.message.content ?? "",
    finishReason: choice.finish_reason,
    model: body.model,
    usage: {
      cacheHitTokens: body.usage.prompt_cache_hit_tokens,
      cacheMissTokens: body.usage.prompt_cache_miss_tokens,
      outputTokens: body.usage.completion_tokens,
      reasoningTokens: body.usage.completion_tokens_details?.reasoning_tokens ?? 0,
    },
  };
}
