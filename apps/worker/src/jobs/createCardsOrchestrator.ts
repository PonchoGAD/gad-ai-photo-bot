import type { Queue } from "bullmq";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

import { JOBS } from "@gad/queue-names";
import { WB_PRESET } from "@gad/core/presets/wb";
import { OZON_PRESET } from "@gad/core/presets/ozon";
import { getJobOptions } from "../lib/retryPolicy.js";
import { redisConnection } from "../queue/redis.js";

const prisma = new PrismaClient();
const redis = new Redis(redisConnection() as any);

/**
 * CREATE_CARDS — ORCHESTRATOR
 *
 * ❗ ВАЖНО:
 * - НЕ ставит export_zip напрямую
 * - только:
 *   - enqueue render_template
 *   - init Redis counters
 *   - сохранить keys в Job.outputJson
 */
export async function createCardsOrchestrator(
  queue: Queue,
  payload: any
) {
  const preset =
    payload.marketplace === "WB" ? WB_PRESET : OZON_PRESET;

  const userId = payload.userId;
  const jobId = payload.jobId;
  const tgMessageId = payload.tgMessageId;

  if (!jobId) {
    throw new Error("JOB_ID_REQUIRED");
  }

  const templatePack = payload.templatePack ?? "minimal-dark";
  const cardsPerColor = Number(payload.cardsPerColor ?? 1);

  const colors = Array.isArray(payload.colors)
    ? payload.colors
    : [{ name: "Default" }];

  const images = Array.isArray(payload.images) ? payload.images : [];
  const firstImage = images[0];

  const imageUrl =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.url ??
        firstImage?.presignedUrl ??
        firstImage?.key;

  if (!imageUrl) {
    throw new Error("IMAGE_URL_REQUIRED");
  }

  const resultKeys: string[] = [];
  const expectedCount = colors.length * cardsPerColor;

  /* ============================
     INIT REDIS COUNTERS
  ============================ */

  await redis.set(`render:expected:${jobId}`, expectedCount);
  await redis.set(`render:done:${jobId}`, 0);

  /* ============================
     ENQUEUE RENDER JOBS
  ============================ */

  for (const color of colors) {
    for (let i = 0; i < cardsPerColor; i++) {
      const outKey = `results/${userId}/${color.name}-${i}.png`;

      await queue.add(
        JOBS.RENDER_TEMPLATE,
        {
          htmlPath: path.resolve(
            `packages/templates/packs/${templatePack}/layout.html`
          ),
          payload: {
            title: payload.productTitle ?? "Товар",
            subtitle: payload.category ?? "",
            features: payload.features ?? [],
            specs: payload.specs ?? {},
            imageUrl,
            colorName: color.name,
            brand: payload.brand ?? ""
          },
          width: preset.width,
          height: preset.height,
          outKey,
          jobId,
          tgMessageId
        },
        getJobOptions(JOBS.RENDER_TEMPLATE)
      );

      resultKeys.push(outKey);
    }
  }

  /* ============================
     SAVE META FOR EXPORT_ZIP
  ============================ */

  await prisma.job.update({
    where: { id: jobId },
    data: {
      outputJson: {
        render: {
          expected: expectedCount,
          keys: resultKeys
        }
      }
    }
  });

  return {
    expectedRenders: expectedCount
  };
}

export const createCardsJob = createCardsOrchestrator;
