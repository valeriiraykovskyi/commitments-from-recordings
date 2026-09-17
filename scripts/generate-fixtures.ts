/**
 * Generates the fixture audio from the dialogue scripts with Deepgram Aura-2.
 *
 * - One TTS request per dialogue line. Identical lines are synthesized once, so
 *   T1 and T2 share every clip except line 18.
 * - Lines are joined with short pauses into public/samples/<id>.wav
 *   (16 kHz mono PCM).
 * - fixtures/<id>/timeline.json records where each line starts and ends.
 * - A fixture with recipe.json (g1-too-long) is concatenated from others.
 *
 * Usage: npm run fixtures            (first run)
 *        npm run fixtures -- --force (overwrite committed audio)
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DeepgramClient } from "@deepgram/sdk";
import nextEnv from "@next/env";

import { parseScript } from "./lib/script-parser";
import { encodeWav, pcmDuration, silence } from "./lib/wav";

const ROOT = process.cwd();
const FIXTURES_DIR = path.join(ROOT, "fixtures");
const SAMPLES_DIR = path.join(ROOT, "public", "samples");

const SAMPLE_RATE = 16_000;
const LEAD_IN_SEC = 0.3;
const PAUSE_SEC = 0.45;
const TAIL_SEC = 0.6;
const MAX_DURATION_SEC = 180; // the app's input limit
const TTS_PRICE_PER_1K_CHARS = 0.03; // Deepgram Aura-2 list price, checked 2026-09-16

type TimelineLine = {
  n: number;
  speaker: string;
  voice: string;
  start: number;
  end: number;
  text: string;
};

type Recipe = { concat: string[] };

const round = (seconds: number) => Math.round(seconds * 1000) / 1000;

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

class Synthesizer {
  private readonly client: DeepgramClient;
  private readonly cache = new Map<string, Buffer>();
  requests = 0;
  characters = 0;

  constructor(apiKey: string) {
    this.client = new DeepgramClient({ apiKey });
  }

  async speak(text: string, voice: string): Promise<Buffer> {
    const key = `${voice}\n${text}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const response = await this.client.speak.v1.audio.generate({
      text,
      model: voice,
      encoding: "linear16",
      sample_rate: SAMPLE_RATE,
      container: "none",
      tag: "fixtures",
    });
    const pcm = Buffer.from(await response.arrayBuffer());
    if (pcm.subarray(0, 4).toString("ascii") === "RIFF") {
      throw new Error("Expected raw PCM, but Deepgram returned a WAV container");
    }
    if (pcm.length === 0 || pcm.length % 2 !== 0) {
      throw new Error(`Unexpected PCM length ${pcm.length} for "${text}"`);
    }
    this.requests += 1;
    this.characters += text.length;
    this.cache.set(key, pcm);
    return pcm;
  }
}

async function buildFromScript(
  id: string,
  voices: Record<string, string>,
  tts: Synthesizer,
): Promise<{ pcm: Buffer; timeline: TimelineLine[] }> {
  const lines = parseScript(
    await readFile(path.join(FIXTURES_DIR, id, "script.md"), "utf8"),
  );
  const chunks: Buffer[] = [];
  let byteLength = 0;
  const append = (chunk: Buffer) => {
    chunks.push(chunk);
    byteLength += chunk.length;
  };

  const timeline: TimelineLine[] = [];
  append(silence(LEAD_IN_SEC, SAMPLE_RATE));
  for (const line of lines) {
    const voice = voices[line.speaker];
    if (!voice) {
      throw new Error(`${id}: no voice for "${line.speaker}" in fixtures/voices.json`);
    }
    const clip = await tts.speak(line.text, voice);
    const start = pcmDuration(byteLength, SAMPLE_RATE);
    append(clip);
    const end = pcmDuration(byteLength, SAMPLE_RATE);
    timeline.push({ ...line, voice, start: round(start), end: round(end) });
    const isLast = line.n === lines.length;
    append(silence(isLast ? TAIL_SEC : PAUSE_SEC, SAMPLE_RATE));
  }
  return { pcm: Buffer.concat(chunks), timeline };
}

async function writeFixture(
  id: string,
  pcm: Buffer,
  details: Record<string, unknown>,
): Promise<void> {
  await writeFile(path.join(SAMPLES_DIR, `${id}.wav`), encodeWav(pcm, SAMPLE_RATE));
  const timeline = {
    fixture: id,
    audio: `public/samples/${id}.wav`,
    sample_rate: SAMPLE_RATE,
    duration_sec: round(pcmDuration(pcm.length, SAMPLE_RATE)),
    ...details,
  };
  await writeFile(
    path.join(FIXTURES_DIR, id, "timeline.json"),
    `${JSON.stringify(timeline, null, 2)}\n`,
  );
}

async function main() {
  nextEnv.loadEnvConfig(ROOT, true, { info: () => {}, error: console.error });
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not set. Copy .env.example to .env.local and fill it in.");
  }

  const entries = await readdir(FIXTURES_DIR, { withFileTypes: true });
  const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const has = (id: string, file: string) => existsSync(path.join(FIXTURES_DIR, id, file));
  const scripted = ids.filter((id) => has(id, "script.md"));
  const recipes = ids.filter((id) => has(id, "recipe.json"));

  const force = process.argv.includes("--force");
  const existing = [...scripted, ...recipes].filter((id) =>
    existsSync(path.join(SAMPLES_DIR, `${id}.wav`)),
  );
  if (existing.length > 0 && !force) {
    throw new Error(
      `Audio already exists for ${existing.join(", ")}. These files are committed test inputs; ` +
        "run `npm run fixtures -- --force` to regenerate them.",
    );
  }

  const voices = await readJson<Record<string, string>>(path.join(FIXTURES_DIR, "voices.json"));
  const tts = new Synthesizer(apiKey);
  const built = new Map<string, Buffer>();
  const summary: { fixture: string; lines: string; seconds: number }[] = [];
  await mkdir(SAMPLES_DIR, { recursive: true });

  for (const id of scripted) {
    const { pcm, timeline } = await buildFromScript(id, voices, tts);
    const seconds = round(pcmDuration(pcm.length, SAMPLE_RATE));
    if (seconds > MAX_DURATION_SEC) {
      throw new Error(`${id} is ${seconds}s long, over the ${MAX_DURATION_SEC}s input limit`);
    }
    await writeFixture(id, pcm, { lines: timeline });
    built.set(id, pcm);
    summary.push({ fixture: id, lines: String(timeline.length), seconds });
  }

  for (const id of recipes) {
    const recipe = await readJson<Recipe>(path.join(FIXTURES_DIR, id, "recipe.json"));
    const parts = recipe.concat.map((source) => {
      const pcm = built.get(source);
      if (!pcm) throw new Error(`${id}: unknown source fixture "${source}"`);
      return pcm;
    });
    const pcm = Buffer.concat(parts);
    const seconds = round(pcmDuration(pcm.length, SAMPLE_RATE));
    if (seconds <= MAX_DURATION_SEC) {
      throw new Error(`${id} must be longer than ${MAX_DURATION_SEC}s, got ${seconds}s`);
    }
    await writeFixture(id, pcm, { source: recipe.concat });
    summary.push({ fixture: id, lines: `${recipe.concat.join(" + ")}`, seconds });
  }

  console.table(summary);
  const cost = (tts.characters / 1000) * TTS_PRICE_PER_1K_CHARS;
  console.log(
    `TTS: ${tts.requests} requests, ${tts.characters} characters, ≈ $${cost.toFixed(3)} at list price`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
