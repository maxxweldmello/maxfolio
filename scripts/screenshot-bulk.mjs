import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/data/kayana-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { slug: "shop-product",  url: "http://localhost:3000/gb/shop/card-terminal" },
  { slug: "about",         url: "http://localhost:3000/gb/about" },
  { slug: "contact",       url: "http://localhost:3000/gb/contact" },
  { slug: "blog",          url: "http://localhost:3000/gb/blog" },
  { slug: "blog-post",     url: "http://localhost:3000/gb/blog/high-street-going-cashless" },
  { slug: "help",          url: "http://localhost:3000/gb/help" },
  { slug: "help-category", url: "http://localhost:3000/gb/help/charities" },
  { slug: "help-article",  url: "http://localhost:3000/gb/help/charities/stripe-troubleshooting" },
  { slug: "book-a-demo",   url: "http://localhost:3000/demo" },
];

const removeBadge = () => {
  document.querySelectorAll("body > *").forEach(el => {
    if (el.tagName.toLowerCase().includes("nextjs") || el.tagName === "NEXTJS-PORTAL") el.remove();
  });
};

const browser = await chromium.launch();

for (const { slug, url } of PAGES) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);
    for (const sel of ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")']) {
      try { const b = page.locator(sel).first(); if (await b.isVisible({ timeout: 400 })) { await b.click(); await page.waitForTimeout(300); break; } } catch {}
    }
    await page.evaluate(removeBadge);
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT_DIR, `${slug}.jpg`), type: "jpeg", quality: 88, fullPage: true });
    console.log(`✓ ${slug}`);
  } catch (err) {
    console.error(`✗ ${slug}: ${err.message.split("\n")[0]}`);
  }
  await page.close();
}

await browser.close();
console.log("done");
