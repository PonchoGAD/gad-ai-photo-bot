import { Client } from "minio";
import * as fs from "node:fs/promises";
const client = new Client({
    endPoint: (process.env.S3_ENDPOINT ?? "http://localhost:9000").replace("http://", "").replace("https://", ""),
    useSSL: (process.env.S3_ENDPOINT ?? "").startsWith("https://"),
    accessKey: process.env.S3_ACCESS_KEY ?? "minio",
    secretKey: process.env.S3_SECRET_KEY ?? "minio123456"
});
const bucket = process.env.S3_BUCKET ?? "gad-bot";
export async function ensureBucket() {
    const exists = await client.bucketExists(bucket).catch(() => false);
    if (!exists)
        await client.makeBucket(bucket, process.env.S3_REGION ?? "us-east-1");
}
export async function putFile(localPath, key, contentType) {
    await ensureBucket();
    const buf = await fs.readFile(localPath);
    await client.putObject(bucket, key, buf, buf.length, contentType ? { "Content-Type": contentType } : undefined);
    return key;
}
export async function presignedGet(key, expirySec = 3600) {
    await ensureBucket();
    return client.presignedGetObject(bucket, key, expirySec);
}
//# sourceMappingURL=storageS3.js.map