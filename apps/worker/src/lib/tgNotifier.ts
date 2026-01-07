// apps/worker/src/lib/tgNotifier.ts
import { prisma } from "@gad/db"

/* ================== DB ================== */

/**
 * ВАЖНО:
 * - PrismaClient здесь НЕ создаём (singleton уже в @gad/db/prisma)
 * - prisma импортируем и используем только как shared instance
 * - В этом файле БД может использоваться для будущих сценариев логирования/статусов
 */

/* ================== TYPES ================== */

type NotifyDoneParams = {
  tgUserId?: number;
  tgMessageId?: number;
  jobName: string;
  jobId?: string;
};

type NotifyFailParams = {
  tgUserId?: number;
  tgMessageId?: number;
  jobName: string;
  jobId?: string;
  error: string;
};

type TelegramResponse<T = any> = {
  ok: boolean;
  result?: T;
};

/* ================== ENV ================== */

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`ENV_MISSING:${name}`);
  return v;
}

function getBotToken(): string {
  return (
    process.env.TG_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN ||
    env("TG_BOT_TOKEN")
  );
}

function tgApiBase(): string {
  return process.env.TG_API_BASE ?? "https://api.telegram.org";
}

/* ================== UTILS ================== */

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isTelegramFlood(err: string) {
  return err.includes("429") || err.includes("Too Many Requests");
}

function isMessageNotFound(err: string) {
  return err.toLowerCase().includes("message to edit not found");
}

async function withRetry<T>(
  fn: () => Promise<T>,
  tries = 5,
  baseDelay = 700
): Promise<T> {
  let lastErr: any;

  for (let i = 1; i <= tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? e);

      if (msg.includes("401") || msg.includes("403")) throw e;
      if (i === tries) throw e;

      const delay = isTelegramFlood(msg)
        ? 5000
        : baseDelay * Math.pow(2, i - 1);

      await sleep(delay);
    }
  }

  throw lastErr;
}

/* ================== TG CORE ================== */

async function tgCall<T = any>(
  method: string,
  body: any
): Promise<TelegramResponse<T>> {
  const token = getBotToken();
  const url = `${tgApiBase()}/bot${token}/${method}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = (await res.json().catch(() => null)) as TelegramResponse<T>;

  if (!res.ok || !json?.ok) {
    throw new Error(`TG_API_${res.status}:${method}:${JSON.stringify(json)}`);
  }

  return json;
}

async function editMessage(chatId: number, messageId: number, text: string) {
  return withRetry(() =>
    tgCall("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text
    })
  );
}

async function sendMessage(chatId: number, text: string) {
  return withRetry(() => tgCall("sendMessage", { chat_id: chatId, text }));
}

/* ================== PUBLIC API ================== */

export async function notifyJobDone(p: NotifyDoneParams): Promise<void> {
  if (!p.tgUserId || !p.jobId) return;

  // 🔔 ТОЛЬКО ПРОГРЕСС, БЕЗ ZIP
  if (p.jobName === "create_cards") {
    if (p.tgMessageId) {
      try {
        await editMessage(p.tgUserId, p.tgMessageId, "📦 Сборка архива…");
      } catch (e: any) {
        if (!isMessageNotFound(String(e?.message))) throw e;
      }
    }
  }

  // prisma оставлен доступным (singleton), но здесь не используется.
  // Если захочешь: можно логировать доставку статуса в БД без изменения контрактов.
  void prisma;
}

export async function notifyJobFailed(p: NotifyFailParams) {
  if (!p.tgUserId) return;

  const text = `❌ Ошибка при обработке\n${String(p.error).slice(0, 700)}`;

  if (p.tgMessageId) {
    try {
      await editMessage(p.tgUserId, p.tgMessageId, text);
      return;
    } catch {}
  }

  await sendMessage(p.tgUserId, text);
}
