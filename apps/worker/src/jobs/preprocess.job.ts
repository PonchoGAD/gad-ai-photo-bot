// apps/worker/src/jobs/preprocess.job.ts

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import { putFile } from "@gad/storage";
import { prisma } from "@gad/db/prisma";

export type PreprocessJobPayload = {
  inputPath: string; // локальный путь (пока так)
  outKey: string;    // ключ в storage (minio/s3)
  jobId?: string;    // Prisma Job.id (если есть — обновим outputJson)
};

export async function preprocessJob(data: PreprocessJobPayload) {
  const tmp = path.join(os.tmpdir(), `pre-${Date.now()}.png`);

  try {
    await fs.copyFile(data.inputPath, tmp);

    await putFile(tmp, data.outKey, "image/png");

    const result = { key: data.outKey };

    if (data.jobId) {
      await prisma.job.update({
        where: { id: data.jobId },
        data: {
          outputJson: result,
          status: "DONE"
        }
      });
    }

    return result;
  } catch (err: any) {
    if (data.jobId) {
      await prisma.job.update({
        where: { id: data.jobId },
        data: {
          status: "FAILED",
          error: String(err?.message ?? err)
        }
      });
    }
    throw err;
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}
