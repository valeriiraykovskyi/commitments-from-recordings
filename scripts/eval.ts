/**
 * Runs the fixtures through the real pipeline (Deepgram, then DeepSeek) and
 * checks every result against fixtures/<id>/expected.json: inclusion,
 * exclusion, and evidence timestamps. Writes eval/<label>.md and
 * eval/<label>.json, and exits with code 1 when any run fails.
 *
 * Usage: npm run eval -- [--runs 3] [--fixture <id>]... [--label <name>]
 *          [--model deepseek-flash|deepseek-v4-pro] [--effort low|high|max] [--no-thinking]
 */
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import nextEnv from "@next/env";

import { ASR_DIARIZER, ASR_MODEL } from "@/lib/asr/deepgram";
import type { Commitments } from "@/lib/commitments/types";
import { DEFAULT_LLM_CONFIG, type LlmConfig } from "@/lib/extraction/deepseek";
import { PROMPT_VERSION } from "@/lib/extraction/prompt";
import { SAMPLES } from "@/lib/limits";
import { runPipeline } from "@/lib/pipeline/run";
import type { PipelineResult } from "@/lib/pipeline/types";

import { compareWithExpected, type Expected, type Timeline } from "./lib/compare";
import { buildReport, renderMarkdown, type EvalRun, type ItemSummary } from "./lib/eval-report";

const MODELS: LlmConfig["model"][] = ["deepseek-flash", "deepseek-v4-pro"];
const EFFORTS: LlmConfig["reasoningEffort"][] = ["low", "high", "max"];
const FIXTURES = SAMPLES.map((sample) => sample.id);

function oneOf<T extends string>(value: string, allowed: readonly T[], flag: string): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`--${flag} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

function gitState(): { sha: string; dirty: boolean } {
  const git = (command: string) => execSync(`git ${command}`, { encoding: "utf8" }).trim();
  return { sha: git("rev-parse --short HEAD"), dirty: git("status --porcelain").length > 0 };
}

function summarizeItems(commitments: Commitments): ItemSummary[] {
  return commitments.items.map((item) => ({
    title: item.title,
    kind: item.kind,
    status: item.status,
    owner: item.owner ? (item.owner.name ?? `S${item.owner.speaker}`) : null,
    deadline: item.deadline?.text ?? null,
    flags: item.flags,
    events: item.events.map((event) => ({
      type: event.type,
      start: event.evidence.start,
      end: event.evidence.end,
    })),
  }));
}

function toEvalRun(
  fixture: string,
  run: number,
  result: PipelineResult,
  expected: Expected,
  timeline: Timeline,
): EvalRun {
  const base = { fixture, run, metrics: result.metrics };
  if (result.outcome === "failed") {
    return {
      ...base,
      outcome: "failed",
      reason: result.message,
      passed: false,
      failures: [`pipeline failed: ${result.message}`],
      warnings: [],
      speakers: [],
      clarifications: [],
      items: [],
    };
  }
  const commitments = result.outcome === "ok" ? result.commitments : null;
  const comparison = compareWithExpected(
    expected,
    {
      outcome: result.outcome,
      declineReason: result.outcome === "declined" ? result.reason : null,
      calls: result.metrics.calls,
      commitments,
    },
    timeline,
  );
  return {
    ...base,
    outcome: result.outcome,
    reason: result.outcome === "declined" ? result.reason : null,
    passed: comparison.passed,
    failures: comparison.failures,
    warnings: comparison.warnings,
    speakers: commitments?.speakers.map(({ label, name }) => ({ label, name })) ?? [],
    clarifications: commitments?.clarifications.map((entry) => entry.type) ?? [],
    items: commitments ? summarizeItems(commitments) : [],
  };
}

async function main() {
  nextEnv.loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });
  const { values } = parseArgs({
    options: {
      runs: { type: "string", default: "3" },
      fixture: { type: "string", multiple: true },
      label: { type: "string" },
      model: { type: "string", default: DEFAULT_LLM_CONFIG.model },
      effort: { type: "string", default: DEFAULT_LLM_CONFIG.reasoningEffort },
      "no-thinking": { type: "boolean", default: false },
    },
  });
  const runsPerFixture = Number(values.runs);
  if (!Number.isInteger(runsPerFixture) || runsPerFixture < 1) {
    throw new Error("--runs must be a positive integer");
  }
  const fixtures = values.fixture?.length
    ? values.fixture.map((id) => oneOf(id, FIXTURES, "fixture"))
    : FIXTURES;
  const config: LlmConfig = {
    ...DEFAULT_LLM_CONFIG,
    model: oneOf(values.model, MODELS, "model"),
    reasoningEffort: oneOf(values.effort, EFFORTS, "effort"),
    thinking: !values["no-thinking"],
  };
  const label =
    values.label ?? `${config.model}-${config.thinking ? config.reasoningEffort : "no-thinking"}`;
  const git = gitState();

  console.log(
    `Eval "${label}": ${fixtures.length} fixtures × ${runsPerFixture} runs; ${config.model}, thinking ${config.thinking ? `on, effort ${config.reasoningEffort}` : "off"}; git ${git.sha}${git.dirty ? " (dirty)" : ""}\n`,
  );

  const runs: EvalRun[] = [];
  for (const id of fixtures) {
    const dir = path.join("fixtures", id);
    const expected = JSON.parse(await readFile(path.join(dir, "expected.json"), "utf8")) as Expected;
    const timeline = JSON.parse(await readFile(path.join(dir, "timeline.json"), "utf8")) as Timeline;
    const audio = await readFile(path.join("public", "samples", `${id}.wav`));

    for (let run = 1; run <= runsPerFixture; run++) {
      const result = await runPipeline(audio, {
        tag: "eval",
        mimeType: "audio/wav",
        llmConfig: config,
        logFailure: (stage, detail) => console.error(`  ${stage} failed: ${detail}`),
      });
      const evalRun = toEvalRun(id, run, result, expected, timeline);
      runs.push(evalRun);
      const { timings, calls, cost } = evalRun.metrics;
      console.log(
        `${id} #${run}: ${evalRun.passed ? "PASS" : "FAIL"} · ${evalRun.outcome}${evalRun.reason ? ` (${evalRun.reason})` : ""} · ${(timings.totalMs / 1000).toFixed(1)} s (model ${(timings.llmMs / 1000).toFixed(1)} s, ${calls.llm} attempt${calls.llm === 1 ? "" : "s"}) · $${cost.operationUsd.toFixed(4)}`,
      );
      for (const failure of evalRun.failures) console.log(`    failure: ${failure}`);
      for (const warning of evalRun.warnings) console.log(`    warning: ${warning}`);
    }
  }

  const report = buildReport({
    label,
    createdAt: new Date().toISOString(),
    git,
    config: {
      asrModel: ASR_MODEL,
      diarizer: ASR_DIARIZER,
      llmModel: config.model,
      thinking: config.thinking,
      reasoningEffort: config.reasoningEffort,
      promptVersion: PROMPT_VERSION,
      runsPerFixture,
    },
    runs,
  });
  await mkdir("eval", { recursive: true });
  await writeFile(path.join("eval", `${label}.md`), renderMarkdown(report));
  await writeFile(path.join("eval", `${label}.json`), `${JSON.stringify(report, null, 2)}\n`);

  const totalUsd = runs.reduce((sum, run) => sum + run.metrics.cost.operationUsd, 0);
  console.log(
    `\n${report.summary.passed} of ${report.summary.runs} runs passed. Total cost $${totalUsd.toFixed(4)} at list prices. Report: eval/${label}.md`,
  );
  if (report.summary.passed < report.summary.runs) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
