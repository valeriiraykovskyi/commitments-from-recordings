import { cn } from "cn";
import type { ReactNode } from "react";

import { formatDuration as duration } from "@/lib/format-time";
import type { Metrics } from "@/lib/pipeline/types";

import type { Marks } from "./session";

type Row = { label: string; value: string; strong?: boolean };

const usd = (value: number) => (value === 0 ? "$0" : `$${value.toFixed(4)}`);
const attempts = (count: number) => (count > 1 ? ` (${count} attempts)` : "");

/** Time and variable cost of one run, as the brief asks: measured, not promised. */
export function MetricsPanel({
  metrics,
  marks,
  upload,
}: {
  metrics: Metrics;
  marks: Marks;
  upload: boolean;
}) {
  const { timings, calls, cost, asr, llm } = metrics;

  const browser: Row[] = [];
  if (upload && marks.uploading !== undefined && marks.checking !== undefined) {
    browser.push({ label: "Upload", value: duration(marks.checking - marks.uploading) });
  }
  if (marks.transcript !== undefined) {
    browser.push({ label: "Transcript shown", value: duration(marks.transcript - marks.started) });
  }
  if (marks.finished !== undefined) {
    browser.push({
      label: "Result shown",
      value: duration(marks.finished - marks.started),
      strong: true,
    });
  }

  const server: Row[] = [
    ...(upload ? [{ label: "Read from storage", value: duration(timings.fetchMs) }] : []),
    { label: "Duration check", value: duration(timings.probeMs) },
    { label: "Recognition", value: duration(timings.asrMs) + attempts(calls.asr) },
    { label: "Model", value: duration(timings.llmMs) + attempts(calls.llm) },
    { label: "Verification", value: duration(timings.verifyMs) },
    { label: "Total", value: duration(timings.totalMs), strong: true },
  ];

  const costs: Row[] = [
    { label: "Recognition", value: usd(cost.recognitionUsd) },
    { label: "Reasoning", value: usd(cost.reasoningUsd) },
    { label: "Retries", value: usd(cost.retriesUsd) },
    { label: "Speech", value: usd(cost.speechUsd) },
    { label: "Intermediaries", value: usd(cost.intermediariesUsd) },
    { label: "This operation", value: usd(cost.operationUsd), strong: true },
    { label: "At peak tariff", value: usd(cost.operationPeakUsd) },
    ...(cost.perAudioMinuteUsd !== null
      ? [{ label: "Per audio minute", value: usd(cost.perAudioMinuteUsd) }]
      : []),
    { label: "Hosting (Blob)", value: usd(cost.hostingUsd) },
  ];

  const usage = llm?.attempts.reduce(
    (total, attempt) => ({
      input: total.input + (attempt.usage?.cacheHitTokens ?? 0) + (attempt.usage?.cacheMissTokens ?? 0),
      cached: total.cached + (attempt.usage?.cacheHitTokens ?? 0),
      output: total.output + (attempt.usage?.outputTokens ?? 0),
      reasoning: total.reasoning + (attempt.usage?.reasoningTokens ?? 0),
    }),
    { input: 0, cached: 0, output: 0, reasoning: 0 },
  );

  return (
    <section className="border border-border bg-card">
      <div className="px-4 pt-4">
        <h2 className="font-heading text-[19px] leading-none font-semibold tracking-[0.01em] text-ink uppercase">
          Measurements
        </h2>
        <p className="text-sm text-muted-foreground">
          This run, at list prices. Free credits are not subtracted; hosting is shown separately.
        </p>
      </div>
      <div className="grid gap-6 p-4 sm:grid-cols-3">
        <Block title="In your browser" rows={browser} />
        <Block title="On the server" rows={server} />
        <Block title={`Cost · ${cost.tariff === "peak" ? "peak" : "off-peak"} tariff`} rows={costs} />
      </div>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {asr && `Recognition: Deepgram ${asr.model}, diarizer ${asr.diarizer}.`}{" "}
        {llm &&
          `Model: DeepSeek ${llm.model}, thinking ${llm.thinking ? "on" : "off"}, effort ${llm.reasoningEffort}, prompt ${llm.promptVersion}.`}{" "}
        {usage &&
          `Tokens: ${usage.input.toLocaleString("en")} in (${usage.cached.toLocaleString("en")} cached), ${usage.output.toLocaleString("en")} out (${usage.reasoning.toLocaleString("en")} reasoning).`}
        {!llm && "No model call was made."}
      </p>
    </section>
  );
}

function Block({ title, rows }: { title: ReactNode; rows: Row[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      <dl className="mt-2 flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-3 text-sm",
              row.strong && "font-medium",
            )}
          >
            <dt className={cn(!row.strong && "text-muted-foreground")}>{row.label}</dt>
            <dd className="font-mono text-xs tabular-nums sm:text-sm">{row.value}</dd>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
      </dl>
    </div>
  );
}
