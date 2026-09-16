import { tokenize } from "@/lib/text";

import { isFullDate } from "./deadline";
import type {
  Deadline,
  EventType,
  ItemEvent,
  Owner,
  QuestionStatus,
  TaskStatus,
} from "./types";

type Resolved<S> = { status: S; reason: string };

/**
 * Walks a task's events in order. Only "committed" and "accepted" make a task
 * agreed; a tentative answer always leaves it unconfirmed; declining or
 * cancelling an agreed task cancels it.
 */
export function taskStatus(types: readonly EventType[]): Resolved<TaskStatus> {
  let status: TaskStatus = "not_agreed";
  let decisive: EventType | null = null;
  for (const type of types) {
    switch (type) {
      case "committed":
      case "accepted":
        status = "agreed";
        break;
      case "tentative":
        status = "needs_confirmation";
        break;
      case "declined":
      case "cancelled":
        status = status === "agreed" ? "cancelled" : "not_agreed";
        break;
      case "reinstated":
        if (status !== "cancelled") continue;
        status = "agreed";
        break;
      default:
        continue;
    }
    decisive = type;
  }
  return { status, reason: taskReason(status, decisive, types) };
}

function taskReason(
  status: TaskStatus,
  decisive: EventType | null,
  types: readonly EventType[],
): string {
  switch (status) {
    case "agreed":
      if (decisive === "committed") return "Someone committed to doing it.";
      if (decisive === "reinstated") return "Brought back after being cancelled.";
      return "Agreed in the discussion.";
    case "needs_confirmation":
      return "Only a tentative answer was given.";
    case "cancelled":
      return decisive === "declined"
        ? "Declined after it had been agreed."
        : "Cancelled after it had been agreed.";
    case "not_agreed":
      if (decisive === "declined") return "Declined or put off.";
      if (decisive === "cancelled") return "Dropped before anyone agreed to it.";
      return types.includes("requested")
        ? "Requested, but never accepted."
        : "Proposed, but never accepted.";
  }
}

export function questionStatus(types: readonly EventType[]): Resolved<QuestionStatus> {
  let status: QuestionStatus = "open";
  for (const type of types) {
    if (type === "asked") status = "open";
    else if (type === "answered") status = "answered";
  }
  return status === "open"
    ? { status, reason: "Raised, but not answered." }
    : { status, reason: "Answered in the discussion." };
}

export type Participants = {
  nameOf(label: number): string | null;
  labelOf(name: string): number | null;
};

/**
 * The latest event that establishes an owner wins: "committed" makes its
 * speaker the owner, and "requested" names the owner once someone other than
 * the requester accepts. Nothing else can create an owner.
 */
export function resolveOwner(
  events: readonly ItemEvent[],
  participants: Participants,
): Owner | null {
  let owner: Owner | null = null;
  let request: ItemEvent | null = null;
  for (const event of events) {
    if (event.type === "requested" && event.owner) {
      request = event;
    } else if (event.type === "committed" && event.by !== null) {
      owner = { name: participants.nameOf(event.by), speaker: event.by, evidence: event.evidence };
      request = null;
    } else if (event.type === "accepted" && request?.owner) {
      const acceptedByRequester = event.by !== null && event.by === request.by;
      if (acceptedByRequester) continue;
      owner = {
        name: request.owner,
        speaker: participants.labelOf(request.owner),
        evidence: request.evidence,
      };
      request = null;
    }
  }
  return owner;
}

/** The latest deadline, plus the earlier ones it replaced (oldest first). */
export function resolveDeadlines(events: readonly ItemEvent[]): {
  deadline: Deadline | null;
  previous: Deadline[];
} {
  const deadlines: Deadline[] = [];
  for (const event of events) {
    if (event.type !== "deadline" || !event.deadline) continue;
    const last = deadlines.at(-1);
    if (last && sameWording(last.text, event.deadline)) continue; // repeated, not changed
    deadlines.push({
      text: event.deadline,
      dateStated: isFullDate(event.deadline),
      evidence: event.evidence,
    });
  }
  return { deadline: deadlines.at(-1) ?? null, previous: deadlines.slice(0, -1) };
}

function sameWording(a: string, b: string): boolean {
  return tokenize(a).join(" ") === tokenize(b).join(" ");
}
