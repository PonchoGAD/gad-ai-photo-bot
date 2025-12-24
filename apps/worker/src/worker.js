import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { redisConnection } from "./queue/redis.js";
import { JOBS, QUEUES } from "./queue/names.js";
import { renderTemplateJob } from "./jobs/renderTemplate.job.js";
import { exportZipJob } from "./jobs/exportZip.job.js";
import { createCardsJob } from "./jobs/createCards.job.js";
const queue = new Queue(QUEUES.MAIN, {
    connection: redisConnection()
});
console.log("Worker starting...");
new Worker(QUEUES.MAIN, async (job) => {
    switch (job.name) {
        case JOBS.CREATE_CARDS:
            return createCardsJob(queue, job.data);
        case JOBS.RENDER_TEMPLATE:
            return renderTemplateJob(job.data);
        case JOBS.EXPORT_ZIP:
            return exportZipJob(job.data);
        default:
            throw new Error(`Unknown job: ${job.name}`);
    }
}, {
    connection: redisConnection(),
    concurrency: 4
});
console.log("Worker ready.");
//# sourceMappingURL=worker.js.map