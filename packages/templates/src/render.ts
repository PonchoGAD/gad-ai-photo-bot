import * as path from "node:path";
import * as fs from "node:fs/promises";
import { chromium } from "playwright";
import type { RenderPayload } from "./schema.js";

export async function renderHtmlToPng(opts: {
  htmlPath: string;
  payload: RenderPayload;
  width: number;
  height: number;
  outputPath: string;
}) {
  // path тут оставлен не зря — часто понадобится дальше (packs, baseDir, etc)
  const htmlRaw = await fs.readFile(opts.htmlPath, "utf8");

  const html = htmlRaw
    .replaceAll("{{TITLE}}", escapeHtml(opts.payload.title))
    .replaceAll("{{SUBTITLE}}", escapeHtml(opts.payload.subtitle ?? ""))
    .replaceAll("{{BRAND}}", escapeHtml(opts.payload.brand ?? ""))
    .replaceAll("{{COLOR}}", escapeHtml(opts.payload.colorName ?? ""))
    .replaceAll("{{IMAGE_URL}}", opts.payload.imageUrl)
    .replaceAll(
      "{{FEATURES}}",
      (opts.payload.features ?? [])
        .map((f) => `<li>${escapeHtml(f)}</li>`)
        .join("")
    )
    .replaceAll(
      "{{SPECS}}",
      Object.entries(opts.payload.specs ?? {})
        .map(([k, v]) => `<div><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</div>`)
        .join("")
    );

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: opts.width, height: opts.height }
  });

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: opts.outputPath, type: "png", fullPage: true });

  await browser.close();
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
