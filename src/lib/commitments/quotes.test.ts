import { describe, expect, it } from "vitest";

import { makeTranscript } from "@/lib/asr/testing";
import { indexTranscript, locateQuote } from "@/lib/commitments/quotes";

const transcript = makeTranscript([
  [0, "Mark, can you send the report?"], // U01
  [1, "Sure. I'll send it by Friday."], // U02
  [0, "Great. Sure, sounds good."], // U03
]);
const index = indexTranscript(transcript);
const locate = (quote: string, utteranceId: string) =>
  locateQuote(transcript, index, quote, utteranceId);

describe("locateQuote", () => {
  it("finds a quote in the referenced utterance, ignoring case and punctuation", () => {
    const match = locate("i'll send it by friday", "U02");

    expect(match?.corrected).toBe(false);
    expect(match?.evidence).toMatchObject({
      utteranceId: "U02",
      text: "I'll send it by Friday.",
      speaker: 1,
    });
    expect(match?.evidence.start).toBeCloseTo(3.65);
    expect(match?.evidence.end).toBeCloseTo(5.35);
  });

  it("uses a match elsewhere when the referenced utterance is wrong, and says so", () => {
    const match = locate("send the report", "U03");

    expect(match?.corrected).toBe(true);
    expect(match?.evidence.utteranceId).toBe("U01");
  });

  it("prefers the occurrence in the referenced utterance", () => {
    expect(locate("Sure", "U02")?.evidence).toMatchObject({ utteranceId: "U02", speaker: 1 });
    expect(locate("Sure", "U03")?.evidence).toMatchObject({ utteranceId: "U03", speaker: 0 });
  });

  it("takes the first occurrence when the utterance ID does not exist", () => {
    const match = locate("Sure", "U99");

    expect(match?.corrected).toBe(true);
    expect(match?.evidence.utteranceId).toBe("U02");
  });

  it("rejects paraphrases and partial words", () => {
    expect(locate("I will send it by Friday", "U02")).toBeNull();
    expect(locate("by Fri", "U02")).toBeNull();
    expect(locate("", "U02")).toBeNull();
  });
});
