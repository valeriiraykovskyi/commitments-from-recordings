/**
 * Splits text into lowercase word tokens for tolerant comparison. Case,
 * punctuation, accents and apostrophes are ignored:
 * "Sign-up" → ["sign", "up"], "I'll" → ["ill"], "Lucía" → ["lucia"].
 */
export function tokenize(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
