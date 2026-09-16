import type { EVENT_TYPES } from "@/lib/extraction/schema";

export type EventType = (typeof EVENT_TYPES)[number];

/** A quote found in the transcript, with its exact position in the audio. */
export type Evidence = {
  utteranceId: string;
  /** The transcript words that matched the quote. */
  text: string;
  start: number;
  end: number;
  /** Speaker label that diarization gave to these words. */
  speaker: number;
};

export type ItemEvent = {
  type: EventType;
  /** Who said it according to the model, which may correct diarization. */
  by: number | null;
  owner: string | null;
  deadline: string | null;
  evidence: Evidence;
};

export type TaskStatus = "agreed" | "needs_confirmation" | "not_agreed" | "cancelled";
export type QuestionStatus = "open" | "answered";
export type ItemStatus = TaskStatus | QuestionStatus;

export type Owner = {
  /** null when the owner is a participant who never said their name. */
  name: string | null;
  /** Speaker label when the owner is a participant. */
  speaker: number | null;
  evidence: Evidence;
};

export type Deadline = {
  /** Wording as spoken, e.g. "by Wednesday". */
  text: string;
  /** True only for a full calendar date with a year. */
  dateStated: boolean;
  evidence: Evidence;
};

export type ItemFlag =
  | "no_owner"
  | "no_deadline"
  | "date_not_stated"
  | "deadline_changed"
  | "speaker_mismatch"
  | "evidence_corrected"
  | "events_dropped";

export type Item = {
  id: string;
  kind: "task" | "question";
  title: string;
  status: ItemStatus;
  /** Why the item has this status, for people. */
  reason: string;
  owner: Owner | null;
  deadline: Deadline | null;
  /** Earlier deadlines, oldest first. */
  previousDeadlines: Deadline[];
  events: ItemEvent[];
  flags: ItemFlag[];
};

export type Speaker = {
  label: number;
  name: string | null;
  /** The verified self-introduction. */
  evidence: Evidence | null;
};

export type Clarification =
  | { type: "speaker_names"; labels: number[] }
  | { type: "speaker_count"; detected: number };

/** Model output that could not be verified against the transcript. */
export type DroppedEvidence = {
  item: string;
  type: EventType | "speaker_name" | "owner";
  utteranceId: string;
  quote: string;
  reason: string;
};

export type Commitments = {
  speakers: Speaker[];
  items: Item[];
  clarifications: Clarification[];
  dropped: DroppedEvidence[];
};
