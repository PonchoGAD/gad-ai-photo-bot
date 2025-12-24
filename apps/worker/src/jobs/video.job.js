import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { getFilePath, putFile } from "@gad/storage";
export async function videoJob(imageKeys, outKey) {
    const listPath = path.join(os.tmpdir(), "list.txt");
    const outPath = path.join(os.tmpdir(), "video.mp4");
    const files = await Promise.all(imageKeys.map(k => getFilePath(k)));
    await fs.writeFile(listPath, files.map((f) => `file '${f}'\nduration 1`).join("\n"));
    await new Promise((res, rej) => execFile("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-pix_fmt", "yuv420p", outPath], err => err ? rej(err) : res(null)));
    await putFile(outPath, outKey, "video/mp4");
}
//# sourceMappingURL=video.job.js.map