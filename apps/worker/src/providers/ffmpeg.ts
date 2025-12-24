// apps/worker/src/providers/ffmpeg.ts
import { spawn } from "node:child_process";

export function runFFmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const bin = process.env.FFMPEG_PATH ?? "ffmpeg";
    const p = spawn(bin, args, { stdio: "inherit" });

    p.on("error", (err) => reject(err));
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (code=${code})`));
    });
  });
}
