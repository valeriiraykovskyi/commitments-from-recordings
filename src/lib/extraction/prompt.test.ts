import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { toTranscript } from "@/lib/asr/transcript";
import { formatTranscript, SYSTEM_PROMPT } from "@/lib/extraction/prompt";
import { tokenize } from "@/lib/text";
import { parseScript } from "../../../scripts/lib/script-parser";

describe("formatTranscript", () => {
  it("renders numbered utterances with start time and speaker label", () => {
    const response = JSON.parse(
      readFileSync(path.join("fixtures", "t1-launch-sync", "asr-response.json"), "utf8"),
    );
    const lines = formatTranscript(toTranscript(response)).split("\n");

    expect(lines[0]).toBe("[U01] 0:00 S0: Hi. I'm Anna, the product manager.");
    expect(lines[1]).toBe("[U02] 0:03 S1: And I'm Mark, the developer on the project.");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("mentions json, which DeepSeek's JSON mode requires", () => {
    expect(SYSTEM_PROMPT).toContain("json");
  });

  it("does not contain sentences from the test fixtures", () => {
    const prompt = ` ${tokenize(SYSTEM_PROMPT).join(" ")} `;
    const fixtures = readdirSync("fixtures", { withFileTypes: true }).filter((e) => e.isDirectory());

    for (const fixture of fixtures) {
      const scriptPath = path.join("fixtures", fixture.name, "script.md");
      let script: string;
      try {
        script = readFileSync(scriptPath, "utf8");
      } catch {
        continue; // recipe-only fixture
      }
      for (const line of parseScript(script)) {
        // Every sentence of five words or more must be absent from the prompt.
        for (const sentence of line.text.split(/(?<=[.?!])\s+/)) {
          const tokens = tokenize(sentence);
          if (tokens.length < 5) continue;
          expect(prompt, `${fixture.name} line ${line.n}`).not.toContain(` ${tokens.join(" ")} `);
        }
      }
    }
  });
});
