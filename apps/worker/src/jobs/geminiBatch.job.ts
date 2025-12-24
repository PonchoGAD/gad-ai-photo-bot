// apps/worker/src/jobs/geminiBatch.job.ts
import type { Queue, Job } from "bullmq";
import { QueueEvents } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { JOBS } from "@gad/queue-names";

const prisma = new PrismaClient();

/**
 * Payload для batch-обработки Gemini
 */
export type GeminiBatchJobPayload = {
  userId: string;
  jobId: string;
  images: Array<{
    inputPath: string;
    prompt: string;
    outKey: string;
  }>;

  premium: boolean;
  allowFallback?: boolean;

  costPerImage: number;
};

/**
 * Результат batch
 */
export type GeminiBatchResult = {
  keys: string[];
  failed: number;
  total: number;
};

/**
 * 🔥 Gemini Batch Orchestrator
 */
export async function geminiBatchJob(
  queue: Queue,
  data: GeminiBatchJobPayload
): Promise<GeminiBatchResult> {
  const { userId, jobId, images } = data;

  // 1️⃣ Job → RUNNING
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      inputJson: {
        imagesCount: images.length,
        premium: data.premium,
        costPerImage: data.costPerImage
      }
    }
  });

  // 2️⃣ QueueEvents
  const queueEvents = new QueueEvents(queue.name, {
    connection: (queue as any).opts?.connection
  });

  try {
    await queueEvents.waitUntilReady();

    // 3️⃣ fan-out
    const subJobs: Job[] = await Promise.all(
      images.map((img) =>
        queue.add(JOBS.GEMINI_CARD, {
          inputPath: img.inputPath,
          prompt: img.prompt,
          outKey: img.outKey,
          premium: data.premium,
          allowFallback: data.allowFallback ?? true,
          userId,
          parentJobId: jobId
        })
      )
    );

    // 4️⃣ fan-in
    const results = await Promise.allSettled(
      subJobs.map((job) => job.waitUntilFinished(queueEvents))
    );

    const keys: string[] = [];
    let failed = 0;

    for (const r of results) {
      if (r.status === "fulfilled" && (r.value as any)?.key) {
        keys.push((r.value as any).key);
      } else {
        failed++;
      }
    }

    // 5️⃣ Job → DONE / FAILED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: failed === images.length ? "FAILED" : "DONE",
        outputJson: { keys, failed, total: images.length }
      }
    });

    return { keys, failed, total: images.length };
  } finally {
    await queueEvents.close().catch(() => {});
  }
}
