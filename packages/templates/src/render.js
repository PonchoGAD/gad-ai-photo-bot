import path from "node:path";
import * as fs from "node:fs/promises";
import { chromium } from "playwright";
export async function renderHtmlToPng(opts) {
    const htmlRaw = await fs.readFile(opts.htmlPath, "utf8");
    // супер простой инжект (в проде лучше ejs/handlebars)
    const html = htmlRaw
        .replaceAll("{{TITLE}}", escapeHtml(opts.payload.title))
        .replaceAll("{{SUBTITLE}}", escapeHtml(opts.payload.subtitle ?? ""))
        .replaceAll("{{BRAND}}", escapeHtml(opts.payload.brand ?? ""))
        .replaceAll("{{COLOR}}", escapeHtml(opts.payload.colorName ?? ""))
        .replaceAll("{{IMAGE_URL}}", opts.payload.imageUrl)
        .replaceAll("{{FEATURES}}", opts.payload.features.map(f => `<li>${escapeHtml(f)}</li>`).join(""))
        .replaceAll("{{SPECS}}", Object.entries(opts.payload.specs).map(([k, v]) => `<div><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</div>`).join(""));
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: opts.outputPath, type: "png", fullPage: true });
    await browser.close();
}
function escapeHtml(s) {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
//# sourceMappingURL=render.js.map