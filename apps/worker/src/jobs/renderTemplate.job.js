import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { renderHtmlToPng } from "@gad/templates/render";
import { putFile } from "../providers/storageS3.js";
export async function renderTemplateJob(data) {
    const tmp = path.join(os.tmpdir(), `card-${Date.now()}.png`);
    await renderHtmlToPng({
        htmlPath: data.htmlPath,
        payload: data.payload,
        width: data.width,
        height: data.height,
        outputPath: tmp
    });
    await putFile(tmp, data.outKey, "image/png");
    await fs.unlink(tmp).catch(() => { });
    return { key: data.outKey };
}
//# sourceMappingURL=renderTemplate.job.js.map