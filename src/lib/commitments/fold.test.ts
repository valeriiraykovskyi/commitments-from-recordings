import { describe, expect, it } from "vitest";

import {
  questionStatus,
  resolveDeadlines,
  resolveOwner,
  taskStatus,
  type Participants,
} from "@/lib/commitments/fold";
import type { EventType, ItemEvent } from "@/lib/commitments/types";

const event = (
  type: EventType,
  fields: Partial<Omit<ItemEvent, "type" | "evidence">> & { at?: number } = {},
): ItemEvent => ({
  type,
  by: fields.by ?? null,
  owner: fields.owner ?? null,
  deadline: fields.deadline ?? null,
  evidence: {
    utteranceId: "U01",
    text: "quote",
    start: fields.at ?? 0,
    end: (fields.at ?? 0) + 1,
    speaker: fields.by ?? 0,
  },
});

const names = new Map([
  [0, "Anna"],
  [1, "Mark"],
]);
const participants: Participants = {
  nameOf: (label) => names.get(label) ?? null,
  labelOf: (name) =>
    [...names].find(([, known]) => known.toLowerCase() === name.toLowerCase())?.[0] ?? null,
};

describe("taskStatus", () => {
  it.each<[EventType[], string, string]>([
    [["proposed"], "not_agreed", "Proposed, but never accepted."],
    [["requested"], "not_agreed", "Requested, but never accepted."],
    [["proposed", "declined"], "not_agreed", "Declined or put off."],
    [["proposed", "cancelled"], "not_agreed", "Dropped before anyone agreed to it."],
    [["proposed", "accepted"], "agreed", "Agreed in the discussion."],
    [["committed"], "agreed", "Someone committed to doing it."],
    [["committed", "deadline", "deadline"], "agreed", "Someone committed to doing it."],
    [["proposed", "tentative"], "needs_confirmation", "Only a tentative answer was given."],
    [["committed", "tentative"], "needs_confirmation", "Only a tentative answer was given."],
    [["committed", "accepted", "cancelled"], "cancelled", "Cancelled after it had been agreed."],
    [["requested", "accepted", "declined"], "cancelled", "Declined after it had been agreed."],
    [["tentative", "declined"], "not_agreed", "Declined or put off."],
    [["committed", "cancelled", "reinstated"], "agreed", "Brought back after being cancelled."],
    // "Let's drop it." — "Okay. Noted." must stay cancelled, not become agreed again.
    [["committed", "cancelled", "accepted"], "cancelled", "Cancelled after it had been agreed."],
    [
      ["requested", "accepted", "cancelled", "accepted"],
      "cancelled",
      "Cancelled after it had been agreed.",
    ],
    [["committed", "declined", "accepted"], "cancelled", "Declined after it had been agreed."],
    // A fresh commitment after the cancellation is a real revival.
    [["committed", "cancelled", "committed"], "agreed", "Brought back after being cancelled."],
    [
      ["committed", "cancelled", "reinstated", "cancelled"],
      "cancelled",
      "Cancelled after it had been agreed.",
    ],
    [["proposed", "reinstated"], "not_agreed", "Proposed, but never accepted."],
  ])("%j → %s", (types, status, reason) => {
    expect(taskStatus(types)).toEqual({ status, reason });
  });
});

describe("questionStatus", () => {
  it("is open until answered", () => {
    expect(questionStatus(["asked"]).status).toBe("open");
    expect(questionStatus(["asked", "answered"]).status).toBe("answered");
  });
});

describe("resolveOwner", () => {
  it("makes the committing speaker the owner", () => {
    const owner = resolveOwner([event("committed", { by: 0 })], participants);

    expect(owner).toMatchObject({ name: "Anna", speaker: 0 });
  });

  it("takes the requested person once someone else accepts", () => {
    const owner = resolveOwner(
      [event("requested", { by: 0, owner: "Mark", at: 1 }), event("accepted", { by: 1, at: 2 })],
      participants,
    );

    expect(owner).toMatchObject({ name: "Mark", speaker: 1 });
    expect(owner?.evidence.start).toBe(1); // the request names the owner
  });

  it("ignores a request that was not accepted, or accepted by the requester", () => {
    expect(resolveOwner([event("requested", { by: 0, owner: "Mark" })], participants)).toBeNull();
    expect(
      resolveOwner(
        [event("requested", { by: 0, owner: "Mark" }), event("accepted", { by: 0 })],
        participants,
      ),
    ).toBeNull();
  });

  it("has no owner for an accepted proposal", () => {
    expect(
      resolveOwner([event("proposed", { by: 0 }), event("accepted", { by: 1 })], participants),
    ).toBeNull();
  });

  it("lets a later commitment replace the requested owner", () => {
    const owner = resolveOwner(
      [event("requested", { by: 0, owner: "Mark" }), event("committed", { by: 0 })],
      participants,
    );

    expect(owner).toMatchObject({ name: "Anna", speaker: 0 });
  });

  it("keeps an owner outside the call without a speaker label", () => {
    const owner = resolveOwner(
      [event("requested", { by: 0, owner: "Olga" }), event("accepted", { by: 1 })],
      participants,
    );

    expect(owner).toMatchObject({ name: "Olga", speaker: null });
  });

  it("names an unnamed committing speaker by label only", () => {
    const owner = resolveOwner([event("committed", { by: 7 })], participants);

    expect(owner).toMatchObject({ name: null, speaker: 7 });
  });
});

describe("resolveDeadlines", () => {
  it("keeps the latest deadline and the replaced ones", () => {
    const { deadline, previous } = resolveDeadlines([
      event("deadline", { deadline: "by Friday" }),
      event("deadline", { deadline: "by Friday." }),
      event("deadline", { deadline: "Monday" }),
    ]);

    expect(deadline).toMatchObject({ text: "Monday", dateStated: false });
    expect(previous.map((d) => d.text)).toEqual(["by Friday"]);
  });

  it("marks a full calendar date as stated", () => {
    const { deadline } = resolveDeadlines([
      event("deadline", { deadline: "by September 30, 2026" }),
    ]);

    expect(deadline?.dateStated).toBe(true);
  });

  it("returns nothing without deadline events", () => {
    expect(resolveDeadlines([event("committed")])).toEqual({ deadline: null, previous: [] });
  });
});
