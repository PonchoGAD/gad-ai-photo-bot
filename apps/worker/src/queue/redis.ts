// apps/worker/src/queue/redis.ts
import type { ConnectionOptions } from "bullmq";

export function redisConnection(): ConnectionOptions {
  if (!process.env.REDIS_HOST) {
    throw new Error("REDIS_HOST is not set");
  }

  return {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    ...(process.env.REDIS_PASSWORD
      ? { password: process.env.REDIS_PASSWORD }
      : {}),
    ...(process.env.REDIS_DB
      ? { db: Number(process.env.REDIS_DB) }
      : {})
  };
}
