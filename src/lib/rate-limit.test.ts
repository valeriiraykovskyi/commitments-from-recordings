import { describe, expect, it } from "vitest";

import { clientIp, createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit per key within the window", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });

    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([true, true, false]);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1005)).toBe(true); // the first request left the window
  });
});

describe("clientIp", () => {
  it("takes the first forwarded address", () => {
    const request = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });

    expect(clientIp(request)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
