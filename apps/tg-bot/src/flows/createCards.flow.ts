// apps/tg-bot/src/flows/createCards.flow.ts

import type { Context } from "telegraf";

// ✅ BullMQ — ТОЛЬКО default import в NodeNext
import BullMQ from "bullmq";
const { Queue } = BullMQ;

import { JOBS } from "@gad/queue-names";
import { enforceCredits } from "@gad/billing/enforce";
import { requirePro } from "../lib/proGuard.js";

// ✅ Prisma — ТОЛЬКО singleton
import { prisma } from "@gad/db/prisma";

/**
 * Нормализация TG message_id
 */
function normalizeTgMessageId(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return Math.trunc(n);
}

/**
 * Flow: Create Cards
 */
export async function createCardsFlow(
  queue: InstanceType<typeof Queue>,
  payload: any
) {
  const user = await prisma.user.findUnique({
    where: { telegramId: String(payload.tgUserId) }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const ctx: Context | null = payload.ctx ?? null;

  // 🔐 PRO / PREMIUM guards
  if (ctx) {
    if (payload.premium === true) {
      const ok = await requirePro(ctx, "GEMINI_PRO");
      if (!ok) return;
    }

    if (payload.images?.length > 1) {
      const ok = await requirePro(ctx, "BATCH_PROCESSING");
      if (!ok) return;
    }
  }

  // 💰 Credits guard
  await enforceCredits({
    userId: user.id,
    job: JOBS.CREATE_CARDS,
    payload
  });

  // 🧾 Persist TG context
  const tgMessageId = normalizeTgMessageId(payload?.tgMessageId);

  const jobRecord = await prisma.job.create({
    data: {
      userId: user.id,
      type: "CREATE_CARDS",
      status: "QUEUED",
      inputJson: payload,
      tgMessageId,
      tgDeliveryStatus: "PENDING"
    }
  });

  // 🚀 Push job to queue
  await queue.add(
    JOBS.CREATE_CARDS,
    {
      ...payload,
      userId: user.id,
      jobId: jobRecord.id
    },
    {
      removeOnComplete: 200,
      removeOnFail: 200,
      attempts: 1
    }
  );

  return jobRecord;
}
