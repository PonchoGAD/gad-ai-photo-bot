// apps/worker/src/admin/dlq.ts
import "dotenv/config";
import { Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";

import { redisConnection } from "../queue/redis.js";
import { QUEUES } from "@gad/queue-names";

const DLQ_NAME = "gad_dlq";

type DlqPayload = {
  jobName: string;
  jobId?: string;
  userId?: string;
  tgUserId?: number;
  payload?: any;
  error?: string;
  attempts?: number;
  attemptsMade?: number;
};

const prisma = new PrismaClient();

const dlq = new Queue<DlqPayload>(DLQ_NAME, {
  connection: redisConnection()
});

/* ============================
   HELPERS
============================ */

function printJob(job: any) {
  console.log("────────────────────────────");
  console.log("DLQ ID:        ", job.id);
  console.log("Job Name:      ", job.data?.jobName);
  console.log("Original JobId:", job.data?.jobId);
  console.log(
    "Attempts:      ",
    job.data?.attemptsMade,
    "/",
    job.data?.attempts
  );
  console.log("User ID:       ", job.data?.userId);
  console.log("TG User ID:    ", job.data?.tgUserId);
  console.log("Error:");
  console.log(job.data?.error);
  console.log("Payload:");
  console.dir(job.data?.payload, { depth: 4 });
}

/* ============================
   COMMANDS
============================ */

async function listDlq() {
  const jobs = await dlq.getJobs(["waiting", "failed", "delayed"]);

  if (jobs.length === 0) {
    console.log("✅ DLQ пустая");
    return;
  }

  console.log(`🔥 DLQ jobs: ${jobs.length}`);

  for (const job of jobs) {
    printJob(job);
  }
}

async function retryJob(dlqId: string) {
  const job = await dlq.getJob(dlqId);

  if (!job) {
    console.error("❌ DLQ job not found:", dlqId);
    return;
  }

  const { jobName, jobId, payload } = job.data ?? {};

  if (!jobName || !payload || !jobId) {
    console.error("❌ Invalid DLQ payload (missing jobName / jobId / payload)");
    return;
  }

  console.log("♻️ Requeue job:", jobName, "jobId:", jobId);

  // 🔁 reset Job state (VALID enum values only)
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "QUEUED",
      error: null,
      tgDeliveryStatus: "PENDING",
      tgDeliveryError: null,
      tgDeliveredAt: null
    }
  });

  // 🟢 MAIN QUEUE (единая очередь воркера)
  const mainQueue = new Queue(QUEUES.MAIN, {
    connection: redisConnection()
  });

  // ⚠️ ВАЖНО: сохраняем тот же jobId
  await mainQueue.add(
    jobName,
    {
      ...payload,
      jobId
    },
    {
      attempts: job.data?.attempts ?? 3,
      removeOnComplete: 200,
      removeOnFail: 200
    }
  );

  // ❌ удаляем из DLQ только после успешного requeue
  await job.remove();

  console.log("✅ Job requeued with same jobId and removed from DLQ");
}

async function clearDlq() {
  await dlq.drain(true);
  console.log("🧹 DLQ очищена");
}

/* ============================
   CLI
============================ */

async function main() {
  const [, , cmd, arg] = process.argv;

  switch (cmd) {
    case "list":
      await listDlq();
      break;

    case "retry":
      if (!arg) {
        console.error("❌ Usage: retry <dlqJobId>");
        break;
      }
      await retryJob(arg);
      break;

    case "clear":
      await clearDlq();
      break;

    default:
      console.log(`
DLQ ADMIN

Usage:
  pnpm tsx src/admin/dlq.ts list
  pnpm tsx src/admin/dlq.ts retry <dlqJobId>
  pnpm tsx src/admin/dlq.ts clear
`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("DLQ admin error:", e);
  process.exit(1);
});
