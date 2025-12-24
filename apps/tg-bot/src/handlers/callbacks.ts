// apps/tg-bot/src/handlers/callbacks.ts
import { Context } from "telegraf";
import { requirePro } from "../lib/proGuard.js";

export async function handleCallback(ctx: Context) {
  const data =
    ctx.callbackQuery && "data" in ctx.callbackQuery
      ? ctx.callbackQuery.data
      : null;

  if (!data) return;

  switch (data) {
    case "create_cards":
      // FREE можно
      await ctx.reply("📦 Пришлите фото товара");
      break;

    case "enhance":
      // FREE можно
      await ctx.reply("✨ Пришлите фото для улучшения");
      break;

    case "background":
      // PRO-only
      if (!(await requirePro(ctx, "BATCH_PROCESSING"))) return;
      await ctx.reply("🎨 Пришлите фото для удаления фона");
      break;

    case "video":
      // PRO-only
      if (!(await requirePro(ctx, "VIDEO"))) return;
      await ctx.reply("🎬 Пришлите фото/видео");
      break;

    case "BILLING_HOME":
      await ctx.reply("💳 Открываю биллинг…");
      break;

    default:
      await ctx.reply("Неизвестная команда");
  }
}
