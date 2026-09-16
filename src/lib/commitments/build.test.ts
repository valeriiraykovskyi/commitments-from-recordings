import { describe, expect, it } from "vitest";

import { makeTranscript } from "@/lib/asr/testing";
import { buildCommitments } from "@/lib/commitments/build";
import type { Extraction, ExtractionEvent } from "@/lib/extraction/schema";

const transcript = makeTranscript([
  [0, "Hi, I'm Anna."], // U01
  [1, "I'm Mark."], // U02
  [0, "Mark, can you send the report by Friday?"], // U03
  [1, "Sure."], // U04
  [0, "Can you also check the logs?"], // U05
  [1, "Yes, I will."], // U06
]);

const introductions: Extraction["speakers"] = [
  { label: "S0", name: "Anna", utterance: "U01", quote: "I'm Anna" },
  { label: "S1", name: "Mark", utterance: "U02", quote: "I'm Mark" },
];

type EventFields = Partial<Omit<ExtractionEvent, "type" | "utterance" | "quote">>;
const event = (
  type: ExtractionEvent["type"],
  utterance: string,
  quote: string,
  fields: EventFields = {},
): ExtractionEvent => ({
  type,
  utterance,
  quote,
  by: fields.by ?? null,
  owner: fields.owner ?? null,
  deadline: fields.deadline ?? null,
});

const reportTask = (events: ExtractionEvent[]): Extraction => ({
  speakers: introductions,
  items: [{ kind: "task", title: "Send the report", events }],
});

describe("buildCommitments", () => {
  it("builds an agreed task with a verified owner, deadline and flags", () => {
    const result = buildCommitments(
      transcript,
      reportTask([
        event("requested", "U03", "Mark, can you send the report", { by: "S0", owner: "Mark" }),
        event("deadline", "U03", "by Friday", { by: "S0", deadline: "by Friday" }),
        event("accepted", "U04", "Sure", { by: "S1" }),
      ]),
    );

    expect(result.dropped).toEqual([]);
    expect(result.clarifications).toEqual([]);
    expect(result.speakers.map((s) => s.name)).toEqual(["Anna", "Mark"]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: "I1",
      status: "agreed",
      owner: { name: "Mark", speaker: 1 },
      deadline: { text: "by Friday", dateStated: false },
      flags: ["date_not_stated"],
    });
  });

  it("drops events whose quotes are not in the transcript, and empty items", () => {
    const result = buildCommitments(transcript, {
      speakers: introductions,
      items: [
        {
          kind: "task",
          title: "Send the report",
          events: [
            event("requested", "U03", "Mark, can you send the report", { by: "S0", owner: "Mark" }),
            event("accepted", "U04", "Absolutely, will do", { by: "S1" }),
          ],
        },
        {
          kind: "task",
          title: "Invented task",
          events: [event("committed", "U06", "I will deploy tonight", { by: "S1" })],
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      status: "not_agreed",
      owner: null,
      flags: ["events_dropped"],
    });
    expect(result.dropped.map((d) => [d.item, d.reason])).toEqual([
      ["Send the report", "Quote not found in the transcript."],
      ["Invented task", "Quote not found in the transcript."],
    ]);
  });

  it("drops a deadline whose wording is not in its quote", () => {
    const result = buildCommitments(
      transcript,
      reportTask([
        event("committed", "U04", "Sure", { by: "S1" }),
        event("deadline", "U04", "Sure", { by: "S1", deadline: "by Monday" }),
      ]),
    );

    expect(result.items[0].deadline).toBeNull();
    expect(result.items[0].flags).toEqual(["events_dropped", "no_deadline"]);
  });

  it("does not accept an owner that the quote does not support", () => {
    const withoutIntroductions: Extraction = {
      speakers: [],
      items: [
        {
          kind: "task",
          title: "Check the logs",
          events: [
            event("requested", "U05", "Can you also check the logs?", { by: "S0", owner: "Olga" }),
            event("accepted", "U06", "Yes, I will.", { by: "S1" }),
          ],
        },
      ],
    };

    const [item] = buildCommitments(transcript, withoutIntroductions).items;

    expect(item.status).toBe("agreed");
    expect(item.owner).toBeNull();
    expect(item.flags).toContain("no_owner");
  });

  it("accepts the other named participant as the owner of an unnamed request", () => {
    const [item] = buildCommitments(
      transcript,
      reportTask([
        event("requested", "U05", "Can you also check the logs?", { by: "S0", owner: "Mark" }),
        event("accepted", "U06", "Yes, I will.", { by: "S1" }),
      ]),
    ).items;

    expect(item.owner).toMatchObject({ name: "Mark", speaker: 1 });
  });

  it("marks a corrected utterance reference and a speaker mismatch", () => {
    const [item] = buildCommitments(
      transcript,
      reportTask([event("committed", "U02", "Yes, I will", { by: "S0" })]),
    ).items;

    expect(item.flags).toEqual(expect.arrayContaining(["evidence_corrected", "speaker_mismatch"]));
    expect(item.events[0].evidence.utteranceId).toBe("U06");
  });

  it("rejects a name that is not in the introduction or was said by someone else", () => {
    const result = buildCommitments(transcript, {
      speakers: [
        { label: "S0", name: "Annie", utterance: "U01", quote: "I'm Anna" },
        { label: "S1", name: "Anna", utterance: "U01", quote: "I'm Anna" },
      ],
      items: [],
    });

    expect(result.speakers.map((s) => s.name)).toEqual([null, null]);
    expect(result.clarifications).toEqual([{ type: "speaker_names", labels: [0, 1] }]);
    expect(result.dropped.map((d) => d.reason)).toEqual([
      'The quote does not contain the name "Annie".',
      "The introduction was said by another speaker.",
    ]);
  });

  it("asks for clarification when the number of speakers is not two", () => {
    const monologue = makeTranscript([[0, "I'm Anna and I will write it."]]);

    const result = buildCommitments(monologue, {
      speakers: [{ label: "S0", name: "Anna", utterance: "U01", quote: "I'm Anna" }],
      items: [],
    });

    expect(result.clarifications).toEqual([{ type: "speaker_count", detected: 1 }]);
  });

  it("orders items by when they were first mentioned", () => {
    const result = buildCommitments(transcript, {
      speakers: introductions,
      items: [
        { kind: "task", title: "Logs", events: [event("proposed", "U05", "check the logs", { by: "S0" })] },
        { kind: "task", title: "Report", events: [event("proposed", "U03", "send the report", { by: "S0" })] },
      ],
    });

    expect(result.items.map((i) => [i.id, i.title])).toEqual([
      ["I1", "Report"],
      ["I2", "Logs"],
    ]);
  });
});
