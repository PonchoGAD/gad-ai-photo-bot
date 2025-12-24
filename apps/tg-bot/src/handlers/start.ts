import { Context } from "telegraf";
import { MESSAGES } from "../ui/messages.js";

export async function handleStart(ctx: Context) {
  await ctx.reply(MESSAGES.START, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🖼 Создать карточки", callback_data: "create_cards" }],
        [{ text: "✨ Улучшить фото", callback_data: "enhance" }],
        [{ text: "🎨 Удалить фон", callback_data: "background" }],
        [{ text: "🎬 Видео", callback_data: "video" }],
      ],
    },
  });
}
