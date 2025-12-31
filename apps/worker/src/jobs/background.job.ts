// apps/worker/src/jobs/background.job.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import { putFile } from "@gad/storage";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();




export type BackgroundJobPayload = {
  inputPath: string;
  outKey: string;
  color?: string; // позже (WHITE/GRADIENT/SCENE)
  jobId?: string;
};

export async function backgroundJob(data: BackgroundJobPayload) {
  const tmp = path.join(os.tmpdir(), `bg-${Date.now()}.png`);

  try {
    // TODO: реальный background removal/replace (следующий блок ядра)
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
