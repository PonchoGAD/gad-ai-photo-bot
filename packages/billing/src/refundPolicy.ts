import type { JobName } from "../../queue-names/src/index.js";

/**
 * Refund policy:
 * - Дорогие AI шаги: refund при FAIL
 * - Дешёвые системные: без refund
 * - Batch refund считается на уровне orchestrator (НЕ JobName)
 */

export type RefundDecision =
  | { refundable: false; reason: string }
  | { refundable: true; reason: string; amount: number };

/**
 * Какие job'ы вообще подлежат refund
 */
export function shouldRefundOnFail(job: JobName): boolean {
  if (job === "gemini_card") return true;
  if (job === "video") return true;
  return false;
}

/**
 * Частичный refund для batch (НЕ JobName!)
 * Вызывается orchestrator'ом напрямую
 */
export function getBatchRefund(params: {
  costTotal: number;
  total: number;
  failed: number;
}): number {
  const { costTotal, total, failed } = params;

  if (costTotal <= 0) return 0;
  if (total <= 0) return 0;
  if (failed <= 0) return 0;

  if (failed >= total) return costTotal;

  const raw = (costTotal * failed) / total;
  return Math.ceil(raw);
}

/**
 * Единая функция решения refund при FAIL job
 */
export function decideRefundOnFail(params: {
  job: JobName;
  cost: number;
}): RefundDecision {
  const { job, cost } = params;

  if (!shouldRefundOnFail(job)) {
    return { refundable: false, reason: "NOT_REFUNDABLE_JOB" };
  }

  if (!cost || cost <= 0) {
    return { refundable: false, reason: "NO_COST" };
  }

  return {
    refundable: true,
    reason: "FAIL_REFUND",
    amount: cost
  };
}
