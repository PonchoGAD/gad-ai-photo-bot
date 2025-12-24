// apps/tg-bot/src/flows/enhance.flow.ts
import { requirePro } from "../lib/proGuard.js";

export async function enhanceFlow(ctx: any) {
  const ok = await requirePro(ctx, "GEMINI_PRO");
  if (!ok) return;

  await ctx.reply("✨ Улучшаю изображение с помощью Gemini PRO…");
}
