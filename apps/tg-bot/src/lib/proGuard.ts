// apps/tg-bot/src/lib/proGuard.ts
import type { Context } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { plansKb } from "../ui/keyboards.js";

const prisma = new PrismaClient();

/**
 * Тип PRO-фичи — для аналитики и UX
 */
export type ProFeature =
  | "GEMINI_PRO"
  | "BATCH_PROCESSING"
  | "VIDEO"
  | "NO_WATERMARK";

/**
 * Проверка: есть ли у пользователя PRO или STUDIO
 */
export function isProPlan(plan: string): boolean {
  return plan === "PRO" || plan === "STUDIO";
}

/**
 * 🔒 PRO-guard
 *
 * Использование:
 * if (!(await requirePro(ctx, "GEMINI_PRO"))) return;
 */
export async function requirePro(
  ctx: Context,
  feature: ProFeature
): Promise<boolean> {
  const tgId = ctx.from?.id;
  if (!tgId) return false;

  const user = await prisma.user.findUnique({
    where: { telegramId: String(tgId) },
    select: {
      plan: true,
      credits: true
    }
  });

  if (!user) {
    await ctx.reply("❌ Пользователь не найден.");
    return false;
  }

  if (isProPlan(user.plan)) {
    return true;
  }

  // ----------------------------
  // PAYWALL
  // ----------------------------
  await ctx.reply(
    buildPaywallMessage(feature, user.plan),
    {
      parse_mode: "Markdown",
      reply_markup: plansKb()
    }
  );

  return false;
}

/**
 * Тексты paywall под конкретную фичу
 */
function buildPaywallMessage(
  feature: ProFeature,
  currentPlan: string
): string {
  const featureText: Record<ProFeature, string> = {
    GEMINI_PRO: "🔮 *Gemini PRO (Nano Banana Pro)*",
    BATCH_PROCESSING: "📦 *Batch-обработка изображений*",
    VIDEO: "🎥 *Генерация видео*",
    NO_WATERMARK: "🚫 *Экспорт без watermark*"
  };

  return (
    `🚫 *Функция недоступна*\n\n` +
    `${featureText[feature]} доступна только на тарифах *PRO* и *STUDIO*.\n\n` +
    `Ваш текущий тариф: *${currentPlan}*\n\n` +
    `⬆️ Обновите тариф, чтобы разблокировать:\n` +
    `• более мощные модели\n` +
    `• batch-обработку\n` +
    `• приоритет в очереди\n` +
    `• коммерческое качество`
  );
}
