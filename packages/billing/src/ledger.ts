// packages/billing/src/ledger.ts
import { prisma } from "@gad/db"

export type LedgerEntryType = "CREDIT" | "DEBIT" | "REFUND";
export type LedgerMeta = Record<string, any>;

/**
 * Ledger — append-only.
 * Никаких UPDATE / DELETE.
 */

export async function getBalance(userId: string): Promise<number> {
  const result = await prisma.ledgerEntry.aggregate({
    where: { userId },
    _sum: { delta: true }
  });

  return result._sum.delta ?? 0;
}

async function appendEntry(params: {
  userId: string;
  delta: number;
  type: LedgerEntryType;
  reason: string;
  meta?: LedgerMeta;
  jobId?: string;
}) {
  return prisma.ledgerEntry.create({
    data: {
      userId: params.userId,
      delta: params.delta,
      type: params.type,
      reason: params.reason,
      meta: params.meta ?? {},
      jobId: params.jobId
    }
  });
}

export async function credit(params: {
  userId: string;
  amount: number;
  reason: string;
  meta?: LedgerMeta;
}) {
  if (params.amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  await appendEntry({
    userId: params.userId,
    delta: params.amount,
    type: "CREDIT",
    reason: params.reason,
    meta: params.meta
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: { credits: { increment: params.amount } }
  });
}

export async function debit(params: {
  userId: string;
  amount: number;
  reason: string;
  meta?: LedgerMeta;
  jobId?: string;
}) {
  if (params.amount <= 0) {
    throw new Error("Debit amount must be positive");
  }

  const balance = await getBalance(params.userId);
  if (balance < params.amount) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  await appendEntry({
    userId: params.userId,
    delta: -params.amount,
    type: "DEBIT",
    reason: params.reason,
    meta: params.meta,
    jobId: params.jobId
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: { credits: { decrement: params.amount } }
  });
}

export async function refund(params: {
  userId: string;
  amount: number;
  reason: string;
  meta?: LedgerMeta;
  jobId?: string;
}) {
  if (params.amount <= 0) {
    throw new Error("Refund amount must be positive");
  }

  await appendEntry({
    userId: params.userId,
    delta: params.amount,
    type: "REFUND",
    reason: params.reason,
    meta: params.meta,
    jobId: params.jobId
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: { credits: { increment: params.amount } }
  });
}

/**
 * Backward compatibility
 */
export function addCredits(userId: string, amount: number, reason: string) {
  return credit({ userId, amount, reason });
}

/**
 * Ensure user exists (idempotent).
 */
export async function ensureUser(tgUserId: number) {
  const telegramId = String(tgUserId);

  const existing = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      telegramId,
      credits: 0,
      plan: "FREE"
    }
  });
}
