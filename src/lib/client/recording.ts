import { ACCEPTED_CONTENT_TYPES, MAX_UPLOAD_BYTES, UPLOAD_PREFIX } from "@/lib/limits";

/** Types by extension, for browsers that leave `File.type` empty. */
const TYPE_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/x-m4a",
  mp4: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/opus",
  webm: "audio/webm",
  flac: "audio/flac",
  mov: "video/quicktime",
};

/** For the file picker: any audio, plus the video containers we take the audio from. */
export const ACCEPT_ATTRIBUTE = ["audio/*", "video/mp4", "video/webm", "video/quicktime"].join(",");

export type FileCheck =
  | { ok: true; contentType: string; pathname: string }
  | { ok: false; message: string };

const MAX_STEM_LENGTH = 80;

/** Checks type and size before anything is uploaded, and picks the Blob path. */
export function checkRecordingFile(file: Pick<File, "name" | "type" | "size">): FileCheck {
  if (file.size === 0) return { ok: false, message: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: `The file is ${megabytes(file.size)} MB; the limit is ${megabytes(MAX_UPLOAD_BYTES)} MB.`,
    };
  }
  const dot = file.name.lastIndexOf(".");
  const extension = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  const contentType = ACCEPTED_CONTENT_TYPES.includes(file.type)
    ? file.type
    : TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return {
      ok: false,
      message: "Unsupported file type. Use MP3, WAV, M4A, AAC, OGG, Opus, WebM or FLAC.",
    };
  }
  const stem = (dot > 0 ? file.name.slice(0, dot) : file.name)
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_STEM_LENGTH);
  const name = `${stem || "recording"}${extension ? `.${extension}` : ""}`;
  return { ok: true, contentType, pathname: `${UPLOAD_PREFIX}${name}` };
}

function megabytes(bytes: number): string {
  const value = bytes / (1024 * 1024);
  return value >= 10 ? value.toFixed(0) : value.toFixed(1);
}

const METADATA_TIMEOUT_MS = 8000;

/**
 * The duration according to the browser's decoder, or null when it can't
 * tell (some WebM recordings report Infinity until fully played). Reads
 * only the metadata, so it costs nothing and needs no upload.
 */
export function readDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    let settled = false;
    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      audio.removeAttribute("src");
      audio.load();
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), METADATA_TIMEOUT_MS);
    audio.addEventListener("loadedmetadata", () =>
      finish(Number.isFinite(audio.duration) ? audio.duration : null),
    );
    audio.addEventListener("error", () => finish(null));
    audio.src = url;
  });
}
