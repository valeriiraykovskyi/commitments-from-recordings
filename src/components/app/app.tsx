"use client";

import { cn } from "cn";
import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import { processRecording, type ProcessInput } from "@/lib/client/process";
import { checkRecordingFile, readDuration } from "@/lib/client/recording";
import { uploadRecording } from "@/lib/client/upload";
import { useSegmentPlayer } from "@/lib/client/use-segment-player";
import { MAX_DURATION_SEC, SAMPLES, tooLongMessage, type SampleId } from "@/lib/limits";
import type { PipelineEvent, TranscriptView } from "@/lib/pipeline/types";

import { MetricsPanel } from "./metrics-panel";
import { Notice } from "./notice";
import { RecordingPicker } from "./recording-picker";
import { ResultsView } from "./results";
import { isBusy, type Marks, type Phase, type Source } from "./session";
import { SessionHeader } from "./session-header";
import { TranscriptPanel } from "./transcript-panel";

type Session = {
  source: Source;
  phase: Phase;
  transcript: TranscriptView | null;
  durationSec: number | null;
  marks: Marks;
};

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  // Each run gets a number; events from an abandoned run are ignored.
  const runRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const player = useSegmentPlayer(session?.source.url ?? null);

  function reset() {
    runRef.current += 1;
    abortRef.current?.abort();
    player.stop();
    if (session?.source.kind === "file") URL.revokeObjectURL(session.source.url);
    setSession(null);
  }

  async function start(source: Source) {
    const runId = ++runRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    player.stop();
    setSession({
      source,
      phase: { kind: "preparing" },
      transcript: null,
      durationSec: null,
      marks: { started: performance.now() },
    });

    const live = () => runRef.current === runId;
    const update = (change: (current: Session) => Session) => {
      if (live()) setSession((current) => (current ? change(current) : current));
    };
    const finish = (phase: Phase) =>
      update((current) => ({
        ...current,
        phase,
        marks: { ...current.marks, finished: performance.now() },
      }));
    const onEvent = (event: PipelineEvent) => {
      if (event.type === "stage") {
        update((current) => ({
          ...current,
          phase: { kind: "processing", stage: event.stage },
          marks: {
            ...current.marks,
            [event.stage]: current.marks[event.stage] ?? performance.now(),
          },
        }));
      } else if (event.type === "transcript") {
        update((current) => ({
          ...current,
          transcript: event.transcript,
          durationSec: event.transcript.durationSec,
          marks: { ...current.marks, transcript: performance.now() },
        }));
      }
    };

    try {
      let input: ProcessInput;
      if (source.kind === "file") {
        const check = checkRecordingFile(source.file);
        if (!check.ok) return finish({ kind: "refused", message: check.message });
        const duration = await readDuration(source.url);
        if (!live()) return;
        update((current) => ({ ...current, durationSec: duration }));
        if (duration !== null && duration > MAX_DURATION_SEC) {
          return finish({ kind: "refused", message: tooLongMessage(duration) });
        }
        update((current) => ({
          ...current,
          phase: { kind: "uploading", fraction: 0 },
          marks: { ...current.marks, uploading: performance.now() },
        }));
        const pathname = await uploadRecording(
          source.file,
          check.pathname,
          check.contentType,
          (fraction) =>
            update((current) =>
              current.phase.kind === "uploading"
                ? { ...current, phase: { kind: "uploading", fraction } }
                : current,
            ),
        );
        if (!live()) return;
        input = { upload: pathname, durationSec: duration ?? undefined };
      } else {
        input = { sample: source.id };
      }

      update((current) => ({
        ...current,
        phase: { kind: "processing", stage: "checking" },
        marks: { ...current.marks, checking: performance.now() },
      }));
      const result = await processRecording(input, onEvent, controller.signal);
      if (!live()) return;
      update((current) => ({
        ...current,
        phase: { kind: "finished", result },
        transcript: result.transcript ?? current.transcript,
        durationSec: result.metrics.audioSec ?? current.durationSec,
        marks: { ...current.marks, finished: performance.now() },
      }));
    } catch (error) {
      if (!live() || controller.signal.aborted) return;
      finish({
        kind: "failed",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  }

  if (!session) {
    return (
      <RecordingPicker
        onFile={(file) =>
          start({ kind: "file", file, name: file.name, url: URL.createObjectURL(file) })
        }
        onSample={(id: SampleId) => {
          const sample = SAMPLES.find((entry) => entry.id === id);
          if (sample) start({ kind: "sample", id, label: sample.label, url: `/samples/${id}.wav` });
        }}
      />
    );
  }

  const { source, phase, transcript } = session;
  const result = phase.kind === "finished" ? phase.result : null;
  const commitments = result?.outcome === "ok" ? result.commitments : null;
  const upload = source.kind === "file";

  return (
    <div className="flex flex-col gap-6">
      <SessionHeader
        source={source}
        phase={phase}
        marks={session.marks}
        durationSec={session.durationSec}
        onReset={reset}
      />

      {phase.kind === "refused" && (
        <Notice
          tone="neutral"
          title="Not processed"
          action={{ label: "Choose another recording", onClick: reset }}
        >
          {phase.message} Nothing was uploaded and no request was made.
        </Notice>
      )}
      {phase.kind === "failed" && (
        <Notice
          tone="error"
          title="Something went wrong"
          action={{ label: "Try again", onClick: () => start(source) }}
        >
          {phase.message}
        </Notice>
      )}
      {result?.outcome === "declined" && (
        <Notice
          tone="neutral"
          title="Not processed"
          action={{ label: "Choose another recording", onClick: reset }}
        >
          {result.message}
        </Notice>
      )}
      {result?.outcome === "failed" && (
        <Notice
          tone="error"
          title="Processing failed"
          action={{ label: "Try again", onClick: () => start(source) }}
        >
          {result.message}
        </Notice>
      )}

      <div className={cn("grid gap-6", transcript && "lg:grid-cols-[minmax(0,1fr)_360px]")}>
        <div className="flex min-w-0 flex-col gap-6">
          {isBusy(phase) && <Working phase={phase} />}
          {commitments && <ResultsView commitments={commitments} player={player} />}
          {result && <MetricsPanel metrics={result.metrics} marks={session.marks} upload={upload} />}
        </div>
        {transcript && (
          <TranscriptPanel
            transcript={transcript}
            speakers={commitments?.speakers ?? null}
            player={player}
          />
        )}
      </div>
    </div>
  );
}

const WORKING_TEXT = {
  preparing: "Checking the file in your browser…",
  uploading: "Uploading to temporary storage…",
  checking: "Checking the duration before any paid call…",
  transcribing: "Transcribing, with speaker separation…",
  extracting:
    "Reading the discussion. The model lists every proposal, acceptance, deadline and cancellation with a quote; then code decides the final state.",
  verifying: "Checking every quote against the transcript…",
};

function Working({ phase }: { phase: Phase }) {
  const text =
    phase.kind === "processing" ? WORKING_TEXT[phase.stage] : WORKING_TEXT[phase.kind as "preparing" | "uploading"];
  return (
    <div className="border border-border bg-card p-5" aria-live="polite">
      <div className="flex items-start gap-3">
        <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
        <p className="text-sm text-pretty">{text}</p>
      </div>
      <div className="mt-5 flex flex-col gap-3" aria-hidden>
        {[1, 0.7, 0.4].map((opacity) => (
          <div
            key={opacity}
            className="h-14 animate-pulse bg-muted"
            style={{ opacity }}
          />
        ))}
      </div>
    </div>
  );
}
