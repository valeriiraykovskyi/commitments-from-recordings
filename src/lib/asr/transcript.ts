import { z } from "zod";

export type TranscriptWord = {
  text: string;
  start: number;
  end: number;
  speaker: number;
  confidence: number;
};

export type Utterance = {
  /** Reference shown to the LLM, e.g. "U07". */
  id: string;
  speaker: number;
  start: number;
  end: number;
  text: string;
  /** Indexes of the first and last word of the utterance in `Transcript.words`. */
  firstWord: number;
  lastWord: number;
};

/** Provider-neutral transcript: the rest of the pipeline only sees this. */
export type Transcript = {
  durationSec: number;
  language: string | null;
  languageConfidence: number | null;
  /** Distinct speaker labels, ascending. */
  speakers: number[];
  words: TranscriptWord[];
  utterances: Utterance[];
  source: { requestId: string; models: string[]; diarizer: string | null };
};

/** A new utterance starts when the speaker changes or after a pause this long. */
export const UTTERANCE_PAUSE_SEC = 1;

// Only the parts of Deepgram's pre-recorded response that we use. The API
// returns `punctuated_word` and `language_confidence`, but the SDK types omit
// them, so the response is validated here instead of trusted.
const deepgramWord = z.object({
  word: z.string(),
  punctuated_word: z.string().optional(),
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
  speaker: z.number().int().optional(),
});

const deepgramResponse = z.object({
  metadata: z.object({
    request_id: z.string(),
    duration: z.number(),
    models: z.array(z.string()),
    diarize_info: z.object({ arch: z.string() }).optional(),
  }),
  results: z.object({
    channels: z
      .array(
        z.object({
          detected_language: z.string().optional(),
          language_confidence: z.number().optional(),
          alternatives: z.array(z.object({ words: z.array(deepgramWord) })).min(1),
        }),
      )
      .min(1),
  }),
});

/** Converts a Deepgram pre-recorded response into a `Transcript`. */
export function toTranscript(response: unknown): Transcript {
  const { metadata, results } = deepgramResponse.parse(response);
  const channel = results.channels[0];
  const words = channel.alternatives[0].words.map(
    (word): TranscriptWord => ({
      text: word.punctuated_word ?? word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker ?? 0,
      confidence: word.confidence,
    }),
  );

  return {
    durationSec: metadata.duration,
    language: channel.detected_language ?? null,
    languageConfidence: channel.language_confidence ?? null,
    speakers: [...new Set(words.map((word) => word.speaker))].sort((a, b) => a - b),
    words,
    utterances: groupUtterances(words),
    source: {
      requestId: metadata.request_id,
      models: metadata.models,
      diarizer: metadata.diarize_info?.arch ?? null,
    },
  };
}

export function groupUtterances(words: TranscriptWord[]): Utterance[] {
  const utterances: Utterance[] = [];
  let first = 0;
  for (let i = 1; i <= words.length; i++) {
    const isBoundary =
      i === words.length ||
      words[i].speaker !== words[i - 1].speaker ||
      words[i].start - words[i - 1].end >= UTTERANCE_PAUSE_SEC;
    if (!isBoundary) continue;

    const slice = words.slice(first, i);
    utterances.push({
      id: `U${String(utterances.length + 1).padStart(2, "0")}`,
      speaker: slice[0].speaker,
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      text: slice.map((word) => word.text).join(" "),
      firstWord: first,
      lastWord: i - 1,
    });
    first = i;
  }
  return utterances;
}
