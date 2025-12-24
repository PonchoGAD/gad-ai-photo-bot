import { Client } from "minio";
import fs from "node:fs/promises";
const client = new Client({
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: "minio",
    secretKey: "minio123456"
});
const BUCKET = "gad-bot";
async function ensure() {
    const exists = await client.bucketExists(BUCKET).catch(() => false);
    if (!exists)
        await client.makeBucket(BUCKET, "us-east-1");
}
export async function saveFile() {
    return true;
}
export async function putFile(filePath, key, contentType) {
    await ensure();
    const buf = await fs.readFile(filePath);
    await client.putObject(BUCKET, key, buf, buf.length, {
        "Content-Type": contentType ?? "application/octet-stream"
    });
}
export async function getFileStream(key) {
    throw new Error("not implemented");
}
export async function presign(key, expires) {
    return `https://example.com/${key}`;
}
//# sourceMappingURL=index.js.map