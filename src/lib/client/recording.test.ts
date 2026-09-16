import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_BYTES } from "@/lib/limits";

import { checkRecordingFile } from "./recording";

describe("checkRecordingFile", () => {
  it("accepts a known content type and keeps the file name", () => {
    expect(checkRecordingFile({ name: "call.mp3", type: "audio/mpeg", size: 1000 })).toEqual({
      ok: true,
      contentType: "audio/mpeg",
      pathname: "uploads/call.mp3",
    });
  });

  it("infers the type from the extension when the browser gives none or an unknown one", () => {
    expect(checkRecordingFile({ name: "call.M4A", type: "", size: 1 })).toMatchObject({
      ok: true,
      contentType: "audio/x-m4a",
      pathname: "uploads/call.m4a",
    });
    expect(
      checkRecordingFile({ name: "call.webm", type: "application/octet-stream", size: 1 }),
    ).toMatchObject({ ok: true, contentType: "audio/webm" });
  });

  it("rejects unsupported types, empty files and oversized files", () => {
    expect(checkRecordingFile({ name: "notes.txt", type: "text/plain", size: 10 })).toMatchObject({
      ok: false,
      message: expect.stringContaining("Unsupported file type"),
    });
    expect(checkRecordingFile({ name: "call.mp3", type: "audio/mpeg", size: 0 })).toMatchObject({
      ok: false,
      message: "The file is empty.",
    });
    expect(
      checkRecordingFile({ name: "call.wav", type: "audio/wav", size: MAX_UPLOAD_BYTES + 1 }),
    ).toMatchObject({ ok: false, message: "The file is 50 MB; the limit is 50 MB." });
  });

  it("makes the Blob path safe and never empty", () => {
    expect(
      checkRecordingFile({ name: "team sync (final) — v2.MP3", type: "audio/mpeg", size: 1 }),
    ).toMatchObject({ pathname: "uploads/team-sync-final-v2.mp3" });
    expect(checkRecordingFile({ name: "***.wav", type: "audio/wav", size: 1 })).toMatchObject({
      pathname: "uploads/recording.wav",
    });
    expect(checkRecordingFile({ name: ".hidden", type: "audio/wav", size: 1 })).toMatchObject({
      pathname: "uploads/.hidden",
    });
  });
});
