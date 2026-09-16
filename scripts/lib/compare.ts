import type { Commitments, Evidence, Item } from "@/lib/commitments/types";

/** The shape of fixtures/<id>/expected.json (see fixtures/README.md). */
export type Expected = {
  fixture: string;
  outcome: "ok" | "declined";
  decline_reason?: string;
  calls?: Partial<Record<"asr" | "llm", number>>;
  clarifications: string[];
  speakers: { name: string; intro_line: number }[];
  items: {
    id: string;
    kind: Item["kind"][];
    match: string[];
    status: string[];
    owner?: string | null;
    deadline?: {
      match: string[];
      not_match?: string[];
      date_context_missing: boolean;
      corrected_from?: string[];
    } | null;
    evidence_lines: number[];
  }[];
  absent_or_not_agreed: { id: string; match: string[] }[];
};

export type Timeline = { lines?: { n: number; start: number; end: number }[] };

export type Observed = {
  outcome: "ok" | "declined";
  declineReason?: string | null;
  calls?: { asr: number; llm: number };
  commitments: Commitments | null;
};

export type Comparison = { passed: boolean; failures: string[]; warnings: string[] };

/** Evidence may start or end this close to a script line and still count as on it. */
const TOLERANCE_SEC = 0.3;

const includesAny = (text: string, needles: readonly string[]) =>
  needles.some((needle) => text.toLowerCase().includes(needle.toLowerCase()));

function onLines(evidence: Evidence, lines: readonly number[], timeline: Timeline): boolean {
  return lines.some((n) => {
    const line = timeline.lines?.find((l) => l.n === n);
    return (
      line !== undefined &&
      evidence.start < line.end + TOLERANCE_SEC &&
      evidence.end > line.start - TOLERANCE_SEC
    );
  });
}

/**
 * Checks one pipeline result against a fixture's expected results. Hard checks
 * become failures; soft checks (deadline history, evidence outside the
 * expected lines, dropped quotes) become warnings.
 */
export function compareWithExpected(
  expected: Expected,
  observed: Observed,
  timeline: Timeline,
): Comparison {
  const failures: string[] = [];
  const warnings: string[] = [];
  const fail = (message: string) => failures.push(message);

  if (observed.outcome !== expected.outcome) {
    fail(`outcome is ${observed.outcome}, expected ${expected.outcome}`);
  }
  if (expected.outcome === "declined" && observed.declineReason !== expected.decline_reason) {
    fail(`decline reason is ${observed.declineReason}, expected ${expected.decline_reason}`);
  }
  for (const [stage, count] of Object.entries(expected.calls ?? {})) {
    const actual = observed.calls?.[stage as "asr" | "llm"];
    if (actual !== undefined && actual !== count) {
      fail(`${stage} calls: ${actual}, expected ${count}`);
    }
  }
  if (expected.outcome === "declined" || observed.outcome === "declined") {
    return { passed: failures.length === 0, failures, warnings };
  }

  const result = observed.commitments;
  if (!result) {
    fail("no commitments in the result");
    return { passed: false, failures, warnings };
  }

  const clarifications = result.clarifications.map((c) => c.type).sort();
  if (clarifications.join() !== [...expected.clarifications].sort().join()) {
    fail(`clarifications are [${clarifications}], expected [${expected.clarifications}]`);
  }

  const names = result.speakers.flatMap((s) => (s.name ? [s.name] : [])).sort();
  if (names.join() !== expected.speakers.map((s) => s.name).sort().join()) {
    fail(`speaker names are [${names}], expected [${expected.speakers.map((s) => s.name)}]`);
  }
  for (const speaker of expected.speakers) {
    const found = result.speakers.find((s) => s.name === speaker.name);
    if (found?.evidence && !onLines(found.evidence, [speaker.intro_line], timeline)) {
      fail(`${speaker.name}: introduction is not on line ${speaker.intro_line}`);
    }
  }

  for (const want of expected.items) {
    const label = `item "${want.id}"`;
    const matches = result.items.filter((item) => includesAny(item.title, want.match));
    if (matches.length !== 1) {
      fail(`${label}: found ${matches.length} matching items, expected 1`);
      continue;
    }
    const [item] = matches;
    if (!want.kind.includes(item.kind)) fail(`${label}: kind is ${item.kind}`);
    if (!want.status.includes(item.status)) {
      fail(`${label}: status is ${item.status}, expected ${want.status.join(" or ")}`);
    }

    if (item.kind === "task" && item.status === "agreed") {
      if (want.owner !== undefined) {
        const owner = item.owner?.name ?? null;
        if (want.owner === null && item.owner) {
          fail(`${label}: owner ${owner ?? `S${item.owner.speaker}`} was invented`);
        } else if (want.owner !== null && owner?.toLowerCase() !== want.owner.toLowerCase()) {
          fail(`${label}: owner is ${owner}, expected ${want.owner}`);
        }
      }
      if (want.deadline !== undefined) {
        const deadline = item.deadline;
        if (want.deadline === null) {
          if (deadline) fail(`${label}: deadline "${deadline.text}" was invented`);
        } else if (!deadline) {
          fail(`${label}: deadline is missing`);
        } else {
          if (!includesAny(deadline.text, want.deadline.match)) {
            fail(`${label}: deadline "${deadline.text}" does not match ${want.deadline.match}`);
          }
          if (want.deadline.not_match && includesAny(deadline.text, want.deadline.not_match)) {
            fail(`${label}: deadline "${deadline.text}" is the old one`);
          }
          if (deadline.dateStated === want.deadline.date_context_missing) {
            fail(`${label}: missing date context is not marked correctly`);
          }
          const history = want.deadline.corrected_from;
          if (history && !item.previousDeadlines.some((d) => includesAny(d.text, history))) {
            warnings.push(`${label}: history does not show the earlier deadline ${history}`);
          }
        }
      }
    }

    if (!item.events.some((event) => onLines(event.evidence, want.evidence_lines, timeline))) {
      fail(`${label}: no evidence on lines ${want.evidence_lines.join(", ")}`);
    } else if (!item.events.every((event) => onLines(event.evidence, want.evidence_lines, timeline))) {
      warnings.push(`${label}: some evidence is outside lines ${want.evidence_lines.join(", ")}`);
    }
  }

  for (const item of result.items.filter((i) => i.status === "agreed")) {
    const allowed = expected.items.some(
      (want) => want.status.includes("agreed") && includesAny(item.title, want.match),
    );
    if (!allowed) fail(`unexpected agreed item "${item.title}"`);
  }
  for (const absent of expected.absent_or_not_agreed) {
    const agreed = result.items.find(
      (item) => item.status === "agreed" && includesAny(item.title, absent.match),
    );
    if (agreed) fail(`"${absent.id}" must not be agreed, but "${agreed.title}" is`);
  }

  for (const dropped of result.dropped) {
    warnings.push(`dropped ${dropped.type} in "${dropped.item}": ${dropped.reason}`);
  }

  return { passed: failures.length === 0, failures, warnings };
}
