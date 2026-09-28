export type TaskItem = {
  id: string;
  title?: string;        // optional — for hasDetail tasks the title is sourced from tasks.data.ts
  description?: string;  // same — single source of truth
  hasDetail: boolean;
  /** "YYYY-MM" — when this task starts on the Gantt. Defaults to the project's start. */
  start?: string;
  /** "YYYY-MM" | "present" — when it ends. Defaults to the project's end. */
  end?:   string;
  /** Optional cover image URL — used by CardsView for tasks without a tasks.data.ts entry. */
  image?: string;
  /** Override the card link destination instead of /tasks/:id */
  pageHref?: string;
};

export type RepoSummary = {
  name:           string;             // e.g. "kayana-frontend-donation-project"
  role:           string;             // e.g. "Next.js frontend" / "Spring Boot backend"
  description?:   string;             // 1–2 line summary
  stack:          string[];           // tech badges
  tree:           string;             // pre-formatted ASCII tree (rendered in <pre>)
  url?:           string;             // optional repo URL
};

export type ProjectArchitecture = {
  summary?:       string;             // 1–3 line architectural summary
  diagram?:       string;             // optional pre-formatted ASCII diagram
  repos:          RepoSummary[];      // one or more repos that make up the project
};

export type ProjectStat = { label: string; value: string };

/** An item can be a plain bullet, or a labeled sub-group with its own lettered sub-points. */
export type ProjectOverviewItem = string | { heading: string; items: string[] };
export type ProjectOverviewSection = { heading: string; items: ProjectOverviewItem[] };

export type ProjectItem = {
  id: string;
  name: string;
  description: string;
  /** Optional grouped feature overview (heading + bullet list per area) shown on the project page. */
  overview?: ProjectOverviewSection[];
  tech: string[];
  start?: string; // "YYYY-MM"
  end?: string;   // "YYYY-MM" | "present"
  tasks: TaskItem[];
  /** If true, the project does not expand inline; instead it links to /work/[id]. */
  linkOnly?: boolean;
  /** Architecture overview shown on the dedicated /work/[id] page. */
  architecture?: ProjectArchitecture;
  /** Optional walkthrough media — image or video path/URL; extension decides which renders. */
  walkthroughUrl?: string;
  /** Optional production URL. */
  liveUrl?: string;
  /** Optional friendly label for the live URL (e.g. "kayanaforbusiness.com"). */
  liveUrlLabel?: string;
  /** Quick-scan highlights — 3–6 short bullet items. */
  highlights?: string[];
  /** What this person did on the project — e.g. "Sole Fullstack Developer". */
  role?: string;
  /** Optional headline stats — small numeric callouts. */
  stats?: ProjectStat[];
};

export type ContributionYear = {
  year: number;
  image: string;  // path under /public, e.g. "/github/kayana/2025.png"
  total?: number; // contributions count for the header
};

export type CompanyItem = {
  id: string;
  company: string;
  role: string;
  duration: string;
  start: string;  // "YYYY-MM"
  end: string;    // "YYYY-MM" | "present"
  description: string;
  projects: ProjectItem[];
  /** GitHub contribution graph, one per year — shown on the /career timeline. */
  contributions?: ContributionYear[];
};

export const workData: CompanyItem[] = [
  // ─── KAYANA (current / most recent) ───────────────────────
  {
    id: "kayana",
    company: "Kayana World LTD",
    role: "Java Backend Developer",
    duration: "1.5 yrs",
    start: "2025-03",
    end: "present",
    description:
      "Sole backend engineer for Kayana Web Admin Portal. Architected and delivered 12+ production modules — payment integrations, real-time session management, RBAC, compliance workflows, and analytics APIs — serving 200+ business clients.",
    projects: [
      {
        id: "kayana-admin",
        name: "Kayana Web Admin Portal",
        walkthroughUrl: "/tasks/audit/hero.jpg",
        start: "2025-03",
        end: "2026-04",
        description:
          "Centralized super-admin platform for managing merchants, partners, roles, permissions, payment configurations, and system-level settings across the Kayana ecosystem. Sole backend developer — designed the architecture and delivered all modules end-to-end.",
        tech: ["Java", "Spring Boot", "Spring Security", "MySQL", "Kafka", "AWS S3", "AWS Cognito", "Stripe API", "Socket.io", "AOP", "Branch.io"],
        tasks: [
          { id: "task-audit",                   hasDetail: true, start: "2025-03", end: "2025-04" },
          { id: "task-auth-session",            hasDetail: true, start: "2025-04", end: "2025-05" },
          { id: "task-menus",                   hasDetail: true, start: "2025-05", end: "2025-06" },
          { id: "task-property-onboarding",     hasDetail: true, start: "2025-06", end: "2025-07" },
          { id: "task-compliance",              hasDetail: true, start: "2025-07", end: "2025-08" },
          { id: "task-stripe-terminal",         hasDetail: true, start: "2025-08", end: "2025-09" },
          { id: "task-stripe-payout-schedule",  hasDetail: true, start: "2025-09", end: "2025-10" },
          { id: "task-stripe-instant-payout",   hasDetail: true, start: "2025-10", end: "2025-11" },
          { id: "task-payment-fee",             hasDetail: true, start: "2025-11", end: "2025-12" },
          { id: "task-card-mapping",            hasDetail: true, start: "2025-12", end: "2026-01" },
          { id: "task-knowledge-base",          hasDetail: true, start: "2026-01", end: "2026-02" },
          { id: "task-transfer-funds",          hasDetail: true, start: "2026-02", end: "2026-03" },
          { id: "task-selective-notifications", hasDetail: true, start: "2026-03", end: "2026-04" },
        ],
      },
      {
        id: "kayana-aid",
        name: "Kayana Aid",
        start: "2026-03",
        end: "present",
        role: "Sole Fullstack Developer (Next.js + Spring Boot)",
        description:
          "Everything a charity needs to raise money online — branded giving pages, recurring donations, events, and HMRC-ready Gift Aid reporting.",
        overview: [
          {
            heading: "Marketing Website",
            items: [
              "Home — hero pitch introducing the platform, live campaign highlights, and trust stats for first-time visitors.",
              "Find a Campaign — searchable, filterable list of every active campaign; each card opens a detail page with the full story, a progress bar, and donor count.",
              "Donate page — the actual giving page behind every 'Donate' button; card payment via Stripe, one-time or recurring, with Gift Aid opt-in.",
              "Charity profile — reached by clicking a charity's name from a campaign; shows all of that charity's campaigns, events, and fundraiser pages in one place.",
              "Events — upcoming fundraising events with date, location, and ticket price; visitors register, buy tickets, and can start their own fundraising page tied to the event.",
              "Fundraise (Fundraising pages) — personal, team, and in-memory tribute pages that supporters create and edit themselves (title, story, cover photo, goal amount); each gets its own public giving page for friends and family.",
              "Fundraising Ideas — a browsable list of fundraising inspiration to help a supporter decide what kind of page to start.",
              "Shop — public storefront where anyone can browse and buy Kayana's hardware (kiosks, card terminals), with its own cart.",
              "Help Center — categorized how-to articles answering common donor and charity questions.",
              "Blog — articles with a listing page and a detail page for each post.",
              "About / Contact — company story and stats page, plus a contact form for general enquiries.",
              "Book a Demo — lets a prospective charity book time with the sales team via an embedded calendar.",
            ],
          },
          {
            heading: "Payload CMS Admin",
            items: [
              "A content-editor login at /admin, authenticated independently of the Cognito-backed charity and donor sessions.",
              "Every page in the Marketing Website above — Home's layout, Help articles, Blog posts, Fundraising Ideas, legal pages, and each page's SEO title/description — is edited here and published without a code deploy.",
              "Built-in migration and reseed tooling in the same admin panel, so the database schema and reference content can be brought up to date without server/CLI access.",
            ],
          },
          {
            heading: "Charity Signup & Login",
            items: [
              "Signup — create a user account and the charity's organization in one flow; automatically creates a Lead in the CRM so sales sees every signup.",
              "Payment setup — connects the charity's Stripe account right after signup; required before they can accept a donation.",
              "Login / forgot-password — standard return flow, plus self-service password reset for staff who lose access.",
            ],
          },
          {
            heading: "Donor Portal",
            items: [
              "Signup / login — a donor account, independent of any charity login, with its own session.",
              "Dashboard — every donation this person has made, across every charity on the platform, in one list.",
              "Donation detail — a receipt page per gift, with amount, date, campaign, and Gift Aid status.",
              "Profile / password reset — donors manage their own details and credentials.",
              "Confirmation — right after giving, a donor sees an on-screen confirmation and gets a receipt by email.",
            ],
          },
          {
            heading: "Charity Admin Dashboard",
            items: [
              "Overview — KPI tiles for total raised, donors, and average gift, a donations chart, active campaigns, and a table of recent donations.",
              "Campaigns — create, list, and edit fundraising campaigns.",
              "Events — create, list, and edit events.",
              "Fundraisers — view and manage the personal, team, and tribute pages supporters have created.",
              "Donations — a full, filterable table of every donation, with a drill-down into any individual donor's history.",
              "Shop — browse Kayana's hardware, add to cart, and order for delivery; order and invoice history.",
              "Reports — campaign performance reports and hardware invoice history.",
              "Team — invite staff, assign roles, and revoke access.",
              "Support — raise a ticket straight into Kayana's internal support system.",
              {
                heading: "Settings",
                items: [
                  "Profile and business profile.",
                  "Category management for campaigns and events.",
                  "Custom branding — request a subdomain; once approved, a one-click activation link (sent by email) makes it live.",
                  "Gift Aid — HMRC configuration and CSV export for filing.",
                  "Embeddable widget — the code (and the live widget it points to) for embedding a donate button on the charity's own website.",
                  "Custom donation confirmation email — an editor with merge fields and a live preview for the email donors get after giving.",
                ],
              },
            ],
          },
        ],
        liveUrl: "https://kayanaaid.com",
        liveUrlLabel: "kayanaaid.com",
        walkthroughUrl: "/work/kayana-aid/cover.jpg",
        tech: [
          "Next.js 15", "React 19", "TypeScript", "Tailwind 3", "NextAuth",
          "Axios", "react-hook-form", "Zod", "Recharts", "Stripe.js + React Stripe.js",
          "Java", "Spring Boot 3.5", "Spring WebFlux", "PostgreSQL",
          "Stripe SDK", "AWS S3", "Kafka", "OpenFeign",
          "Spring AOP @LogActivity", "iText PDF", "OpenCSV",
          "Multi-currency", "White-label custom domain",
          "Payload CMS 3", "Lexical editor", "AWS Cognito",
        ],
        stats: [
          { label: "Feature areas",              value: "9" },
          { label: "Public-facing pages",        value: "20+" },
          { label: "Donor account features",     value: "6" },
          { label: "Charity dashboard sections",  value: "10+" },
          { label: "Charity settings options",   value: "9" },
          { label: "Content & admin tools",      value: "5" },
          { label: "User roles",                 value: "Charity · Donor" },
          { label: "Payments",                   value: "Stripe end to end" },
          { label: "Custom domains",             value: "White-label per charity" },
        ],
        linkOnly: true,
        tasks: [],
      },
    ],
    contributions: [
      { year: 2026, image: "/api/drive-image?id=1C3ApjBWl-9vH7RvW20wqNH10YkCNLUVb", total: 1502 },
      { year: 2025, image: "/api/drive-image?id=1ciY9gMl1meMfTg0lHbkH0fZ-tFbCvtQb", total: 1827 },
    ],
  },

  // ─── GO DIGITAL (earlier) ─────────────────────────────────
  {
    id: "go-digital",
    company: "Go Digital Technology Consulting LLP",
    role: "Application Developer Intern",
    duration: "2 months",
    start: "2024-12",
    end: "2025-02",
    description:
      "Built full-stack applications using Angular and Spring Boot. Worked across frontend and backend — data tables, real-time WebSocket boards, and REST APIs — within fast 3-week sprints.",
    projects: [
      {
        id: "go-digital-kanban",
        name: "Real-time Collaborative Kanban Board",
        start: "2025-01",
        end: "2025-02",
        description:
          "Full-stack Kanban board where multiple team members drag cards across columns simultaneously — WebSocket sync propagates every move to every connected client without polling.",
        tech: ["Angular", "Spring Boot", "WebSockets", "STOMP", "SockJS", "MySQL", "Spring Security", "JWT"],
        linkOnly: true,
        walkthroughUrl: "/work/go-digital-kanban/cover.jpg",
        tasks: [],
      },
    ],
  },
];
