import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { putFile } from "@gad/storage";
export async function backgroundJob(data) {
    const tmp = path.join(os.tmpdir(), `bg-${Date.now()}.png`);
    await fs.copyFile(data.inputPath, tmp);
    // TODO: реальное удаление фона
    await putFile(tmp, data.outKey, "image/png");
    await fs.unlink(tmp).catch(() => { });
    return { key: data.outKey };
}
//# sourceMappingURL=background.job.js.map