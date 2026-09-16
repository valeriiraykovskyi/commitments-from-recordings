import { groupUtterances, type Transcript, type TranscriptWord } from "./transcript";

/**
 * Builds a transcript for unit tests: one utterance per line, in order
 * (U01, U02, …), with 0.35 s per word and a 1.2 s pause between lines.
 */
export function makeTranscript(lines: [speaker: number, text: string][]): Transcript {
  const words: TranscriptWord[] = [];
  let time = 0;
  for (const [speaker, text] of lines) {
    for (const word of text.split(/\s+/).filter(Boolean)) {
      words.push({ text: word, start: time, end: time + 0.3, speaker, confidence: 1 });
      time += 0.35;
    }
    time += 1.2;
  }
  return {
    durationSec: time,
    language: "en",
    languageConfidence: 1,
    speakers: [...new Set(lines.map(([speaker]) => speaker))].sort((a, b) => a - b),
    words,
    utterances: groupUtterances(words),
    source: { requestId: "test", models: [], diarizer: "v2" },
  };
}
