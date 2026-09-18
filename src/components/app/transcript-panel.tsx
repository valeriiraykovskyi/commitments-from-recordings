"use client";

import { cn } from "cn";

import { isSameSegment, type SegmentPlayer } from "@/lib/client/use-segment-player";
import type { Speaker } from "@/lib/commitments/types";
import { formatTimestamp } from "@/lib/format-time";
import type { TranscriptView } from "@/lib/pipeline/types";

import { speakerName, speakerStyle } from "./speakers";

/** The full transcript; it appears before the result, and every line can be played. */
export function TranscriptPanel({
  transcript,
  speakers,
  player,
}: {
  transcript: TranscriptView;
  speakers: readonly Speaker[] | null;
  player: SegmentPlayer;
}) {
  return (
    <aside className="flex flex-col overflow-hidden border border-border bg-card lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-4 py-3">
        <div>
          <p className="font-heading text-sm font-semibold text-ink uppercase">Transcript</p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(transcript.durationSec)} · click a line to listen
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {transcript.speakers.map((label) => (
            <li key={label} className="flex items-center gap-1.5 text-xs">
              <span className={cn("size-2 rounded-full", speakerStyle(label).dot)} />
              {speakerName(speakers, label)}
            </li>
          ))}
        </ul>
      </div>
      <ol className="min-h-0 flex-1 overflow-y-auto p-2">
        {transcript.utterances.map((utterance) => {
          const segment = { start: utterance.start, end: utterance.end };
          const style = speakerStyle(utterance.speaker);
          const highlighted =
            isSameSegment(player.active, segment) ||
            (player.position !== null &&
              player.position >= utterance.start &&
              player.position < utterance.end);
          return (
            <li key={utterance.id}>
              <button
                type="button"
                onClick={() => player.play(segment)}
                className={cn(
                  "w-full border-l-[3px] border-transparent px-2 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  highlighted ? "border-brand bg-brand-mint" : "hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs">
                  <span className={cn("size-1.5 rounded-full", style.dot)} />
                  <span className={cn("font-heading font-semibold", style.text)}>
                    {speakerName(speakers, utterance.speaker)}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {formatTimestamp(utterance.start)}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed">{utterance.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
