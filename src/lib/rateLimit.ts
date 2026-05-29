import { NextRequest, NextResponse } from "next/server";
import { redis } from "./redis";

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Fixed-window rate limiter backed by Redis.
 * Returns a 429 NextResponse if the limit is exceeded, null otherwise.
 * Fails open if Redis is unavailable so a Redis outage never blocks users.
 *
 * @param key     Unique bucket key (include IP + route identifier)
 * @param max     Max requests allowed in the window
 * @param windowSeconds  Window duration in seconds
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  try {
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSeconds);
    if (count > max) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(windowSeconds) },
        },
      );
    }
  } catch {
    // Redis unavailable — fail open
  }
  return null;
}
