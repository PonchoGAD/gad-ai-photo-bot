// apps/worker/src/worker.ts
import "dotenv/config";
import { Worker, Queue } from "bullmq";


import { redisConnection } from "./queue/redis.js";
import { JOBS, QUEUES } from "@gad/queue-names";
import type { JobName } from "@gad/queue-names";

import { debit, refund } from "@gad/billing/ledger";
import { estimateCost } from "@gad/billing/enforce";
import { decideRefundOnFail } from "@gad/billing/refundPolicy";
import { markJobStart, markJobEnd } from "./lib/metrics.js";

import { withSLA } from "./lib/jobSLA.js";
import { sendZipTgJob } from "./jobs/sendZipTg.job.js";

import { renderTemplateJob } from "./jobs/renderTemplate.job.js";
import { exportZipJob } from "./jobs/exportZip.job.js";
import { createCardsOrchestrator } from "./jobs/createCards.job.js";
import { preprocessJob } from "./jobs/preprocess.job.js";
import { backgroundJob } from "./jobs/background.job.js";
import { geminiCardJob } from "./jobs/geminiCard.job.js";
import { videoJob } from "./jobs/video.job.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();


const queue = new Queue(QUEUES.MAIN, {
  connection: redisConnection()
});

// 🔴 DLQ
const dlq = new Queue("gad_dlq", {
  connection: redisConnection()
});

console.log("Worker starting...");

function isKnownJobName(name: string): name is JobName {
  return Object.values(JOBS).includes(name as any);
}

new Worker(
  QUEUES.MAIN,
  async (job) => {
    const { userId, jobId, premium, batchMeta } = (job.data || {}) as any;

    const rawName = job.name;
    console.log("[WORKER] received job", rawName, job.data);

    let cost = 0;
    let costBreakdown: Record<string, number> | undefined;

    try {
      // 1️⃣ Job → RUNNING
      if (jobId) {
        await prisma.job.update({
          where: { id: jobId },
          data: { status: "RUNNING" }
        });

        await markJobStart(jobId);
      }

      // 2️⃣ Guard
      if (!isKnownJobName(rawName)) {
        throw new Error(`Unknown job: ${rawName}`);
      }
      const jobName: JobName = rawName;

      // 3️⃣ 💰 DEBIT (only GEMINI)
      if (jobName === JOBS.GEMINI_CARD) {
        const estimated = estimateCost(jobName, { premium });
        cost = estimated.total;
        costBreakdown = estimated.breakdown;

        if (cost > 0) {
          await debit({
            userId,
            amount: cost,
            reason: `job:${jobName}`,
            meta: { breakdown: costBreakdown },
            jobId
          });
        }
      }

      // 4️⃣ EXECUTE
      const result = await withSLA(jobName, async () => {
        switch (jobName) {
          case JOBS.PREPROCESS:
            return preprocessJob(job.data);

          case JOBS.BACKGROUND:
            return backgroundJob(job.data);

          case JOBS.GEMINI_CARD:
            return geminiCardJob(job.data);

          case JOBS.RENDER_TEMPLATE:
            return renderTemplateJob(job.data);

          case JOBS.VIDEO:
            return videoJob(job.data);

          case JOBS.CREATE_CARDS:
            return createCardsOrchestrator(queue, job.data);

          case JOBS.EXPORT_ZIP:
            return exportZipJob(job.data);

          case JOBS.SEND_ZIP_TG:
            return sendZipTgJob(job.data);

          default:
            throw new Error(`Unhandled job: ${jobName}`);
        }
      });

      // ✅ metrics success
      if (jobId) {
        await markJobEnd({
          jobId,
          jobName,
          success: true,
          cost
        });
      }

      return result;
    } catch (err: any) {
      const errorMsg = String(err?.message ?? err);
      console.error("Job failed:", errorMsg);

      // A) DB FAILED
      if (jobId) {
        await prisma.job.update({
          where: { id: jobId },
          data: { status: "FAILED", error: errorMsg }
        });

        await markJobEnd({
          jobId,
          jobName: rawName,
          success: false,
          cost
        });
      }

      // B) refund
      if (userId && cost > 0 && isKnownJobName(rawName)) {
        const decision = decideRefundOnFail({ job: rawName, cost });

        if (decision.refundable) {
          await refund({
            userId,
            amount: decision.amount,
            reason: decision.reason,
            meta: {
              jobName: rawName,
              breakdown: costBreakdown,
              batchMeta
            },
            jobId
          });
        }
      }

      // C) DLQ (last attempt)
      const attempts = Number((job.opts as any)?.attempts ?? 1);
      const attemptsMade = Number((job as any)?.attemptsMade ?? 0);
      const isLastAttempt = attemptsMade + 1 >= attempts;

      if (isLastAttempt) {
        try {
          await dlq.add(
            "failed_job",
            {
              jobName: rawName,
              jobId,
              userId,
              payload: job.data,
              error: errorMsg,
              attempts,
              attemptsMade
            },
            { removeOnComplete: 200, removeOnFail: 200 }
          );
        } catch (e) {
          console.warn("[DLQ] push failed:", e);
        }
      }

      throw err;
    }
  },
  {
    connection: redisConnection(),
    concurrency: 4
  }
);

console.log("Worker ready.");
