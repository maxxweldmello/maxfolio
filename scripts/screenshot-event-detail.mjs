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

await page.goto("http://localhost:3000/gb/discover-events/london-event-for-dogs", {
  waitUntil: "load",
  timeout: 60000,
});
await page.waitForTimeout(2000);

// Dismiss cookie banner
for (const sel of ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")']) {
  try {
    const b = page.locator(sel).first();
    if (await b.isVisible({ timeout: 500 })) { await b.click(); await page.waitForTimeout(400); break; }
  } catch {}
}
await page.waitForTimeout(400);

// DOM injection
await page.evaluate(() => {
  // ── 0. Remove Next.js dev error badge ──
  for (const sel of [
    "nextjs-portal",
    "[data-nextjs-dialog-overlay]",
    "[data-nextjs-toast]",
    ".__next-error-overlay-toast",
    "body > nextjs-portal",
  ]) {
    document.querySelectorAll(sel).forEach(el => el.remove());
  }
  // Also remove shadow-dom portals
  document.querySelectorAll("body > *").forEach(el => {
    if (el.tagName.toLowerCase().includes("nextjs") || el.shadowRoot) {
      const inner = el.shadowRoot?.querySelector("[data-nextjs-toast], [class*='toast'], [class*='error-overlay']");
      if (inner || el.tagName.toLowerCase().includes("nextjs")) el.remove();
    }
  });

  // ── 1. Remove entire "Who's registered" section ──
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn;
  while ((tn = tw.nextNode())) {
    if (/who.?s registered/i.test(tn.textContent)) {
      // Walk up to find the section card/container to remove
      let el = tn.parentElement;
      while (el && el !== document.body) {
        const tag = el.tagName;
        // Stop at a card-level container (has padding/border or is a section)
        if (["SECTION","ARTICLE"].includes(tag) ||
            (tag === "DIV" && el.parentElement && el.parentElement.children.length >= 2)) {
          el.remove();
          break;
        }
        el = el.parentElement;
      }
      break;
    }
  }

  // ── 2. Replace images with dogs-walking photo (skip header/nav logo) ──
  const dogImg = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1000&auto=format&fit=crop";
  document.querySelectorAll("img").forEach(img => {
    if (img.closest("header, nav, [role='navigation']")) return;
    const w = img.naturalWidth, h = img.naturalHeight;
    if (w > 0 && w < 50 && h > 0 && h < 50) return;
    img.src = dogImg;
    img.srcset = "";
  });

  // ── 3. About this event: replace description ──
  const aboutDesc =
    "London Event for Dogs is a sponsored charity walk raising vital funds for animal welfare organisations across the UK. " +
    "Participants walk alongside their four-legged companions through scenic London parks, collecting pledges from friends and family. " +
    "Every pound raised goes directly towards rescue shelters and veterinary care for neglected animals.";

  for (const el of document.querySelectorAll("h2, h3, h4, strong, b")) {
    if (/about this event/i.test(el.textContent.trim())) {
      let sib = el.nextElementSibling;
      if (!sib) sib = el.parentElement?.nextElementSibling;
      if (sib) {
        const p = sib.tagName === "P" ? sib : (sib.querySelector("p") ?? sib);
        p.textContent = aboutDesc;
      }
      break;
    }
  }
});

await page.waitForTimeout(300);
await page.screenshot({
  path: join(OUT_DIR, "event-detail.jpg"),
  type: "jpeg",
  quality: 88,
  fullPage: true,
});

await browser.close();
console.log("done → event-detail.jpg");
