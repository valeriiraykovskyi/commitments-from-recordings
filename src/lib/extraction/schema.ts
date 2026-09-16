import { z } from "zod";

/** Event types the model may report. The final state is computed from them in code. */
export const EVENT_TYPES = [
  "proposed",
  "requested",
  "committed",
  "accepted",
  "tentative",
  "declined",
  "deadline",
  "cancelled",
  "reinstated",
  "asked",
  "answered",
] as const;

const speakerLabel = z.string().regex(/^S\d+$/, 'expected a speaker label like "S0"');
const utteranceId = z.string().regex(/^U\d{2,}$/, 'expected an utterance ID like "U01"');
const text = z.string().trim().min(1);

export const extractionEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  utterance: utteranceId,
  quote: text,
  by: speakerLabel.nullable(),
  owner: text.nullable().optional(),
  deadline: text.nullable().optional(),
});

export const extractionSchema = z.object({
  speakers: z.array(
    z.object({
      label: speakerLabel,
      name: text.nullable(),
      utterance: utteranceId.nullable(),
      quote: text.nullable(),
    }),
  ),
  items: z.array(
    z.object({
      kind: z.enum(["task", "question"]),
      title: text,
      events: z.array(extractionEventSchema).min(1),
    }),
  ),
});

export type Extraction = z.infer<typeof extractionSchema>;
export type ExtractionItem = Extraction["items"][number];
export type ExtractionEvent = z.infer<typeof extractionEventSchema>;
