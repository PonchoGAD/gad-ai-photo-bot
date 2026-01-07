// apps/tg-bot/src/flows/billing.flow.ts
import type { Context } from "telegraf";
import { billingKb, plansKb, topupKb } from "../ui/keyboards.js";
import { prisma } from "@gad/db"

/**
 * Главный экран billing
 */
export async function billingHomeFlow(ctx: Context) {
  const tgId = String(ctx.from!.id);

  const user = await prisma.user.findUnique({
    where: { telegramId: tgId }
  });

  if (!user) {
    await ctx.reply("Пользователь не найден.");
    return;
  }

  await ctx.reply(
    `💳 *Ваш баланс*\n\n` +
    `Тариф: *${user.plan}*\n` +
    `Credits: *${user.credits}*\n`,
    {
      parse_mode: "Markdown",
      reply_markup: billingKb()
    }
  );
}

export async function billingPlansFlow(ctx: Context) {
  await ctx.reply(
    "⬆️ *Выберите тариф*\n\n" +
    "FREE — базовые функции\n" +
    "STARTER — batch, больше лимитов\n" +
    "PRO — Gemini PRO, без watermark\n" +
    "STUDIO — приоритет, большие объёмы\n",
    {
      parse_mode: "Markdown",
      reply_markup: plansKb()
    }
  );
}

export async function billingTopupFlow(ctx: Context) {
  await ctx.reply(
    "➕ *Пополнение баланса*\n\nВыберите способ оплаты:",
    {
      parse_mode: "Markdown",
      reply_markup: topupKb()
    }
  );
}
