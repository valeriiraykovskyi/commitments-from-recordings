import type { Transcript } from "@/lib/asr/transcript";
import type { Extraction } from "@/lib/extraction/schema";
import { containsPhrase } from "@/lib/text";

import {
  questionStatus,
  resolveDeadlines,
  resolveOwner,
  taskStatus,
  type Participants,
} from "./fold";
import { indexTranscript, locateQuote, type TranscriptIndex } from "./quotes";
import type {
  Clarification,
  Commitments,
  DroppedEvidence,
  Evidence,
  Item,
  ItemEvent,
  ItemFlag,
  Speaker,
} from "./types";

type Mention = Extraction["deadlines_mentioned"][number] & { used: boolean };

/** The brief's scope: exactly two speakers. */
const EXPECTED_SPEAKERS = 2;

/**
 * Turns the model's extraction into verified commitments. Every quote is
 * located in the transcript or dropped; statuses, owners and deadlines are
 * computed only from the verified events.
 */
export function buildCommitments(transcript: Transcript, extraction: Extraction): Commitments {
  const index = indexTranscript(transcript);
  const dropped: DroppedEvidence[] = [];
  const speakers = resolveSpeakers(transcript, index, extraction, dropped);
  const participants: Participants = {
    nameOf: (label) => speakers.find((s) => s.label === label)?.name ?? null,
    labelOf: (name) => speakers.find((s) => sameName(s.name, name))?.label ?? null,
  };

  const mentions: Mention[] = extraction.deadlines_mentioned.map((m) => ({ ...m, used: false }));
  const items: Item[] = [];
  for (const raw of extraction.items) {
    const events: ItemEvent[] = [];
    let corrected = false;
    let droppedCount = 0;
    const drop = (entry: Omit<DroppedEvidence, "item">) => {
      dropped.push({ item: raw.title, ...entry });
      droppedCount += 1;
    };

    for (const event of raw.events) {
      const where = { utteranceId: event.utterance, quote: event.quote };
      const match = locateQuote(transcript, index, event.quote, event.utterance);
      if (!match) {
        drop({ type: event.type, ...where, reason: "Quote not found in the transcript." });
        continue;
      }
      if (
        event.type === "deadline" &&
        !(event.deadline && containsPhrase(match.evidence.text, event.deadline))
      ) {
        drop({ type: event.type, ...where, reason: "Deadline wording is not in the quote." });
        continue;
      }

      const by = participantLabel(transcript, event.by);
      let owner = event.owner ?? null;
      if (owner && event.type === "requested" && !ownerSupported(owner, match.evidence.text, by, speakers)) {
        drop({ type: "owner", ...where, reason: `Owner "${owner}" is not named in the quote.` });
        owner = null;
      }
      corrected ||= match.corrected;
      events.push({
        type: event.type,
        by,
        owner,
        deadline: event.deadline ?? null,
        evidence: match.evidence,
      });
    }

    if (events.length === 0) continue; // nothing verifiable is left
    const recovered =
      raw.kind === "task" &&
      attachListedDeadlines(transcript, index, raw.title, events, mentions, drop);
    items.push(
      buildItem(raw.kind, raw.title, events, participants, corrected, droppedCount > 0, recovered),
    );
  }
  for (const mention of mentions.filter((m) => !m.used)) {
    dropped.push({
      item: mention.task,
      type: "deadline",
      utteranceId: mention.utterance,
      quote: mention.quote,
      reason: "Listed deadline does not belong to any item.",
    });
  }

  items.sort((a, b) => a.events[0].evidence.start - b.events[0].evidence.start);
  items.forEach((item, i) => {
    item.id = `I${i + 1}`;
  });

  return { speakers, items, clarifications: clarify(transcript, speakers), dropped };
}

/**
 * The model lists every time expression before it writes the events, which it
 * finds easier than attaching each one to its task. A listed deadline that is
 * missing from its task's events is attached here, at its place in time, once
 * its quote is found in the transcript. Nothing is invented: the quote and the
 * task come from the model, the timestamps from the recording.
 */
function attachListedDeadlines(
  transcript: Transcript,
  index: TranscriptIndex,
  title: string,
  events: ItemEvent[],
  mentions: Mention[],
  drop: (entry: Omit<DroppedEvidence, "item">) => void,
): boolean {
  let recovered = false;
  for (const mention of mentions) {
    if (mention.used || !sameTopic(mention.task, title)) continue;
    mention.used = true;
    const where = { utteranceId: mention.utterance, quote: mention.quote };
    const match = locateQuote(transcript, index, mention.quote, mention.utterance);
    if (!match) {
      drop({ type: "deadline", ...where, reason: "Listed deadline not found in the transcript." });
      continue;
    }
    const present = events.some(
      (event) => event.type === "deadline" && overlaps(event.evidence, match.evidence),
    );
    if (present) continue;
    const at = events.findIndex((event) => event.evidence.start > match.evidence.start);
    events.splice(at === -1 ? events.length : at, 0, {
      type: "deadline",
      by: null,
      owner: null,
      deadline: mention.quote,
      evidence: match.evidence,
    });
    recovered = true;
  }
  return recovered;
}

const overlaps = (a: Evidence, b: Evidence): boolean => a.start < b.end && b.start < a.end;

/** Titles match when one contains the other's words in order, e.g. with or without a trailing "before the launch". */
function sameTopic(a: string, b: string): boolean {
  return containsPhrase(a, b) || containsPhrase(b, a);
}

function buildItem(
  kind: Item["kind"],
  title: string,
  events: ItemEvent[],
  participants: Participants,
  corrected: boolean,
  hasDropped: boolean,
  recovered: boolean,
): Item {
  const types = events.map((event) => event.type);
  const flags = new Set<ItemFlag>();
  if (corrected) flags.add("evidence_corrected");
  if (hasDropped) flags.add("events_dropped");
  if (recovered) flags.add("deadline_recovered");

  if (kind === "question") {
    return {
      id: "",
      kind,
      title,
      ...questionStatus(types),
      owner: null,
      deadline: null,
      previousDeadlines: [],
      events,
      flags: [...flags],
    };
  }

  const { status, reason } = taskStatus(types);
  const owner = resolveOwner(events, participants);
  const { deadline, previous } = resolveDeadlines(events);
  if (status === "agreed" && !owner) flags.add("no_owner");
  if (status === "agreed" && !deadline) flags.add("no_deadline");
  if (deadline && !deadline.dateStated) flags.add("date_not_stated");
  if (previous.length > 0) flags.add("deadline_changed");
  const mislabelled = events.some(
    (event) =>
      (event.type === "committed" || event.type === "accepted") &&
      event.by !== null &&
      event.by !== event.evidence.speaker,
  );
  if (mislabelled) flags.add("speaker_mismatch");

  return {
    id: "",
    kind,
    title,
    status,
    reason,
    owner,
    deadline,
    previousDeadlines: previous,
    events,
    flags: [...flags],
  };
}

/**
 * A speaker gets a name only from a verified self-introduction: the quote is
 * in the transcript, contains the name, and was said by that speaker.
 */
function resolveSpeakers(
  transcript: Transcript,
  index: TranscriptIndex,
  extraction: Extraction,
  dropped: DroppedEvidence[],
): Speaker[] {
  return transcript.speakers.map((label): Speaker => {
    const claim = extraction.speakers.find(
      (speaker) => labelNumber(speaker.label) === label && speaker.name !== null,
    );
    if (!claim?.name || !claim.quote || !claim.utterance) {
      return { label, name: null, evidence: null };
    }

    const match = locateQuote(transcript, index, claim.quote, claim.utterance);
    const problem = !match
      ? "Quote not found in the transcript."
      : !containsPhrase(match.evidence.text, claim.name)
        ? `The quote does not contain the name "${claim.name}".`
        : match.evidence.speaker !== label
          ? "The introduction was said by another speaker."
          : null;
    if (!match || problem) {
      dropped.push({
        item: `Speaker S${label}`,
        type: "speaker_name",
        utteranceId: claim.utterance,
        quote: claim.quote,
        reason: problem ?? "",
      });
      return { label, name: null, evidence: null };
    }
    return { label, name: claim.name, evidence: match.evidence };
  });
}

function clarify(transcript: Transcript, speakers: Speaker[]): Clarification[] {
  const clarifications: Clarification[] = [];
  if (transcript.speakers.length !== EXPECTED_SPEAKERS) {
    clarifications.push({ type: "speaker_count", detected: transcript.speakers.length });
  }
  const unnamed = speakers.filter((speaker) => speaker.name === null).map((s) => s.label);
  if (unnamed.length > 0) clarifications.push({ type: "speaker_names", labels: unnamed });
  return clarifications;
}

/** An owner from a request must be named in the quote or be the other, named participant. */
function ownerSupported(
  owner: string,
  quote: string,
  requester: number | null,
  speakers: Speaker[],
): boolean {
  return (
    containsPhrase(quote, owner) ||
    speakers.some((speaker) => speaker.label !== requester && sameName(speaker.name, owner))
  );
}

function labelNumber(label: string): number {
  return Number(label.slice(1)); // "S1" → 1, format checked by the schema
}

/** The model's speaker label, if it refers to a speaker that exists. */
function participantLabel(transcript: Transcript, label: string | null): number | null {
  if (label === null) return null;
  const number = labelNumber(label);
  return transcript.speakers.includes(number) ? number : null;
}

function sameName(a: string | null, b: string): boolean {
  return a !== null && a.trim().toLowerCase() === b.trim().toLowerCase();
}
