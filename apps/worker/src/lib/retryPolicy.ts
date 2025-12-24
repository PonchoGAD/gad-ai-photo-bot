// apps/worker/src/lib/retryPolicy.ts
import type { JobsOptions } from "bullmq";
import type { JobName } from "@gad/queue-names";

export function getJobOptions(job: JobName): JobsOptions {
  const base: JobsOptions = {
    removeOnComplete: 200,
    removeOnFail: false
  };

  switch (job) {
    case "gemini_card":
      return { ...base, attempts: 3, backoff: { type: "exponential", delay: 5000 } };

    case "export_zip":
      return { ...base, attempts: 3, backoff: { type: "fixed", delay: 2000 } };

    case "render_template":
    case "preprocess":
    case "background":
      return { ...base, attempts: 3, backoff: { type: "fixed", delay: 1500 } };

    case "video":
      return { ...base, attempts: 2, backoff: { type: "fixed", delay: 5000 } };

    case "create_cards":
      return { ...base, attempts: 1 };

    default:
      return base;
  }
}
