/**
 * Saves real Deepgram responses for the scripted fixtures to
 * fixtures/<id>/asr-response.json, so unit tests of later pipeline stages run on
 * realistic transcripts without network calls. The app and the eval always call
 * Deepgram live; these files are test data only.
 *
 * Usage: npm run asr:snapshot            (first run)
 *        npm run asr:snapshot -- --force (overwrite committed snapshots)
 */
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

import { transcribe } from "@/lib/asr/deepgram";

const ROOT = process.cwd();
const FIXTURES_DIR = path.join(ROOT, "fixtures");
const SAMPLES_DIR = path.join(ROOT, "public", "samples");

const snapshotFile = (id: string) => path.join(FIXTURES_DIR, id, "asr-response.json");

async function main() {
  loadEnvConfig(ROOT, true, { info: () => {}, error: console.error });

  const entries = await readdir(FIXTURES_DIR, { withFileTypes: true });
  const ids = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((id) => existsSync(path.join(FIXTURES_DIR, id, "script.md")))
    .sort();

  const existing = ids.filter((id) => existsSync(snapshotFile(id)));
  if (existing.length > 0 && !process.argv.includes("--force")) {
    throw new Error(
      `Snapshots already exist for ${existing.join(", ")}. ` +
        "Run `npm run asr:snapshot -- --force` to replace them.",
    );
  }

  const summary = [];
  for (const id of ids) {
    const audio = await readFile(path.join(SAMPLES_DIR, `${id}.wav`));
    const { transcript, raw, latencyMs, attempts } = await transcribe(audio, { tag: "snapshot" });
    await writeFile(snapshotFile(id), `${JSON.stringify(raw, null, 2)}\n`);
    summary.push({
      fixture: id,
      seconds: transcript.durationSec,
      language: transcript.language,
      speakers: transcript.speakers.length,
      utterances: transcript.utterances.length,
      latencyMs,
      attempts,
    });
  }
  console.table(summary);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
