// packages/billing/src/plans.ts
import type { JobName } from "../../queue-names/src/index.js";



/**
 * Единая модель тарифов и стоимости операций в credits.
 * Деньги (Stars / Crypto / Stripe) = пополнение credits.
 */

export type PlanId = "FREE" | "STARTER" | "PRO" | "STUDIO";

export type Plan = {
  id: PlanId;
  title: string;

  // credits, выдаваемые в начале периода
  monthlyCredits: number;

  // лимиты
  maxJobsPerDay: number;

  // фичи
  features: {
    proModels: boolean;
    batch: boolean;
    watermarkFree: boolean;
    priorityQueue: boolean;
  };
};

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    title: "Free",
    monthlyCredits: 50,
    maxJobsPerDay: 5,
    features: {
      proModels: false,
      batch: false,
      watermarkFree: false,
      priorityQueue: false
    }
  },

  STARTER: {
    id: "STARTER",
    title: "Starter",
    monthlyCredits: 200,
    maxJobsPerDay: 20,
    features: {
      proModels: false,
      batch: true,
      watermarkFree: false,
      priorityQueue: false
    }
  },

  PRO: {
    id: "PRO",
    title: "Pro",
    monthlyCredits: 500,
    maxJobsPerDay: 50,
    features: {
      proModels: true,
      batch: true,
      watermarkFree: true,
      priorityQueue: false
    }
  },

  STUDIO: {
    id: "STUDIO",
    title: "Studio",
    monthlyCredits: 3000,
    maxJobsPerDay: 500,
    features: {
      proModels: true,
      batch: true,
      watermarkFree: true,
      priorityQueue: true
    }
  }
};

/**
 * Базовые цены за шаги пайплайна (credits).
 */
export const CREDIT_PRICES: Record<string, number> = {
  // orchestration
  CREATE_CARDS: 0,

  // pipeline
  PREPROCESS: 1,
  RENDER_TEMPLATE: 1,
  EXPORT_ZIP: 1,
  VIDEO: 2,
  BACKGROUND: 2,
  ENHANCE: 2,

  // AI
  GEMINI_CARD_FREE: 5,
  GEMINI_CARD_PRO: 15
};

/**
 * Цена одного job без batch/мультипликаторов
 */
export function getBaseJobPrice(
  job: JobName,
  opts?: { premium?: boolean }
): number {
  if (job === "gemini_card") {
    return opts?.premium
      ? CREDIT_PRICES.GEMINI_CARD_PRO
      : CREDIT_PRICES.GEMINI_CARD_FREE;
  }

  const key = job.toUpperCase();
  return CREDIT_PRICES[key] ?? 0;
}

/**
 * Нужно ли делать refund при FAIL
 */
export function shouldRefundOnFail(job: JobName): boolean {
  if (job === "gemini_card") return true;
  return false;
}
