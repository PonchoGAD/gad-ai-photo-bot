// apps/worker/src/jobs/createCards.job.ts
import { Queue } from "bullmq";
import * as path from "node:path";
import { JOBS } from "@gad/queue-names";
import { WB_PRESET } from "@gad/core/presets/wb";
import { OZON_PRESET } from "@gad/core/presets/ozon";
/**
 * Orchestrator:
 * - формирует пачку RENDER_TEMPLATE задач
 * - затем ставит EXPORT_ZIP
 * Возвращает zipKey (финальный артефакт).
 */
export async function createCardsOrchestrator(queue, payload) {
    const preset = payload.marketplace === "WB" ? WB_PRESET : OZON_PRESET;
    const userId = payload.userId ??
        payload.user?.id ??
        payload.tgUserId ??
        "unknown";
    const templatePack = payload.templatePack ?? "minimal-dark";
    const cardsPerColor = Number(payload.cardsPerColor ?? 1);
    const colors = Array.isArray(payload.colors)
        ? payload.colors
        : [{ name: "Default" }];
    const images = Array.isArray(payload.images) ? payload.images : [];
    const firstImage = images[0];
    // Если у тебя image хранится как {key}, {url}, или строкой — поддержим всё
    const imageUrl = typeof firstImage === "string"
        ? firstImage
        : firstImage?.url ?? firstImage?.presignedUrl ?? firstImage?.key;
    const resultKeys = [];
    for (const color of colors) {
        for (let i = 0; i < cardsPerColor; i++) {
            const outKey = `results/${userId}/${color.name}-${i}.png`;
            await queue.add(JOBS.RENDER_TEMPLATE, {
                htmlPath: path.resolve(`packages/templates/packs/${templatePack}/layout.html`),
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
                outKey
            }, {
                removeOnComplete: 200,
                removeOnFail: 200
            });
            resultKeys.push(outKey);
        }
    }
    const zipKey = `exports/${userId}/${Date.now()}.zip`;
    await queue.add(JOBS.EXPORT_ZIP, { keys: resultKeys, zipKey }, {
        removeOnComplete: 200,
        removeOnFail: 200
    });
    return { zipKey, keys: resultKeys };
}
// alias на случай если где-то вызывали старое имя
export const createCardsJob = createCardsOrchestrator;
//# sourceMappingURL=createCards.job.js.map