// apps/tg-bot/src/lib/waitForJob.ts

// ✅ Prisma — ТОЛЬКО singleton
import { prisma } from "@gad/db"

/**
 * Ожидаем завершение job (DONE / FAILED)
 * Простая polling-логика для MVP
 */
export async function waitForJobResult(params: {
  jobId: string;
  timeoutMs?: number;
  intervalMs?: number;
}) {
  const {
    jobId,
    timeoutMs = 10 * 60_000, // 10 минут
    intervalMs = 2_000
  } = params;

  const startedAt = Date.now();

  while (true) {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error("JOB_NOT_FOUND");
    }

    if (job.status === "DONE") {
      return job;
    }

    if (job.status === "FAILED") {
      throw new Error(job.error ?? "JOB_FAILED");
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("JOB_TIMEOUT");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
