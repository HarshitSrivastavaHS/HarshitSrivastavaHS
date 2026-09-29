import { chromium } from "playwright";
import chromiumBinary from "@sparticuz/chromium";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFile } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = await chromiumBinary.executablePath();
const fontConfig = "/tmp/portfolio-fonts.conf";
await writeFile(fontConfig, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/tmp/fonts/fonts</dir><cachedir>/tmp/portfolio-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfig;
const browser = await chromium.launch({ args: chromiumBinary.args, executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(root, "images/social-preview.svg")).href, { waitUntil: "load" });
await page.screenshot({ path: resolve(root, "images/social-preview.png"), type: "png" });
await browser.close();
console.log("Generated images/social-preview.png");
