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
        "group/quote flex w-full items-start gap-3 border-l-[3px] border-transparent px-2 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        playing ? "border-brand bg-brand-mint" : "hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-ink transition-colors group-hover/quote:bg-brand group-hover/quote:text-white",
          playing && "bg-brand text-white",
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
          <span className={cn("font-heading font-semibold", style.text)}>
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
