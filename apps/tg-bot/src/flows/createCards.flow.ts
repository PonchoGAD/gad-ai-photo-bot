// apps/tg-bot/src/flows/createCards.flow.ts
import type { Context } from "telegraf";
import { Queue } from "bullmq";
import { JOBS } from "@gad/queue-names";

import { enforceCredits } from "@gad/billing/enforce";
import { requirePro } from "../lib/proGuard.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();


function normalizeTgMessageId(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  // tg message_id целое
  return Math.trunc(n);
}

export async function createCardsFlow(queue: Queue, payload: any) {
  const user = await prisma.user.findUnique({
    where: { telegramId: String(payload.tgUserId) }
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const ctx: Context | null = payload.ctx ?? null;

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

  await enforceCredits({
    userId: user.id,
    job: JOBS.CREATE_CARDS,
    payload
  });

  // ✅ persist TG context in DB
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
