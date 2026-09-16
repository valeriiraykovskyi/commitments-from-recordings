import { parseBuffer } from "music-metadata";

/**
 * The duration stored in the file itself, or null when it can't be read
 * (unknown format, or a container without duration such as some browser
 * recordings).
 */
export async function probeDuration(audio: Uint8Array, mimeType?: string): Promise<number | null> {
  try {
    const { format } = await parseBuffer(
      audio,
      { mimeType, size: audio.length },
      { duration: true, skipCovers: true },
    );
    return format.duration !== undefined && Number.isFinite(format.duration)
      ? format.duration
      : null;
  } catch {
    return null;
  }
}
