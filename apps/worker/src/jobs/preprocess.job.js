import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { putFile } from "@gad/storage";
export async function preprocessJob(data) {
    const tmp = path.join(os.tmpdir(), `pre-${Date.now()}.png`);
    await fs.copyFile(data.inputPath, tmp);
    await putFile(tmp, data.outKey, "image/png");
    await fs.unlink(tmp).catch(() => { });
    return { key: data.outKey };
}
//# sourceMappingURL=preprocess.job.js.map