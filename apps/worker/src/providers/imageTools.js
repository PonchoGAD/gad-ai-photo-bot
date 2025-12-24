import * as fs from "node:fs/promises";
export async function upscaleImage(input, output) {
    // stub — можно подключить real ESRGAN / sharp
    await fs.copyFile(input, output);
}
//# sourceMappingURL=imageTools.js.map