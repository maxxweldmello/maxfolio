/**
 * screenshot-kayana.mjs
 * Screenshots every public kayanaaid page from the local dev server.
 * Run: node scripts/screenshot-kayana.mjs
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/data/kayana-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { slug: "home",                    url: "http://localhost:3000/gb" },
  { slug: "find-campaigns",          url: "http://localhost:3000/gb/find-campaigns" },
  { slug: "donate",                  url: "http://localhost:3000/donate/daanpeti-campaign" },
  { slug: "charity-page",            url: "http://localhost:3000/gb/charity/Daanpeti-Trusts" },
  { slug: "discover-events",         url: "http://localhost:3000/gb/discover-events" },
  { slug: "event-detail",            url: "http://localhost:3000/gb/discover-events/london-event-for-dogs" },
  { slug: "fundraisings",            url: "http://localhost:3000/gb/fundraisings" },
  { slug: "fundraise",               url: "http://localhost:3000/gb/fundraise/for-kids-fundraising" },
  { slug: "fundraising-idea-cat",    url: "http://localhost:3000/gb/fundraisings/ideas/eco-nature" },
  { slug: "fundraising-idea",        url: "http://localhost:3000/gb/fundraisings/ideas/eco-nature/sponsored-walk" },
  { slug: "shop",                    url: "http://localhost:3000/gb/shop" },
  { slug: "shop-product",            url: "http://localhost:3000/gb/shop/card-terminal" },
  { slug: "about",                   url: "http://localhost:3000/gb/about" },
  { slug: "contact",                 url: "http://localhost:3000/gb/contact" },
  { slug: "blog",                    url: "http://localhost:3000/gb/blog" },
  { slug: "blog-post",               url: "http://localhost:3000/blog/high-street-going-cashless" },
  { slug: "help",                    url: "http://localhost:3000/gb/help" },
  { slug: "help-category",           url: "http://localhost:3000/help/charities" },
  { slug: "help-article",            url: "http://localhost:3000/gb/help/charities/stripe-troubleshooting" },
  { slug: "book-a-demo",             url: "http://localhost:3000/demo" },
];

const VIEWPORT = { width: 1400, height: 875 }; // ~16:10

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  for (const { slug, url } of PAGES) {
    const dest = join(OUT_DIR, `${slug}.jpg`);
    console.log(`→ ${slug}  ${url}`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: dest,
        type: "jpeg",
        quality: 88,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });
      console.log(`   ✓ ${dest}`);
    } catch (err) {
      console.error(`   ✗ ${err.message}`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

run();
