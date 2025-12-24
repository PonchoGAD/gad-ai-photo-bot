import { Client } from "minio";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { createReadStream, createWriteStream } from "node:fs";

type StorageConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
};

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`STORAGE_ENV_MISSING:${name}`);
  return v;
}

function envInt(name: string, fallback?: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") {
    if (fallback == null) throw new Error(`STORAGE_ENV_MISSING:${name}`);
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`STORAGE_ENV_INVALID_INT:${name}`);
  return n;
}

function envBool(name: string, fallback?: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") {
    if (fallback == null) throw new Error(`STORAGE_ENV_MISSING:${name}`);
    return fallback;
  }
  return raw === "1" || raw.toLowerCase() === "true";
}

function getConfig(): StorageConfig {
  return {
    endPoint: env("MINIO_ENDPOINT", "localhost"),
    port: envInt("MINIO_PORT", 9000),
    useSSL: envBool("MINIO_USE_SSL", false),
    accessKey: env("MINIO_ACCESS_KEY", "minio"),
    secretKey: env("MINIO_SECRET_KEY", "minio123456"),
    bucket: env("MINIO_BUCKET", "gad-bot"),
    region: process.env.MINIO_REGION ?? "us-east-1"
  };
}

// клиент создаём лениво (чтобы тесты/линтер не падали без env)
let _client: Client | null = null;
function getClient(): { client: Client; cfg: StorageConfig } {
  const cfg = getConfig();
  if (!_client) {
    _client = new Client({
      endPoint: cfg.endPoint,
      port: cfg.port,
      useSSL: cfg.useSSL,
      accessKey: cfg.accessKey,
      secretKey: cfg.secretKey
    });
  }
  return { client: _client, cfg };
}

async function ensureBucket(): Promise<void> {
  const { client, cfg } = getClient();
  const exists = await client.bucketExists(cfg.bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(cfg.bucket, cfg.region ?? "us-east-1");
  }
}

export async function putFile(filePath: string, key: string, contentType?: string) {
  const { client, cfg } = getClient();
  await ensureBucket();

  const stat = await fs.stat(filePath);
  const stream = createReadStream(filePath);

  await client.putObject(cfg.bucket, key, stream, stat.size, {
    "Content-Type": contentType ?? "application/octet-stream"
  });

  return { key };
}

export async function getFileStream(key: string) {
  const { client, cfg } = getClient();
  await ensureBucket();
  return client.getObject(cfg.bucket, key);
}

export async function getFilePath(key: string): Promise<string> {
  const { client, cfg } = getClient();
  await ensureBucket();

  const tmpPath = path.join(os.tmpdir(), `gad-${Date.now()}-${path.basename(key)}`);

  const readStream = await client.getObject(cfg.bucket, key);
  const writeStream = createWriteStream(tmpPath);

  await new Promise<void>((resolve, reject) => {
    readStream.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    readStream.on("error", reject);
  });

  return tmpPath;
}

export async function presign(key: string, expiresSeconds: number) {
  const { client, cfg } = getClient();
  await ensureBucket();
  return client.presignedGetObject(cfg.bucket, key, expiresSeconds);
}
