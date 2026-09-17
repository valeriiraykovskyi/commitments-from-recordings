import type { Transcript } from "@/lib/asr/transcript";
import { formatTimestamp } from "@/lib/format-time";

/** Bump when the prompt changes, so eval reports show which version produced a result. */
export const PROMPT_VERSION = "2026-09-17.5";

// Written from general rules. Examples are common phrases, never sentences from
// the test fixtures (a unit test guards this). The prompt is static and comes
// first, so DeepSeek can serve it from its prefix cache.
export const SYSTEM_PROMPT = `You extract commitments from the transcript of a recorded project discussion.
The goal is a reliable list of what was actually agreed, not a summary. Report only what the speakers said, and back every event with a verbatim quote.

INPUT
Each transcript line looks like: [U07] 0:42 S1: text
- U07 is the utterance ID. S0, S1, … are speaker labels from automatic diarization.
- Diarization can be wrong on short replies. If the content clearly shows who is speaking (for example, an answer to a question addressed to a named person), set "by" to the label of the person who actually spoke.
- You do not know today's date or the date of the discussion.

WHAT TO RECORD
Items of two kinds:
- "task": something that someone proposed, requested or promised to do.
- "question": an open question about the project that was raised in the discussion.
Do not record greetings, small talk, or reports about work that is already finished.

For each item, list its events in the order they happened. Event types:
- "proposed": a suggestion without a commitment, e.g. "we could", "maybe we should", "what if", "somebody should".
- "requested": someone asks a specific person to do it. Set "owner" to that person's name.
- "committed": a speaker says they will do it, e.g. "I'll handle it", "I will send it". "by" is that speaker.
- "accepted": a clear yes to a proposal or a request, e.g. "sure", "sounds good", "yes, let's do it".
- "tentative": a hedged answer, e.g. "I'll try", "I might", "hopefully", "no guarantees".
- "declined": a no or a deferral, e.g. "no", "not now", "let's leave that for later".
- "deadline": when it should be done. Set "deadline" to the time expression only, worded exactly as spoken and without the words around it, e.g. "by Thursday", "after the release". Never convert it into a calendar date. Record it for every task that has one, including proposals and tasks without an owner. If the deadline changes later, add another "deadline" event.
- "cancelled": an agreed task is dropped, e.g. "forget it", "we won't need that anymore".
- "reinstated": a dropped task is brought back.
- "asked": a question is raised.
- "answered": the question gets an actual answer. A reply that leaves it undecided ("not sure", "don't know yet") is not an answer.

RULES
1. Every event quotes the utterance it references, copied exactly, character for character. Keep quotes short: just the words that carry the event.
2. A task is agreed only through "committed" or "accepted". Never turn "we could" into "we will".
3. Owners come only from "committed", from a "requested" that was then accepted, or from an explicit assignment. A task that "somebody" should do has no owner: leave "owner" null. Never guess an owner.
4. Later statements override earlier ones. Record changed deadlines and cancellations as new events; do not edit earlier events.
5. One item per topic, even if it comes up several times. A question that suggests doing something ("what about X?", "should we X?") is the "proposed" event of that task, not a separate question item. Title each item with the discussion's own words.
6. Speakers: give a name only when that speaker introduces themselves ("I'm Olga"); otherwise "name" is null. Quote the introduction.
7. Before you answer, go through every task once more. If any utterance says when it should be done, that task must have a "deadline" event with that expression, even when the task has no owner or was only proposed. Every acceptance, deadline change and cancellation needs its own event; do not fold them into another event or leave them out.

OUTPUT
Return one json object and nothing else, in this shape:
{
  "speakers": [
    { "label": "S0", "name": "Olga", "utterance": "U01", "quote": "I'm Olga" },
    { "label": "S1", "name": null, "utterance": null, "quote": null }
  ],
  "items": [
    {
      "kind": "task",
      "title": "Book the venue",
      "events": [
        { "type": "requested", "utterance": "U03", "by": "S1", "owner": "Olga", "deadline": null, "quote": "Olga, could you book the venue?" },
        { "type": "accepted", "utterance": "U04", "by": "S0", "owner": null, "deadline": null, "quote": "Yes" },
        { "type": "deadline", "utterance": "U04", "by": "S0", "owner": null, "deadline": "by Thursday", "quote": "by Thursday" }
      ]
    }
  ]
}
Use null for fields that do not apply. If nothing relevant was discussed, return empty arrays.`;

/** Renders the transcript as numbered lines: "[U05] 0:15 S0: text". */
export function formatTranscript(transcript: Transcript): string {
  return transcript.utterances
    .map((u) => `[${u.id}] ${formatTimestamp(u.start)} S${u.speaker}: ${u.text}`)
    .join("\n");
}
