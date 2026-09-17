import type { Metrics } from "@/lib/pipeline/types";

/** One item of a result, enough to audit a run without the full evidence. */
export type ItemSummary = {
  title: string;
  kind: string;
  status: string;
  owner: string | null;
  deadline: string | null;
  flags: string[];
  events: { type: string; start: number; end: number }[];
};

export type EvalRun = {
  fixture: string;
  run: number;
  outcome: "ok" | "declined" | "failed";
  /** The decline reason or the failure message. */
  reason: string | null;
  passed: boolean;
  failures: string[];
  warnings: string[];
  metrics: Metrics;
  speakers: { label: number; name: string | null }[];
  clarifications: string[];
  items: ItemSummary[];
};

export type EvalConfig = {
  asrModel: string;
  diarizer: string;
  llmModel: string;
  thinking: boolean;
  reasoningEffort: string;
  promptVersion: string;
  runsPerFixture: number;
};

export type Spread = { median: number; worst: number };

export type FixtureSummary = {
  fixture: string;
  runs: number;
  passed: number;
  outcomes: string[];
  totalMs: Spread;
  llmMs: Spread;
  llmAttempts: Spread;
  operationUsd: Spread;
  operationPeakUsd: Spread;
  perAudioMinuteUsd: number | null;
  failures: string[];
  warnings: string[];
};

export type EvalReport = {
  label: string;
  createdAt: string;
  git: { sha: string; dirty: boolean };
  config: EvalConfig;
  summary: { runs: number; passed: number };
  fixtures: FixtureSummary[];
  runs: EvalRun[];
};

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError("median of no values");
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const spread = (values: number[]): Spread => ({ median: median(values), worst: Math.max(...values) });

export function summarizeFixture(fixture: string, runs: readonly EvalRun[]): FixtureSummary {
  const own = runs.filter((run) => run.fixture === fixture);
  if (own.length === 0) throw new RangeError(`no runs for ${fixture}`);
  const perMinute = own
    .map((run) => run.metrics.cost.perAudioMinuteUsd)
    .filter((value): value is number => value !== null);
  return {
    fixture,
    runs: own.length,
    passed: own.filter((run) => run.passed).length,
    outcomes: [
      ...new Set(
        own.map((run) =>
          run.outcome === "ok" || run.reason === null ? run.outcome : `${run.outcome} (${run.reason})`,
        ),
      ),
    ],
    totalMs: spread(own.map((run) => run.metrics.timings.totalMs)),
    llmMs: spread(own.map((run) => run.metrics.timings.llmMs)),
    llmAttempts: spread(own.map((run) => run.metrics.calls.llm)),
    operationUsd: spread(own.map((run) => run.metrics.cost.operationUsd)),
    operationPeakUsd: spread(own.map((run) => run.metrics.cost.operationPeakUsd)),
    perAudioMinuteUsd: perMinute.length > 0 ? median(perMinute) : null,
    failures: own.flatMap((run) => run.failures.map((text) => `run ${run.run}: ${text}`)),
    warnings: own.flatMap((run) => run.warnings.map((text) => `run ${run.run}: ${text}`)),
  };
}

export function buildReport(input: {
  label: string;
  createdAt: string;
  git: { sha: string; dirty: boolean };
  config: EvalConfig;
  runs: EvalRun[];
}): EvalReport {
  const fixtures = [...new Set(input.runs.map((run) => run.fixture))].map((fixture) =>
    summarizeFixture(fixture, input.runs),
  );
  return {
    ...input,
    summary: { runs: input.runs.length, passed: input.runs.filter((run) => run.passed).length },
    fixtures,
  };
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const usd = (value: number) => `$${value.toFixed(4)}`;
const both = (value: Spread, format: (n: number) => string) =>
  `${format(value.median)} / ${format(value.worst)}`;

function tokens(metrics: Metrics): string {
  const attempts = metrics.llm?.attempts ?? [];
  if (attempts.length === 0) return "—";
  const sum = (pick: (usage: NonNullable<(typeof attempts)[number]["usage"]>) => number) =>
    attempts.reduce((total, attempt) => total + (attempt.usage ? pick(attempt.usage) : 0), 0);
  const cached = sum((usage) => usage.cacheHitTokens);
  const input = cached + sum((usage) => usage.cacheMissTokens);
  return `${input} (${cached}) / ${sum((usage) => usage.outputTokens)} (${sum((usage) => usage.reasoningTokens)})`;
}

export function renderMarkdown(report: EvalReport): string {
  const { config } = report;
  const lines: string[] = [];
  lines.push(`# Eval — ${report.label}`, "");
  lines.push(
    `Created ${report.createdAt}. Git \`${report.git.sha}\`${report.git.dirty ? " (with uncommitted changes)" : ""}. Prompt ${config.promptVersion}.`,
    `Recognition: Deepgram ${config.asrModel}, diarizer ${config.diarizer}. Model: DeepSeek ${config.llmModel}, thinking ${config.thinking ? "on" : "off"}${config.thinking ? `, effort ${config.reasoningEffort}` : ""}. ${config.runsPerFixture} runs per fixture, one after another, with real API calls.`,
    "Costs are list prices at the DeepSeek tariff in force during each run; \"at peak\" is the same run at the peak tariff. Free credits are not subtracted. Hosting is not included.",
    "",
    `**${report.summary.passed} of ${report.summary.runs} runs passed.** A run passes when every expected item is found with the right status, owner, deadline wording and flags, nothing outside the expected list is agreed, and every quote falls on the expected lines.`,
    "",
    "## Summary",
    "",
    "| Fixture | Passed | Outcome | Result after (median / worst) | Model (median / worst) | Model attempts (median / worst) | Cost per run (median / worst) | At peak (median) | Per audio minute (median) |",
    "|---|---|---|---|---|---|---|---|---|",
  );
  for (const fixture of report.fixtures) {
    lines.push(
      `| ${fixture.fixture} | ${fixture.passed}/${fixture.runs} | ${fixture.outcomes.join(", ")} | ${both(fixture.totalMs, seconds)} | ${both(fixture.llmMs, seconds)} | ${fixture.llmAttempts.median} / ${fixture.llmAttempts.worst} | ${both(fixture.operationUsd, usd)} | ${usd(fixture.operationPeakUsd.median)} | ${fixture.perAudioMinuteUsd === null ? "—" : usd(fixture.perAudioMinuteUsd)} |`,
    );
  }

  const failures = report.fixtures.flatMap((fixture) =>
    fixture.failures.map((text) => `- ${fixture.fixture}, ${text}`),
  );
  const warnings = report.fixtures.flatMap((fixture) =>
    fixture.warnings.map((text) => `- ${fixture.fixture}, ${text}`),
  );
  lines.push("", "## Failures", "", ...(failures.length > 0 ? failures : ["None."]));
  lines.push(
    "",
    "## Warnings",
    "",
    "Soft checks: evidence outside the expected lines, missing deadline history, or model claims that were dropped because they could not be verified.",
    "",
    ...(warnings.length > 0 ? warnings : ["None."]),
  );

  lines.push(
    "",
    "## Runs",
    "",
    "| Fixture | Run | Passed | Outcome | Total | Recognition | Model | Attempts | Tokens in (cached) / out (reasoning) | Cost (off-peak / at peak) |",
    "|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const run of report.runs) {
    const { timings, calls, cost } = run.metrics;
    lines.push(
      `| ${run.fixture} | ${run.run} | ${run.passed ? "yes" : "no"} | ${run.outcome}${run.reason && run.outcome !== "ok" ? ` (${run.reason})` : ""} | ${seconds(timings.totalMs)} | ${seconds(timings.asrMs)} | ${seconds(timings.llmMs)} | ${calls.llm} | ${tokens(run.metrics)} | ${usd(cost.operationUsd)} / ${usd(cost.operationPeakUsd)} |`,
    );
  }

  lines.push("", "## Results per run", "");
  for (const run of report.runs) {
    lines.push(`### ${run.fixture}, run ${run.run}: ${run.passed ? "pass" : "FAIL"}`, "");
    if (run.items.length === 0) {
      lines.push(`No items (${run.outcome}${run.reason ? `: ${run.reason}` : ""}).`, "");
      continue;
    }
    if (run.clarifications.length > 0) lines.push(`Clarifications: ${run.clarifications.join(", ")}.`, "");
    lines.push(
      `Speakers: ${run.speakers.map((speaker) => `S${speaker.label} = ${speaker.name ?? "unnamed"}`).join(", ")}.`,
      "",
    );
    for (const item of run.items) {
      const details = [
        item.owner === null ? null : `owner ${item.owner}`,
        item.deadline === null ? null : `deadline "${item.deadline}"`,
        item.flags.length > 0 ? `flags ${item.flags.join(", ")}` : null,
      ].filter((text) => text !== null);
      const evidence = item.events
        .map((event) => `${event.type} @ ${event.start.toFixed(1)}–${event.end.toFixed(1)} s`)
        .join(", ");
      lines.push(
        `- [${item.kind}/${item.status}] ${item.title}${details.length > 0 ? ` — ${details.join(", ")}` : ""} — ${evidence}`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}
