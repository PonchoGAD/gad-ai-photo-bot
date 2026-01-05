// apps/tg-bot/src/flows/background.flow.ts
import BullMQ from "bullmq";
const { Queue } = BullMQ;

import { JOBS } from "@gad/queue-names";
import { requirePro } from "../lib/proGuard.js";

export async function backgroundFlow(
  queue: InstanceType<typeof Queue>,
  payload: any
) {
  const ok = await requirePro(payload.ctx, "NO_WATERMARK");
  if (!ok) return;

  await queue.add(JOBS.BACKGROUND, payload);
}
