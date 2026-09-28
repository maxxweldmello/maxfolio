import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { workData } from "@/data/work.data";
import { ArrowLeft, ArrowUpRight } from "@/components/icons";
import { MobileToc } from "./PageToc";
import PublicCarousel from "./PublicCarousel";
import FlowDiagram from "./flow/FlowDiagram";
import { charityFlowConfig, supporterFlowConfig, donorFlowConfig } from "./flow/flow-data";
import ResetScroll from "./ResetScroll";
import CharityWalkthroughs from "./CharityWalkthroughs";
import SupporterWalkthroughs from "./SupporterWalkthroughs";
import DonorWalkthroughs from "./DonorWalkthroughs";
import BackendArchitecture from "./BackendArchitecture";
import DataLayer from "./DataLayer";
import AuthenticationSection from "./AuthenticationSection";
import OnboardingSection from "./OnboardingSection";
import CampaignLifecycleSection from "./CampaignLifecycleSection";
import DonationFlowSection from "./DonationFlowSection";
import HardwareShopSection from "./HardwareShopSection";
import StaffTeamsSection from "./StaffTeamsSection";
import CustomBrandingSection from "./CustomBrandingSection";
import ReportProblemSection from "./ReportProblemSection";
import WebAdminSection from "./WebAdminSection";
import CmsGallery from "./CmsGalleryClient";

export const metadata: Metadata = {
  title: "Kayana Aid",
  description:
    "Full-stack donation platform for UK charities — Next.js 15 marketing site + Payload CMS, Spring Boot microservice backend, Stripe payments, HMRC Gift Aid, donor portal, charity admin, and hardware shop. Built solo.",
};

function locateProject() {
  for (const company of workData) {
    const project = company.projects.find((p) => p.id === "kayana-aid");
    if (project) return { company, project };
  }
  return null;
}

const TOC = [
  { id: "overview",   num: "01", label: "OVERVIEW" },
  { id: "stack",      num: "02", label: "TECH STACK" },
  { id: "public",     num: "03", label: "PUBLIC SITE" },
  { id: "cms",        num: "04", label: "CMS" },
  { id: "seo",        num: "05", label: "SEO & GROWTH" },
  { id: "charity",    num: "06", label: "CHARITY FLOW" },
  { id: "supporter",  num: "07", label: "SUPPORTER FLOW" },
  { id: "donor",      num: "08", label: "DONOR FLOW" },
  { id: "backend",    num: "09", label: "BACKEND & ARCHITECTURE" },
  { id: "conclusion", num: "10", label: "CONCLUSION" },
];

type Item = { title: string; desc: string };
type Group = { title: string; items: Item[] };

/* ── 2. Tech Stack ── */
const STACK_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Frontend",
    items: [
      "Next.js 15.4", "React 19.2", "TypeScript 5.4", "Tailwind 3.4",
      "Payload CMS 3.85 (Lexical editor, SEO plugin, S3 storage, Postgres adapter)",
      "NextAuth 4.24", "React Hook Form 7.51 + Zod 3.23",
      "Stripe.js + React Stripe.js (client-side Elements)",
      "Axios", "GraphQL", "Recharts", "jsPDF", "date-fns", "Sharp",
      "react-date-range", "react-phone-input-2", "lucide-react",
    ],
  },
  {
    title: "Backend",
    items: [
      "Spring Boot 3.5.5", "Java 21", "Spring WebFlux",
      "Spring Cloud Config", "Eureka client", "Spring Boot Admin client",
      "OpenFeign + feign-reactor (webclient/cloud)", "Resilience4j",
      "Spring Cloud Stream + Kafka (AWS MSK, IAM auth)",
      "Spring Data JPA", "QueryDSL", "Hibernate Spatial + JTS",
      "hypersistence-utils (jsonb mapping)", "MapStruct", "Lombok", "Postgres",
    ],
  },
  { title: "Payments", items: ["Stripe SDK (stripe-java v30)", "Stripe Connect", "Gift Aid (HMRC)"] },
  { title: "AWS",      items: ["S3 (media)", "SES / SNS (email + SMS)", "Cognito (identity pool)", "MSK (Kafka, IAM auth)", "ECR / ECS deploy"] },
];

/* ── 3. Public Site — hero four + the rest ── */
type PublicPage = { title: string; annotation?: string; desc: string; image: string | null; displayUrl?: string };
const S = (slug: string) => `/work/kayana-aid/marketing/${slug}.jpg`;
const PUBLIC_PAGES: PublicPage[] = [
  {
    title: "Home",
    annotation: "Hero → platform stats → featured campaigns → CTA",
    desc: "Marketing home — CMS-editable hero with cover image, live platform stats (total raised, donors, active campaigns), featured campaign cards, and a full-width CTA band. Every string pulled from the Pages global via `getPageContent('home')`.",
    image: S("home"),
    displayUrl: "kayanaaid.com",
  },
  {
    title: "Find Campaigns",
    annotation: "Search → category pills → card grid → pagination",
    desc: "Client-side directory of all active campaigns. Search bar, category pills, 3-column card grid with progress bars and charity logos. On a custom domain the middleware seeds per-charity branding and category set.",
    image: S("find-campaigns"),
    displayUrl: "kayanaaid.com/find-campaigns",
  },
  {
    title: "Donate",
    annotation: "Campaign → amount → Gift Aid → Stripe → confirmation",
    desc: "Server-rendered metadata + JSON-LD schema per campaign. Client-side Stripe Elements form with saved-card support, tip toggle, and inline Gift Aid opt-in. Post-submit polling renders the donation confirmation with a PDF receipt link.",
    image: S("donate"),
    displayUrl: "kayanaaid.com/donate/[campaign]",
  },
  {
    title: "Charity Page",
    annotation: "Hero → verified badge → live stats → Campaigns / Events / About tabs",
    desc: "Public profile for a charity — hero cover + logo, verified badge, live totals (raised, donors, active campaigns), and a tabbed view of the charity's own campaigns and events.",
    image: S("charity-page"),
    displayUrl: "kayanaaid.com/charity/[slug]",
  },
  {
    title: "Discover Events",
    annotation: "Search → filters → featured banner → event cards",
    desc: "Event discovery page — search input, category + date filters, a featured banner for the top result, and event cards with date badge, location, and registration count.",
    image: S("discover-events"),
    displayUrl: "kayanaaid.com/discover-events",
  },
  {
    title: "Event Detail",
    annotation: "Event info → register → map → organiser",
    desc: "Full event page — cover image, date/time/location, description rich text, registration CTA, embedded map, and organising charity card.",
    image: S("event-detail"),
    displayUrl: "kayanaaid.com/discover-events/[slug]",
  },
  {
    title: "Fundraisings",
    annotation: "Ideas directory → category grid → filter by type",
    desc: "Directory of fundraising ideas — category card grid, filter by personal / team / memorial, and legacy category paths that auto-redirect. Each category links to its ideas list.",
    image: S("fundraising-list"),
    displayUrl: "kayanaaid.com/fundraisings",
  },
  {
    title: "Fundraise",
    annotation: "Pick campaign → build page → set target → go live",
    desc: "Fundraising page creation wizard — heading, campaign picker, personal story editor, target amount, and cover-image upload. Saved as a fundraiser doc linked to the chosen campaign.",
    image: S("fundraise"),
    displayUrl: "kayanaaid.com/fundraise/[campaign]",
  },
  {
    title: "Fundraising Ideas",
    annotation: "Category → idea cards → CTA to create fundraiser",
    desc: "Category-level ideas page — hero with category name, grid of fundraising idea cards with descriptions and suggested targets, and a CTA to start a fundraising page for any idea.",
    image: S("fundraising-idea-category"),
    displayUrl: "kayanaaid.com/fundraisings/ideas/[category]",
  },
  {
    title: "Fundraising Idea Detail",
    annotation: "Idea → tips → suggested target → start fundraising",
    desc: "Single fundraising idea — cover image, step-by-step tips, suggested fundraising target, and a direct CTA linking into the Fundraise creation flow pre-seeded with the idea.",
    image: S("fundraising-idea"),
    displayUrl: "kayanaaid.com/fundraisings/ideas/[category]/[idea]",
  },
  {
    title: "Shop",
    annotation: "Hardware catalogue → quantity → region pricing → cart",
    desc: "Contactless donation hardware catalogue — product grid, quantity steppers, region-aware currency (GB/US/EU/AU), and a marketing overlay merged with live Stripe pricing.",
    image: S("shop"),
    displayUrl: "kayanaaid.com/shop",
  },
  {
    title: "Shop Product",
    annotation: "Product detail → specs → quantity → checkout",
    desc: "Single hardware product page — image carousel, spec table, quantity stepper with stock check, region-aware price, and a Stripe checkout CTA.",
    image: S("shop-product"),
    displayUrl: "kayanaaid.com/shop/[product]",
  },
  {
    title: "About",
    annotation: "Hero → stats → story → values → CTA",
    desc: "CMS-editable about page — hero, hero image, stats grid, two-column story, values pillars, a platform dark-band section and CTA. Every string pulled from `getPageContent('about')`.",
    image: S("about"),
    displayUrl: "kayanaaid.com/about",
  },
  {
    title: "Contact",
    annotation: "Copy + regional phones → ContactForm → CRM lead",
    desc: "Two-column layout: left copy with regional phone numbers and help-centre link; right embeds `ContactForm` which posts into the CRM leads endpoint.",
    image: S("contact"),
    displayUrl: "kayanaaid.com/contact",
  },
  {
    title: "Blog",
    annotation: "Featured post large → 3-column grid → categories",
    desc: "Blog index — featured doc renders full-width side-by-side at top, remaining posts in a 3-column card grid. Categories: Fundraising, Gift Aid, Events, Product.",
    image: S("blog"),
    displayUrl: "kayanaaid.com/blog",
  },
  {
    title: "Blog Post",
    annotation: "Article → rich text → related posts",
    desc: "Individual blog post — Lexical rich text, estimated read time, author card, and a related-posts strip at the bottom pulling from the same category.",
    image: S("blog-post"),
    displayUrl: "kayanaaid.com/blog/[slug]",
  },
  {
    title: "Help Centre",
    annotation: "Search → categories → article grid",
    desc: "Fetches articles via `getFlatItems('help')`, groups them by category, and hands the result to a client-side searchable grid component.",
    image: S("help"),
    displayUrl: "kayanaaid.com/help",
  },
  {
    title: "Help Category",
    annotation: "Category → article list → breadcrumb",
    desc: "Articles for a single help category — breadcrumb, article list with estimated read times, and a sidebar with all other categories.",
    image: S("help-category"),
    displayUrl: "kayanaaid.com/help/[category]",
  },
  {
    title: "Help Article",
    annotation: "Article → rich text → related articles",
    desc: "Individual help article — Lexical rich text body, breadcrumb trail, and a related-articles panel pulling from the same category.",
    image: S("help-article"),
    displayUrl: "kayanaaid.com/help/[category]/[article]",
  },
  {
    title: "Book a Demo",
    annotation: "CMS hero → what to expect → phone card → scheduling",
    desc: "CMS-editable demo booking page — hero, a 'what to expect' checklist, a regional phone card, and an embedded scheduling script for live demo bookings.",
    image: S("book-a-demo"),
    displayUrl: "kayanaaid.com/demo",
  },
];

/* ── 4. CMS — Payload ── */
const CMS_COLLECTIONS_ROW1: { name: string; desc: string }[] = [
  { name: "Pages",                desc: "Block builder + per-page CMS fields. Draft/publish workflow." },
  { name: "Media",                desc: "S3-backed uploads with Sharp image processing (resize, WebP)." },
  { name: "BlogPosts",            desc: "Title, slug, category, excerpt, cover image, author, Lexical body. Draft/publish." },
];

const CMS_COLLECTIONS_REST: { name: string; desc: string }[] = [
  { name: "HelpArticles",         desc: "Help centre articles linked to HelpCategories." },
  { name: "HelpCategories",       desc: "Top-level help centre sections, each with a slug." },
  { name: "FundraisingIdeas",     desc: "Fundraising idea cards nested under FundraisingCategories." },
  { name: "FundraisingCategories",desc: "Top-level fundraising idea categories." },
];

const CMS_SEO_COLLECTIONS: string[] = [
  "pages", "help-articles", "fundraising-ideas",
  "fundraising-categories", "help-categories", "blog-posts",
];


/* ── 5. SEO & Growth ── */
const SEO_STATS = [
  { label: "Regions", value: "7" },
  { label: "Audit Rounds", value: "4" },
  { label: "Sitemaps", value: "7" },
  { label: "Structured Data", value: "JSON-LD" },
];

/* Charity / Supporter / Donor flow data now lives in ./flow/flow-data.ts,
   rendered through the reusable <FlowDiagram /> component. */

/* ── Overview — persona diagram + detail panels ── */
type PersonaPhase = { label: string; items: string[] };
const PERSONAS: {
  title: string;
  role: string;
  tags: string[];
  phases: [PersonaPhase, PersonaPhase];
  route: { from: string; to: string; sub: string[] };
  accent: string;
}[] = [
  {
    title: "Charity",
    role: "Owner and staff, one shared dashboard",
    tags: ["campaigns", "events", "settings"],
    phases: [
      { label: "Get set up", items: ["Register & verify with an OTP", "Connect payments (Stripe)", "Wait for Kayana's approval"] },
      { label: "Run the charity", items: ["Launch campaigns & events with impact levels", "Track donations, fundraisers & reports", "Manage team, support desk & settings"] },
    ],
    route: { from: "SIGNUP", to: "LIVE", sub: ["13-step dashboard", "Draft until approved", "Then fully public"] },
    accent: "#c65b4e",
  },
  {
    title: "Supporter",
    role: "A donor who fundraises for a charity",
    tags: ["fundraising page", "team invites"],
    phases: [
      { label: "Start", items: ["Pick a live campaign", "Create a page — solo or team"] },
      { label: "Grow it", items: ["Set impact levels, own or the charity's", "Invite teammates by email", "Track total raised & leaderboard"] },
    ],
    route: { from: "CAMPAIGN", to: "PAGE", sub: ["Solo or team page", "Own impact levels", "Live leaderboard"] },
    accent: "#3f6fae",
  },
  {
    title: "Donor",
    role: "Gives money",
    tags: ["donate", "receipts"],
    phases: [
      { label: "Give", items: ["Browse campaigns, events & pages", "Donate by card, add Gift Aid"] },
      { label: "After", items: ["Get an instant receipt — email + PDF", "Optionally keep a donor account"] },
    ],
    route: { from: "BROWSE", to: "RECEIPT", sub: ["Card + Gift Aid", "Instant PDF receipt", "Cross-charity history"] },
    accent: "#4f9d63",
  },
];

const STATS: { label: string; value: string }[] = [
  { label: "Feature areas",           value: "7" },
  { label: "Public-facing pages",     value: "16" },
  { label: "Charity flow steps",      value: "13" },
  { label: "Supporter flow steps",    value: "5" },
  { label: "Donor flow stages",       value: "4" },
  { label: "Backend REST controllers", value: "15" },
  { label: "Payments",                value: "Stripe end to end" },
  { label: "Custom domains",          value: "White-label per charity" },
];

/* ══════════════════════ shared primitives ══════════════════════ */

function Chapter({
  id, num, title, action, children,
}: { id: string; num: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mt-28 md:mt-40">
      <div className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="mono" style={{ fontSize: "clamp(2.2rem, 4vw, 3.25rem)", color: "var(--accent)" }}>{num}</span>
          {action && <div className="flex items-center">{action}</div>}
          <h2
            className="font-light tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", color: "var(--ink)" }}
          >
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}


/* Collapsible detail row — used wherever long descriptions need to stay scannable */
function DetailRow({ title, desc, accent }: { title: string; desc: string; accent?: string }) {
  return (
    <details className="group py-3" style={{ borderBottom: "1px solid var(--rule)" }}>
      <summary
        className="mono flex items-center justify-between cursor-pointer list-none"
        style={{ fontSize: "13px", color: "var(--ink)" }}
      >
        <span>{title}</span>
        <span
          className="flex-shrink-0 transition-transform group-open:rotate-45"
          style={{ color: accent ?? "var(--accent)", fontSize: "14px" }}
          aria-hidden
        >
          +
        </span>
      </summary>
      <p className="mt-2.5" style={{ fontSize: "13.5px", lineHeight: 1.65, color: "var(--ink-70)" }}>
        {desc}
      </p>
    </details>
  );
}

/* ══════════════════════ 01 — Overview ══════════════════════ */

const ECOSYSTEM_KEYWORDS: Record<string, string[]> = {
  Charity: ["Register & verify", "Connect payments", "Get approved", "Launch campaigns"],
  Supporter: ["Pick a campaign", "Create a page", "Set impact levels", "Invite teammates"],
  Donor: ["Browse & discover", "Donate by card", "Get a receipt", "Check Donor's account"],
};

const GAUGE_NODES = [
  { x: 110, y: 150, key: "charity",   side: "left"  as const },
  { x: 300, y: 45,  key: "supporter", side: "top"   as const },
  { x: 490, y: 150, key: "donor",     side: "right" as const },
];
const GAUGE_MAIN = { x: 300, y: 225 };
const GAUGE_INK = "#221f1c";

/* circumcircle through the 3 arc nodes, so the band is a true circular arc */
function circumcircle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const ax2y2 = a.x * a.x + a.y * a.y;
  const bx2y2 = b.x * b.x + b.y * b.y;
  const cx2y2 = c.x * c.x + c.y * c.y;
  const ux = (ax2y2 * (b.y - c.y) + bx2y2 * (c.y - a.y) + cx2y2 * (a.y - b.y)) / d;
  const uy = (ax2y2 * (c.x - b.x) + bx2y2 * (a.x - c.x) + cx2y2 * (b.x - a.x)) / d;
  const r = Math.hypot(a.x - ux, a.y - uy);
  return { x: ux, y: uy, r };
}

function norm(a: number) {
  const twoPi = Math.PI * 2;
  return ((a % twoPi) + twoPi) % twoPi;
}

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const circle = circumcircle(a, b, c);
  const angleA = norm(Math.atan2(a.y - circle.y, a.x - circle.x));
  const angleB = norm(Math.atan2(b.y - circle.y, b.x - circle.x));
  const angleC = norm(Math.atan2(c.y - circle.y, c.x - circle.x));

  const ccwSpan = norm(angleC - angleA);
  const passesCCW = norm(angleB - angleA) <= ccwSpan;
  const sweep = passesCCW ? 1 : 0;
  const span = passesCCW ? ccwSpan : Math.PI * 2 - ccwSpan;
  const largeArc = span > Math.PI ? 1 : 0;

  return `M ${a.x} ${a.y} A ${circle.r} ${circle.r} 0 ${largeArc} ${sweep} ${c.x} ${c.y}`;
}

/* rotate the whole diagram so the Charity -> Main spoke lands perfectly horizontal */
const GAUGE_ROTATION = -(
  Math.atan2(GAUGE_MAIN.y - GAUGE_NODES[0].y, GAUGE_MAIN.x - GAUGE_NODES[0].x) * (180 / Math.PI)
);

/* wrap a long keyword onto a second line at a natural break, so detail text never overruns */
function wrapKeyword(k: string): string[] {
  if (k.length <= 22) return [k];
  for (const sep of [" & ", "/"]) {
    const idx = k.indexOf(sep);
    if (idx > -1) {
      return [k.slice(0, idx).trim(), k.slice(idx + sep.length).trim()];
    }
  }
  return [k];
}

function EcosystemDiagram() {
  return (
    <div className="mb-16">
      <div className="gauge-wrap max-w-[760px] mx-auto">
        <svg viewBox="-140 -100 900 450" style={{ width: "100%", height: "auto", display: "block" }} aria-hidden>
          <g transform={`rotate(${GAUGE_ROTATION} 300 150)`}>
            {/* thin spokes: main -> each node */}
            {GAUGE_NODES.map((n) => (
              <line
                key={n.key}
                x1={GAUGE_MAIN.x} y1={GAUGE_MAIN.y} x2={n.x} y2={n.y}
                stroke="var(--rule)" strokeWidth="1"
              />
            ))}

            {/* true circular arc through the three nodes */}
            <path
              d={arcPath(GAUGE_NODES[0], GAUGE_NODES[1], GAUGE_NODES[2])}
              fill="none"
              stroke={GAUGE_INK}
              strokeWidth="76"
              strokeLinecap="round"
            />

            {/* experience nodes — layered dark circles, white text, details attached to the outer side */}
            {PERSONAS.map((p, i) => {
              const n = GAUGE_NODES[i];
              return (
                <g key={p.title} data-node={n.key} style={{ cursor: "default" }}>
                  <circle cx={n.x} cy={n.y} r="38" fill={GAUGE_INK} />
                  <circle cx={n.x} cy={n.y} r="30" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  <g transform={`rotate(${-GAUGE_ROTATION} ${n.x} ${n.y})`}>
                    <text x={n.x} y={n.y + 4} textAnchor="middle" className="mono" fontSize="10.5" fill="#fff" letterSpacing="0.03em">
                      {p.title.toUpperCase()}
                    </text>
                    {(() => {
                      const items = ECOSYSTEM_KEYWORDS[p.title].slice(0, 4);
                      const wrapped = items.map(wrapKeyword);
                      const bulletLineCount = wrapped.reduce((sum, w) => sum + w.length, 0);
                      const blockX = n.side === "left" ? n.x - 214 : n.side === "right" ? n.x + 88 : n.x - 68;
                      const lines = bulletLineCount + 1; // heading + wrapped bullet lines
                      const baseY = n.side === "top" ? n.y - 62 - (lines - 1) * 16 : n.y - 24;

                      let row = 0;
                      return (
                        <>
                          <text x={blockX} y={baseY} textAnchor="start" className="mono" fontSize="10.5" fill={GAUGE_INK} letterSpacing="0.08em">
                            {`${p.title.toUpperCase()} FLOW`}
                          </text>
                          {wrapped.map((w) =>
                            w.map((line, li) => {
                              row += 1;
                              return (
                                <text
                                  key={`${line}-${li}`}
                                  x={blockX}
                                  y={baseY + row * 16}
                                  textAnchor="start"
                                  className="mono"
                                  fontSize="10"
                                  fill="var(--ink-45)"
                                >
                                  {li === 0 ? `• ${line}` : `  ${line}`}
                                </text>
                              );
                            })
                          )}
                        </>
                      );
                    })()}
                  </g>
                </g>
              );
            })}

            {/* main node */}
            <circle cx={GAUGE_MAIN.x} cy={GAUGE_MAIN.y} r="44" fill="var(--paper)" stroke={GAUGE_INK} strokeWidth="1.5" />
            <g transform={`rotate(${-GAUGE_ROTATION} ${GAUGE_MAIN.x} ${GAUGE_MAIN.y})`}>
              <text x={GAUGE_MAIN.x} y={GAUGE_MAIN.y + 4} textAnchor="middle" className="mono" fontSize="10.5" fill={GAUGE_INK} letterSpacing="0.02em">
                KAYANA AID
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════ 02 — Tech Stack ══════════════════════ */

function EngineeringLandscape() {
  return (
    <div>
      {STACK_GROUPS.map((g, i) => (
        <div key={g.title}>
          <div
            className="grid md:grid-cols-[170px_1fr] gap-4 md:gap-8 items-start py-7"
            style={{ borderBottom: "1px solid var(--rule)" }}
          >
            <p className="serif" style={{ fontSize: "1.35rem", color: "var(--ink)" }}>{g.title}</p>
            <ul className="flex flex-wrap gap-x-2 gap-y-2">
              {g.items.map((it) => (
                <li
                  key={it}
                  className="mono px-2.5 py-1"
                  style={{ fontSize: "12px", color: "var(--ink-70)", background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 3, whiteSpace: "nowrap" }}
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════ 03 — Public Site ══════════════════════ */

/* ══════════════════════ 04 — CMS ══════════════════════ */

function PointList({ points }: { points: string[] }) {
  return (
    <ul className="space-y-3">
      {points.map((point, i) => (
        <li key={i} className="flex gap-3" style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-70)" }}>
          <span className="mono flex-shrink-0" style={{ color: "var(--ink-30)", fontSize: "13px" }} aria-hidden>—</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}


function CmsLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mono mb-5" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)" }}>
      {children}
    </p>
  );
}

function CmsArchitecture() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

      {/* ── Admin & Auth ── */}
      <div>
        <CmsLabel>Admin &amp; Auth</CmsLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 items-start" style={{ gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
              Payload mounts its own UI. A dedicated <strong>Users</strong> collection controls admin access — entirely separate from the Cognito identity pool that charity users authenticate against. REST and GraphQL APIs are auto-generated from every collection and global.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {["Payload 3.85", "REST API", "GraphQL API", "Users collection"].map(t => (
                <span key={t} className="mono" style={{ fontSize: "9px", padding: "3px 8px", background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 4, color: "var(--ink-45)" }}>{t}</span>
              ))}
            </div>
          </div>
          <CmsGallery items={[
            { label: "admin login", src: "/work/kayana-aid/cms/login.png" },
            { label: "admin dashboard", src: "/work/kayana-aid/cms/home.png" },
          ]} />
        </div>
      </div>

      {/* ── Collections ── */}
      <div>
        <CmsLabel>Collections — 7</CmsLabel>
        <div style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1 }}>
            {CMS_COLLECTIONS_ROW1.map((col) => (
              <div key={col.name} style={{ padding: "14px 16px", borderRight: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", background: "var(--paper)" }}>
                <p className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{col.name}</p>
                <p style={{ fontSize: "11px", lineHeight: 1.55, color: "var(--ink-45)" }}>{col.desc}</p>
              </div>
            ))}
            <div style={{ borderBottom: "1px solid var(--rule)", background: "var(--paper)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1 }}>
            {CMS_COLLECTIONS_REST.map((col) => (
              <div key={col.name} style={{ padding: "14px 16px", borderRight: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", background: "var(--paper)" }}>
                <p className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{col.name}</p>
                <p style={{ fontSize: "11px", lineHeight: 1.55, color: "var(--ink-45)" }}>{col.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <CmsGallery items={[
          { label: "pages", src: "/work/kayana-aid/cms/pages.png" },
          { label: "pageshome", src: "/work/kayana-aid/cms/pages-home.png" },
          { label: "pageshome1", src: "/work/kayana-aid/cms/pages-home-alt.png" },
          { label: "media", src: "/work/kayana-aid/cms/media.png" },
          { label: "blogposts", src: "/work/kayana-aid/cms/blog-posts.png" },
          { label: "blogpostinside", src: "/work/kayana-aid/cms/blog-post-detail.png" },
          { label: "helparticle", src: "/work/kayana-aid/cms/help-article.png" },
          { label: "helparticleinside", src: "/work/kayana-aid/cms/help-article-detail.png" },
          { label: "helpcategories", src: "/work/kayana-aid/cms/help-categories.png" },
          { label: "helpcateogoryinside", src: "/work/kayana-aid/cms/help-category-detail.png" },
          { label: "fundrasingideas", src: "/work/kayana-aid/cms/fundraising-ideas.png" },
          { label: "fundraisingideainside", src: "/work/kayana-aid/cms/fundraising-idea-detail.png" },
          { label: "fundrasingcategories", src: "/work/kayana-aid/cms/fundraising-categories.png" },
          { label: "fundrsingcategoryinside", src: "/work/kayana-aid/cms/fundraising-category-detail.png" },
        ]} />
      </div>

      {/* ── SEO Plugin (last — feeds into §05) ── */}
      <div>
        <CmsLabel>SEO Plugin</CmsLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 items-center" style={{ gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink-45)" }}>
              <span className="mono" style={{ fontSize: "12px", color: "var(--ink)" }}>@payloadcms/plugin-seo</span> injects a Meta tab into 6 collections. Title auto-fills as <span className="mono" style={{ fontSize: "11px", color: "var(--ink)" }}>{`{title} | Kayana Aid`}</span> — editors override per document. A <span className="mono" style={{ fontSize: "12px", color: "var(--ink)" }}>cleanCmsTitle()</span> guard strips the brand suffix if an editor types it manually, preventing duplication in the layout template.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CMS_SEO_COLLECTIONS.map(c => (
                <span key={c} className="mono" style={{ fontSize: "10px", padding: "4px 10px", background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 4, color: "var(--ink)" }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CmsGallery items={[{ label: "seo", src: "/work/kayana-aid/cms/seo.png" }]} thumbWidth={420} />
          </div>
        </div>
      </div>

      {/* ── curved connector: SEO image → next section heading ── */}
      <div style={{ marginTop: 8 }} aria-hidden>
        <svg viewBox="0 0 800 170" style={{ width: "100%", height: 140, display: "block" }}>
          <defs>
            <marker id="feed-arrow" markerWidth="8" markerHeight="8" refX="5.5" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--ink-30)" />
            </marker>
          </defs>
          <path
            d="M 640 15 C 760 55, 700 110, 560 100 C 380 88, 300 40, 150 60 C 70 72, 60 110, 90 145"
            fill="none"
            stroke="var(--ink-30)"
            strokeWidth="1.5"
            strokeDasharray="4 5"
            markerEnd="url(#feed-arrow)"
          />
          <text x="655" y="10" className="mono" fontSize="10" fill="var(--ink-30)" letterSpacing="0.06em">feeds into</text>
        </svg>
      </div>

    </div>
  );
}

/* ══════════════════════ 05 — SEO & Growth ══════════════════════ */

type ShapeKey = "qc-tl"|"qc-tr"|"qc-bl"|"qc-br"|"semi-b"|"semi-t"|"lens-v"|"lens-h";

/* six distinct 12-shape sequences — same vocabulary, different rhythm per transition */
const BAUHAUS_PATTERNS: Record<string, ShapeKey[]> = {
  overview:    ["qc-tl","qc-br","lens-h","qc-tr","qc-bl","semi-t", "lens-v","qc-tl","semi-b","qc-br","qc-tr","qc-bl"],
  stack:       ["semi-b","qc-tl","qc-tr","lens-v","qc-bl","qc-br", "qc-tr","semi-t","lens-h","qc-bl","qc-tl","qc-br"],
  cms:         ["qc-tl","qc-tr","qc-bl","qc-br","semi-b","lens-v", "qc-br","lens-h","semi-t","qc-tl","qc-bl","qc-tr"],
  flows:       ["qc-br","lens-v","qc-tl","semi-b","qc-tr","qc-bl", "semi-t","qc-br","qc-tl","lens-h","qc-tr","qc-bl"],
  conclusion:  ["qc-tl","qc-tr","semi-t","qc-bl","lens-h","qc-br", "lens-v","qc-bl","qc-tr","semi-b","qc-tl","qc-br"],
};

function BauhausTransition({ top, bottom, pattern, startDark = true }: { top: string; bottom: string; pattern: ShapeKey[]; startDark?: boolean }) {
  const S = 100;
  const cols = 6, rows = 2;
  const W = cols * S;
  const dark = "var(--ink)", light = "var(--paper)";

  const cells: [number, number, string, string, ShapeKey][] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isDarkBg = ((c + r) % 2 === 0) === startDark;
      cells.push([c, r, isDarkBg ? dark : light, isDarkBg ? light : dark, pattern[idx]]);
      idx++;
    }
  }

  const shape = (type: ShapeKey, x: number, y: number, fg: string, cp: string) => {
    const props = { fill: fg, clipPath: `url(#${cp})` };
    switch (type) {
      case "qc-tl": return <circle cx={x}   cy={y}   r={S} {...props} />;
      case "qc-tr": return <circle cx={x+S} cy={y}   r={S} {...props} />;
      case "qc-bl": return <circle cx={x}   cy={y+S} r={S} {...props} />;
      case "qc-br": return <circle cx={x+S} cy={y+S} r={S} {...props} />;
      case "semi-b": return <circle cx={x+S/2} cy={y}   r={S/2} {...props} />;
      case "semi-t": return <circle cx={x+S/2} cy={y+S} r={S/2} {...props} />;
      case "lens-v": return (
        <path d={`M ${x+S/2} ${y} C ${x+S} ${y} ${x+S} ${y+S} ${x+S/2} ${y+S} C ${x} ${y+S} ${x} ${y} ${x+S/2} ${y} Z`}
          fill={fg} />
      );
      case "lens-h": return (
        <path d={`M ${x} ${y+S/2} C ${x} ${y} ${x+S} ${y} ${x+S} ${y+S/2} C ${x+S} ${y+S} ${x} ${y+S} ${x} ${y+S/2} Z`}
          fill={fg} />
      );
    }
  };

  const renderRow = (row: number) => {
    const rowCells = cells.filter(([, r]) => r === row);
    return (
      <svg viewBox={`0 0 ${W} ${S}`} width="100%" style={{ display: "block" }}>
        <defs>
          {rowCells.map(([c, r]) => (
            <clipPath key={`cp${c}${r}`} id={`cp${c}${r}`}>
              <rect x={c*S} y={0} width={S} height={S} />
            </clipPath>
          ))}
        </defs>
        {rowCells.map(([c, r, bg, fg, type]) => {
          const x = c*S, y = 0;
          return (
            <g key={`${c}${r}`}>
              <rect x={x} y={y} width={S} height={S} fill={bg} />
              {shape(type, x, y, fg, `cp${c}${r}`)}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ width: "100%", overflow: "hidden", padding: "40px 0" }}>
      <div aria-hidden>{renderRow(0)}</div>
      <div className="my-12 md:my-20 text-center select-none" aria-hidden>
        <p className="font-light tracking-tight" style={{ fontSize: "clamp(1.5rem, 4.2vw, 2.6rem)", lineHeight: 1.2, color: "var(--ink-15)" }}>{top}</p>
        <p className="font-light tracking-tight" style={{ fontSize: "clamp(1.5rem, 4.2vw, 2.6rem)", lineHeight: 1.2, color: "var(--ink)" }}>{bottom}</p>
      </div>
      <div aria-hidden>{renderRow(1)}</div>
    </div>
  );
}

function StatStrip({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 1, borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
      {stats.map(s => (
        <div key={s.label} style={{ padding: "20px 0", textAlign: "center" }}>
          <p className="mono" style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{s.value}</p>
          <p className="mono" style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)" }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

const SEO_PARA: CSSProperties = { fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" };
const SEO_CODE: CSSProperties = { fontSize: "12px", color: "var(--ink)" };

function SeoBlock({ num, title, children }: { num: string; title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <span className="mono" style={{ fontSize: "11px", color: "var(--accent)" }}>{num}</span>
        <CmsLabel>{title}</CmsLabel>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function SeoList({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0, marginTop: 9, width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />
          <span style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink-45)" }}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function SeoSnippet({ file, code }: { file: string; code: string }) {
  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 6, overflow: "hidden" }}>
      <p className="mono" style={{ fontSize: "10px", color: "var(--ink-30)", padding: "8px 14px", borderBottom: "1px solid var(--rule)" }}>{file}</p>
      <pre className="mono" style={{ fontSize: "11.5px", lineHeight: 1.7, color: "var(--ink)", padding: "12px 14px", margin: 0, overflowX: "auto" }}><code>{code}</code></pre>
    </div>
  );
}

function SeoSplit({ text, snippet, snippetLeft = false }: { text: ReactNode; snippet: ReactNode; snippetLeft?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "24px 40px", alignItems: "start" }}>
      <div>{text}</div>
      <div className={snippetLeft ? "md:order-first" : undefined}>{snippet}</div>
    </div>
  );
}

const M = ({ children }: { children: ReactNode }) => <span className="mono" style={SEO_CODE}>{children}</span>;

const SITEMAP_INDEX_SNIPPET = `<sitemapindex>
  <sitemap><loc>https://kayanaaid.com/sitemap_gb.xml</loc></sitemap>
  <sitemap><loc>https://kayanaaid.com/sitemap_us.xml</loc></sitemap>
  … ca · au · es · nl · eu
</sitemapindex>

<!-- one <url> inside a regional sitemap -->
<url>
  <loc>https://kayanaaid.com/gb/pricing</loc>
  <xhtml:link rel="alternate" hreflang="en-GB" href=".../gb/pricing" />
  <xhtml:link rel="alternate" hreflang="en-US" href=".../us/pricing" />
  …
  <xhtml:link rel="alternate" hreflang="x-default" href=".../gb/pricing" />
</url>`;

const ROBOTS_SNIPPET = `# production
User-agent: *
Allow: /
Disallow: /api

User-agent: facebookexternalhit, Facebot, LinkedInBot,
            Twitterbot, WhatsApp, Slackbot-LinkExpanding,
            TelegramBot, Discordbot, redditbot, Pinterest
Allow: /
Disallow: /api

# dev · preview deploys · local
User-agent: *
Disallow: /`;

const LLMS_SNIPPET = `# Kayana Aid
> The simplest way for charities to collect donations.

## Discover and donate
- [Find campaigns](https://kayanaaid.com/gb/find-campaigns)
- [Campaign](https://kayanaaid.com/gb/donate/{slug})
- [Charity profile](https://kayanaaid.com/gb/charity/{slug})
…

## Exclude
Do not crawl authenticated, account, onboarding,
payment or dashboard routes:
- /dashboard   - /settings/*   - /signup/*   - /payment/*`;

function GrowthPipeline() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
      {/* ── 1. Intro ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={SEO_PARA}>
          Payload CMS drives all SEO output — every collection exposes a Meta tab via the SEO plugin, so editors control titles, descriptions and OG images without touching code. The SEO layer turns that content into sitemaps, hreflang, canonical tags and structured data for seven markets.
        </p>
        <p style={SEO_PARA}>
          SEO was part of my remit on this build, mostly the <strong>technical</strong> side. I set up the foundations (sitemaps, robots, canonicals, hreflang, JSON-LD), then ran the live site through Sitechecker in four crawl-and-fix rounds. Each round I triaged the findings, traced every one to its root cause in the Next.js app, middleware or CMS, and shipped the fix before the next crawl.
        </p>
      </div>

      <StatStrip stats={SEO_STATS} />

      {/* ── Sitemaps ── */}
      <SeoBlock num="01" title="Sitemaps">
        <SeoSplit
          text={<SeoList items={[
            <>A sitemap index lists seven regional files — <M>sitemap_gb</M>, <M>us</M>, <M>ca</M>, <M>au</M>, <M>es</M>, <M>nl</M>, <M>eu</M>. Each region has its own literal URL, so the file names the market directly.</>,
            <>Every entry carries the full seven-region <M>hreflang</M> map plus <M>x-default</M> (pointing at <M>/gb</M>), so Google follows alternates across files to the sibling regions.</>,
            <>Only live, real content is listed. Campaigns, events and fundraiser pages must be <M>ACTIVE</M>; test, dummy and fixture slugs are filtered out; URLs that redirect (bare <M>/terms</M>, <M>/privacy</M>) are listed under their region-prefixed form instead.</>,
            <>Built at request time from Payload collections (help articles, fundraising ideas, blog) and the paginated donation API (campaigns, events, fundraisers, charities, shop products).</>,
            <>On <M>dev.kayanaaid.com</M> the sitemaps stay reachable for testing but return <M>X-Robots-Tag: noindex, nofollow</M>.</>,
          ]} />}
          snippet={<SeoSnippet file="sitemap_gb.xml" code={SITEMAP_INDEX_SNIPPET} />}
        />
      </SeoBlock>

      {/* ── robots.txt ── */}
      <SeoBlock num="02" title="robots.txt">
        <SeoSplit
          snippetLeft
          text={<SeoList items={[
            <>Generated per request. Production allows everything public and disallows only the API surface.</>,
            <><M>dev.kayanaaid.com</M>, preview deployments and local dev return <M>Disallow: /</M>, so no pre-release build can be indexed.</>,
            <>Social link-preview bots get their own allow rule. They are not search engines, and when they inherited the indexing rules LinkedIn and Facebook previews went blank.</>,
          ]} />}
          snippet={<SeoSnippet file="robots.txt" code={ROBOTS_SNIPPET} />}
        />
      </SeoBlock>

      {/* ── llms.txt ── */}
      <SeoBlock num="03" title="llms.txt">
        <SeoSplit
          text={<SeoList items={[
            <>A curated file tells AI crawlers what is worth reading. It exposes public pages in four sections: Kayana Aid (home, about, pricing, demo, contact), Discover and donate, Guides and support, and Legal.</>,
            <>An explicit <M>Exclude</M> block lists every private route — dashboard, settings, reports, signup, login, payment, onboarding and donor areas — so nothing authenticated is treated as public content.</>,
            <>A Jest test guards it: the hub pages must be present, and dashboard, settings, signup, create and donor routes must never appear in the public list.</>,
          ]} />}
          snippet={<SeoSnippet file="public/llms.txt" code={LLMS_SNIPPET} />}
        />
      </SeoBlock>

      {/* ── Canonicals & hreflang | Redirects ── */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "56px 48px", alignItems: "start" }}>
        <SeoBlock num="04" title="Canonicals & hreflang">
          <SeoList items={[
            <>Every regional page has a self-referencing canonical that includes the region from the URL (<M>/us/pricing</M> canonicals to itself), taken from the request rather than a cookie that isn't written yet on a first visit.</>,
            <>Locale map: <M>gb → en-GB</M>, <M>us → en-US</M>, <M>ca → en-CA</M>, <M>au → en-AU</M>, <M>es → en-ES</M>, <M>nl → en-NL</M>, <M>eu → en</M>.</>,
            <>The audit exposed invalid values: <M>es-ES</M> and <M>nl-NL</M> claimed a language the pages don't serve, and <M>en-EU</M> isn't a valid country code, so it was wrong on every page. All values now match the English that is actually served.</>,
          ]} />
        </SeoBlock>
        <SeoBlock num="05" title="Redirects & broken links">
          <SeoList items={[
            <>Region-prefix redirects in middleware were Next's implicit 307. The destination for a bare path is stable, so they now default to <M>308</M> permanent — clearing the "3xx other redirects" finding.</>,
            <>Broken links are handled in the CMS: a Payload <M>Redirects</M> collection (301 or 302) is checked by the catch-all route, only for requests that would otherwise 404, so normal navigation is never slowed.</>,
            <>Auth redirects stay <M>307</M> on purpose — a cached 308 there causes redirect loops on logout.</>,
          ]} />
        </SeoBlock>
      </div>

      {/* ── Non-content pages ── */}
      <SeoBlock num="06" title="Keeping non-content pages out of the index">
        <SeoList items={[
          <>Login, donor signup and charity signup are <M>noindex, follow</M>; manage-recurring, payment-complete and checkout are <M>noindex, nofollow</M>. Each has a unique title and a test asserting its robots directive.</>,
          <>Dev and preview environments are blocked twice — <M>Disallow: /</M> in robots.txt and <M>noindex</M> on their sitemaps.</>,
        ]} />
      </SeoBlock>
    </div>
  );
}

/* ══════════════════════ page ══════════════════════ */

export default function KayanaAidPage() {
  const found = locateProject();
  if (!found) return notFound();
  const { project } = found;

  return (
    <main className="min-h-screen" style={{ overflowX: "clip", maxWidth: "100vw" }}>
      <ResetScroll />
      <style>{`
        @media (max-width: 1023px) {
          .kayana-page-wrap { padding-bottom: 120px !important; }
          .kayana-page-wrap svg { max-width: 100%; height: auto; }

          /* Chapter titles centered on mobile/tablet */
          .kayana-page-wrap section > div:first-child > div {
            justify-content: center;
          }

          /* Tech stack: pills wrap instead of forcing horizontal overflow */
          .kayana-page-wrap ul li[class*="mono"] { white-space: normal !important; }

          /* Any code block / pre must scroll internally, not push the
             page. Applies to the CURL / RESPONSE snippets inside the
             Business-Logic accordion and every other rendered <pre>. */
          .kayana-page-wrap pre {
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            word-break: normal;
          }
          .kayana-page-wrap pre code { white-space: pre; }

          /* Flow / diagram containers can't grow past viewport */
          .kayana-page-wrap .react-flow,
          .kayana-page-wrap [class*="flow"] > div { max-width: 100%; }

        }
      `}</style>

      {/* ── Hero image ── */}
      {project.walkthroughUrl && (
        <div style={{ width: "100%", aspectRatio: "5/2", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.walkthroughUrl}
            alt={project.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
        </div>
      )}

      <div className="mx-auto max-w-[1180px] px-6 md:px-10 pt-10">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent-strong)]"
          style={{ fontSize: "12.5px", color: "var(--ink-30)" }}
        >
          <ArrowLeft size={14} />
          Back to Work
        </Link>

        <h1
          className="mt-5 font-light tracking-tight leading-[1.1]"
          style={{ fontSize: "clamp(2rem, 4.5vw, 2.9rem)", color: "var(--ink)" }}
        >
          Kayana Aid - Donation &amp; Fundraising Platform for Charities{" "}
          <a
            href="https://kayanaaid.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "var(--accent)", fontWeight: 300 }}
          >
            (kayanaaid.com <ArrowUpRight size={11} />)
          </a>
        </h1>

        <p className="mt-4" style={{ fontSize: "15.5px", lineHeight: 1.65, color: "var(--ink-70)" }}>
          Kayana Aid is an all-in-one fundraising platform for charities across the UK, US, Australia, Canada and Europe — covering online donations, peer-to-peer fundraising pages, registration-based events, a hardware shop for donation kiosks and card terminals. Charities register, connect their bank, and go live with a branded public page in minutes. Every donation — one-time giving or supporter-led fundraising — feeds into one real-time dashboard. Built solo, end to end: Next.js 15 marketing site with Payload CMS and its own SEO layer, Spring Boot microservice backend, Stripe payments, Cognito auth, and HMRC Gift Aid integration.
        </p>

      </div>

      <div className="mx-auto max-w-[1180px] px-6 md:px-10 pt-10">

          {/* metadata strip */}
          <dl className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 py-8" style={{ borderTop: "1px solid var(--rule)" }}>
            {STATS.map((s) => (
              <div key={s.label} className="p-2.5 sm:p-4" style={{ border: "1px solid var(--rule)", borderRadius: 4 }}>
                <dt className="label mb-1.5 sm:mb-2" style={{ fontSize: "9px" }}>{s.label}</dt>
                <dd className="serif leading-tight" style={{ fontSize: "clamp(0.95rem, 3vw, 1.4rem)", color: "var(--ink)" }}>{s.value}</dd>
              </div>
            ))}
          </dl>

      </div>

      <div
        className="sticky z-10 w-full"
        style={{
          top: 58,
          background: "var(--paper)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="px-6 md:px-10 py-4">
          <MobileToc items={TOC} />
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 md:px-10 pb-28 kayana-page-wrap">

          {/* 01 — OVERVIEW */}
          <Chapter id="overview" num="01" title="Overview">
            <p className="mb-14" style={{ fontSize: "17px", lineHeight: 1.75, color: "var(--ink-70)" }}>
              Kayana Aid is a donation platform. Charities run their own giving site on it, donors give money through it, and supporters raise money on a charity&apos;s behalf through it — three experiences, one connected platform.
            </p>
            <EcosystemDiagram />
          </Chapter>

          <BauhausTransition top="FROM PRODUCT EXPERIENCE" bottom="TO ENGINEERING SYSTEM" pattern={BAUHAUS_PATTERNS.overview} />

          {/* 02 — TECH STACK */}
          <Chapter id="stack" num="02" title="Tech Stack">
            <EngineeringLandscape />
          </Chapter>

          <BauhausTransition top="THE SYSTEM" bottom="MEETS THE USER" pattern={BAUHAUS_PATTERNS.stack} startDark={false} />

          {/* 03 — PUBLIC SITE */}
          <Chapter id="public" num="03" title="Public-facing sites">
            <PublicCarousel items={PUBLIC_PAGES} />
          </Chapter>

          {/* 04 — CMS */}
          <Chapter id="cms" num="04" title="CMS (Payload)">
            <CmsArchitecture />
          </Chapter>

          <BauhausTransition top="CONTENT" bottom="BECOMES DISCOVERY" pattern={BAUHAUS_PATTERNS.cms} />

          {/* 05 — SEO & GROWTH */}
          <Chapter id="seo" num="05" title="SEO & Growth">
            <GrowthPipeline />
          </Chapter>

          {/* 06 — CHARITY FLOW */}
          <Chapter id="charity" num="06" title="Charity Flow">
            <p className="mb-6" style={{ fontSize: "13.5px", color: "var(--ink-45)" }}>{charityFlowConfig.description}</p>
            <FlowDiagram config={charityFlowConfig} />
            <CharityWalkthroughs />
          </Chapter>

          {/* 07 — SUPPORTER FLOW */}
          <Chapter id="supporter" num="07" title="Supporter Flow">
            <p className="mb-6" style={{ fontSize: "13.5px", color: "var(--ink-45)" }}>{supporterFlowConfig.description}</p>
            <FlowDiagram config={supporterFlowConfig} />
            <SupporterWalkthroughs />
          </Chapter>

          {/* 08 — DONOR FLOW */}
          <Chapter id="donor" num="08" title="Donor Flow">
            <p className="mb-6" style={{ fontSize: "13.5px", color: "var(--ink-45)" }}>{donorFlowConfig.description}</p>
            <FlowDiagram config={donorFlowConfig} />
            <DonorWalkthroughs />
          </Chapter>

          <BauhausTransition top="WHAT USERS SEE" bottom="WHAT THE PLATFORM DOES" pattern={BAUHAUS_PATTERNS.flows} />

          {/* 09 — BACKEND PLATFORM */}
          <Chapter id="backend" num="09" title="Backend & Architecture">
            <BackendArchitecture />
            <div className="mt-20">
              <DataLayer />
            </div>
            <div className="mt-20">
              <AuthenticationSection />
            </div>
            <div className="mt-20">
              <OnboardingSection />
            </div>
            <div className="mt-20">
              <CampaignLifecycleSection />
            </div>
            <div className="mt-20">
              <DonationFlowSection />
            </div>
            <div className="mt-20">
              <HardwareShopSection />
            </div>
            <div className="mt-20">
              <StaffTeamsSection />
            </div>
            <div className="mt-20">
              <CustomBrandingSection />
            </div>
            <div className="mt-20">
              <ReportProblemSection />
            </div>
            <div className="mt-20">
              <WebAdminSection />
            </div>
          </Chapter>

          <BauhausTransition top="THE SYSTEM, END TO END" bottom="WHAT IT ADDS UP TO" pattern={BAUHAUS_PATTERNS.conclusion} startDark={false} />

          {/* 10 — CONCLUSION */}
          <Chapter id="conclusion" num="10" title="Conclusion">
            <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
              <p style={{ fontSize: "19px", lineHeight: 1.7, color: "var(--ink)", fontWeight: 300 }}>
                One platform, three faces. A charity runs its giving site, a supporter fundraises for it, a donor gives.
                Everything underneath them is shared.
              </p>

              {/* the whole page, top to bottom, in groups: the platform, the public site, CMS & SEO, then what a charity, a supporter and a donor each do, then the backend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                {[
                  { group: "The platform", rows: [
                    { label: "Overview", detail: "A donation platform with three experiences on one connected system: charities run their giving site, supporters fundraise for them, donors give." },
                    { label: "Tech stack", detail: "Next.js 15, React 19 and Tailwind on the front; Spring Boot 3.5 on Java 21 behind it; Postgres, Kafka on AWS MSK, and AWS for storage, email and SMS, identity and deploys." },
                  ] },
                  { group: "Public site", rows: [
                    { label: "Home & discovery", detail: "A CMS-editable home with live platform stats and featured campaigns, plus Find Campaigns: search, category pills and a card grid." },
                    { label: "Donate page", detail: "Per-campaign page with Stripe Elements, saved cards, a tip toggle and an inline Gift Aid opt-in, with JSON-LD for search." },
                    { label: "Charity page", detail: "A charity’s public profile: cover, logo, verified badge, live totals and tabs for its campaigns, events and about." },
                    { label: "Events", detail: "Discover Events with search, category and date filters, and an Event Detail page with registration, a map and the organising charity." },
                    { label: "Fundraising ideas", detail: "A directory of ideas by category, filterable by personal, team or memorial, each with its own detail page." },
                    { label: "Shop pages", detail: "The public hardware shop and its product pages." },
                    { label: "Content pages", detail: "About, Contact, Blog and Blog Post, Help Centre with categories and articles, and Book a Demo." },
                  ] },
                  { group: "CMS & SEO", rows: [
                    { label: "CMS", detail: "Payload CMS for pages, media, blog posts, help articles and categories, and fundraising ideas and categories, with draft and publish and its own admin login." },
                    { label: "Sitemaps", detail: "A sitemap index of seven regional files (GB, US, CA, AU, ES, NL, EU), listing only live content and built at request time." },
                    { label: "robots.txt & llms.txt", detail: "Production allows public pages and blocks only the API; dev and previews are fully blocked; a curated llms.txt points AI crawlers at public pages and excludes every private route." },
                    { label: "Canonicals & hreflang", detail: "Self-referencing regional canonicals and a corrected locale map, so search reads the seven regions properly." },
                    { label: "Redirects & broken links", detail: "Permanent 308 region redirects and a CMS Redirects collection for broken links, checked only when a page would otherwise 404." },
                    { label: "Index control & audit", detail: "Non-content pages kept out of the index, and four Sitechecker crawl-and-fix rounds to find and clear issues." },
                  ] },
                  { group: "Charity", rows: [
                    { label: "Signup", detail: "A three-step wizard: account with password strength and consent, email OTP verification, then organisation details." },
                    { label: "Onboarding", detail: "Login for charities and donors, subdomain routing for white-label charities, then Stripe payment setup from a dashboard banner." },
                    { label: "Payment setup", detail: "Stripe Connect onboarding: organisation type, legal structure, representative and bank details, finished on Stripe’s hosted page." },
                    { label: "Dashboard", detail: "Total raised, donors, average gift and active campaigns, a donations chart with date ranges, and a Gift Aid estimate." },
                    { label: "Shop", detail: "A hardware marketplace for card terminals, kiosks and accessories, with a cart panel and an Orders tab of past purchases." },
                    { label: "Campaigns", detail: "Create and manage campaigns with a category, cover image and impact levels; the parent of fundraisers, events and donations." },
                    { label: "Events", detail: "Fundraising events tied to a campaign, in person, virtual or hybrid, with a venue or an online link." },
                    { label: "Fundraisers", detail: "Every supporter-created page across the charity’s campaigns, filterable by campaign." },
                    { label: "Donations", detail: "The full ledger of incoming gifts, filtered by donor, campaign, fundraiser, origin, type and date." },
                    { label: "Reports", detail: "Campaign reports by status with a full summary per campaign, plus an invoices tab." },
                    { label: "Support", detail: "Tickets with a priority and status, and a Reported Issues log where repeated errors are grouped and tiered." },
                    { label: "Settings", detail: "Profile and login sessions, business profile, live payment rates, custom branding, custom donation email, Gift Aid, embedded widget, campaign and event categories, and team." },
                  ] },
                  { group: "Supporter", rows: [
                    { label: "Pick a campaign", detail: "Browse Find Campaigns or follow a direct link to a live campaign." },
                    { label: "Create a page", detail: "A solo or team fundraising page with a title, personal story, target and cover photo." },
                    { label: "Impact levels", detail: "Inherit the campaign’s impact levels or set custom ones, each with a label and an amount." },
                    { label: "Share", detail: "A unique page URL with Open Graph previews for social, email and messaging." },
                    { label: "Track", detail: "Total raised against target, donor count, donor messages and a team leaderboard in real time." },
                  ] },
                  { group: "Donor", rows: [
                    { label: "Discover", detail: "Find a campaign through search, the events page or a supporter’s shared page." },
                    { label: "Choose an amount", detail: "A preset impact level or a custom amount, with the progress bar visible." },
                    { label: "Details", detail: "Name, email, optional phone and message, with the option to give anonymously." },
                    { label: "Gift Aid & pay", detail: "Confirm UK taxpayer status so Gift Aid can be claimed, then pay by card through Stripe with 3DS handled." },
                    { label: "Receipt", detail: "A confirmation page, an emailed receipt with a PDF link, and the charity’s own message if set." },
                    { label: "Donor account", detail: "Optional: history across all charities, profile, past receipts and the fundraising pages supported." },
                  ] },
                  { group: "Backend", rows: [
                    { label: "Architecture", detail: "Spring Boot microservices behind gateways, with a service registry, central config and secrets, and an admin server." },
                    { label: "Data layer", detail: "One shared Postgres database in five schemas: charity tenant, donors, orders and transactions, platform defaults, audit trail." },
                    { label: "Authentication", detail: "Two separate AWS Cognito logins, one for charity admins and staff and one for donors and supporters, with OTP, MFA and lockout." },
                    { label: "Onboarding flows", detail: "Four backend flows behind signup: user creation, email verification, business creation and payment setup." },
                    { label: "Campaign lifecycle", detail: "A campaign from creation through the ways it stops taking gifts, and how supporters and embeds plug into it." },
                    { label: "Donations & payments", detail: "Two halves: the donation service records the gift, the webhook service marks it paid once Stripe confirms, so nothing is paid on the donor’s say-so." },
                    { label: "Money & events", detail: "Charities are paid on their own connected accounts and results travel as Kafka events, so a slow step never blocks a donor or double-counts." },
                    { label: "Hardware shop", detail: "Catalogue from the company’s inventory database, paid to the company’s own Stripe account, not a charity’s." },
                    { label: "Staff & teams", detail: "One owner and any staff; default roles Charity Manager, Finance Officer and Treasurer decide what each can do, checked on every request." },
                    { label: "Custom branding", detail: "A charity’s look as one JSON document and a white-label subdomain requested and activated through a workflow." },
                    { label: "Report a problem", detail: "Claude triages each report, then real issues become a bug entry and a helpdesk ticket the charity follows." },
                    { label: "Web admin integrations", detail: "Website leads, bookings and policy hub reading and consent, called only from the site’s own server routes." },
                  ] },
                ].map((g) => (
                  <div key={g.group}>
                    <p className="mono" style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--rule)" }}>{g.group}</p>
                    <ul style={{ listStyle: "disc", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                      {g.rows.map((row) => (
                        <li key={row.label} style={{ fontSize: "14.5px", lineHeight: 1.65, color: "var(--ink-70)", paddingLeft: 4 }}>
                          <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{row.label}:</strong> {row.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)" }}>
                Built solo, end to end: from the page a donor lands on to the account the money lands in.
              </p>
            </div>
          </Chapter>

      </div>
    </main>
  );
}
