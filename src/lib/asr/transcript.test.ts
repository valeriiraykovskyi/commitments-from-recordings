import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { groupUtterances, toTranscript, type TranscriptWord } from "@/lib/asr/transcript";
import { tokenize } from "@/lib/text";

const word = (text: string, start: number, end: number, speaker: number): TranscriptWord => ({
  text,
  start,
  end,
  speaker,
  confidence: 0.99,
});

const deepgramResponse = (words: object[]) => ({
  metadata: {
    request_id: "req-1",
    duration: 4.2,
    models: ["model-uuid"],
    diarize_info: { model_uuid: "diarizer-uuid", arch: "v2" },
  },
  results: {
    channels: [
      {
        detected_language: "en",
        language_confidence: 0.98,
        alternatives: [{ transcript: "unused", confidence: 0.99, words }],
      },
    ],
  },
});

describe("groupUtterances", () => {
  it("starts a new utterance when the speaker changes", () => {
    const utterances = groupUtterances([
      word("Can", 0, 0.2, 0),
      word("you?", 0.2, 0.5, 0),
      word("Sure.", 0.7, 1, 1),
    ]);

    expect(utterances.map((u) => [u.id, u.speaker, u.text])).toEqual([
      ["U01", 0, "Can you?"],
      ["U02", 1, "Sure."],
    ]);
  });

  it("starts a new utterance after a long pause by the same speaker", () => {
    const utterances = groupUtterances([
      word("One.", 0, 0.4, 0),
      word("Two.", 0.9, 1.2, 0),
      word("Three.", 2.2, 2.5, 0),
    ]);

    expect(utterances.map((u) => u.text)).toEqual(["One. Two.", "Three."]);
  });

  it("keeps the time span and word range of each utterance", () => {
    const [first, second] = groupUtterances([
      word("a", 1, 1.1, 0),
      word("b", 1.2, 1.4, 0),
      word("c", 1.5, 1.9, 1),
    ]);

    expect(first).toMatchObject({ start: 1, end: 1.4, firstWord: 0, lastWord: 1 });
    expect(second).toMatchObject({ start: 1.5, end: 1.9, firstWord: 2, lastWord: 2 });
  });

  it("returns no utterances for no words", () => {
    expect(groupUtterances([])).toEqual([]);
  });
});

describe("toTranscript", () => {
  it("uses punctuated words and reads language, speakers and source", () => {
    const transcript = toTranscript(
      deepgramResponse([
        { word: "hi", punctuated_word: "Hi.", start: 0, end: 0.3, confidence: 0.9, speaker: 1 },
        { word: "yes", start: 0.5, end: 0.8, confidence: 0.8, speaker: 0 },
      ]),
    );

    expect(transcript.words.map((w) => w.text)).toEqual(["Hi.", "yes"]);
    expect(transcript).toMatchObject({
      durationSec: 4.2,
      language: "en",
      languageConfidence: 0.98,
      speakers: [0, 1],
      source: { requestId: "req-1", models: ["model-uuid"], diarizer: "v2" },
    });
  });

  it("puts every word on speaker 0 when diarization is missing", () => {
    const transcript = toTranscript(
      deepgramResponse([{ word: "hi", start: 0, end: 0.3, confidence: 0.9 }]),
    );

    expect(transcript.speakers).toEqual([0]);
  });

  it("rejects a response without results", () => {
    expect(() => toTranscript({ request_id: "accepted-for-callback" })).toThrow();
  });
});

describe("recorded Deepgram responses", () => {
  const fixture = (id: string, file: string) =>
    JSON.parse(readFileSync(path.join("fixtures", id, file), "utf8"));
  const transcriptOf = (id: string) => toTranscript(fixture(id, "asr-response.json"));
  const phrase = (text: string) => tokenize(text).join(" ");

  it.each(["t1-launch-sync", "t2-migration-kept", "t3-no-intros-hedged"])(
    "%s: English, two speakers, every script line transcribed",
    (id) => {
      const transcript = transcriptOf(id);
      const spoken = phrase(transcript.utterances.map((u) => u.text).join(" "));

      expect(transcript.language).toBe("en");
      expect(transcript.speakers).toEqual([0, 1]);
      expect(transcript.source.diarizer).toBe("v2");
      for (const line of fixture(id, "timeline.json").lines as { n: number; text: string }[]) {
        expect(spoken, `line ${line.n}`).toContain(phrase(line.text));
      }
    },
  );

  it("g2-spanish: detected as Spanish", () => {
    expect(transcriptOf("g2-spanish").language).toBe("es");
  });

  it("t1-launch-sync: Mark's short replies keep Mark's label", () => {
    const { utterances } = transcriptOf("t1-launch-sync");
    const speakerOf = (text: string) =>
      utterances.find((u) => phrase(u.text).includes(phrase(text)))?.speaker;
    const mark = speakerOf("And I'm Mark");

    expect(mark).not.toBe(speakerOf("Hi, I'm Anna"));
    expect(speakerOf("Sure, I'll have it done by Wednesday")).toBe(mark);
    expect(speakerOf("Monday works")).toBe(mark);
  });
});
