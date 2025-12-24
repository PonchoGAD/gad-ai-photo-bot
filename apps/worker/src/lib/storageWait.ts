// apps/worker/src/lib/storageWait.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getFilePath } from "@gad/storage";

type WaitOptions = {
  timeoutMs?: number;   // default 10s
  intervalMs?: number;  // default 500ms
};

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_INTERVAL = 500;

/**
 * Проверяет существование объекта в storage (MinIO),
 * fallback — .local-storage
 */
async function objectExists(key: string): Promise<boolean> {
  // 1️⃣ MinIO
  try {
    const p = await getFilePath(key);
    await fs.access(p);
    return true;
  } catch {}

  // 2️⃣ local-storage fallback
  try {
    const repoRoot = path.resolve(process.cwd(), "..", "..");
    const local = path.join(repoRoot, ".local-storage", key);
    await fs.access(local);
    return true;
  } catch {}

  return false;
}

/**
 * Ждёт появления объекта
 */
export async function waitUntilObjectExists(
  key: string,
  opts: WaitOptions = {}
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL;

  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (await objectExists(key)) {
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`STORAGE_OBJECT_NOT_READY:${key}`);
}

/**
 * Ждёт появления всех объектов
 */
export async function waitUntilObjectsExist(
  keys: string[],
  opts: WaitOptions = {}
): Promise<void> {
  for (const key of keys) {
    await waitUntilObjectExists(key, opts);
  }
}
