// apps/worker/src/providers/imageTools.ts
import * as fs from "node:fs/promises";

export async function upscaleImage(input: string, output: string) {
  // stub — позже подключим real ESRGAN / sharp
  await fs.copyFile(input, output);
  return output;
}
