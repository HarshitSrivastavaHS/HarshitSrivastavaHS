import { chromium } from "playwright";
import chromiumBinary from "@sparticuz/chromium";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFile } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "resume/index.html");
const output = resolve(root, "assets/Harshit-Srivastava-Resume.pdf");
const fontConfig = "/tmp/portfolio-fonts.conf";
const executablePath = await chromiumBinary.executablePath();
await writeFile(fontConfig, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/tmp/fonts/fonts</dir><cachedir>/tmp/portfolio-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfig;
const browser = await chromium.launch({
  args: chromiumBinary.args,
  executablePath,
  headless: true
});
const page = await browser.newPage();
await page.goto(pathToFileURL(source).href, { waitUntil: "networkidle" });
await page.addStyleTag({ content: `html, body { font-family: "Open Sans", sans-serif !important; }` });
await page.emulateMedia({ media: "print" });
await page.pdf({ path: output, format: "Letter", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();
console.log(`Generated ${output}`);
