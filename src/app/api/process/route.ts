import { readFile } from "node:fs/promises";
import path from "node:path";

import { del, get } from "@vercel/blob";
import { z } from "zod";

import { SAMPLE_IDS, UPLOAD_PREFIX } from "@/lib/limits";
import { runPipeline, type RunOptions } from "@/lib/pipeline/run";
import type { PipelineEvent } from "@/lib/pipeline/types";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

// Recognition takes a few seconds and the model up to two minutes per attempt.
export const maxDuration = 300;

const allow = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

const requestSchema = z.union([
  z.object({ sample: z.enum(SAMPLE_IDS) }),
  z.object({
    upload: z.string().startsWith(UPLOAD_PREFIX).max(500),
    durationSec: z.number().positive().optional(),
  }),
]);

type Audio = { bytes: Buffer; options: Omit<RunOptions, "tag" | "onEvent"> };

/** Bundled samples ship with this function (see outputFileTracingIncludes). */
async function readSample(id: string): Promise<Audio> {
  const bytes = await readFile(path.join(process.cwd(), "public", "samples", `${id}.wav`));
  return { bytes, options: { mimeType: "audio/wav" } };
}

async function readUpload(pathname: string, durationSec?: number): Promise<Audio | null> {
  const started = performance.now();
  const blob = await get(pathname, { access: "private" });
  if (blob?.statusCode !== 200) return null;
  const bytes = Buffer.from(await new Response(blob.stream).arrayBuffer());
  return {
    bytes,
    options: {
      mimeType: blob.blob.contentType,
      clientDurationSec: durationSec,
      storage: { bytes: bytes.length, fetchMs: Math.round(performance.now() - started) },
    },
  };
}

/**
 * Processes a sample or an uploaded recording and streams progress as
 * newline-delimited JSON (one PipelineEvent per line). Uploads are deleted
 * from Blob storage when processing ends, whatever the outcome.
 */
export async function POST(request: Request): Promise<Response> {
  if (!allow(clientIp(request))) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Expected a sample ID or an upload path." }, { status: 400 });
  }
  const input = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PipelineEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const audio =
          "sample" in input
            ? await readSample(input.sample)
            : await readUpload(input.upload, input.durationSec);
        if (!audio) {
          send({ type: "error", message: "The uploaded file was not found. Please upload it again." });
          return;
        }

        const result = await runPipeline(audio.bytes, {
          ...audio.options,
          tag: "app",
          onEvent: send,
        });
        send({ type: "done", result });
        console.info(
          JSON.stringify({
            msg: "recording processed",
            source: "sample" in input ? input.sample : "upload",
            outcome: result.outcome,
            metrics: result.metrics,
          }),
        );
      } catch (error) {
        console.error("processing failed", error);
        send({ type: "error", message: "Processing failed. Please try again." });
      } finally {
        if ("upload" in input) {
          await del(input.upload).catch((error) => console.error("blob delete failed", error));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
