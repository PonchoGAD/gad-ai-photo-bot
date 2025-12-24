import * as archiver from "archiver";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { getFileStream, putFile, presign } from "@gad/storage";
export async function exportZipJob(data) {
    const zipPath = path.join(os.tmpdir(), `${Date.now()}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    for (const key of data.keys) {
        const stream = await getFileStream(key);
        archive.append(stream, { name: path.basename(key) });
    }
    await archive.finalize();
    await new Promise((res) => output.on("close", res));
    await putFile(zipPath, data.zipKey, "application/zip");
    const url = await presign(data.zipKey, 3600 * 24);
    return { url };
}
//# sourceMappingURL=exportZip.job.js.map