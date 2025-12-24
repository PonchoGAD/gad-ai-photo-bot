import { Context } from "telegraf";
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { putFile } from "@gad/storage";

export async function uploadTelegramPhoto(ctx: Context, userId: string) {
  if (!("photo" in ctx.message!)) return null;

  const photo = ctx.message.photo.at(-1);
  if (!photo) return null;

  const file = await ctx.telegram.getFile(photo.file_id);
  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  const tmpPath = path.join(os.tmpdir(), `${photo.file_unique_id}.jpg`);
  const res = await axios.get(url, { responseType: "arraybuffer" });
  await fs.writeFile(tmpPath, res.data);

  const key = `uploads/${userId}/${Date.now()}.jpg`;
  await putFile(tmpPath, key, "image/jpeg");

  await fs.unlink(tmpPath).catch(() => {});
  return key;
}
