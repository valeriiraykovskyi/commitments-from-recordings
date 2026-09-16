/**
 * Runs the extraction on a fixture's recorded transcript and prints the
 * model's events and the verified result. The transcript comes from
 * fixtures/<id>/asr-response.json (no ASR call); the DeepSeek call is real.
 * --save writes the model's answer to fixtures/<id>/llm-response.json, which
 * unit tests use.
 *
 * Usage: npm run extract -- <fixture-id>
 *          [--model deepseek-flash|deepseek-v4-pro] [--effort low|high|max]
 *          [--no-thinking] [--transcript] [--json] [--save]
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { loadEnvConfig } from "@next/env";

import { toTranscript } from "@/lib/asr/transcript";
import { buildCommitments } from "@/lib/commitments/build";
import { DEFAULT_LLM_CONFIG, type LlmConfig } from "@/lib/extraction/deepseek";
import { ExtractionError, extractCommitments } from "@/lib/extraction/extract";
import { formatTranscript } from "@/lib/extraction/prompt";

const MODELS: LlmConfig["model"][] = ["deepseek-flash", "deepseek-v4-pro"];
const EFFORTS: LlmConfig["reasoningEffort"][] = ["low", "high", "max"];

function oneOf<T extends string>(value: string, allowed: T[], flag: string): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`--${flag} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

async function main() {
  loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: "string", default: DEFAULT_LLM_CONFIG.model },
      effort: { type: "string", default: DEFAULT_LLM_CONFIG.reasoningEffort },
      "no-thinking": { type: "boolean", default: false },
      transcript: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      save: { type: "boolean", default: false },
    },
  });
  const [id] = positionals;
  if (!id) throw new Error("Usage: npm run extract -- <fixture-id> [options]");

  const config: LlmConfig = {
    ...DEFAULT_LLM_CONFIG,
    model: oneOf(values.model, MODELS, "model"),
    reasoningEffort: oneOf(values.effort, EFFORTS, "effort"),
    thinking: !values["no-thinking"],
  };
  const fixtureDir = path.join("fixtures", id);
  const response = JSON.parse(await readFile(path.join(fixtureDir, "asr-response.json"), "utf8"));
  const transcript = toTranscript(response);
  if (values.transcript) console.log(`${formatTranscript(transcript)}\n`);

  const result = await extractCommitments(transcript, config);

  if (values.json) {
    console.log(JSON.stringify(result.extraction, null, 2));
  } else {
    for (const speaker of result.extraction.speakers) {
      const evidence = speaker.quote ? `  ← ${speaker.utterance} "${speaker.quote}"` : "";
      console.log(`${speaker.label} = ${speaker.name ?? "(no name)"}${evidence}`);
    }
    for (const item of result.extraction.items) {
      console.log(`\n[${item.kind}] ${item.title}`);
      for (const event of item.events) {
        const details = [
          event.owner && `owner=${event.owner}`,
          event.deadline && `deadline="${event.deadline}"`,
        ].filter(Boolean);
        console.log(
          `  ${event.type.padEnd(10)} ${event.utterance} ${event.by ?? "--"}  ${details.join(" ")} "${event.quote}"`,
        );
      }
    }
  }

  const commitments = buildCommitments(transcript, result.extraction);
  console.log("\nVerified result:");
  for (const item of commitments.items) {
    const owner = item.owner ? (item.owner.name ?? `S${item.owner.speaker}`) : "-";
    const deadline = item.deadline ? `"${item.deadline.text}"` : "-";
    console.log(
      `  ${item.id} ${item.status.padEnd(18)} owner=${owner.padEnd(6)} deadline=${deadline.padEnd(20)} ${item.title}  [${item.flags.join(", ")}]`,
    );
  }
  for (const clarification of commitments.clarifications) {
    console.log(`  clarification: ${JSON.stringify(clarification)}`);
  }
  for (const dropped of commitments.dropped) {
    console.log(`  dropped ${dropped.type} (${dropped.item}): ${dropped.reason} "${dropped.quote}"`);
  }

  if (values.save) {
    const file = path.join(fixtureDir, "llm-response.json");
    const snapshot = {
      model: result.model,
      promptVersion: result.promptVersion,
      config,
      extraction: result.extraction,
    };
    await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`\nSaved ${file}`);
  }

  console.log(
    `\nmodel=${result.model} prompt=${result.promptVersion} thinking=${config.thinking} effort=${config.reasoningEffort}`,
  );
  console.table(
    result.attempts.map((a) => ({
      ok: a.ok,
      finish: a.finishReason,
      ms: a.latencyMs,
      cacheHit: a.usage?.cacheHitTokens,
      cacheMiss: a.usage?.cacheMissTokens,
      output: a.usage?.outputTokens,
      reasoning: a.usage?.reasoningTokens,
      error: a.error?.slice(0, 80),
    })),
  );
}

main().catch((error: unknown) => {
  if (error instanceof ExtractionError) console.table(error.attempts);
  console.error(error);
  process.exitCode = 1;
});
