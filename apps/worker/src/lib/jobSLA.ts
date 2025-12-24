// apps/worker/src/lib/jobSLA.ts
import type { JobName } from "@gad/queue-names";

/**
 * SLA / timeouts для job.
 * Мы НЕ убиваем процесс принудительно (это опасно),
 * но:
 * - ограничиваем ожидания
 * - маркируем ошибкой "SLA_TIMEOUT"
 * - используем это для refund policy / ретраев
 */

export type JobSLA = {
  /**
   * Максимальное время выполнения job в ms
   */
  timeoutMs: number;

  /**
   * Считаем ли таймаут "refundable" (как FAIL)
   */
  refundableOnTimeout: boolean;
};

export function getJobSLA(job: JobName): JobSLA {
  switch (job) {
    case "gemini_card":
      return { timeoutMs: 90_000, refundableOnTimeout: true };

// batch — это orchestration, SLA считается по внутренним jobs


    case "video":
      return { timeoutMs: 5 * 60_000, refundableOnTimeout: true };

    case "export_zip":
      return { timeoutMs: 2 * 60_000, refundableOnTimeout: false };

    case "render_template":
      return { timeoutMs: 60_000, refundableOnTimeout: false };

    case "preprocess":
    case "background":
      return { timeoutMs: 60_000, refundableOnTimeout: false };

    case "create_cards":
      return { timeoutMs: 10 * 60_000, refundableOnTimeout: false };

    default:
      return { timeoutMs: 2 * 60_000, refundableOnTimeout: false };
  }
}

/**
 * Обёртка SLA вокруг async handler.
 * Если превышаем timeout — кидаем SLA_TIMEOUT.
 */
export async function withSLA<T>(
  job: JobName,
  fn: () => Promise<T>
): Promise<T> {
  const { timeoutMs } = getJobSLA(job);

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error("SLA_TIMEOUT"), { code: "SLA_TIMEOUT" }));
    }, timeoutMs);

    fn()
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
