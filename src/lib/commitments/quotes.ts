import type { Transcript } from "@/lib/asr/transcript";
import { findTokenRuns, tokenize } from "@/lib/text";

import type { Evidence } from "./types";

/** The transcript's tokens, each mapped back to its word and utterance. */
export type TranscriptIndex = {
  tokens: string[];
  wordOfToken: number[];
  utteranceOfWord: number[];
};

export function indexTranscript(transcript: Transcript): TranscriptIndex {
  const tokens: string[] = [];
  const wordOfToken: number[] = [];
  transcript.words.forEach((word, wordIndex) => {
    for (const token of tokenize(word.text)) {
      tokens.push(token);
      wordOfToken.push(wordIndex);
    }
  });

  const utteranceOfWord: number[] = [];
  transcript.utterances.forEach((utterance, utteranceIndex) => {
    for (let w = utterance.firstWord; w <= utterance.lastWord; w++) {
      utteranceOfWord[w] = utteranceIndex;
    }
  });
  return { tokens, wordOfToken, utteranceOfWord };
}

export type QuoteMatch = {
  evidence: Evidence;
  /** True when the quote was found outside the utterance the model referenced. */
  corrected: boolean;
};

/**
 * Finds a quote in the transcript. Case and punctuation are ignored, but the
 * words must match exactly and in order. A match inside the referenced
 * utterance wins; otherwise the match closest to it is used.
 */
export function locateQuote(
  transcript: Transcript,
  index: TranscriptIndex,
  quote: string,
  utteranceId: string,
): QuoteMatch | null {
  const needle = tokenize(quote);
  const starts = findTokenRuns(index.tokens, needle);
  if (starts.length === 0) return null;

  const referenced = transcript.utterances.findIndex((u) => u.id === utteranceId);
  const candidates = starts.map((start) => {
    const firstWord = index.wordOfToken[start];
    const lastWord = index.wordOfToken[start + needle.length - 1];
    const from = index.utteranceOfWord[firstWord];
    const to = index.utteranceOfWord[lastWord];
    let distance = Number.POSITIVE_INFINITY;
    if (referenced >= from && referenced <= to) distance = 0;
    else if (referenced !== -1) {
      distance = Math.min(Math.abs(referenced - from), Math.abs(referenced - to));
    }
    return { firstWord, lastWord, distance };
  });
  const best = candidates.reduce((a, b) => (b.distance < a.distance ? b : a));

  const words = transcript.words.slice(best.firstWord, best.lastWord + 1);
  return {
    evidence: {
      utteranceId: transcript.utterances[index.utteranceOfWord[best.firstWord]].id,
      text: words.map((word) => word.text).join(" "),
      start: words[0].start,
      end: words[words.length - 1].end,
      speaker: mostCommon(words.map((word) => word.speaker)),
    },
    corrected: best.distance !== 0,
  };
}

function mostCommon(labels: number[]): number {
  const counts = new Map<number, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}
