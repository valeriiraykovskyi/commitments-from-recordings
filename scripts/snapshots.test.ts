import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { toTranscript } from "@/lib/asr/transcript";
import { buildCommitments } from "@/lib/commitments/build";
import { extractionSchema } from "@/lib/extraction/schema";

import { compareWithExpected, type Expected, type Timeline } from "./lib/compare";

// Recorded ASR and LLM responses run through the deterministic part of the
// pipeline and are compared with the hand-written expected results. The live
// eval does the same with fresh API calls.

const read = (id: string, file: string) =>
  JSON.parse(readFileSync(path.join("fixtures", id, file), "utf8"));

describe.each(["t1-launch-sync", "t2-migration-kept", "t3-no-intros-hedged"])(
  "%s with recorded responses",
  (id) => {
    const transcript = toTranscript(read(id, "asr-response.json"));
    const extraction = extractionSchema.parse(read(id, "llm-response.json").extraction);
    const commitments = buildCommitments(transcript, extraction);

    it("matches the expected results", () => {
      const comparison = compareWithExpected(
        read(id, "expected.json") as Expected,
        { outcome: "ok", commitments },
        read(id, "timeline.json") as Timeline,
      );

      expect(comparison.failures).toEqual([]);
    });

    it("finds every quote the model returned", () => {
      expect(commitments.dropped).toEqual([]);
    });
  },
);
