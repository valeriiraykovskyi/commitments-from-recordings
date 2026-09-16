import { describe, expect, it } from "vitest";

import { encodeWav, pcmDuration, silence } from "./wav";

describe("silence", () => {
  it("returns zeroed samples for the requested duration", () => {
    const pcm = silence(0.5, 16_000);

    expect(pcm.length).toBe(16_000); // 8 000 samples × 2 bytes
    expect(pcm.every((byte) => byte === 0)).toBe(true);
  });
});

describe("pcmDuration", () => {
  it("converts bytes to seconds", () => {
    expect(pcmDuration(48_000, 16_000)).toBe(1.5);
  });
});

describe("encodeWav", () => {
  it("writes a mono 16-bit PCM header followed by the samples", () => {
    const pcm = Buffer.from([1, 0, 2, 0, 3, 0]);
    const wav = encodeWav(pcm, 16_000);

    expect(wav.length).toBe(44 + pcm.length);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.readUInt32LE(4)).toBe(36 + pcm.length);
    expect(wav.toString("ascii", 8, 16)).toBe("WAVEfmt ");
    expect(wav.readUInt16LE(20)).toBe(1); // PCM
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt32LE(24)).toBe(16_000);
    expect(wav.readUInt32LE(28)).toBe(32_000);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.toString("ascii", 36, 40)).toBe("data");
    expect(wav.readUInt32LE(40)).toBe(pcm.length);
    expect(wav.subarray(44)).toEqual(pcm);
  });

  it("rejects a partial sample", () => {
    expect(() => encodeWav(Buffer.from([1, 0, 2]), 16_000)).toThrow(/whole number/);
  });
});
