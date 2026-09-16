import { clientIp, createRateLimiter } from "@/lib/rate-limit";

// Configuration check for the running deployment. It never returns key
// values: only whether each key is present, its shape, and whether the
// provider accepts it (via free, read-only requests).

const allow = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });
const TIMEOUT_MS = 5000;

/** Variables the app uses; only their presence is reported. */
const EXPECTED_VARIABLES = [
  "DEEPGRAM_API_KEY",
  "DEEPSEEK_API_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "BLOB_STORE_ID",
  "BLOB_WEBHOOK_PUBLIC_KEY",
];

type KeyCheck = {
  configured: boolean;
  length?: number;
  hadWhitespace?: boolean;
  printableAscii?: boolean;
  providerStatus?: number;
  error?: string;
};

function inspectKey(raw: string | undefined): { check: KeyCheck; key: string | null } {
  if (!raw) return { check: { configured: false }, key: null };
  const key = raw.trim();
  const printableAscii = /^[\x21-\x7e]+$/.test(key);
  return {
    check: { configured: true, length: key.length, hadWhitespace: key !== raw, printableAscii },
    key: printableAscii ? key : null,
  };
}

async function probe(url: string, authorization: string, check: KeyCheck): Promise<KeyCheck> {
  try {
    const response = await fetch(url, {
      headers: { Authorization: authorization },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ...check, providerStatus: response.status };
  } catch (error) {
    return { ...check, error: error instanceof Error ? error.name : "unknown" };
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!allow(clientIp(request))) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  const deepgram = inspectKey(process.env.DEEPGRAM_API_KEY);
  const deepseek = inspectKey(process.env.DEEPSEEK_API_KEY);
  const [deepgramCheck, deepseekCheck] = await Promise.all([
    deepgram.key
      ? probe("https://api.deepgram.com/v1/projects", `Token ${deepgram.key}`, deepgram.check)
      : deepgram.check,
    deepseek.key
      ? probe("https://api.deepseek.com/user/balance", `Bearer ${deepseek.key}`, deepseek.check)
      : deepseek.check,
  ]);

  return Response.json(
    {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? null,
      region: process.env.VERCEL_REGION ?? null,
      node: process.version,
      present: Object.fromEntries(
        EXPECTED_VARIABLES.map((name) => [name, Boolean(process.env[name])]),
      ),
      deepgram: deepgramCheck,
      deepseek: deepseekCheck,
      blob: { configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
