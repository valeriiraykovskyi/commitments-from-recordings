"use client";

import { cn } from "cn";
import { Check, FileMusic, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatDuration, formatTimestamp } from "@/lib/format-time";
import type { Stage } from "@/lib/pipeline/types";

import { isBusy, type Marks, type Phase, type Source } from "./session";

const STAGE_TEXT: Record<Stage, string> = {
  checking: "Checking the file",
  transcribing: "Transcribing",
  extracting: "Reading the discussion",
  verifying: "Verifying quotes",
};

function statusText(phase: Phase): string {
  switch (phase.kind) {
    case "preparing":
      return "Checking the file";
    case "uploading":
      return `Uploading ${Math.round(phase.fraction * 100)}%`;
    case "processing":
      return STAGE_TEXT[phase.stage];
    case "finished":
      return phase.result.outcome === "ok"
        ? "Done"
        : phase.result.outcome === "declined"
          ? "Not processed"
          : "Failed";
    case "refused":
      return "Not processed";
    case "failed":
      return "Failed";
  }
}

const STEPS = [
  { key: "uploading", label: "Upload" },
  { key: "checking", label: "Check" },
  { key: "transcribing", label: "Transcribe" },
  { key: "extracting", label: "Extract" },
  { key: "verifying", label: "Verify" },
] as const;

type StepState = "pending" | "active" | "done" | "stopped" | "skipped";

/** What is being processed, and how far along each step is, with its time. */
export function SessionHeader({
  source,
  phase,
  marks,
  durationSec,
  onReset,
}: {
  source: Source;
  phase: Phase;
  marks: Marks;
  durationSec: number | null;
  onReset: () => void;
}) {
  const busy = isBusy(phase);
  const now = useNow(busy);
  const steps = source.kind === "file" ? STEPS : STEPS.slice(1);
  const ended = marks.finished !== undefined;

  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileMusic className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {source.kind === "sample" ? source.label : source.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {source.kind === "sample" ? "Bundled sample, processed live" : "Your upload"}
            {durationSec !== null && ` · ${formatTimestamp(durationSec)}`}
            {` · ${statusText(phase)}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          New recording
        </Button>
      </div>

      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-foreground/10 px-4 py-2.5">
        {steps.map((step, index) => {
          const start = marks[step.key];
          const next =
            steps
              .slice(index + 1)
              .map((later) => marks[later.key])
              .find((value) => value !== undefined) ?? marks.finished;
          const state: StepState =
            start === undefined
              ? ended
                ? "skipped"
                : "pending"
              : next !== undefined
                ? "done"
                : busy
                  ? "active"
                  : "stopped";
          const elapsed = start === undefined ? null : Math.max(0, (next ?? now) - start);
          const detail =
            step.key === "uploading" && phase.kind === "uploading"
              ? `${Math.round(phase.fraction * 100)}%`
              : elapsed !== null
                ? formatDuration(elapsed)
                : null;
          return (
            <li key={step.key} className="flex items-center gap-1.5">
              {index > 0 && <span className="mx-1 h-px w-4 bg-border" aria-hidden />}
              <StepIcon state={state} />
              <span
                className={cn(
                  "text-sm",
                  state === "pending" || state === "skipped"
                    ? "text-muted-foreground"
                    : "font-medium",
                )}
              >
                {step.label}
              </span>
              {detail && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{detail}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepIcon({ state }: { state: StepState }) {
  const base = "flex size-5 shrink-0 items-center justify-center rounded-full";
  switch (state) {
    case "done":
      return (
        <span className={cn(base, "bg-foreground text-background")}>
          <Check className="size-3" strokeWidth={3} />
        </span>
      );
    case "active":
      return (
        <span className={cn(base, "bg-muted")}>
          <LoaderCircle className="size-3.5 animate-spin" />
        </span>
      );
    case "stopped":
      return (
        <span className={cn(base, "bg-destructive/10 text-destructive")}>
          <X className="size-3" strokeWidth={3} />
        </span>
      );
    default:
      return <span className={cn(base, "ring-1 ring-foreground/15 ring-inset")} />;
  }
}

/** The current time, refreshed while something is running, for live timers. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}
