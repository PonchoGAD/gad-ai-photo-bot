// apps/worker/src/jobs/exportZip.job.ts
import archiver from "archiver";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { Queue } from "bullmq";

import { getFileStream, putFile, presign } from "@gad/storage";
import { waitUntilObjectsExist } from "../lib/storageWait.js";
import { redisConnection } from "../queue/redis.js";
import { QUEUES, JOBS } from "@gad/queue-names";

const prisma = new PrismaClient();
const redis = new Redis(redisConnection() as any);

// ✅ очередь для постановки SEND_ZIP_TG
const queue = new Queue(QUEUES.MAIN, {
  connection: redisConnection()
});

export type ExportZipJobPayload = {
  keys: string[];
  zipKey: string;
  jobId: string;

  // ✅ нужно для снятия tg-lock + передачи в send_zip_tg
  tgUserId?: number;
  tgMessageId?: number;

  presignSeconds?: number;
};

/* ================== LOCAL STORAGE ================== */

function localStorageRoot(): string {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  return path.join(repoRoot, ".local-storage");
}

function localPathForKey(key: string): string {
  return path.join(localStorageRoot(), key);
}

function ensureDirSync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/* ================== FILE ACCESS ================== */

async function safeGetStream(key: string): Promise<NodeJS.ReadableStream> {
  try {
    return (await getFileStream(key)) as any;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("connect ECONNREFUSED")
    ) {
      return fs.createReadStream(localPathForKey(key));
    }
    throw e;
  }
}

async function safePutZip(zipPath: string, zipKey: string) {
  try {
    await putFile(zipPath, zipKey, "application/zip");
    return { mode: "minio" as const };
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("connect ECONNREFUSED")
    ) {
      const out = localPathForKey(zipKey);
      ensureDirSync(path.dirname(out));
      fs.copyFileSync(zipPath, out);
      return { mode: "local" as const, path: out };
    }
    throw e;
  }
}

async function safePresign(zipKey: string, seconds: number): Promise<string | null> {
  try {
    return await presign(zipKey, seconds);
  } catch {
    return null;
  }
}

/* ================== JOB ================== */

export async function exportZipJob(data: ExportZipJobPayload) {
  if (!data.jobId) throw new Error("JOB_ID_REQUIRED");

  // 🛑 HARD GUARD — рендеры обязаны быть завершены
  const expectedRaw = await redis.get(`render:expected:${data.jobId}`);
  const doneRaw = await redis.get(`render:done:${data.jobId}`);

  const expected = expectedRaw != null ? Number(expectedRaw) : null;
  const done = doneRaw != null ? Number(doneRaw) : 0;

  if (expected != null && expected > 0 && done < expected) {
    throw new Error("RENDER_NOT_READY");
  }

  const zipPath = path.join(os.tmpdir(), `zip-${Date.now()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  try {
    // 🔎 ждём все PNG
    await waitUntilObjectsExist(data.keys, {
      timeoutMs: 15_000,
      intervalMs: 500
    });

    archive.pipe(output);

    for (const key of data.keys) {
      const stream = await safeGetStream(key);
      archive.append(stream as any, { name: path.basename(key) });
    }

    // 🔐 ждём закрытие output
    await new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("warning", (w) => console.warn("archiver warning:", w));
      archive.on("error", reject);
      archive.finalize().catch(reject);
    });

    // ✅ проверяем что zip не пуст
    const stat = await fsp.stat(zipPath);
    if (!stat.size || stat.size < 100) {
      throw new Error("ZIP_EMPTY_OR_CORRUPTED");
    }

    // ⬆️ upload
    const putRes = await safePutZip(zipPath, data.zipKey);

    let url: string | null = null;
    let localPath: string | undefined;

    if (putRes.mode === "local") {
      localPath = putRes.path;
    } else {
      url = await safePresign(data.zipKey, data.presignSeconds ?? 86400);
    }

    const result: any = {
      key: data.zipKey,
      zipKey: data.zipKey
    };
    if (url) result.url = url;
    if (localPath) result.localPath = localPath;

    // ✅ ЕДИНСТВЕННЫЙ источник истины
    await prisma.job.update({
      where: { id: data.jobId },
      data: {
        outputJson: result,
        status: "DONE"
      }
    });

    // ✅ снимаем TG-lock (чтобы автозапуск не блокировался)
    if (data.tgUserId) {
      await redis.del(`tg:ready:${data.tgUserId}`);
    }

    // ✅ ставим delivery job (TG отправка В ОТДЕЛЬНОМ job)
    if (data.tgUserId) {
      await queue.add(
        JOBS.SEND_ZIP_TG,
        {
          jobId: data.jobId,
          tgUserId: data.tgUserId,
          tgMessageId: data.tgMessageId
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: 200,
          removeOnFail: 200
        }
      );
    } else {
      console.warn("[EXPORT_ZIP] tgUserId missing, skip SEND_ZIP_TG enqueue", {
        jobId: data.jobId
      });
    }

    return result;
  } catch (err: any) {
    await prisma.job.update({
      where: { id: data.jobId },
      data: {
        status: "FAILED",
        error: String(err?.message ?? err)
      }
    });

    // ✅ на ошибке тоже снимаем lock (иначе пользователь застрянет)
    if (data.tgUserId) {
      await redis.del(`tg:ready:${data.tgUserId}`);
    }

    throw err;
  } finally {
    await fsp.unlink(zipPath).catch(() => {});
  }
}
