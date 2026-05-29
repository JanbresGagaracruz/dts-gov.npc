// src/lib/redis.ts
// Install: npm install ioredis
// Add to .env: REDIS_URL=redis://localhost:6379

import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ─── Duplicate scan prevention (3-second TTL) ─────────────────────────────
export async function checkDuplicateScan(
  warehouseId: string,
  productId: string,
  scanType: string,
): Promise<boolean> {
  const key = `scan:dup:${warehouseId}:${productId}:${scanType}`;
  const exists = await redis.exists(key);
  if (exists) return true;
  await redis.setex(key, 3, "1");
  return false;
}

// ─── Inventory queue ──────────────────────────────────────────────────────
export async function queueInventoryUpdate(payload: {
  warehouseId: string;
  productId: string;
  qty: number;
  type: "IN" | "OUT" | "ADJUSTMENT";
  scanLogId: string;
  userId: string;
  referenceNo: string;
}) {
  await redis.rpush("inventory:queue", JSON.stringify(payload));
}

// ─── Pub/Sub channel names ────────────────────────────────────────────────
export const CHANNELS = {
  INVENTORY_UPDATE: "inventory:update",
  TRANSFER_UPDATE: "transfer:update",
  SCAN_FEED: "scan:feed",
  DASHBOARD: "dashboard:update",
} as const;

// ─── Cache helpers ────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  const v = await redis.get(key);
  return v ? (JSON.parse(v) as T) : null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 60,
): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}
