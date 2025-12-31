import pkg from "@prisma/client";

const { PrismaClient, Prisma } = pkg;

const prisma = new PrismaClient();

/* ===============================
   TYPES
================================ */

type JobEndParams = {
  jobId: string;
  jobName: string;
  success: boolean;
  cost?: number;
};

type RangeParams = {
  from: Date;
  to: Date;
};

export type TopJobRow = {
  jobId: string;
  userId: string;
  cost: number;
  durationMs: number | null;
  createdAt: Date;
};

/* ===============================
   WRITE METRICS (used by worker)
================================ */

/**
 * Фиксируем старт джобы
 * Используем updatedAt как start marker
 */
export async function markJobStart(jobId: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      updatedAt: new Date()
    }
  });
}

/**
 * Фиксируем завершение джобы + метрики
 */
export async function markJobEnd(params: JobEndParams) {
  const { jobId, jobName, success, cost } = params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      createdAt: true,
      outputJson: true
    }
  });

  if (!job) return;

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - job.createdAt.getTime();

  await prisma.job.update({
    where: { id: jobId },
    data: {
      outputJson: {
        ...(job.outputJson as Record<string, unknown>),
        jobName,
        metrics: {
          finishedAt: finishedAt.toISOString(),
          durationMs,
          success,
          cost: cost ?? 0
        }
      }
    }
  });
}

/* ===============================
   READ METRICS (used by admin)
================================ */

/**
 * Агрегаты за диапазон
 */
export async function getMetricsByRange({ from, to }: RangeParams) {
  const jobs = await prisma.job.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    select: {
      status: true,
      outputJson: true
    }
  });

  const totalJobs = jobs.length;

  let successJobs = 0;
  let failedJobs = 0;
  let totalDuration = 0;
  const durations: number[] = [];
  let totalCost = 0;

  for (const job of jobs) {
    const metrics = (job.outputJson as any)?.metrics;
    if (!metrics) continue;

    if (metrics.success) successJobs++;
    else failedJobs++;

    if (typeof metrics.durationMs === "number") {
      durations.push(metrics.durationMs);
      totalDuration += metrics.durationMs;
    }

    if (typeof metrics.cost === "number") {
      totalCost += metrics.cost;
    }
  }

  durations.sort((a, b) => a - b);
  const p95Index = Math.floor(durations.length * 0.95);
  const p95DurationMs = durations[p95Index] ?? 0;

  return {
    totalJobs,
    successJobs,
    failedJobs,
    successRate: totalJobs
      ? Number(((successJobs / totalJobs) * 100).toFixed(2))
      : 0,
    avgDurationMs: durations.length
      ? Math.round(totalDuration / durations.length)
      : 0,
    p95DurationMs,
    totalCost,
    avgCostPerJob: totalJobs
      ? Number((totalCost / totalJobs).toFixed(2))
      : 0
  };
}

/**
 * Метрики по дням (N последних дней)
 */
export async function getDailyMetrics(days: number) {
  const rows: {
    date: string;
    totalJobs: number;
    successJobs: number;
    failedJobs: number;
    successRate: number;
    avgDurationMs: number;
    totalCost: number;
  }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const from = new Date();
    from.setDate(from.getDate() - i);
    from.setHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setHours(23, 59, 59, 999);

    const m = await getMetricsByRange({ from, to });

    rows.push({
      date: from.toISOString().slice(0, 10),
      totalJobs: m.totalJobs,
      successJobs: m.successJobs,
      failedJobs: m.failedJobs,
      successRate: m.successRate,
      avgDurationMs: m.avgDurationMs,
      totalCost: m.totalCost
    });
  }

  return rows;
}

/**
 * Топ самых дорогих job
 */
export async function getTopExpensiveJobs(
  limit = 10
): Promise<TopJobRow[]> {
  const jobs: {
    id: string;
    userId: string;
    outputJson: unknown;
    createdAt: Date;
  }[] = await prisma.job.findMany({
    select: {
      id: true,
      userId: true,
      outputJson: true,
      createdAt: true
    }
  });

  const rows: TopJobRow[] = jobs
    .map((j) => {
      const metrics = (j.outputJson as any)?.metrics;

      if (!metrics || typeof metrics.cost !== "number") {
        return null;
      }

      return {
        jobId: j.id,
        userId: j.userId,
        cost: metrics.cost,
        durationMs:
          typeof metrics.durationMs === "number"
            ? metrics.durationMs
            : null,
        createdAt: j.createdAt
      };
    })
    .filter((j): j is TopJobRow => j !== null);

  rows.sort((a, b) => b.cost - a.cost);

  return rows.slice(0, limit);
}

