import { describe, expect, it } from "vitest";

import type { Commitments, Evidence, Item } from "@/lib/commitments/types";

import { compareWithExpected, type Expected, type Timeline } from "./compare";

const expected: Expected = {
  fixture: "test",
  outcome: "ok",
  clarifications: [],
  speakers: [{ name: "Anna", intro_line: 1 }],
  items: [
    {
      id: "report",
      kind: ["task"],
      match: ["report"],
      status: ["agreed"],
      owner: null,
      deadline: {
        match: ["monday"],
        not_match: ["friday"],
        date_context_missing: true,
        corrected_from: ["friday"],
      },
      evidence_lines: [2],
    },
    { id: "idea", kind: ["task"], match: ["idea"], status: ["not_agreed"], evidence_lines: [3] },
  ],
  absent_or_not_agreed: [{ id: "done", match: ["bug"] }],
};

const timeline: Timeline = {
  lines: [
    { n: 1, start: 0, end: 1 },
    { n: 2, start: 2, end: 3 },
    { n: 3, start: 4, end: 5 },
  ],
};

const evidence = (start: number): Evidence => ({
  utteranceId: "U01",
  text: "quote",
  start,
  end: start + 0.5,
  speaker: 0,
});

const item = (fields: Partial<Item>): Item => ({
  id: "I1",
  kind: "task",
  title: "",
  status: "agreed",
  reason: "",
  owner: null,
  deadline: null,
  previousDeadlines: [],
  events: [],
  flags: [],
  ...fields,
});

const proposedAt = (start: number) => [
  { type: "proposed" as const, by: 0, owner: null, deadline: null, evidence: evidence(start) },
];

function result(items: Item[] = []): Commitments {
  return {
    speakers: [
      { label: 0, name: "Anna", evidence: evidence(0.2) },
      { label: 1, name: null, evidence: null },
    ],
    items: [
      item({
        title: "Send the report",
        deadline: { text: "Monday", dateStated: false, evidence: evidence(2.2) },
        previousDeadlines: [{ text: "by Friday", dateStated: false, evidence: evidence(2.1) }],
        events: proposedAt(2.1),
      }),
      item({ title: "An idea", status: "not_agreed", events: proposedAt(4.1) }),
      ...items,
    ],
    clarifications: [],
    dropped: [],
  };
}

const compare = (commitments: Commitments) =>
  compareWithExpected(expected, { outcome: "ok", commitments }, timeline);

describe("compareWithExpected", () => {
  it("passes a result that matches", () => {
    expect(compare(result())).toEqual({ passed: true, failures: [], warnings: [] });
  });

  it("fails an invented owner", () => {
    const commitments = result();
    commitments.items[0].owner = { name: "Mark", speaker: 1, evidence: evidence(2.1) };

    expect(compare(commitments).failures).toEqual(['item "report": owner Mark was invented']);
  });

  it("fails a proposal reported as agreed", () => {
    const commitments = result();
    commitments.items[1].status = "agreed";

    expect(compare(commitments).failures).toEqual([
      'item "idea": status is agreed, expected not_agreed',
      'unexpected agreed item "An idea"',
    ]);
  });

  it("fails when the old deadline is kept", () => {
    const commitments = result();
    commitments.items[0].deadline = { text: "by Friday", dateStated: false, evidence: evidence(2.1) };
    commitments.items[0].previousDeadlines = [];

    expect(compare(commitments).failures).toEqual([
      'item "report": deadline "by Friday" does not match monday',
      'item "report": deadline "by Friday" is the old one',
    ]);
  });

  it("fails an item that must not be agreed, and a missing item", () => {
    const commitments = result([item({ title: "Fix the bug", events: proposedAt(4.2) })]);
    commitments.items.splice(1, 1);

    expect(compare(commitments).failures).toEqual([
      'item "idea": found 0 matching items, expected 1',
      'unexpected agreed item "Fix the bug"',
      '"done" must not be agreed, but "Fix the bug" is',
    ]);
  });

  it("fails evidence that is not on the expected lines", () => {
    const commitments = result();
    commitments.items[1].events = proposedAt(0.2);

    expect(compare(commitments).failures).toEqual(['item "idea": no evidence on lines 3']);
  });

  it("reports dropped quotes and missing history as warnings", () => {
    const commitments = result();
    commitments.items[0].previousDeadlines = [];
    commitments.dropped = [
      { item: "An idea", type: "accepted", utteranceId: "U09", quote: "x", reason: "Quote not found in the transcript." },
    ];

    const comparison = compare(commitments);

    expect(comparison.passed).toBe(true);
    expect(comparison.warnings).toEqual([
      'item "report": history does not show the earlier deadline friday',
      'dropped accepted in "An idea": Quote not found in the transcript.',
    ]);
  });

  it("checks declines and paid calls", () => {
    const declined: Expected = {
      ...expected,
      outcome: "declined",
      decline_reason: "too_long",
      calls: { asr: 0, llm: 0 },
    };
    const observed = {
      outcome: "declined" as const,
      declineReason: "too_long",
      calls: { asr: 0, llm: 0 },
      commitments: null,
    };

    expect(compareWithExpected(declined, observed, {}).passed).toBe(true);
    expect(
      compareWithExpected(declined, { ...observed, calls: { asr: 1, llm: 0 } }, {}).failures,
    ).toEqual(["asr calls: 1, expected 0"]);
  });
});
