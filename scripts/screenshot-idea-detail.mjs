import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/data/kayana-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

await page.goto("http://localhost:3000/gb/fundraisings/ideas/eco-nature/sponsored-walk", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);

for (const sel of ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")']) {
  try { const b = page.locator(sel).first(); if (await b.isVisible({ timeout: 500 })) { await b.click(); await page.waitForTimeout(400); break; } } catch {}
}
await page.waitForTimeout(400);

await page.evaluate(() => {
  document.querySelectorAll("body > *").forEach(el => {
    if (el.tagName.toLowerCase().includes("nextjs") || el.tagName === "NEXTJS-PORTAL") el.remove();
  });

  // Remove language selector widget if present
  document.querySelectorAll("*").forEach(el => {
    if (el.children.length === 0 && /^Select Language$/i.test(el.textContent.trim())) {
      // Walk up to remove the whole widget
      let p = el.parentElement;
      while (p && p !== document.body) {
        if (p.parentElement === document.body || p.tagName === "SECTION") { p.remove(); break; }
        p = p.parentElement;
      }
    }
  });

  const replacements = [
    [/Sponsored Walk/g, "Charity Marathon Challenge"],
    [/sponsored walk/gi, "Charity Marathon Challenge"],
    [/Eco & Nature/g, "Community Fundraising"],
    [/eco & nature/gi, "Community Fundraising"],
    [/eco-nature/gi, "community-fundraising"],
    // Common placeholder descriptions that might appear
    [/Tackle a scenic route and get sponsored for every mile[^.]*\./g,
     "Rally supporters to run, walk, or cycle a set distance and collect pledges for your charity. A powerful way to bring the community together."],
    [/Walks suit all ages and fitness levels[^.]*\./g,
     "Suitable for all ages and fitness levels — from a 5K fun run to a full marathon, every step raises vital funds for your cause."],
    // Generic "how to" content replacements
    [/Set a distance/g, "Set your fundraising goal"],
    [/Get sponsors/g, "Recruit supporters"],
    [/Complete the walk/g, "Complete the challenge"],
  ];

  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn;
  while ((tn = tw.nextNode())) {
    let t = tn.textContent;
    let changed = false;
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(t)) { t = t.replace(pattern, replacement); changed = true; }
      pattern.lastIndex = 0;
    }
    if (changed) tn.textContent = t;
  }
});

await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT_DIR, "fundraising-idea.jpg"), type: "jpeg", quality: 88, fullPage: true });
await browser.close();
console.log("done → fundraising-idea.jpg");
