import { readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const pages = ["index.html", "projects.html", "about.html", "playground.html", "404.html", "posters.html", "resume/index.html"];
const failures = [];

for (const name of pages) {
  const path = resolve(root, name);
  const html = await readFile(path, "utf8");
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${name}: missing title`);
  if (!/<html\s+lang="en"/.test(html)) failures.push(`${name}: missing document language`);
  if (!name.startsWith("resume/") && name !== "404.html" && name !== "posters.html" && (html.match(/<h1\b/g) || []).length !== 1) failures.push(`${name}: expected exactly one h1`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) failures.push(`${name}: duplicate ids ${[...new Set(duplicateIds)].join(", ")}`);
  if (!name.startsWith("resume/") && name !== "404.html" && name !== "posters.html" && !/name="description"/.test(html)) failures.push(`${name}: missing description`);
  if (/Galassia/i.test(html)) failures.push(`${name}: removed Galassia content is present`);
  if (/\b(TODO|placeholder|under construction)\b/i.test(html)) failures.push(`${name}: implementation-facing copy is present`);

  const attributes = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const value of attributes) {
    if (/^(?:https?:|mailto:|tel:|#|data:)/.test(value)) continue;
    const target = value.split(/[?#]/)[0];
    if (!target) continue;
    try { await stat(resolve(dirname(path), target)); }
    catch { failures.push(`${name}: missing local target ${value}`); }
  }
}

const projectsHtml = await readFile(resolve(root, "projects.html"), "utf8");
const expectedKmap = new Map([[0, 0], [1, 0], [2, 1], [3, 1], [4, 0], [5, 0], [6, 0], [7, 1]]);
for (const layout of ["desktop", "mobile"]) {
  const pattern = new RegExp(`data-kmap-layout="${layout}" data-minterm="([0-7])" data-value="([01])"`, "g");
  const cells = [...projectsHtml.matchAll(pattern)].map((match) => [Number(match[1]), Number(match[2])]);
  if (cells.length !== 8) failures.push(`K-Map ${layout}: expected 8 cells, found ${cells.length}`);
  const minterms = new Set(cells.map(([minterm]) => minterm));
  if (minterms.size !== 8) failures.push(`K-Map ${layout}: minterms must appear exactly once`);
  for (const [minterm, value] of cells) {
    if (expectedKmap.get(minterm) !== value) failures.push(`K-Map ${layout}: m${minterm} should be ${expectedKmap.get(minterm)}, found ${value}`);
  }
}
if (!projectsHtml.includes("Σm(2,3,7)") || !projectsHtml.includes("F = A′B + BC")) failures.push("K-Map: verified minterms or minimized SOP expression is missing");
const siteJs = await readFile(resolve(root, "assets/js/site.js"), "utf8");
const kmapExamples = [
  { minterms: [2, 3, 7], canonical: "Σm(2,3,7)", label: "F = A′B + BC", evaluate: (a, b, c) => (!a && b) || (b && c) },
  { minterms: [0, 1, 4, 5], canonical: "ΠM(2,3,6,7)", label: "F = B′", evaluate: (_a, b) => !b },
  { minterms: [0, 2, 4, 6], canonical: "Σm(0,2,4,6)", label: "F = C′", evaluate: (_a, _b, c) => !c }
];
for (const example of kmapExamples) {
  const actual = [];
  for (let a = 0; a <= 1; a += 1) for (let b = 0; b <= 1; b += 1) for (let c = 0; c <= 1; c += 1) {
    if (example.evaluate(a, b, c)) actual.push(4 * a + 2 * b + c);
  }
  if (actual.join(",") !== example.minterms.join(",")) failures.push(`K-Map: ${example.label} does not match its minterms`);
  if (!siteJs.includes(example.label) || !siteJs.includes(example.canonical)) failures.push(`K-Map: animated example ${example.label} is missing`);
}
if (!siteJs.includes('mode: "POS"') || !siteJs.includes('groupAction: "Group adjacent 0s"')) failures.push("K-Map: POS zero-grouping example is missing");

const pdf = await readFile(resolve(root, "assets/Harshit-Srivastava-Resume.pdf"));
const pageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
if (pageCount !== 2) failures.push(`résumé PDF: expected 2 pages, found ${pageCount}`);
if (pdf.length < 20000) failures.push(`résumé PDF: file is unexpectedly small (${pdf.length} bytes)`);

const social = await readFile(resolve(root, "images/social-preview.png"));
if (social.readUInt32BE(16) !== 1200 || social.readUInt32BE(20) !== 630) failures.push("social preview: expected 1200×630 PNG");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Checked ${pages.length} pages: local links and core content rules pass.`);
