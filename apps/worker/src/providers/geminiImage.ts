// apps/worker/src/providers/geminiImage.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs/promises";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type InlineDataPart = {
  inlineData: {
    data: string;
    mimeType?: string;
  };
};

function isInlineDataPart(x: any): x is InlineDataPart {
  return !!x && typeof x === "object" && !!x.inlineData && typeof x.inlineData.data === "string";
}

export async function geminiImageEdit(opts: {
  prompt: string;
  inputImagePath: string;
  premium?: boolean;
}): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

  const modelName = opts.premium
    ? process.env.GEMINI_MODEL_IMAGE_PRO
    : process.env.GEMINI_MODEL_IMAGE;

  if (!modelName) throw new Error("GEMINI_MODEL_MISSING");

  const model = genAI.getGenerativeModel({ model: modelName });

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

  if (!isInlineDataPart(part)) {
    throw new Error("GEMINI_NO_IMAGE_OUTPUT");
  }

  return Buffer.from(part.inlineData.data, "base64");
}
