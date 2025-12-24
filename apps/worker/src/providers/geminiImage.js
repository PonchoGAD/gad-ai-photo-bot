import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs/promises";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export async function geminiImageEdit(opts) {
    const model = genAI.getGenerativeModel({
        model: opts.premium
            ? process.env.GEMINI_MODEL_IMAGE_PRO
            : process.env.GEMINI_MODEL_IMAGE
    });
    const imageBytes = await fs.readFile(opts.inputImagePath);
    const result = await model.generateContent([
        opts.prompt,
        {
            inlineData: {
                mimeType: "image/png",
                data: imageBytes.toString("base64")
            }
        }
    ]);
    const part = result.response.candidates?.[0]?.content?.parts?.[0];
    if (!part || !("inlineData" in part)) {
        throw new Error("Gemini did not return image");
    }
    return Buffer.from(part.inlineData.data, "base64");
    return fs.readFile(opts.inputImagePath);
}
//# sourceMappingURL=geminiImage.js.map