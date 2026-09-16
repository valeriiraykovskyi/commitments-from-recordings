"use client";

import { cn } from "cn";
import { Pause, Play } from "lucide-react";

import { isSameSegment, type SegmentPlayer } from "@/lib/client/use-segment-player";
import type { Evidence, Speaker } from "@/lib/commitments/types";
import { formatTimestamp } from "@/lib/format-time";

import { speakerName, speakerStyle } from "./speakers";

/** A verbatim quote with its timestamp; clicking plays that part of the recording. */
export function EvidenceQuote({
  evidence,
  speakers,
  player,
  label,
}: {
  evidence: Evidence;
  speakers: readonly Speaker[] | null;
  player: SegmentPlayer;
  /** What this quote shows, e.g. "Accepted". */
  label?: string;
}) {
  const segment = { start: evidence.start, end: evidence.end };
  const playing = isSameSegment(player.active, segment);
  const style = speakerStyle(evidence.speaker);

  return (
    <button
      type="button"
      onClick={() => player.play(segment)}
      aria-pressed={playing}
      className={cn(
        "group/quote flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50",
        playing && "bg-muted",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground transition-colors group-hover/quote:bg-foreground group-hover/quote:text-background",
          playing && "bg-foreground text-background",
        )}
      >
        {playing ? (
          <Pause className="size-3 fill-current" />
        ) : (
          <Play className="size-3 translate-x-px fill-current" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-relaxed text-foreground/90">“{evidence.text}”</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span className={cn("font-medium", style.text)}>
            {speakerName(speakers, evidence.speaker)}
          </span>
          <span aria-hidden>·</span>
          <span className="font-mono tabular-nums">{formatTimestamp(evidence.start)}</span>
          {label && (
            <>
              <span aria-hidden>·</span>
              <span>{label}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}
