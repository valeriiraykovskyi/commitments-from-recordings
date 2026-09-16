export type ScriptLine = {
  n: number;
  speaker: string;
  text: string;
};

const DIALOGUE_LINE = /^(\d+)\.\s+\*\*(.+?):\*\*\s+(.+)$/;

/**
 * Reads the dialogue from a fixture script: numbered Markdown list items in the
 * form `N. **Speaker:** text`. Everything else in the file is ignored.
 * Lines must be numbered 1, 2, 3, … without gaps, because expected results
 * refer to them by number.
 */
export function parseScript(markdown: string): ScriptLine[] {
  const lines: ScriptLine[] = [];
  for (const raw of markdown.split(/\r?\n/)) {
    const match = DIALOGUE_LINE.exec(raw.trim());
    if (!match) continue;
    const [, number, speaker, text] = match;
    const n = Number(number);
    const expected = lines.length + 1;
    if (n !== expected) {
      throw new Error(`Dialogue line ${n} is out of order: expected ${expected}`);
    }
    lines.push({ n, speaker: speaker.trim(), text: text.trim() });
  }
  if (lines.length === 0) {
    throw new Error("No dialogue lines found");
  }
  return lines;
}
