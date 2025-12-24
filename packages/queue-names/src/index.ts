/**
 * Единый контракт имён очередей и job-name.
 *
 * Принцип:
 * - QUEUES.* - это реальное имя очереди в Redis (BullMQ queue name).
 * - JOBS.*   - это имя конкретной задачи (job.name).
 *
 * По умолчанию используем одну главную очередь QUEUES.MAIN.
 * Остальные очереди оставлены на будущее (если решишь развести нагрузку).
 */

export const QUEUES = {
  MAIN: "gad_main",

  // Optional (future split)
  CREATE_CARDS: "gad_create_cards",
  EXPORT_ZIP: "gad_export_zip",
  VIDEO: "gad_video",
  BACKGROUND: "gad_background"
} as const;

export const JOBS = {
  // orchestration
  CREATE_CARDS: "create_cards",

  // pipeline steps
  PREPROCESS: "preprocess",
  RENDER_TEMPLATE: "render_template",
  EXPORT_ZIP: "export_zip",
  VIDEO: "video",
  BACKGROUND: "background",
  ENHANCE: "enhance",
  SEND_ZIP_TG: "send_zip_tg", 

  // AI
  GEMINI_CARD: "gemini_card"
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];
export type JobName = typeof JOBS[keyof typeof JOBS];

/**
 * Backward/compat aliases:
 * если где-то остались старые ожидания QUEUE/JOB — проект не ломается.
 */
export const QUEUE = QUEUES;
export const JOB = JOBS;
