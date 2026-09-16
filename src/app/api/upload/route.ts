import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { ACCEPTED_CONTENT_TYPES, MAX_UPLOAD_BYTES, UPLOAD_PREFIX } from "@/lib/limits";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

// The app has no accounts, so the upload token is limited by type, size,
// path and lifetime instead of by user.
const allow = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });
const TOKEN_LIFETIME_MS = 10 * 60_000;

export async function POST(request: Request): Promise<Response> {
  if (!allow(clientIp(request))) {
    return Response.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(UPLOAD_PREFIX)) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: ACCEPTED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + TOKEN_LIFETIME_MS,
        };
      },
    });
    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
