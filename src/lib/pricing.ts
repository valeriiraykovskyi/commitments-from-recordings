/**
 * List prices behind the cost estimates. Free credits and free tiers are
 * ignored on purpose: they are not zero operating cost.
 */
export const PRICES = {
  checked: "2026-09-17",
  deepgram: {
    source: "https://deepgram.com/pricing",
    /** Nova-3 monolingual, pre-recorded, pay-as-you-go, USD per minute. */
    perMinute: 0.0043,
    /** Speaker diarization add-on. Listed as an add-on; counted to stay on the safe side. */
    diarizationPerMinute: 0.002,
  },
  deepseek: {
    source: "https://api-docs.deepseek.com/quick_start/pricing",
    /** USD per 1M tokens. Peak: Mon–Fri 01:00–04:00 and 06:00–10:00 UTC. */
    models: {
      "deepseek-flash": {
        peak: { cacheHit: 0.006, cacheMiss: 0.3, output: 1.2 },
        offPeak: { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
      },
      "deepseek-v4-pro": {
        peak: { cacheHit: 0.044, cacheMiss: 1.32, output: 3.96 },
        offPeak: { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 },
      },
    },
  },
  vercelBlob: {
    source: "https://vercel.com/docs/vercel-blob/usage-and-pricing",
    /** Pro rates beyond the included usage, in USD. */
    advancedOperation: 5 / 1_000_000,
    simpleOperation: 0.4 / 1_000_000,
    transferPerGb: 0.05,
  },
} as const;

export type LlmModel = keyof typeof PRICES.deepseek.models;

export type TokenUsage = {
  cacheHitTokens: number;
  cacheMissTokens: number;
  /** Includes reasoning tokens, which are billed as output. */
  outputTokens: number;
};

export function isDeepSeekPeak(at: Date): boolean {
  const day = at.getUTCDay(); // 0 is Sunday
  const hour = at.getUTCHours();
  const weekday = day >= 1 && day <= 5;
  return weekday && ((hour >= 1 && hour < 4) || (hour >= 6 && hour < 10));
}

export function llmCost(model: LlmModel, usage: TokenUsage, peak: boolean): number {
  const rates = PRICES.deepseek.models[model][peak ? "peak" : "offPeak"];
  return (
    (usage.cacheHitTokens * rates.cacheHit +
      usage.cacheMissTokens * rates.cacheMiss +
      usage.outputTokens * rates.output) /
    1_000_000
  );
}

export function asrCost(audioSec: number): number {
  const { perMinute, diarizationPerMinute } = PRICES.deepgram;
  return (audioSec / 60) * (perMinute + diarizationPerMinute);
}

/** One upload (advanced operation) and one download (simple operation plus transfer); deletes are free. */
export function blobCost(bytes: number): number {
  const { advancedOperation, simpleOperation, transferPerGb } = PRICES.vercelBlob;
  return advancedOperation + simpleOperation + (bytes / 1024 ** 3) * transferPerGb;
}
