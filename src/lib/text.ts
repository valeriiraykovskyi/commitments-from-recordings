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

/** Start positions of every contiguous occurrence of `needle` in `haystack`. */
export function findTokenRuns(haystack: readonly string[], needle: readonly string[]): number[] {
  if (needle.length === 0) return [];
  const starts: number[] = [];
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((token, j) => haystack[i + j] === token)) starts.push(i);
  }
  return starts;
}

/** True when the words of `phrase` appear in `text` in the same order, side by side. */
export function containsPhrase(text: string, phrase: string): boolean {
  return findTokenRuns(tokenize(text), tokenize(phrase)).length > 0;
}
