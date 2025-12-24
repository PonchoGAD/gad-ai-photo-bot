import { PrismaClient } from "@prisma/client";
import { presign } from "@gad/storage";
import type { Context } from "telegraf";

const prisma = new PrismaClient();

/**
 * MVP listener доставки результата job в TG
 * - polling по БД
 * - TG НЕ ждёт
 * - используется ТОЛЬКО после enqueue
 */
export async function deliverJobResultMvp(params: {
  ctx: Context;
  jobId: string;
  timeoutMs?: number;
  intervalMs?: number;
}) {
  const {
    ctx,
    jobId,
    timeoutMs = 10 * 60_000, // 10 минут
    intervalMs = 2_000
  } = params;

  const startedAt = Date.now();

  while (true) {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      await ctx.reply("❌ Задание не найдено.");
      return;
    }

    if (job.status === "FAILED") {
      await ctx.reply("❌ Ошибка при обработке задания.");
      return;
    }

    if (job.status === "DONE") {
      const out: any = job.outputJson ?? {};

      // 1️⃣ local fallback (если MinIO недоступен)
      if (out.localPath) {
        await ctx.replyWithDocument(
          { source: out.localPath },
          { caption: "📦 Готово! Архив с карточками." }
        );
        return;
      }

      // 2️⃣ если URL уже есть
      if (out.url) {
        await ctx.replyWithDocument(
          { url: out.url },
          { caption: "📦 Готово! Архив с карточками." }
        );
        return;
      }

      // 3️⃣ если есть только key — подписываем
      if (out.key || out.zipKey) {
        const key = out.key ?? out.zipKey;
        const url = await presign(key, 60 * 60);

        await ctx.replyWithDocument(
          { url },
          { caption: "📦 Готово! Архив с карточками." }
        );
        return;
      }

      await ctx.reply("⚠️ Архив собран, но результат не найден.");
      return;
    }

    if (Date.now() - startedAt > timeoutMs) {
      await ctx.reply("⏱ Обработка занимает больше времени. Попробуй позже.");
      return;
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
