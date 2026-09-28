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

await page.goto("http://localhost:3000/gb/fundraisings/ideas/eco-nature", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);

for (const sel of ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")']) {
  try { const b = page.locator(sel).first(); if (await b.isVisible({ timeout: 500 })) { await b.click(); await page.waitForTimeout(400); break; } } catch {}
}
await page.waitForTimeout(400);

await page.evaluate(() => {
  document.querySelectorAll("body > *").forEach(el => {
    if (el.tagName.toLowerCase().includes("nextjs") || el.tagName === "NEXTJS-PORTAL") el.remove();
  });

  const replacements = [
    [/Eco & Nature/g, "Community Fundraising"],
    [/eco & nature/gi, "Community Fundraising"],
    [/eco-nature/gi, "community-fundraising"],
    [/Browse ideas in this category — each comes with a step-by-step guide to help you plan, promote, and hit your target\./g,
     "Browse community fundraising ideas — each comes with a step-by-step guide to help your charity plan, promote, and reach its target."],
    [/Shopping & Sales/g, "Sponsored Challenges"],
    [/Arts & Entertainment/g, "Awareness Campaigns"],
    [/Food & Drink/g, "Online Fundraising"],
    [/Sports & Fitness/g, "Corporate Giving"],
    // Idea card titles if present
    [/Garden Party/g, "Charity Gala Evening"],
    [/Sponsored Walk/g, "Charity Marathon"],
    [/Jumble Sale/g, "Online Giving Drive"],
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
await page.screenshot({ path: join(OUT_DIR, "fundraising-idea-cat.jpg"), type: "jpeg", quality: 88, fullPage: true });
await browser.close();
console.log("done → fundraising-idea-cat.jpg");
