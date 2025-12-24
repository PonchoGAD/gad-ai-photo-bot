// apps/worker/src/providers/storageS3.ts
import { Client } from "minio";
import * as fs from "node:fs/promises";

function parseEndpoint(endpoint: string) {
  // endpoint like: http://localhost:9000
  const url = new URL(endpoint);
  return {
    endPoint: url.hostname,
    port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
    useSSL: url.protocol === "https:"
  };
}

const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const { endPoint, port, useSSL } = parseEndpoint(endpoint);

const client = new Client({
  endPoint,
  port,
  useSSL,
  accessKey: process.env.S3_ACCESS_KEY ?? "minio",
  secretKey: process.env.S3_SECRET_KEY ?? "minio123456"
});

const bucket = process.env.S3_BUCKET ?? "gad-bot";

export async function ensureBucket() {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket, process.env.S3_REGION ?? "us-east-1");
  }
}

export async function putFile(localPath: string, key: string, contentType?: string) {
  await ensureBucket();
  const buf = await fs.readFile(localPath);

  await client.putObject(
    bucket,
    key,
    buf,
    buf.length,
    contentType ? { "Content-Type": contentType } : undefined
  );

  return key;
}

export async function presignedGet(key: string, expirySec = 3600) {
  await ensureBucket();
  return client.presignedGetObject(bucket, key, expirySec);
}
