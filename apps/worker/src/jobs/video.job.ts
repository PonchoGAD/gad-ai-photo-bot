// apps/worker/src/jobs/video.job.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import { getFilePath, putFile } from "@gad/storage";
import { runFFmpeg } from "../providers/ffmpeg.js";
import { prisma } from "@gad/db/prisma";

export interface VideoJobPayload {
  imageKeys: string[];
  outKey: string;
  jobId?: string;
  secondsPerImage?: number; // default 1
}

export async function videoJob(data: VideoJobPayload) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-"));
  const listPath = path.join(tmpDir, "list.txt");
  const outPath = path.join(tmpDir, "out.mp4");

  try {
    const files = await Promise.all(
      data.imageKeys.map((k) => getFilePath(k))
    );

    const dur = Number(data.secondsPerImage ?? 1);

    // concat demuxer:
    // duration применяется к предыдущему file
    const lines: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      lines.push(`file '${String(f).replaceAll("'", "\\'")}'`);
      if (i < files.length - 1) {
        lines.push(`duration ${dur}`);
      }
    }

    await fs.writeFile(listPath, lines.join("\n"), "utf8");

    await runFFmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-vsync",
      "vfr",
      "-pix_fmt",
      "yuv420p",
      outPath
    ]);

    await putFile(outPath, data.outKey, "video/mp4");

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
    // cleanup tmp dir
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
