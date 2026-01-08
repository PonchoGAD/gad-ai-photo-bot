// apps/worker/src/jobs/sendZipTg.job.ts

import { readZipAsBuffer } from "../lib/readZipAsBuffer.js";
import { prisma } from "@gad/db";

/* ================== ENV ================== */

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`ENV_MISSING:${name}`);
  return v;
}

const TG_API_BASE = process.env.TG_API_BASE ?? "https://api.telegram.org";

/* ================== TYPES ================== */

export type SendZipTgPayload = {
  jobId: string;
  tgUserId: number;
  tgMessageId?: number;
};

type TelegramResponse<T = any> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

/* ================== TG CALL ================== */

async function tgSendDocument(params: {
  token: string;
  chatId: number;
  buffer: Buffer;
  filename: string;
  caption?: string;
}): Promise<TelegramResponse<{ message_id: number }>> {
  const form = new FormData();

  form.append("chat_id", String(params.chatId));
  if (params.caption) form.append("caption", params.caption);

  const bytes = new Uint8Array(params.buffer);
  const blob = new Blob([bytes], { type: "application/zip" });
  form.append("document", blob, params.filename);

  const res = await fetch(
    `${TG_API_BASE}/bot${params.token}/sendDocument`,
    { method: "POST", body: form as any }
  );

  const json = (await res.json().catch(() => null)) as
    | TelegramResponse<any>
    | null;

  if (!res.ok || !json?.ok) {
    throw new Error(
      `TG_API_${res.status}:sendDocument:${JSON.stringify(json)}`
    );
  }

  return json as TelegramResponse<{ message_id: number }>;
}

/* ================== JOB ================== */

export async function sendZipTgJob(data: SendZipTgPayload) {
  const token = env("TG_BOT_TOKEN");

  const { jobId, tgUserId } = data;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new Error("JOB_NOT_FOUND");
  if (!job.outputJson) throw new Error("ZIP_NOT_READY");

  if (job.tgDeliveredAt) {
    console.log("[TG] skip delivery (already sent)", jobId);
    return;
  }

  const zipKey =
    (job.outputJson as any)?.zipKey ??
    (job.outputJson as any)?.key;

  if (!zipKey) throw new Error("ZIP_KEY_MISSING");

  const zipBuffer = await readZipAsBuffer(zipKey);

  const sent = await tgSendDocument({
    token,
    chatId: tgUserId,
    buffer: zipBuffer,
    filename: "cards.zip",
    caption: "✅ Архив с карточками готов",
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      tgDeliveredAt: new Date(),
      tgDeliveryStatus: "SENT",
      tgDeliveryError: null,
    },
  });

  console.log("[TG] ZIP delivered", {
    jobId,
    messageId: sent?.result?.message_id,
  });
}
