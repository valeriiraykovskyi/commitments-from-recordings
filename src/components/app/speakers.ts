import type { Speaker } from "@/lib/commitments/types";

export type SpeakerStyle = { dot: string; text: string };

const STYLES: SpeakerStyle[] = [
  { dot: "bg-open", text: "text-open" },
  { dot: "bg-ink", text: "text-ink" },
];
const FALLBACK: SpeakerStyle = { dot: "bg-inactive", text: "text-inactive" };

export const speakerStyle = (label: number): SpeakerStyle => STYLES[label] ?? FALLBACK;

/** The verified name, or a neutral label when the speaker never introduced themselves. */
export function speakerName(
  speakers: readonly Speaker[] | null | undefined,
  label: number,
): string {
  return speakers?.find((speaker) => speaker.label === label)?.name ?? `Speaker ${label + 1}`;
}
