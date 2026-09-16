/**
 * Best-effort, per-instance request limit. Serverless instances don't share
 * memory, so this only slows abuse down; the real caps are the prepaid and
 * free-credit balances at the providers.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function allow(key: string, now = Date.now()): boolean {
    if (hits.size > 10_000) hits.clear(); // keep memory bounded
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    const allowed = recent.length < limit;
    if (allowed) recent.push(now);
    hits.set(key, recent);
    return allowed;
  };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
