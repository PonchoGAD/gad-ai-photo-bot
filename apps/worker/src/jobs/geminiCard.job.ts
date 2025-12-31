import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import { putFile } from "@gad/storage";
import { geminiImageEdit } from "../providers/geminiImage.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();


export type GeminiCardJobPayload = {
  inputPath: string;
  prompt: string;
  outKey: string;
  premium: boolean;
  allowFallback?: boolean;
  jobId?: string;
};

export async function geminiCardJob(data: GeminiCardJobPayload) {
  const tmp = path.join(os.tmpdir(), `gemini-${Date.now()}.png`);

  try {
    let buf: Buffer;

    try {
      buf = await geminiImageEdit({
        prompt: data.prompt,
        inputImagePath: data.inputPath,
        premium: data.premium
      });
    } catch (err) {
      if (data.premium && data.allowFallback) {
        buf = await geminiImageEdit({
          prompt: data.prompt,
          inputImagePath: data.inputPath,
          premium: false
        });
      } else {
        throw err;
      }
    }

    await fs.writeFile(tmp, buf);
    await putFile(tmp, data.outKey, "image/png");

    const result = { key: data.outKey };

    if (data.jobId) {
      await prisma.job.update({
        where: { id: data.jobId },
        data: {
          status: "DONE",
          outputJson: result
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
