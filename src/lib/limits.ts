/** The longest recording the app accepts (the brief's limit). */
export const MAX_DURATION_SEC = 180;

/** A 3-minute uncompressed stereo WAV at 48 kHz is about 35 MB. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Upload types; video containers are accepted for their audio track. */
export const ACCEPTED_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/opus",
  "audio/webm",
  "audio/flac",
  "audio/x-flac",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

/** Where uploaded recordings go in the Blob store. */
export const UPLOAD_PREFIX = "uploads/";

/** Bundled test recordings, processed live like any upload. */
export const SAMPLES = [
  { id: "t1-launch-sync", label: "Launch sync", note: "All five cases from the brief" },
  { id: "t2-migration-kept", label: "Launch sync, one change", note: "The migration script is kept" },
  { id: "t3-no-intros-hedged", label: "Undecided talk", note: "No names, nothing agreed" },
  { id: "g1-too-long", label: "Too long", note: "3:36, over the 3:00 limit" },
  { id: "g2-spanish", label: "Spanish", note: "Not English" },
] as const;

export type SampleId = (typeof SAMPLES)[number]["id"];

export const SAMPLE_IDS = SAMPLES.map((sample) => sample.id) as [SampleId, ...SampleId[]];
