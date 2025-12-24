import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { putFile } from "@gad/storage";

/* ================= helpers ================= */

async function downloadToFile(url: string, outPath: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TG_DOWNLOAD_FAILED:${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
}

/* ================= public API ================= */

export async function uploadTelegramPhoto(params: {
  botToken: string;
  filePathOnTelegram: string; // getFile().file_path
  key: string;               // uploads/...
}): Promise<{ key: string }> {
  const url = `https://api.telegram.org/file/bot${params.botToken}/${params.filePathOnTelegram}`;

  const tmp = path.join(
    os.tmpdir(),
    `tg-${Date.now()}-${path.basename(params.key)}`
  );

  try {
    await downloadToFile(url, tmp);
    await putFile(tmp, params.key, "image/jpeg");
    return { key: params.key };
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}
