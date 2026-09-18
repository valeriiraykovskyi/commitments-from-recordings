"use client";

import { cn } from "cn";
import { Play, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { ACCEPT_ATTRIBUTE } from "@/lib/client/recording";
import { SAMPLES, type SampleId } from "@/lib/limits";

/** The start screen: drop a recording, or pick a bundled sample. */
export function RecordingPicker({
  onFile,
  onSample,
}: {
  onFile: (file: File) => void;
  onSample: (id: SampleId) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="flex max-w-2xl flex-col gap-3">
        <h1 className="font-heading text-[38px] leading-[1.15] font-semibold tracking-[-0.01em] text-ink uppercase text-balance">
          What was <span className="text-brand-strong">actually agreed</span>?
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
          Upload a short recording of a two-person discussion. You get the agreed tasks, owners
          and deadlines, plus the questions left open, each backed by a quote you can play.
          Nothing is inferred.
        </p>
      </section>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "group/drop flex flex-col items-center gap-3 border border-dashed border-input bg-card px-6 py-14 text-center transition-colors outline-none hover:border-brand hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
          dragging && "border-brand bg-brand-mint",
        )}
      >
        <span className="flex size-12 items-center justify-center bg-muted transition-colors group-hover/drop:bg-ink group-hover/drop:text-background">
          <Upload className="size-5" />
        </span>
        <span className="text-base font-medium">
          Drop a recording here, or{" "}
          <span className="text-brand-strong underline underline-offset-4">browse</span>
        </span>
        <span className="text-sm text-muted-foreground text-pretty">
          English · two speakers who introduce themselves · up to 3 minutes · MP3, WAV, M4A, WebM
          and more
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFile(file);
          }}
        />
      </button>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Or try a sample
          </h2>
          <p className="text-xs text-muted-foreground">
            Samples go through the same pipeline as an upload, live.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLES.map((sample) => (
            <li key={sample.id}>
              <button
                type="button"
                onClick={() => onSample(sample.id)}
                className="group/sample flex w-full items-start gap-3 border border-border bg-card p-4 text-left transition-colors outline-none hover:border-brand focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover/sample:bg-brand group-hover/sample:text-white">
                  <Play className="size-3 translate-x-px fill-current" />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-sm font-semibold text-ink">
                    {sample.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">{sample.note}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
