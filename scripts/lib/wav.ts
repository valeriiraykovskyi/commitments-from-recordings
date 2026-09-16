/** Helpers for mono 16-bit little-endian PCM, the format used for fixture audio. */

const BYTES_PER_SAMPLE = 2;

export function silence(seconds: number, sampleRate: number): Buffer {
  return Buffer.alloc(Math.round(seconds * sampleRate) * BYTES_PER_SAMPLE);
}

/** Duration in seconds of `byteLength` bytes of PCM. */
export function pcmDuration(byteLength: number, sampleRate: number): number {
  return byteLength / BYTES_PER_SAMPLE / sampleRate;
}

/** Wraps PCM samples in a standard 44-byte WAV (RIFF) header. */
export function encodeWav(pcm: Buffer, sampleRate: number): Buffer {
  if (pcm.length % BYTES_PER_SAMPLE !== 0) {
    throw new Error(`PCM length ${pcm.length} is not a whole number of samples`);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // size of the fmt chunk
  header.writeUInt16LE(1, 20); // audio format: PCM
  header.writeUInt16LE(1, 22); // channels: mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * BYTES_PER_SAMPLE, 28); // byte rate
  header.writeUInt16LE(BYTES_PER_SAMPLE, 32); // block align
  header.writeUInt16LE(BYTES_PER_SAMPLE * 8, 34); // bits per sample
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
