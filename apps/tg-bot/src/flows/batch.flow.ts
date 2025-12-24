// apps/tg-bot/src/flows/batch.flow.ts
import { Queue } from "bullmq";
import { JOBS } from "@gad/queue-names";
import { requirePro } from "../lib/proGuard.js";

export async function batchFlow(
  queue: Queue,
  payload: any
) {
  const ok = await requirePro(payload.ctx, "BATCH_PROCESSING");
  if (!ok) return;

await queue.add(JOBS.GEMINI_CARD, {
  ...payload,
  batch: true
});
}
