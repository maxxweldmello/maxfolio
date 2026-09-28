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

await page.goto("http://localhost:3000/gb/fundraise/for-kids-fundraising", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);

for (const sel of ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")']) {
  try { const b = page.locator(sel).first(); if (await b.isVisible({ timeout: 500 })) { await b.click(); await page.waitForTimeout(400); break; } } catch {}
}
await page.waitForTimeout(400);

await page.evaluate(() => {
  // Remove dev badge
  document.querySelectorAll("body > *").forEach(el => {
    if (el.tagName.toLowerCase().includes("nextjs") || el.tagName === "NEXTJS-PORTAL") el.remove();
  });

  const replacements = [
    // Names
    [/Maxwel Dmello/g, "James Okafor"],
    [/maxwel dmello/gi, "James Okafor"],
    [/Maxwel D\./g, "James O."],
    [/Sophie Williams/g, "James Okafor"],
    // Title
    [/For Kids fundraising/g, "Animal Rescue Fund"],
    [/Children's Education Fund/g, "Animal Rescue Fund"],
    // Description
    [/A Fundraising page for the kids in uk[^.]*\./g,
     "Raising funds to provide shelter, medical care, and rehoming support for rescued animals across the UK."],
    [/Raising funds to provide books[^.]*\./g,
     "Raising funds to provide shelter, medical care, and rehoming support for rescued animals across the UK."],
    // Amounts
    [/£0 raised/g, "£1,870 raised"],
    [/of £1,000/g, "of £3,000"],
    [/0 donors/g, "31 donors"],
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

  // ── Remove payment setup warning banner ──
  const warningEl = document.querySelector(".bg-amber-50");
  if (warningEl) warningEl.remove();

  // ── Switch selected amount from £20 → £10 ──
  document.querySelectorAll("button, [role='button']").forEach(btn => {
    const txt = btn.textContent.trim();
    if (txt === "£20") {
      btn.setAttribute("style", "background:#fff!important;border:1.5px solid #d1d5db!important;color:#374151!important;font-weight:500;border-radius:12px;padding:10px 18px;cursor:pointer;");
      // Nuke all classes that add green
      btn.className = [...btn.classList].filter(c => !/green|primary|selected|ring|focus/.test(c)).join(" ");
    }
    if (txt === "£10") {
      btn.setAttribute("style", "background:#fff!important;border:2px solid #16a34a!important;color:#16a34a!important;font-weight:600;border-radius:12px;padding:10px 18px;cursor:pointer;");
    }
  });

  // ── Inject ONLY the donate button before "Secured by Stripe · Kayana Aid" text ──
  const tw3 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn3;
  while ((tn3 = tw3.nextNode())) {
    if (/Secured by Stripe.*Kayana Aid/i.test(tn3.textContent)) {
      const stripeEl = tn3.parentElement;
      const btn = document.createElement("button");
      btn.style.cssText = "width:100%;background:#4ade80;color:#fff;font-weight:700;font-size:15px;padding:16px;border-radius:14px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;";
      btn.textContent = "Donate £10.00 →";
      stripeEl.parentElement?.insertBefore(btn, stripeEl);
      break;
    }
  }

  // ── Replace ALL non-icon images with animal rescue photo ──
  const animalImg = "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop";
  document.querySelectorAll("img").forEach(img => {
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute("width") || "0");
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute("height") || "0");
    // Skip tiny icons (logo, favicons etc.)
    if (w < 60 && h < 60) return;
    img.src = animalImg;
    img.srcset = "";
    img.style.objectFit = "cover";
  });

  // ── Update progress bar width ──
  const bars = document.querySelectorAll("[style*='width']");
  bars.forEach(b => {
    if (/width:\s*0%/.test(b.getAttribute("style") ?? "")) {
      b.style.width = "43%";
    }
  });
});

await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT_DIR, "fundraise.jpg"), type: "jpeg", quality: 88, fullPage: true });
await browser.close();
console.log("done → fundraise.jpg");
