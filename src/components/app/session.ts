import type { SampleId } from "@/lib/limits";
import type { PipelineResult, Stage } from "@/lib/pipeline/types";

export type Source =
  | { kind: "sample"; id: SampleId; label: string; url: string }
  | { kind: "file"; file: File; name: string; url: string };

export type Phase =
  /** Type, size and duration are being checked in the browser. */
  | { kind: "preparing" }
  | { kind: "uploading"; fraction: number }
  | { kind: "processing"; stage: Stage }
  | { kind: "finished"; result: PipelineResult }
  /** Rejected in the browser before any upload or request. */
  | { kind: "refused"; message: string }
  /** Upload or connection problem; the same recording can be tried again. */
  | { kind: "failed"; message: string };

/** Browser-side timestamps (`performance.now()`) of when each step began. */
export type Marks = {
  started: number;
  uploading?: number;
  checking?: number;
  transcribing?: number;
  extracting?: number;
  verifying?: number;
  transcript?: number;
  finished?: number;
};

export const isBusy = (phase: Phase): boolean =>
  phase.kind === "preparing" || phase.kind === "uploading" || phase.kind === "processing";
