import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseScript } from "./lib/script-parser";

// Integrity checks for the hand-written test set: they catch typos in line
// numbers and speaker names before any pipeline run depends on them.

const FIXTURES_DIR = path.join(process.cwd(), "fixtures");

type Expected = {
  speakers: { name: string; intro_line: number }[];
  items: { id: string; evidence_lines: number[] }[];
};

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const fixtureFile = (id: string, file: string) => path.join(FIXTURES_DIR, id, file);
const script = (id: string) => parseScript(readFileSync(fixtureFile(id, "script.md"), "utf8"));

const fixtureIds = readdirSync(FIXTURES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const scripted = fixtureIds.filter((id) => existsSync(fixtureFile(id, "script.md")));
const voices = readJson<Record<string, string>>(path.join(FIXTURES_DIR, "voices.json"));

describe("fixture set", () => {
  it.each(fixtureIds)("%s has a script or a recipe, and expected results", (id) => {
    const hasSource =
      existsSync(fixtureFile(id, "script.md")) || existsSync(fixtureFile(id, "recipe.json"));
    expect(hasSource).toBe(true);
    expect(existsSync(fixtureFile(id, "expected.json"))).toBe(true);
  });

  it.each(scripted)("%s: every speaker has a voice", (id) => {
    for (const line of script(id)) {
      expect(voices[line.speaker], `line ${line.n}`).toBeDefined();
    }
  });

  it.each(scripted)("%s: expected results point at existing lines", (id) => {
    const lines = script(id);
    const expected = readJson<Expected>(fixtureFile(id, "expected.json"));

    for (const speaker of expected.speakers) {
      const intro = lines[speaker.intro_line - 1];
      expect(intro?.speaker, `intro of ${speaker.name}`).toBe(speaker.name);
      expect(intro?.text, `intro of ${speaker.name}`).toContain(speaker.name);
    }
    for (const item of expected.items) {
      expect(item.evidence_lines.length, item.id).toBeGreaterThan(0);
      for (const n of item.evidence_lines) {
        expect(n >= 1 && n <= lines.length, `${item.id}: line ${n}`).toBe(true);
      }
    }
  });

  it("T2 differs from T1 only in line 18", () => {
    const t1 = script("t1-launch-sync");
    const t2 = script("t2-migration-kept");

    expect(t2).toHaveLength(t1.length);
    const changed = t1
      .filter((line, i) => line.speaker !== t2[i].speaker || line.text !== t2[i].text)
      .map((line) => line.n);
    expect(changed).toEqual([18]);
  });
});
