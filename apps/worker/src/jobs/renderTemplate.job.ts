// apps/worker/src/jobs/renderTemplate.job.ts

import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";

import { renderHtmlToPng } from "@gad/templates/render";
import type { RenderPayload } from "@gad/templates/types";
import { putFile, getFilePath } from "@gad/storage";
import { waitUntilObjectExists } from "../lib/storageWait.js";
import { redisConnection } from "../queue/redis.js";
import { JOBS, QUEUES } from "@gad/queue-names";
import { Redis } from "ioredis";

import { prisma } from "@gad/db"

if (!process.env.REDIS_HOST) {
  throw new Error("REDIS_HOST is not set");
}

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export type RenderTemplateJobPayload = {
  htmlPath: string;
  payload: RenderPayload;
  width: number;
  height: number;
  outKey: string;
  jobId?: string;
  tgUserId?: number;
  tgMessageId?: number;
};

/* ================== helpers ================== */

function localStorageRoot(): string {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  return path.join(repoRoot, ".local-storage");
}

function localPathForKey(key: string): string {
  return path.join(localStorageRoot(), key);
}

async function ensureLocalDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/**
 * Чиним htmlPath
 */
async function resolveHtmlPath(input: string): Promise<string> {
  const normalized = path.normalize(input);

  try {
    await fs.access(normalized);
    return normalized;
  } catch {}

  const broken = path.normalize(
    `${path.sep}apps${path.sep}worker${path.sep}packages${path.sep}templates${path.sep}`
  );

  if (normalized.includes(broken)) {
    const fixed = normalized.replace(
      broken,
      `${path.sep}packages${path.sep}templates${path.sep}`
    );
    try {
      await fs.access(fixed);
      return fixed;
    } catch {}
  }

  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const candidate = path.resolve(repoRoot, normalized);
  try {
    await fs.access(candidate);
    return candidate;
  } catch {}

  const idx = normalized.indexOf(
    path.normalize(`${path.sep}packages${path.sep}templates${path.sep}`)
  );
  if (idx >= 0) {
    const tail = normalized.slice(idx + 1);
    const candidate2 = path.resolve(repoRoot, tail);
    try {
      await fs.access(candidate2);
      return candidate2;
    } catch {}
  }

  throw new Error(`TEMPLATE_NOT_FOUND:${input}`);
}

/**
 * uploads/... → data:image/*
 */
async function imageKeyToDataUrl(imageKey: string): Promise<string> {
  if (/^https?:\/\//i.test(imageKey)) return imageKey;
  if (/^data:image\//i.test(imageKey)) return imageKey;

  try {
    const p = await getFilePath(imageKey);
    const buf = await fs.readFile(p);
    const ext = path.extname(p).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {}

  const local = localPathForKey(imageKey);
  const buf = await fs.readFile(local);
  const ext = path.extname(local).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
      ? "image/webp"
      : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * putFile → MinIO / fallback local
 */
async function safePutFile(tmp: string, key: string, contentType: string) {
  try {
    await putFile(tmp, key, contentType);
    return { mode: "minio" as const, key };
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("connect ECONNREFUSED")
    ) {
      const out = localPathForKey(key);
      await ensureLocalDir(out);
      await fs.copyFile(tmp, out);
      return { mode: "local" as const, key, path: out };
    }
    throw e;
  }
}

/* ================== job ================== */

export async function renderTemplateJob(data: RenderTemplateJobPayload) {
  const tmp = path.join(os.tmpdir(), `card-${Date.now()}.png`);

  try {
    const htmlPath = await resolveHtmlPath(data.htmlPath);

    const payload: RenderPayload = {
      ...data.payload,
      imageUrl: await imageKeyToDataUrl(data.payload.imageUrl),
    };

    await renderHtmlToPng({
      htmlPath,
      payload,
      width: data.width,
      height: data.height,
      outputPath: tmp,
    });

    await safePutFile(tmp, data.outKey, "image/png");

    await waitUntilObjectExists(data.outKey, {
      timeoutMs: 10_000,
      intervalMs: 500,
    });

    const result = { key: data.outKey };

    // 🔔 ORCHESTRATOR SIGNAL
    if (data.jobId) {
      const done = await redis.incr(`render:done:${data.jobId}`);
      const expectedRaw = await redis.get(`render:expected:${data.jobId}`);
      const expected = Number(expectedRaw ?? 0);

      if (expected > 0 && done === expected) {
        const lockKey = `render:zip:lock:${data.jobId}`;

        const locked = await redis.set(lockKey, "1", "EX", 600, "NX");
        if (!locked) return result;

        const job = await prisma.job.findUnique({
          where: { id: data.jobId },
        });

        if (!job) {
          throw new Error("JOB_NOT_FOUND");
        }

        const outputJson = job.outputJson as any;
        const keys: string[] =
          outputJson?.render?.keys ??
          outputJson?.keys ??
          [];

        if (!keys.length) {
          throw new Error("RENDER_KEYS_MISSING");
        }

        const zipKey = `exports/${job.userId}/${Date.now()}.zip`;

        await redis.del(`render:done:${data.jobId}`);
        await redis.del(`render:expected:${data.jobId}`);

        const Bull = await import("bullmq");
        const queue = new Bull.default.Queue(QUEUES.MAIN, {
          connection: redisConnection(),
        });

        const input = job.inputJson as any;

        await queue.add(
          JOBS.EXPORT_ZIP,
          {
            keys,
            zipKey,
            jobId: job.id,
            tgUserId: input?.tgUserId,
            tgMessageId: job.tgMessageId ?? input?.tgMessageId,
          },
          { attempts: 1 }
        );
      }
    }

    return result;
  } catch (err: any) {
    if (data.jobId) {
      await prisma.job.update({
        where: { id: data.jobId },
        data: {
          status: "FAILED",
          error: String(err?.message ?? err),
        },
      });
    }
    throw err;
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}
