import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { geminiImageEdit } from "../providers/geminiImage";
import { putFile } from "@gad/storage";
export async function geminiCardJob(data) {
    const buf = await geminiImageEdit({
        prompt: data.prompt,
        inputImagePath: data.inputPath,
        premium: data.premium
    });
    const tmp = path.join(os.tmpdir(), "gemini.png");
    await fs.writeFile(tmp, buf);
    await putFile(tmp, data.outKey, "image/png");
}
//# sourceMappingURL=geminiCard.job.js.map