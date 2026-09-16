import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { probeDuration } from "@/lib/audio/duration";

describe("probeDuration", () => {
  it("reads the duration of the fixture recordings", async () => {
    const t1 = readFileSync("public/samples/t1-launch-sync.wav");
    const g1 = readFileSync("public/samples/g1-too-long.wav");

    expect(await probeDuration(t1, "audio/wav")).toBeCloseTo(72.25, 1);
    expect(await probeDuration(g1, "audio/wav")).toBeCloseTo(216.75, 1);
  });

  it("returns null for data that is not audio", async () => {
    expect(await probeDuration(Buffer.from("definitely not audio"), "audio/mpeg")).toBeNull();
  });
});
