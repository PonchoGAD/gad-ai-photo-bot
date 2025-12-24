import { Queue } from "bullmq";
/**
 * Orchestrator:
 * - формирует пачку RENDER_TEMPLATE задач
 * - затем ставит EXPORT_ZIP
 * Возвращает zipKey (финальный артефакт).
 */
export declare function createCardsOrchestrator(queue: Queue, payload: any): Promise<{
    zipKey: string;
    keys: string[];
}>;
export declare const createCardsJob: typeof createCardsOrchestrator;
//# sourceMappingURL=createCards.job.d.ts.map