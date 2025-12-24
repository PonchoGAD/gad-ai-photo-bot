// packages/billing/src/providers/crypto.ts
import { credit } from "../ledger.js";

/**
 * Обработка USDT платежа (TRC20 / ERC20)
 * amountUsd — уже подтверждённая сумма
 */
export async function processUsdtPayment(params: {
  userId: string;
  amountUsd: number;
  txHash: string;
}) {
  const { userId, amountUsd, txHash } = params;

  // 🔒 Idempotency — txHash
  const meta = { txHash };

  if (amountUsd >= 299) {
    return credit({
      userId,
      amount: 3000,
      reason: "USDT_STUDIO",
      meta
    });
  }

  if (amountUsd >= 79) {
    return credit({
      userId,
      amount: 600,
      reason: "USDT_PRO",
      meta
    });
  }

  if (amountUsd >= 19) {
    return credit({
      userId,
      amount: 120,
      reason: "USDT_STARTER",
      meta
    });
  }

  throw new Error("USDT_AMOUNT_TOO_LOW");
}
