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

await page.goto("http://localhost:3000/gb/fundraisings", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);

for (const sel of ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")']) {
  try { const b = page.locator(sel).first(); if (await b.isVisible({ timeout: 500 })) { await b.click(); await page.waitForTimeout(400); break; } } catch {}
}
await page.waitForTimeout(400);

await page.evaluate(() => {
  // ── Remove Next.js dev badge ──
  document.querySelectorAll("body > *").forEach(el => {
    if (el.tagName.toLowerCase().includes("nextjs") || el.tagName === "NEXTJS-PORTAL") el.remove();
  });

  // ── Replace idea cards (Garden Party / Sponsored Walk / Jumble Sale) with charity-relevant ones ──
  const ideaCards = [
    {
      title: "Charity Gala Evening",
      desc: "Host an elegant fundraising dinner with live entertainment and a silent auction. A premium experience that inspires generous giving from your community.",
    },
    {
      title: "Sponsored Marathon",
      desc: "Rally supporters to run, walk, or cycle a set distance and collect pledges. Suits all fitness levels and brings the whole community together for a great cause.",
    },
    {
      title: "Online Giving Campaign",
      desc: "Launch a digital fundraising drive with social sharing tools, progress trackers, and personalised donation pages to reach a global audience in days.",
    },
  ];

  // Find all idea cards — they're <a> or <div> elements inside the ideas grid with a title + desc
  // Look for cards containing "Garden Party", "Sponsored Walk", "Jumble Sale"
  const ideaTitles = ["Garden Party", "Sponsored Walk", "Jumble Sale"];
  ideaTitles.forEach((oldTitle, i) => {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = tw.nextNode())) {
      if (tn.textContent.trim() === oldTitle) {
        // Replace title
        tn.textContent = ideaCards[i].title;
        // Find sibling desc paragraph
        let el = tn.parentElement;
        while (el) {
          const p = el.querySelector("p");
          if (p && p.textContent.trim().length > 20) {
            p.textContent = ideaCards[i].desc;
            break;
          }
          // Also try nextElementSibling
          if (el.nextElementSibling) {
            const np = el.nextElementSibling.querySelector?.("p") ?? el.nextElementSibling;
            if (np && /[A-Z]/.test(np.textContent?.[0] ?? "")) {
              np.textContent = ideaCards[i].desc;
              break;
            }
          }
          el = el.parentElement;
          if (el?.tagName === "SECTION") break;
        }
        break;
      }
    }
  });

  // ── Replace pill category labels ──
  const oldPills = ["Eco & Nature", "Shopping & Sales", "Arts & Entertainment", "Food & Drink", "Sports & Fitness"];
  const newPills = ["Community Events", "Sponsored Challenges", "Awareness Campaigns", "Online Fundraising", "Corporate Giving"];
  const tw0 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn0;
  while ((tn0 = tw0.nextNode())) {
    const idx = oldPills.indexOf(tn0.textContent.trim());
    if (idx !== -1) tn0.textContent = newPills[idx];
  }

  // ── Remove the "Eco & Nature ideas / Shopping & Sales ideas / ..." link row ──
  // It's the parent DIV of those anchor links
  const ideasLink = [...document.querySelectorAll("a")].find(a => /eco & nature ideas/i.test(a.textContent.trim()));
  if (ideasLink) ideasLink.parentElement?.remove();

  // ── Campaign cards section: show For Kids + 2 fake cards ──
  // Find "For Kids fundraising" card <A>
  let kidsCard = null;
  for (const a of document.querySelectorAll("a")) {
    if (/for kids fundraising/i.test(a.textContent) && a.closest("section")) {
      kidsCard = a;
      break;
    }
  }

  if (kidsCard) {
    const grid = kidsCard.parentElement;

    // Clone For Kids card twice with different content
    const fakeCards = [
      {
        title: "Help the Homeless",
        raised: "£3,240",
        goal: "£5,000",
        donors: "47 donors",
        pct: "65%",
        img: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&auto=format&fit=crop",
        tag: "Community",
        tagColor: "#7c3aed",
        tagBg: "#ede9fe",
      },
      {
        title: "Animal Rescue Fund",
        raised: "£1,870",
        goal: "£3,000",
        donors: "31 donors",
        pct: "62%",
        img: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&auto=format&fit=crop",
        tag: "Animals",
        tagColor: "#b45309",
        tagBg: "#fef3c7",
      },
    ];

    // Hide all other original cards
    [...grid.children].forEach(child => { if (child !== kidsCard) child.style.display = "none"; });

    // Clone BEFORE modifying — clones still have raw "£0" text nodes
    const clones = fakeCards.map(() => kidsCard.cloneNode(true));

    // Helper: fix amounts on a card that still has "£0" / "£1,000" / "0 donors" / "0%"
    const fixAmounts = (card, raisedAmt, goalAmt, donorsTxt, pctTxt) => {
      const tw = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = tw.nextNode())) {
        const v = n.textContent.trim();
        if (v === "£0") n.textContent = raisedAmt;
        else if (v === "£1,000") n.textContent = goalAmt;
        else if (v === "0 donors") n.textContent = donorsTxt;
        else if (v === "0%") n.textContent = pctTxt;
      }
      card.querySelectorAll("[style]").forEach(el => {
        if (/width:\s*0/.test(el.getAttribute("style") ?? "")) el.style.width = pctTxt;
      });
    };

    // Fix Kids card
    const kidsImg = kidsCard.querySelector("img");
    if (kidsImg) { kidsImg.src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop"; kidsImg.srcset = ""; }
    const kidsTag = kidsCard.querySelector("span");
    if (kidsTag && /personal/i.test(kidsTag.textContent)) { kidsTag.textContent = "Children"; kidsTag.style.color = "#0369a1"; kidsTag.style.background = "#e0f2fe"; }
    fixAmounts(kidsCard, "£2,140", "£4,000", "38 donors", "54%");

    // Build and append each clone with its own amounts
    fakeCards.forEach(({ title, raised, goal, donors, pct, img, tag, tagColor, tagBg }, i) => {
      const clone = clones[i];
      const cloneImg = clone.querySelector("img");
      if (cloneImg) { cloneImg.src = img; cloneImg.srcset = ""; }
      const cloneTag = clone.querySelector("span");
      if (cloneTag) { cloneTag.textContent = tag; cloneTag.style.color = tagColor; cloneTag.style.background = tagBg; }
      const cloneH3 = clone.querySelector("h3");
      if (cloneH3) cloneH3.textContent = title;
      fixAmounts(clone, raised, goal, donors, pct);
      grid.appendChild(clone);
    });
  }
});

await page.waitForTimeout(100);
await page.screenshot({
  path: join(OUT_DIR, "fundraisings.jpg"),
  type: "jpeg",
  quality: 88,
  fullPage: true,
});

await browser.close();
console.log("done → fundraisings.jpg");
