import { describe, expect, it } from "vitest";

import { parseScript } from "./script-parser";

describe("parseScript", () => {
  it("reads numbered dialogue lines and ignores everything else", () => {
    const markdown = [
      "# T1 — Title",
      "",
      "A note for people.",
      "",
      "1. **Anna:** Hi, I'm Anna.",
      "2. **Mark:** And I'm Mark: the developer.",
    ].join("\n");

    expect(parseScript(markdown)).toEqual([
      { n: 1, speaker: "Anna", text: "Hi, I'm Anna." },
      { n: 2, speaker: "Mark", text: "And I'm Mark: the developer." },
    ]);
  });

  it("keeps non-ASCII speaker names and Windows line endings", () => {
    const markdown = "1. **Lucía:** Hola.\r\n2. **Speaker 2:** Hi.\r\n";

    expect(parseScript(markdown).map((line) => line.speaker)).toEqual([
      "Lucía",
      "Speaker 2",
    ]);
  });

  it("rejects gaps in numbering", () => {
    const markdown = "1. **Anna:** One.\n3. **Mark:** Three.";

    expect(() => parseScript(markdown)).toThrow(/out of order/);
  });

  it("rejects a script without dialogue", () => {
    expect(() => parseScript("# Only a title")).toThrow(/No dialogue/);
  });
});
