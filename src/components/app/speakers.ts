import type { Speaker } from "@/lib/commitments/types";

export type SpeakerStyle = { dot: string; text: string };

const STYLES: SpeakerStyle[] = [
  { dot: "bg-indigo-500", text: "text-indigo-700" },
  { dot: "bg-teal-600", text: "text-teal-700" },
];
const FALLBACK: SpeakerStyle = { dot: "bg-neutral-400", text: "text-neutral-600" };

export const speakerStyle = (label: number): SpeakerStyle => STYLES[label] ?? FALLBACK;

/** The verified name, or a neutral label when the speaker never introduced themselves. */
export function speakerName(
  speakers: readonly Speaker[] | null | undefined,
  label: number,
): string {
  return speakers?.find((speaker) => speaker.label === label)?.name ?? `Speaker ${label + 1}`;
}
