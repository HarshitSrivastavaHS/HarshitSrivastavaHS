import { chromium } from "playwright";
import chromiumBinary from "@sparticuz/chromium";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "test-results");
await mkdir(output, { recursive: true });
const fontConfig = "/tmp/portfolio-fonts.conf";
const executablePath = await chromiumBinary.executablePath();
await writeFile(fontConfig, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/tmp/fonts/fonts</dir><cachedir>/tmp/portfolio-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfig;
const browser = await chromium.launch({ args: chromiumBinary.args, executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/, (route) => route.abort());
const cases = [
  ["home-desktop", "index.html", 1440, 900, 0],
  ["home-mobile", "index.html", 390, 844, 0],
  ["home-small-mobile", "index.html", 320, 700, 0],
  ["projects-desktop", "projects.html", 1440, 900, 0],
  ["projects-mobile", "projects.html", 390, 844, 0],
  ["project-scene-mobile", "projects.html", 390, 844, 700],
  ["project-scene", "projects.html", 1440, 900, 1150],
  ["about-desktop", "about.html", 1440, 900, 0],
  ["about-timeline", "about.html", 1440, 900, 1750],
  ["playground-desktop", "playground.html", 1440, 900, 0],
  ["playground-mobile", "playground.html", 430, 900, 0],
  ["playground-scrapbook", "playground.html", 1440, 900, 1000],
  ["resume-page", "resume/index.html", 816, 1056, 0],
  ["resume-page-two", "resume/index.html", 816, 1056, 1056]
];
const failures = [];
for (const [name, route, width, height, scrollY] of cases) {
  await page.setViewportSize({ width, height });
  page.removeAllListeners("pageerror");
  page.on("pageerror", (error) => failures.push(`${name}: ${error.message}`));
  await page.goto(`http://127.0.0.1:4173/${route}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: `* { font-family: "Open Sans", sans-serif !important; }` });
  if (scrollY) {
    await page.evaluate((position) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, position); }, scrollY);
    await page.waitForTimeout(100);
  }
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: false });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) failures.push(`${name}: horizontal overflow ${overflow}px`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "networkidle" });
const reducedState = await page.evaluate(() => ({
  wipe: getComputedStyle(document.querySelector(".page-wipe")).display,
  revealOpacity: getComputedStyle(document.querySelector("[data-reveal]")).opacity
}));
if (reducedState.wipe !== "none" || reducedState.revealOpacity !== "1") failures.push("reduced motion: static fallback did not apply");
const toggle = page.locator("[data-nav-toggle]");
await toggle.click();
await page.waitForTimeout(50);
if (await toggle.getAttribute("aria-expanded") !== "true") failures.push("mobile nav: toggle did not open menu");
if (!(await toggle.evaluate((node) => node === document.activeElement))) {
  const active = await page.evaluate(() => `${document.activeElement.tagName}.${document.activeElement.className}`);
  failures.push(`mobile nav: focus did not remain on disclosure button (active: ${active})`);
}
await page.keyboard.press("Escape");
if (await toggle.getAttribute("aria-expanded") !== "false") failures.push("mobile nav: Escape did not close menu");
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.close();
await browser.close();
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Rendered ${cases.length} viewport checks without page errors or horizontal overflow.`);
