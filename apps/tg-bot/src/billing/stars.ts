// apps/tg-bot/src/billing/stars.ts
import type { Context } from "telegraf";
import { credit } from "@gad/billing/ledger";
import { prisma } from "@gad/db/prisma";


export async function handleStarsPayment(ctx: Context) {
  const payment = (ctx.message as any)?.successful_payment;
  if (!payment) return;

  const tgId = String(ctx.from!.id);
  const stars = payment.total_amount;

  const user = await prisma.user.findUnique({
    where: { telegramId: tgId }
  });

  if (!user) {
    await ctx.reply("Ошибка: пользователь не найден.");
    return;
  }

  await credit({
    userId: user.id,
    amount: stars,
    reason: "STARS_TOPUP",
    meta: {
      telegramPaymentChargeId: payment.telegram_payment_charge_id
    }
  });

  await ctx.reply(
    `✅ Баланс пополнен!\n\n` +
    `⭐ Получено credits: ${stars}\n` +
    `Текущий баланс: ${user.credits + stars}`
  );
}
