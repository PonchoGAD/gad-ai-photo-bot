
import type { JobName } from "@gad/queue-names";
import { PLANS, getBaseJobPrice } from "./plans.js";
import { debit } from "./ledger.js";
import type { PlanId, Plan } from "./plans.js";


import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();


/**
 * Расчёт стоимости job
 */
export function estimateCost(
  job: JobName,
  payload: any
): { total: number; breakdown: Record<string, number> } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  const base = getBaseJobPrice(job, {
    premium: payload?.premiumDesign
  });

  total += base;
  breakdown[job] = base;

  if (Array.isArray(payload?.images)) {
    total *= payload.images.length;
    breakdown["images"] = payload.images.length;
  }

  if (payload?.cardsPerColor) {
    total *= payload.cardsPerColor;
    breakdown["cardsPerColor"] = payload.cardsPerColor;
  }

  return { total, breakdown };
}

/**
 * 🔒 Главная точка входа billing
 */
export async function enforceCredits(params: {
  userId: string;
  job: JobName;
  payload: any;
  jobId?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId }
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.isBanned) throw new Error("USER_BANNED");

  const planId = user.plan as PlanId;
  const plan = PLANS[planId];

  if (!plan) {
    throw new Error(`PLAN_NOT_FOUND: ${user.plan}`);
  }

  if (params.payload?.premiumDesign && !plan.features.proModels) {
    throw new Error("UPGRADE_REQUIRED");
  }

  const { total, breakdown } = estimateCost(params.job, params.payload);

  // дальше код без изменений


  // ✅ КЛЮЧЕВОЙ ФИКС
  // Оркестратор / бесплатные job’ы не списывают кредиты
  if (total <= 0) {
    console.log("[BILLING] skip debit (zero cost)", {
      job: params.job,
      userId: user.id
    });

    return { total: 0, breakdown };
  }

  if (user.credits < total) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  await debit({
    userId: user.id,
    amount: total,
    reason: `job:${params.job}`,
    jobId: params.jobId,
    meta: {
      breakdown,
      payloadPreview: {
        images: params.payload?.images?.length ?? 0,
        cardsPerColor: params.payload?.cardsPerColor ?? 1
      }
    }
  });

  return { total, breakdown };
} 
