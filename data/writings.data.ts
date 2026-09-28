// ─── Types ────────────────────────────────────────────────────────────────────
//
// Writing posts are deliberately a separate, leaner model from Task — a blog-style
// long-form article isn't a 26-section case study, it's prose with headings, code,
// lists, and the occasional callout. `relatedTaskIds` is the only bridge back to
// the structured case studies in tasks.data.ts, so an article can say "see the full
// breakdown of the payout-schedule engine" and link straight to it.

export type WritingBlock =
  | { type: "heading"; level?: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "code"; language?: string; caption?: string; code: string }
  | { type: "quote"; text: string }
  | { type: "callout"; label?: string; text: string }
  | { type: "svg"; caption?: string; svg: string };

export type WritingStatus = "published" | "coming-soon";

export type WritingPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: string;
  publishedDate: string; // "YYYY-MM"
  status: WritingStatus;
  /** Hero image URL shown on the listing card. */
  image?: string;
  /** Only present for status="published". */
  body?: WritingBlock[];
};

// ─── Posts ────────────────────────────────────────────────────────────────────

export const writings: WritingPost[] = [
  {
    slug: "microservices-from-the-inside",
    title: "Microservices, In one diagram",
    excerpt:
      "The whole backend I work on, walked tier by tier. Twelve clients, two gateways, twenty-six services, no padding.",
    category: "Architecture",
    tags: ["Microservices", "Spring Boot", "Spring Cloud Gateway", "Eureka", "Feign", "Cognito", "Architecture"],
    readTime: "6 min",
    publishedDate: "2026-06",
    status: "published",
    image: "/learning/microservices.jpg",
    body: [
      {
        type: "paragraph",
        text: "Twenty-six Spring Boot services. Twelve clients asking them for things. The diagram below is the whole backend; the rest of this post is one short note per tier.",
      },

      {
        type: "svg",
        caption: "backend-services · client-to-service topology. Platform tier sits at the top as the boot-time foundation (every service registers with it before becoming reachable). Web Admin Portal is listed first since it skips both the gateway AND the security tier (monolithic, validates JWTs internally). Each colored client path is drawn in 3 clean segments — client→gateway, gateway→security, security→service — with arrows landing exactly on box edges.",
        svg: `<svg viewBox="0 0 1500 1280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
  <defs>
    <marker id="ah-w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.55)"/></marker>
    <marker id="ah-v" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a78bfa"/></marker>
    <marker id="ah-1"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#67e8f9"/></marker>
    <marker id="ah-2"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a78bfa"/></marker>
    <marker id="ah-3"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#60a5fa"/></marker>
    <marker id="ah-4"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#5eead4"/></marker>
    <marker id="ah-5"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#86efac"/></marker>
    <marker id="ah-6"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#bef264"/></marker>
    <marker id="ah-7"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fde047"/></marker>
    <marker id="ah-8"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fcd34d"/></marker>
    <marker id="ah-9"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f0abfc"/></marker>
    <marker id="ah-10" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f9a8d4"/></marker>
    <marker id="ah-11" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fb923c"/></marker>
    <marker id="ah-12" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fb7185"/></marker>
  </defs>

  <rect width="1500" height="1280" fill="#070707"/>

  <text x="20" y="28" fill="#e5e5e5" font-size="14" letter-spacing="1.2" font-weight="500">backend-services · client-to-service topology</text>
  <text x="20" y="46" fill="rgba(255,255,255,0.35)" font-size="10">12 clients · 2 gateways · 2 security services · 11 data services · 6 specialists · 2 independent · 3 platform</text>

  <!-- ==================== TIER 1: PLATFORM (TOP — boot-time foundation, no runtime arrows) ==================== -->
  <g opacity="0.7" font-size="10.5">
    <rect x="100" y="70" width="420" height="45" rx="6" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.22)" stroke-dasharray="4 3"/>
    <text x="310" y="89" text-anchor="middle" fill="#cbd5e1">config-server</text>
    <text x="310" y="103" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Spring Cloud Config · pulls from AWS Secrets Manager</text>

    <rect x="540" y="70" width="420" height="45" rx="6" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.22)" stroke-dasharray="4 3"/>
    <text x="750" y="89" text-anchor="middle" fill="#cbd5e1">discovery-service</text>
    <text x="750" y="103" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Eureka peer cluster · lb:// service-id resolution for gateways</text>

    <rect x="980" y="70" width="420" height="45" rx="6" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.22)" stroke-dasharray="4 3"/>
    <text x="1190" y="89" text-anchor="middle" fill="#cbd5e1">admin-server</text>
    <text x="1190" y="103" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Spring Boot Admin · health + actuator dashboard</text>
  </g>
  <text x="750" y="135" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="9.5" font-style="italic">↑ boot-time foundation — every service pulls config, registers with Eureka, reports actuator before becoming reachable. Runtime requests never cross this tier.</text>

  <!-- ==================== TIER 2: CLIENTS (Web Admin FIRST, then 11 others) ==================== -->
  <g font-size="9.5">
    <!-- 1 Web Admin Portal (cyan) — leftmost, isolated, no gateway/security column -->
    <rect x="20"   y="170" width="125" height="58" rx="6" fill="rgba(103,232,249,0.06)" stroke="#67e8f9" stroke-width="1.3"/>
    <!-- 2 Partner admin web (violet) -->
    <rect x="155"  y="170" width="110" height="58" rx="6" fill="rgba(167,139,250,0.06)" stroke="#a78bfa" stroke-width="1.3"/>
    <!-- 3 Business App mobile (blue) — zigzag offset -->
    <rect x="275"  y="210" width="110" height="58" rx="6" fill="rgba(96,165,250,0.06)"  stroke="#60a5fa" stroke-width="1.3"/>
    <!-- 4 Kiosk app (teal) -->
    <rect x="395"  y="170" width="110" height="58" rx="6" fill="rgba(94,234,212,0.06)"  stroke="#5eead4" stroke-width="1.3"/>
    <!-- 5 Epos app (green) -->
    <rect x="515"  y="210" width="110" height="58" rx="6" fill="rgba(134,239,172,0.06)" stroke="#86efac" stroke-width="1.3"/>
    <!-- 6 Card Terminal · Mpos (lime) -->
    <rect x="635"  y="170" width="110" height="58" rx="6" fill="rgba(190,242,100,0.06)" stroke="#bef264" stroke-width="1.3"/>
    <!-- 7 Kitchen Display System (yellow) -->
    <rect x="755"  y="210" width="110" height="58" rx="6" fill="rgba(253,224,71,0.06)"  stroke="#fde047" stroke-width="1.3"/>
    <!-- 8 Partner App (amber) -->
    <rect x="875"  y="170" width="110" height="58" rx="6" fill="rgba(252,211,77,0.06)"  stroke="#fcd34d" stroke-width="1.3"/>
    <!-- 9 Aid (fuchsia) -->
    <rect x="995"  y="210" width="110" height="58" rx="6" fill="rgba(240,171,252,0.06)" stroke="#f0abfc" stroke-width="1.3"/>
    <!-- 10 Reseller web (pink) -->
    <rect x="1115" y="170" width="110" height="58" rx="6" fill="rgba(249,168,212,0.06)" stroke="#f9a8d4" stroke-width="1.3"/>
    <!-- 11 Websites WL (orange) -->
    <rect x="1235" y="210" width="125" height="58" rx="6" fill="rgba(251,146,60,0.06)"  stroke="#fb923c" stroke-width="1.3"/>
    <!-- 12 White-labeled apps (rose) -->
    <rect x="1370" y="170" width="125" height="58" rx="6" fill="rgba(251,113,133,0.06)" stroke="#fb7185" stroke-width="1.3"/>
  </g>

  <!-- ==================== COLORED ARROWS: SEGMENT A (client → gateway top) ==================== -->
  <!-- y2=300 = gateway top edge. Arrowhead tip lands EXACTLY at the box edge. -->
  <!-- Web Admin (client 1) skips this — direct path drawn separately below. -->
  <g fill="none" stroke-width="1.6" stroke-opacity="0.85">
    <line x1="210"  y1="228" x2="210"  y2="300" stroke="#a78bfa" marker-end="url(#ah-2)"/>
    <line x1="330"  y1="268" x2="330"  y2="300" stroke="#60a5fa" marker-end="url(#ah-3)"/>
    <line x1="450"  y1="228" x2="450"  y2="300" stroke="#5eead4" marker-end="url(#ah-4)"/>
    <line x1="570"  y1="268" x2="570"  y2="300" stroke="#86efac" marker-end="url(#ah-5)"/>
    <line x1="690"  y1="228" x2="690"  y2="300" stroke="#bef264" marker-end="url(#ah-6)"/>
    <line x1="810"  y1="268" x2="810"  y2="300" stroke="#fde047" marker-end="url(#ah-7)"/>
    <line x1="930"  y1="228" x2="930"  y2="300" stroke="#fcd34d" marker-end="url(#ah-8)"/>
    <line x1="1050" y1="268" x2="1050" y2="300" stroke="#f0abfc" marker-end="url(#ah-9)"/>
    <line x1="1170" y1="228" x2="1170" y2="300" stroke="#f9a8d4" marker-end="url(#ah-10)"/>
    <line x1="1297" y1="268" x2="1297" y2="300" stroke="#fb923c" marker-end="url(#ah-11)"/>
    <line x1="1432" y1="228" x2="1432" y2="300" stroke="#fb7185" marker-end="url(#ah-12)"/>
  </g>

  <!-- ==================== TIER 3: GATEWAYS (drawn AFTER arrows so labels stay readable) ==================== -->
  <g font-size="11" fill="#e5e5e5">
    <!-- business-api-gateway: covers clients 2-10 (x=155 to x=1225) -->
    <rect x="155" y="300" width="1075" height="78" rx="6" fill="#0c0c0c" stroke="rgba(255,255,255,0.3)"/>
    <text x="690" y="328" text-anchor="middle" font-weight="500">business-api-gateway</text>
    <text x="690" y="346" text-anchor="middle" font-size="9.5" fill="rgba(255,255,255,0.5)">/business/** · /donation/** · /websocket/** · /terminal/** · /self/** · /partners-service/** · /kds/**</text>
    <text x="690" y="362" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)" font-style="italic">routes 9 client audiences to their target service</text>

    <!-- api-gateway: covers clients 11-12 (x=1235 to x=1495) -->
    <rect x="1240" y="300" width="255" height="78" rx="6" fill="#0c0c0c" stroke="rgba(255,255,255,0.3)"/>
    <text x="1367" y="318" text-anchor="middle" font-weight="500">api-gateway</text>
    <rect x="1250" y="328" width="235" height="22" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)"/>
    <text x="1367" y="343" text-anchor="middle" font-size="9.5">WL routes · /web/** · /user/**</text>
    <rect x="1250" y="354" width="235" height="22" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)"/>
    <text x="1367" y="369" text-anchor="middle" font-size="9.5">Webhook routes · /webhook/**</text>
  </g>

  <!-- Web Admin annotation (its own column has no gateway/security) -->
  <g font-size="9" font-style="italic" fill="rgba(103,232,249,0.6)">
    <text x="82" y="318" text-anchor="middle">no gateway</text>
    <text x="82" y="332" text-anchor="middle">monolithic</text>
    <text x="82" y="346" text-anchor="middle">validates JWT</text>
    <text x="82" y="360" text-anchor="middle">internally</text>
    <text x="82" y="374" text-anchor="middle">(admin pool)</text>
  </g>

  <!-- ==================== COLORED ARROWS: SEGMENT B (gateway → security top) ==================== -->
  <g fill="none" stroke-width="1.6" stroke-opacity="0.85">
    <line x1="210"  y1="378" x2="210"  y2="410" stroke="#a78bfa" marker-end="url(#ah-2)"/>
    <line x1="330"  y1="378" x2="330"  y2="410" stroke="#60a5fa" marker-end="url(#ah-3)"/>
    <line x1="450"  y1="378" x2="450"  y2="410" stroke="#5eead4" marker-end="url(#ah-4)"/>
    <line x1="570"  y1="378" x2="570"  y2="410" stroke="#86efac" marker-end="url(#ah-5)"/>
    <line x1="690"  y1="378" x2="690"  y2="410" stroke="#bef264" marker-end="url(#ah-6)"/>
    <line x1="810"  y1="378" x2="810"  y2="410" stroke="#fde047" marker-end="url(#ah-7)"/>
    <line x1="930"  y1="378" x2="930"  y2="410" stroke="#fcd34d" marker-end="url(#ah-8)"/>
    <line x1="1050" y1="378" x2="1050" y2="410" stroke="#f0abfc" marker-end="url(#ah-9)"/>
    <line x1="1170" y1="378" x2="1170" y2="410" stroke="#f9a8d4" marker-end="url(#ah-10)"/>
    <line x1="1297" y1="378" x2="1297" y2="410" stroke="#fb923c" marker-end="url(#ah-11)"/>
    <line x1="1432" y1="378" x2="1432" y2="410" stroke="#fb7185" marker-end="url(#ah-12)"/>
  </g>

  <!-- ==================== TIER 4: SECURITY ==================== -->
  <g font-size="10.5" fill="#e5e5e5">
    <rect x="155" y="410" width="1075" height="48" rx="6" fill="#0c0c0c" stroke="rgba(255,255,255,0.28)"/>
    <text x="690" y="430" text-anchor="middle" font-weight="500">business-security-service</text>
    <text x="690" y="445" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.5)">aws.business.userpool · validates JWT on every API call from clients 2-10</text>

    <rect x="1240" y="410" width="255" height="48" rx="6" fill="#0c0c0c" stroke="rgba(255,255,255,0.28)"/>
    <text x="1367" y="430" text-anchor="middle" font-weight="500">security-service</text>
    <text x="1367" y="445" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.5)">aws.userpool · clients 11-12</text>
  </g>

  <!-- ==================== COLORED ARROWS: SEGMENT C (security → service top) ==================== -->
  <g fill="none" stroke-width="1.6" stroke-opacity="0.85">
    <line x1="210"  y1="458" x2="210"  y2="490" stroke="#a78bfa" marker-end="url(#ah-2)"/>
    <line x1="330"  y1="458" x2="330"  y2="535" stroke="#60a5fa" marker-end="url(#ah-3)"/>
    <line x1="450"  y1="458" x2="450"  y2="490" stroke="#5eead4" marker-end="url(#ah-4)"/>
    <line x1="570"  y1="458" x2="570"  y2="535" stroke="#86efac" marker-end="url(#ah-5)"/>
    <line x1="690"  y1="458" x2="690"  y2="490" stroke="#bef264" marker-end="url(#ah-6)"/>
    <line x1="810"  y1="458" x2="810"  y2="535" stroke="#fde047" marker-end="url(#ah-7)"/>
    <line x1="930"  y1="458" x2="930"  y2="490" stroke="#fcd34d" marker-end="url(#ah-8)"/>
    <line x1="1050" y1="458" x2="1050" y2="535" stroke="#f0abfc" marker-end="url(#ah-9)"/>
    <line x1="1170" y1="458" x2="1170" y2="490" stroke="#f9a8d4" marker-end="url(#ah-10)"/>
    <line x1="1297" y1="458" x2="1297" y2="535" stroke="#fb923c" marker-end="url(#ah-11)"/>
    <line x1="1432" y1="458" x2="1432" y2="490" stroke="#fb7185" marker-end="url(#ah-12)"/>
  </g>

  <!-- ==================== Web Admin DIRECT ARROW (single segment, client 1 → admin-service) ==================== -->
  <g fill="none" stroke-width="1.7" stroke-opacity="0.9">
    <line x1="82" y1="228" x2="82" y2="490" stroke="#67e8f9" marker-end="url(#ah-1)"/>
  </g>

  <!-- ==================== TIER 5: SERVICES (11 boxes; admin-service leftmost) ==================== -->
  <g font-size="10.5">
    <!-- admin-service (caller 1, leftmost, monolithic) -->
    <rect x="20" y="490" width="125" height="65" rx="6" fill="rgba(103,232,249,0.05)" stroke="#67e8f9"/>
    <text x="82" y="513" text-anchor="middle" fill="#a5f3fc">admin-service</text>
    <text x="82" y="528" text-anchor="middle" font-size="8.5" fill="rgba(165,243,252,0.55)" font-style="italic">monolithic · own auth</text>
    <rect x="27" y="538" width="8" height="8" rx="1.5" fill="#67e8f9"/>

    <!-- business-service (callers 2+3 — wider box) -->
    <rect x="155" y="490" width="230" height="65" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.34)"/>
    <text x="270" y="513" text-anchor="middle" fill="#e5e5e5" font-weight="500">business-service</text>
    <text x="270" y="528" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">merchants · properties · menus · orders</text>
    <rect x="162" y="538" width="8" height="8" rx="1.5" fill="#a78bfa"/>
    <rect x="175" y="538" width="8" height="8" rx="1.5" fill="#60a5fa"/>

    <!-- self-service (caller 4) -->
    <rect x="395" y="535" width="110" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="450" y="558" text-anchor="middle" fill="#e5e5e5">self-service</text>
    <rect x="402" y="572" width="8" height="8" rx="1.5" fill="#5eead4"/>

    <!-- epos-service (caller 5) -->
    <rect x="515" y="490" width="110" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="570" y="513" text-anchor="middle" fill="#e5e5e5">epos-service</text>
    <rect x="522" y="528" width="8" height="8" rx="1.5" fill="#86efac"/>

    <!-- terminal-service (caller 6) -->
    <rect x="635" y="535" width="110" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="690" y="558" text-anchor="middle" fill="#e5e5e5">terminal-service</text>
    <rect x="642" y="572" width="8" height="8" rx="1.5" fill="#bef264"/>

    <!-- kds-service (caller 7) -->
    <rect x="755" y="490" width="110" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="810" y="513" text-anchor="middle" fill="#e5e5e5">kds-service</text>
    <rect x="762" y="528" width="8" height="8" rx="1.5" fill="#fde047"/>

    <!-- partners-app-service (caller 8) -->
    <rect x="875" y="535" width="110" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="930" y="558" text-anchor="middle" fill="#e5e5e5">partners-app-service</text>
    <rect x="882" y="572" width="8" height="8" rx="1.5" fill="#fcd34d"/>

    <!-- donation-service (caller 9) -->
    <rect x="995" y="490" width="110" height="65" rx="6" fill="rgba(240,171,252,0.06)" stroke="#f0abfc"/>
    <text x="1050" y="513" text-anchor="middle" fill="#f5d0fe">donation-service</text>
    <rect x="1002" y="528" width="8" height="8" rx="1.5" fill="#f0abfc"/>

    <!-- merchant-partner-service (caller 10) -->
    <rect x="1115" y="535" width="110" height="65" rx="6" fill="rgba(249,168,212,0.05)" stroke="#f9a8d4"/>
    <text x="1170" y="556" text-anchor="middle" fill="#fbcfe8">merchant-partner</text>
    <text x="1170" y="570" text-anchor="middle" font-size="8.5" fill="rgba(251,207,232,0.6)" font-style="italic">-service · biz pool</text>
    <rect x="1122" y="580" width="8" height="8" rx="1.5" fill="#f9a8d4"/>

    <!-- web-service (caller 11) -->
    <rect x="1235" y="490" width="125" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="1297" y="513" text-anchor="middle" fill="#e5e5e5">web-service</text>
    <rect x="1242" y="528" width="8" height="8" rx="1.5" fill="#fb923c"/>

    <!-- user-service (caller 12) -->
    <rect x="1370" y="535" width="125" height="65" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)"/>
    <text x="1432" y="558" text-anchor="middle" fill="#e5e5e5">user-service</text>
    <rect x="1377" y="572" width="8" height="8" rx="1.5" fill="#fb7185"/>
  </g>

  <!-- ==================== TIER 6: SPECIALISTS ==================== -->
  <g font-size="10.5" fill="#e5e5e5">
    <rect x="120" y="650" width="380" height="58" rx="6" fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.55)"/>
    <text x="310" y="673" text-anchor="middle" fill="#c4b5fd" font-weight="500">payment-aggregator-service</text>
    <text x="310" y="690" text-anchor="middle" font-size="9" fill="rgba(196,181,253,0.6)">sole owner of Stripe secrets · outbound to Stripe</text>
    <text x="310" y="703" text-anchor="middle" font-size="8.5" fill="rgba(196,181,253,0.5)" font-style="italic">14 real Feign callers (violet arrows below)</text>

    <rect x="520" y="650" width="190" height="58" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.24)"/>
    <text x="615" y="673" text-anchor="middle">cache-service</text>
    <text x="615" y="688" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Redis · 16 real callers</text>

    <rect x="725" y="650" width="220" height="58" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.24)"/>
    <text x="835" y="673" text-anchor="middle">async-notification-service</text>
    <text x="835" y="688" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">SES · SNS / Pinpoint · 16 callers</text>

    <rect x="960" y="650" width="160" height="58" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.24)"/>
    <text x="1040" y="673" text-anchor="middle">log-service</text>
    <text x="1040" y="688" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">audit · 7 callers</text>

    <rect x="1135" y="650" width="170" height="58" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.24)"/>
    <text x="1220" y="673" text-anchor="middle">report-service</text>
    <text x="1220" y="688" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Redshift · webhook only</text>

    <rect x="1320" y="650" width="160" height="58" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.24)"/>
    <text x="1400" y="673" text-anchor="middle">web-socket-service</text>
    <text x="1400" y="688" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Socket.IO real-time</text>
  </g>

  <!-- ==================== TIER 7: INDEPENDENT ==================== -->
  <g font-size="10.5">
    <rect x="120" y="780" width="380" height="80" rx="6" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.22)" stroke-dasharray="6 3"/>
    <text x="310" y="806" text-anchor="middle" fill="#e5e5e5" font-weight="500">batch-processor</text>
    <text x="310" y="823" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.45)">Spring @Scheduled cron · NO inbound HTTP · NO gateway</text>
    <text x="310" y="839" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.42)">reads DBs · S3 sweeps · calls payment-aggregator outbound</text>
    <text x="310" y="852" text-anchor="middle" font-size="8.5" fill="rgba(255,255,255,0.32)" font-style="italic">runs independently of client traffic</text>

    <rect x="800" y="780" width="500" height="80" rx="6" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.22)" stroke-dasharray="6 3"/>
    <text x="1050" y="806" text-anchor="middle" fill="#e5e5e5" font-weight="500">webhook-service</text>
    <text x="1050" y="823" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.45)">inbound from Stripe only · routed via api-gateway (Webhook routes)</text>
    <text x="1050" y="839" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.42)">no client audience · fans out to business + donation + self + report + payment-aggregator</text>
    <text x="1050" y="852" text-anchor="middle" font-size="8.5" fill="rgba(255,255,255,0.32)" font-style="italic">/webhook/adyen · /webhook/aws · /webhook/nash · /eposnow</text>
  </g>

  <!-- ============ MONEY PATH (real 14 Feign callers → payment-aggregator) ============ -->
  <g fill="none" stroke="#a78bfa" stroke-width="0.9" stroke-opacity="0.55" marker-end="url(#ah-v)">
    <path d="M 82 555 C 82 600 200 630 310 648"/>
    <path d="M 270 555 C 270 600 290 625 310 648"/>
    <path d="M 450 600 C 450 620 380 640 310 650"/>
    <path d="M 570 555 C 570 600 440 630 310 648"/>
    <path d="M 690 600 C 690 620 500 640 310 650"/>
    <path d="M 930 600 C 930 620 620 640 310 650"/>
    <path d="M 1050 555 C 1050 600 680 630 310 648"/>
    <path d="M 1170 600 C 1170 620 740 640 310 650"/>
    <path d="M 1297 555 C 1297 600 800 630 310 648"/>
    <path d="M 1432 555 C 1432 600 860 630 310 648"/>
    <path d="M 310 780 C 310 740 310 720 310 708"/>
    <path d="M 1050 780 C 800 740 500 720 310 708"/>
  </g>

  <!-- ============ Shared specialist fan-in (cache + async-notif + log) — representative ============ -->
  <g fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2" marker-end="url(#ah-w)">
    <path d="M 1490 600 C 1500 620 1495 640 615 650"/>
  </g>
  <text x="1330" y="635" fill="rgba(255,255,255,0.4)" font-size="9" font-style="italic" text-anchor="end">all data services → cache · async-notif · log (real Feign usage)</text>

  <!-- ============ report-service: only webhook-service ============ -->
  <g fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1" marker-end="url(#ah-w)">
    <path d="M 1050 780 C 1100 760 1180 720 1220 708"/>
  </g>
  <text x="1170" y="755" fill="rgba(255,255,255,0.4)" font-size="8.5" font-style="italic">only webhook</text>

  <!-- ============ Webhook-service fan-out (back to data services) ============ -->
  <g fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="1" stroke-dasharray="3 2" marker-end="url(#ah-w)">
    <path d="M 900 780 C 700 700 400 600 270 555"/>
    <path d="M 950 780 C 1000 700 1030 620 1050 555"/>
  </g>

  <!-- ============ Inter-service edges (REAL Feign usage → business-service) ============ -->
  <g fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="0.9" marker-end="url(#ah-w)">
    <path d="M 82 555 C 82 580 150 600 200 555"/>
    <path d="M 550 555 C 400 580 280 580 250 555"/>
    <path d="M 880 600 C 600 620 320 600 230 555"/>
    <path d="M 670 600 C 450 620 280 600 215 555"/>
    <path d="M 1265 555 C 700 615 280 600 195 555"/>
  </g>
  <text x="700" y="635" fill="rgba(255,255,255,0.4)" font-size="8.5" font-style="italic" text-anchor="middle">inter-service (REAL Feign): admin · epos · partners-app · terminal · web → business-service</text>

  <!-- ==================== CLIENT BOX LABELS (drawn last) ==================== -->
  <g font-size="9.5">
    <text x="82"   y="194" text-anchor="middle" fill="#a5f3fc">Web</text>
    <text x="82"   y="208" text-anchor="middle" fill="#a5f3fc">Admin Portal</text>
    <text x="210"  y="194" text-anchor="middle" fill="#c4b5fd">Partner admin</text>
    <text x="210"  y="208" text-anchor="middle" fill="#c4b5fd">web app</text>
    <text x="330"  y="234" text-anchor="middle" fill="#93c5fd">Business App</text>
    <text x="330"  y="248" text-anchor="middle" fill="#93c5fd">(mobile)</text>
    <text x="450"  y="200" text-anchor="middle" fill="#99f6e4">Kiosk app</text>
    <text x="570"  y="240" text-anchor="middle" fill="#bbf7d0">Epos app</text>
    <text x="690"  y="194" text-anchor="middle" fill="#d9f99d">Card Terminal</text>
    <text x="690"  y="208" text-anchor="middle" fill="#d9f99d">· Mpos</text>
    <text x="810"  y="234" text-anchor="middle" fill="#fef08a">Kitchen Display</text>
    <text x="810"  y="248" text-anchor="middle" fill="#fef08a">System</text>
    <text x="930"  y="200" text-anchor="middle" fill="#fde68a">Partner App</text>
    <text x="1050" y="240" text-anchor="middle" fill="#f5d0fe">Aid</text>
    <text x="1170" y="194" text-anchor="middle" fill="#fbcfe8">Reseller web</text>
    <text x="1170" y="208" text-anchor="middle" fill="#fbcfe8">app platform</text>
    <text x="1297" y="234" text-anchor="middle" fill="#fdba74">Websites</text>
    <text x="1297" y="248" text-anchor="middle" fill="#fdba74">(white-label)</text>
    <text x="1432" y="194" text-anchor="middle" fill="#fda4af">White-labeled</text>
    <text x="1432" y="208" text-anchor="middle" fill="#fda4af">apps</text>
  </g>

  <!-- ==================== LEGEND ==================== -->
  <g font-size="9.5">
    <rect x="20" y="900" width="1465" height="360" rx="6" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.13)"/>
    <text x="36" y="922" fill="rgba(255,255,255,0.45)" font-size="9.5" letter-spacing="1.5">LEGEND</text>

    <text x="36" y="942" fill="rgba(255,255,255,0.55)" font-size="9" letter-spacing="1">CLIENT → SERVICE  (3 segments per arrow: client→gateway, gateway→security, security→service)</text>
    <g font-size="9.5" fill="rgba(255,255,255,0.62)">
      <rect x="40"  y="953" width="11" height="11" rx="2" fill="#67e8f9"/><text x="58"  y="963">Web Admin Portal → admin-service  (direct, no gateway, internal JWT verify)</text>
      <rect x="40"  y="969" width="11" height="11" rx="2" fill="#a78bfa"/><text x="58"  y="979">Partner admin web app → business-service  (via business-api-gw + business-security)</text>
      <rect x="40"  y="985" width="11" height="11" rx="2" fill="#60a5fa"/><text x="58"  y="995">Business App (mobile) → business-service  (same path)</text>
      <rect x="40"  y="1001" width="11" height="11" rx="2" fill="#5eead4"/><text x="58"  y="1011">Kiosk app → self-service</text>
      <rect x="40"  y="1017" width="11" height="11" rx="2" fill="#86efac"/><text x="58"  y="1027">Epos app → epos-service</text>
      <rect x="40"  y="1033" width="11" height="11" rx="2" fill="#bef264"/><text x="58"  y="1043">Card Terminal · Mpos → terminal-service</text>
      <rect x="40"  y="1049" width="11" height="11" rx="2" fill="#fde047"/><text x="58"  y="1059">Kitchen Display System → kds-service</text>

      <rect x="540" y="953" width="11" height="11" rx="2" fill="#fcd34d"/><text x="558" y="963">Partner App → partners-app-service</text>
      <rect x="540" y="969" width="11" height="11" rx="2" fill="#f0abfc"/><text x="558" y="979">Aid → donation-service</text>
      <rect x="540" y="985" width="11" height="11" rx="2" fill="#f9a8d4"/><text x="558" y="995">Reseller web app platform → merchant-partner-service  (via business-api-gw)</text>
      <rect x="540" y="1001" width="11" height="11" rx="2" fill="#fb923c"/><text x="558" y="1011">Websites (white-label) → web-service  (via api-gw WL + security-service)</text>
      <rect x="540" y="1017" width="11" height="11" rx="2" fill="#fb7185"/><text x="558" y="1027">White-labeled apps → user-service  (same path)</text>
    </g>

    <text x="36" y="1090" fill="rgba(255,255,255,0.55)" font-size="9" letter-spacing="1">EDGE STYLES</text>
    <g font-size="9.5" fill="rgba(255,255,255,0.62)">
      <line x1="46"  y1="1105" x2="106" y2="1105" stroke="#a78bfa" stroke-width="1.6" marker-end="url(#ah-2)"/>
      <text x="116" y="1109">colored client arrow (lands exactly on box top edge)</text>

      <line x1="46"  y1="1125" x2="106" y2="1125" stroke="#a78bfa" stroke-width="0.9" stroke-opacity="0.55" marker-end="url(#ah-v)"/>
      <text x="116" y="1129">money path (real Feign caller → payment-aggregator, 14 services)</text>

      <line x1="650" y1="1105" x2="710" y2="1105" stroke="rgba(255,255,255,0.28)" stroke-width="0.9" marker-end="url(#ah-w)"/>
      <text x="720" y="1109">inter-service Feign call (real callers: admin · epos · partners-app · terminal · web → business)</text>

      <line x1="650" y1="1125" x2="710" y2="1125" stroke="rgba(255,255,255,0.32)" stroke-width="1" stroke-dasharray="3 2" marker-end="url(#ah-w)"/>
      <text x="720" y="1129">webhook fan-out (webhook-service → business + donation)</text>
    </g>

    <text x="36" y="1158" fill="rgba(255,255,255,0.55)" font-size="9" letter-spacing="1">NOTES</text>
    <text x="46"  y="1175" font-size="9" fill="rgba(255,255,255,0.5)">• PLATFORM moved to the TOP — config-server + discovery-service + admin-server are the boot-time foundation, NOT in any runtime request path</text>
    <text x="46"  y="1189" font-size="9" fill="rgba(255,255,255,0.5)">• Web Admin Portal is the only client that completely skips both gateway and security tiers (monolithic admin-service validates its admin-pool JWTs internally)</text>
    <text x="46"  y="1203" font-size="9" fill="rgba(255,255,255,0.5)">• arrow endpoints now land exactly on the gateway / security / service box top edges (no floating arrowheads)</text>
    <text x="46"  y="1217" font-size="9" fill="rgba(255,255,255,0.5)">• specialist counts reflect REAL Feign usage (services that actually invoke methods, not just declare an interface)</text>
    <text x="46"  y="1231" font-size="9" fill="rgba(255,255,255,0.5)">• batch-processor + webhook-service run independently of client traffic — batch has no inbound HTTP, webhook receives only external Stripe POSTs</text>
  </g>
</svg>`,
      },

      { type: "heading", text: "Clients (12)" },
      {
        type: "paragraph",
        text: "Twelve platforms reach the backend. Each one has its own color in the diagram — follow the color to see the full path.",
      },
      {
        type: "list",
        items: [
          "**Web Admin Portal** (cyan) → `admin-service`. The only client with no gateway.",
          "**Partner admin web app** (violet) → `business-service`. Merchant owner dashboard.",
          "**Business App (mobile)** (blue) → `business-service`. Android / iOS counterpart.",
          "**Kiosk app** (teal) → `self-service`. In-venue ordering screen.",
          "**Epos app** (green) → `epos-service`. Cashier till.",
          "**Card Terminal · Mpos** (lime) → `terminal-service`. Stripe physical readers.",
          "**Kitchen Display System** (yellow) → `kds-service`. Kitchen-floor ticket display.",
          "**Partner App** (amber) → `partners-app-service`. Field-partner mobile app.",
          "**Aid** (fuchsia) → `donation-service`. Charity donations product.",
          "**Reseller web app platform** (pink) → `merchant-partner-service`. Reseller dashboard.",
          "**Websites (white-label)** (orange) → `web-service`. Hosted partner sites.",
          "**White-labeled apps** (rose) → `user-service`. Mobile counterpart to the websites.",
        ],
      },

      { type: "heading", text: "Gateways (2)" },
      {
        type: "paragraph",
        text: "`business-api-gateway` routes nine clients. `api-gateway` routes the two white-label clients plus inbound Stripe webhooks. The Web Admin Portal skips both — `admin-service` exposes its own API and validates JWTs in-process.",
      },

      { type: "heading", text: "Security (2 services + 2 in-process)" },
      {
        type: "paragraph",
        text: "Each authenticated request has its JWT checked before the data service answers. `business-security-service` covers the business Cognito pool (clients 2–10). `security-service` covers the user pool (clients 11–12). `admin-service` and `merchant-partner-service` do the same check in-process so they don't need an external security service.",
      },

      { type: "heading", text: "Data services (11)" },
      {
        type: "paragraph",
        text: "One service per audience. One schema per service. Nothing else touches that schema.",
      },
      {
        type: "list",
        items: [
          "`admin-service` — ops tools (transfer funds, fee config, compliance).",
          "`business-service` — merchants, properties, menus, orders. Biggest service.",
          "`donation-service` — charities, campaigns, donations.",
          "`self-service` — kiosk runtime.",
          "`epos-service` — till runtime.",
          "`terminal-service` — Stripe Terminal readers.",
          "`kds-service` — kitchen-display tickets.",
          "`partners-app-service` — partner mobile app backend.",
          "`merchant-partner-service` — reseller dashboard.",
          "`web-service` — white-label site BFF.",
          "`user-service` — white-label user accounts.",
        ],
      },

      { type: "heading", text: "Specialists (6)" },
      {
        type: "paragraph",
        text: "Cross-cutting Feign clients called by data services. Caller counts below are real usage — services that actually invoke methods, not just declare an interface.",
      },
      {
        type: "list",
        items: [
          "`payment-aggregator-service` — sole owner of Stripe keys. 14 callers.",
          "`cache-service` — Redis. 16 callers.",
          "`async-notification-service` — SES email · SNS / Pinpoint SMS. 16 callers.",
          "`log-service` — audit sink. 7 callers.",
          "`report-service` — Redshift reports. 1 caller (`webhook-service` only).",
          "`web-socket-service` — Socket.IO push.",
        ],
      },

      { type: "heading", text: "Independent (2)" },
      {
        type: "paragraph",
        text: "Outside the client request flow. `batch-processor` is Spring `@Scheduled` cron — image archives, payout invoices, dunning. No inbound HTTP. `webhook-service` receives Stripe POSTs via `api-gateway` and fans out to business, donation, self, and report. No client audience hits it.",
      },

      { type: "heading", text: "Platform (3)" },
      {
        type: "paragraph",
        text: "Boot-time only. `config-server` pulls from AWS Secrets Manager. `discovery-service` is the Eureka cluster gateways use to resolve `lb://` service ids. `admin-server` is the Spring Boot Admin health dashboard. None of them are in the runtime request path.",
      },

      { type: "heading", text: "The rule" },
      {
        type: "paragraph",
        text: "Nobody touches another service's database. Cross-service reads go over Feign. A service dies, the rest survive missing one slice of capability — not the whole system.",
      },

      {
        type: "paragraph",
        text: "Hold the diagram in your head and you can answer four questions about any of the twenty-six services: which tier, who calls it, who it calls, what breaks if it stops. That's the job.",
      },
    ],
  },

  {
    slug: "aws-in-production",
    title: "AWS in Production — Cognito, S3, Pipelines, Logs & the Bits Nobody Documents",
    excerpt:
      "Three Cognito pools, thirty-odd S3 buckets, ten-step ECS deploys, and the AWS bits that only make sense once you've shipped them — what backend-services actually runs on and why.",
    category: "Infrastructure",
    tags: ["AWS", "Cognito", "S3", "ECS", "CloudFront", "GitHub Actions", "Java", "Spring Boot"],
    readTime: "16 min",
    publishedDate: "2026-06",
    status: "published",
    image: "/learning/aws-in-production.jpg",
    body: [
      {
        type: "paragraph",
        text: "backend-services are roughly thirty Spring Boot services, all running in a single AWS region — eu-west-2 (London). Most engineers who join the codebase ask the same first question: where does AWS actually live in this thing? The answer isn't in one config file or one service — it's spread across every layer, from the way merchants sign in, to how images survive a deploy, to how a `git push` ends up running in production six minutes later. This is the honest tour: what we use, why we picked it, and the parts that only start making sense after they've already bitten you.",
      },

      { type: "heading", text: "Three Cognito user pools, and they're not interchangeable" },
      {
        type: "paragraph",
        text: "Every login on the platform goes through Cognito — but not the same pool. We run three: an admin pool for ops and platform engineers, a business pool that holds every merchant, donation-portal user, reseller, and business contact (this is the big one — five-figure user count), and a third pool dedicated to the partners-app. They're separate on purpose. A leaked credential on one shouldn't grant a token that any other service in the platform will accept.",
      },
      {
        type: "paragraph",
        text: "JWT validation per pool is wired through a config property, not hardcoded: `cognito.jwt.key.store.url = https://cognito-idp.${aws.region}.amazonaws.com/${pool-id}`. Every service that fronts an authenticated API resolves the right key store at boot, downloads the JWKS, and validates incoming bearer tokens against the pool that issued them. The trick is that admin, business, and partners-app pools all sign tokens that look syntactically identical — the difference is which `iss` claim points at which pool. Getting that resolution wrong means an admin token authenticates as a business user (or worse).",
      },
      {
        type: "code",
        language: "java",
        caption: "Per-pool JWT validation, resolved at boot",
        code: `// application.yml
//   aws:
//     business:
//       userpool:
//         id: eu-west-2_xxxxxxxxx
//   cognito:
//     business:
//       jwt:
//         key:
//           store:
//             url: https://cognito-idp.\${aws.region}.amazonaws.com/\${aws.business.userpool.id}

// At boot — one decoder per pool, never shared, never reused across services
JwtDecoder businessDecoder = NimbusJwtDecoder
    .withJwkSetUri(businessJwksUrl + "/.well-known/jwks.json")
    .build();`,
      },
      {
        type: "paragraph",
        text: "Cognito itself does nineteen distinct things in our code — sign-up, OTP confirm, sign-in, MFA setup, password reset, global sign-out, the whole admin-API surface (user create, delete, attribute updates, password set). We use the AWS SDK v2 `CognitoIdentityProviderClient` almost everywhere, with v1 `AWSCognitoIdentityProvider` still in older spots that haven't been migrated. Either client works fine; mixing them in the same service is the only thing that gets weird (v1 and v2 have different exception hierarchies, so a unified retry layer has to handle both).",
      },
      {
        type: "callout",
        label: "What I'd tell past me",
        text: "Decide which pool a service authenticates against on day one. Once a Spring config is loaded, switching a service from admin pool to business pool isn't a flag flip — it's a coordinated re-issue of every active token. We had that conversation exactly once and it was unpleasant.",
      },

      { type: "heading", text: "S3 is thirty buckets, not one" },
      {
        type: "paragraph",
        text: "There's a lazy way to use S3 — one bucket, prefix-as-folder for everything — and there's the way that actually scales when seven domains all want their own lifecycle, encryption, and CloudFront distribution. We picked the second. Roughly thirty buckets, grouped by the kind of data they hold: user/profile photos, property assets, the menu graph (categories, items, addons), POS and signage media, the donation Aid surface (campaign / event / fundraiser images), docs and training, onboarding and compliance, marketing and reports. Each bucket has a paired `*.cdn.url` CloudFront distribution in front of it, so app code never serves a `*.s3.amazonaws.com` URL to a client.",
      },
      {
        type: "list",
        items: [
          "User / profile photos — `profile.images`, `admin.profile.images`, `business.user.profile.images`, `merchant.partner.profile.images`",
          "Property assets — `property.images`, `property.featured.image.or.video`, `property.compliance`",
          "Menu graph — `menu.images`, `category.images`, `item.images`, `addon.images`",
          "POS / signage / kiosk — `product.images`, `advert.images`, `signage.media`, `theme.images`, `kiosk.screensaver.image.or.video`",
          "Donation Aid surface — `donation.campaign.images`, `event.images`, `fundraiser.images`",
          "Docs / training — `knowledge.base` (versioning enabled), `csr.training.videos`, `help.attachment.images`",
          "Onboarding / compliance / HR — `admin.business.documents`, `business.onboarding.documents`, `business.hr.media`",
          "Marketing / reports — `marketing.operations`, `ryft.reports`, `reports`",
        ],
      },
      {
        type: "paragraph",
        text: "Splitting like this isn't free — every bucket is one more config key, one more CloudFront distribution, one more set of CORS headers to keep in sync — but it lets us reason about retention and access independently. Compliance documents go in their own bucket with longer retention. Knowledge-base docs have S3-side versioning enabled so a rollback is a single `GetObject` against an older version id. User profile photos churn fast and can be aggressively cleaned. None of that is possible if everything's in one bucket called `stuff`.",
      },
      {
        type: "code",
        language: "java",
        caption: "The upload pattern that ended up in every service",
        code: `// Reactive controllers + JPA + S3 don't naturally coexist —
// we landed on this pattern after trying everything else.

String ext = FilenameUtils.getExtension(filePart.filename());
String s3Key = "properties/" + propertyId + "/banners/" + bannerType + "." + ext;
String[] uploadedUrl = new String[1];
CountDownLatch latch = new CountDownLatch(1);

Mono.fromCallable(() -> Files.createTempFile(TEMP_PREFIX, uniqueId() + "." + ext))
    .subscribeOn(Schedulers.boundedElastic())
    .flatMap(tempFile -> DataBufferUtils.write(filePart.content(), tempFile, CREATE)
        .then(Mono.fromRunnable(() -> {
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(propertyImagesBucketName)
                    .key(s3Key)
                    .build(),
                RequestBody.fromFile(tempFile.toFile()));
            uploadedUrl[0] = propertyImagesCdnUrl + "/" + s3Key;   // CloudFront URL, never S3 directly
        })))
    .doOnTerminate(latch::countDown)
    .doOnError(e -> latch.countDown())
    .subscribe();
latch.await();`,
      },
      {
        type: "paragraph",
        text: "That pattern is in maybe a dozen services. It's not pretty — `CountDownLatch.await()` in a reactive method is the kind of thing every Reactor blog post tells you not to do — but it solves a real problem: the controller's `Mono` needs to return synchronously to the client with the uploaded URL, but the actual S3 PUT needs to happen off the event loop (otherwise a slow upload blocks every other request on that worker). `Files.createTempFile` + `DataBufferUtils.write` on `boundedElastic` + a latch is the least-bad answer I've found. The URL we return is always the CloudFront one, never the raw S3 one — clients never learn the bucket name.",
      },
      {
        type: "quote",
        text: "Every public-facing image URL in the platform is a CloudFront URL. Not because it's faster — because it means we can switch buckets, re-region, or rotate keys without invalidating a single URL in a single database row.",
      },

      { type: "heading", text: "Email + SMS: three SDKs for two messages" },
      {
        type: "paragraph",
        text: "Transactional email goes through SES (`SesClient` + `SendEmailRequest`). SMS is split — older flows use SNS publish-as-SMS with a sender ID and `Transactional` type, while newer flows have moved to Pinpoint SMS Voice v2 (`PinpointSmsVoiceV2Client` + `SendTextMessageRequest`) under an `aws.eum.enabled` toggle. Yes, we run two SMS paths in parallel — that's the cost of migrating without downtime. The toggle picks one based on env config; production has been on Pinpoint for a while, but the SNS path is still there for the legacy regions.",
      },
      {
        type: "paragraph",
        text: "SMS sending has its own IAM role (`aws.sms.role`) separate from the service's default role, because the permission to publish SMS through SNS is much more powerful than the rest of what the service needs — and we'd rather assume the SMS role explicitly than grant the service's default role permanent SMS-send rights. That distinction has saved us from one near-miss already.",
      },

      { type: "heading", text: "Secrets Manager: not for everything, but for the parts that matter" },
      {
        type: "paragraph",
        text: "Database passwords and PSP API keys (Stripe, Ryft, Adyen) live in AWS Secrets Manager and get pulled at boot via `GetSecretValueRequest`. Everything else (bucket names, CDN URLs, Cognito pool IDs) lives in Spring config under `application-<env>.yml`. The line we drew: anything whose leak would cost real money goes in Secrets Manager; anything else doesn't earn the extra round-trip. That keeps boot time fast while still gating the dangerous bits behind IAM.",
      },

      { type: "heading", text: "Region: eu-west-2, and that's a deliberate choice" },
      {
        type: "paragraph",
        text: "Single region — London. UK GDPR + data-residency conversations with charity customers are easier when nothing leaves the country, and the latency penalty for everything-in-one-region is invisible at our scale. The downside is real (one region == one regional outage == zero traffic) but the upside is also real: cross-region replication, multi-region IAM, and per-region key management are entire workstreams we don't have to staff yet. That trade is honest.",
      },

      { type: "heading", text: "Local creds vs OIDC: same SDK, different identity" },
      {
        type: "paragraph",
        text: "Local dev uses static `aws.key.access` / `aws.key.secret` per developer, loaded from a gitignored properties file. Prod doesn't have static keys anywhere — every GitHub Actions run assumes an AWS role via OIDC federation. The deploy workflow doesn't ship secrets to the runner; it asks AWS for a temporary STS token good for the length of the job, calls AWS with that, and lets the token expire.",
      },
      {
        type: "code",
        language: "yaml",
        caption: "How the GitHub Actions runner gets AWS credentials — no static keys anywhere",
        code: `permissions:
  id-token: write   # required for the OIDC JWT exchange

steps:
  - name: Configure AWS Credentials
    uses: aws-actions/configure-aws-credentials@v1.7.0
    with:
      role-to-assume: \${{ vars.AWS_ROLE_ARN }}
      role-session-name: GitHub_to_AWS_via_FederatedOIDC
      aws-region: \${{ vars.AWS_REGION }}

  - name: STS Get Caller Identity
    run: aws sts get-caller-identity   # sanity check — fail early if the trust policy is wrong`,
      },
      {
        type: "callout",
        label: "What I'd tell past me",
        text: "Set up OIDC federation BEFORE you set up your first deploy pipeline. Migrating an existing static-credential pipeline to OIDC after the fact means rotating every secret in every repo, which is exactly the kind of work nobody schedules until something breaks.",
      },

      { type: "heading", text: "CI/CD: four workflows per service, ten steps per workflow" },
      {
        type: "paragraph",
        text: "Every service has its own `.github/workflows/` directory with four pipelines: `cicd-dev.yml`, `cicd-test.yml`, `cicd-prod.yml`, `cicd-prod-blue.yml`. Branch-per-environment — pushing to `dev-deploy` triggers the dev pipeline, `prod-deploy` triggers prod, `prod-deploy-blue` triggers the blue lane of our blue/green rotation. No manual approvals; the branch IS the approval.",
      },
      {
        type: "paragraph",
        text: "Each pipeline runs ten steps, in this order, every time:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "GitHub Actions OIDC federation — `aws-actions/configure-aws-credentials` with `role-to-assume`, no static creds.",
          "`aws sts get-caller-identity` sanity check — fail loudly if the trust policy is wrong.",
          "GraalVM JDK 25 build via Maven — `mvn clean install -DskipTests`.",
          "Spring Boot Paketo Buildpacks build the Docker image — `mvn spring-boot:build-image -DDEPLOYMENT_ENVIRONMENT=prod_blue`.",
          "Login to Amazon ECR — `aws-actions/amazon-ecr-login@v2`.",
          "Tag + push the image to ECR.",
          "`aws ecs describe-task-definition` fetches the current task def for that service.",
          "`aws-actions/amazon-ecs-render-task-definition@v1.6.1` patches the new image + env vars (`LOG_LEVEL`, `UPDATE_TIMESTAMP`, `DEPLOYMENT_ENVIRONMENT`).",
          "`aws-actions/amazon-ecs-deploy-task-definition@v2.2.0` deploys with `wait-for-service-stability: true` — the job hangs until the new task is healthy.",
          "Cleanup — `aws ecs list-task-definitions` + `aws ecs deregister-task-definition` to keep only the last N revisions per service, so the task-def list doesn't grow unbounded.",
        ],
      },
      {
        type: "paragraph",
        text: "The Paketo buildpack step is the one that took me longest to learn to trust. It turns a Spring Boot fat JAR into an OCI image without a `Dockerfile`, which sounds like magic until it's the only thing standing between you and a successful deploy at 2am. The trade is convenience for control — we can't tweak the base image without rolling our own buildpack — but for thirty services, none of which actually need a custom base image, that's a deal worth taking.",
      },
      {
        type: "paragraph",
        text: "The cleanup step is the one I'm most quietly proud of. ECS task definitions accumulate revisions FOREVER unless you deregister them, and a year of daily deploys leaves you with 365 revisions per service. The cleanup runs at the end of every successful deploy, lists task defs with `--sort DESC`, keeps the latest N (driven by a repo variable), and `deregister`s the rest. Costs nothing, prevents a maintenance task from existing.",
      },

      { type: "heading", text: "Logs: not what the appender says" },
      {
        type: "paragraph",
        text: "Inside the app, every service writes through Logback — a `RollingFileAppender` for local-disk rotation and a Sentry appender for errors. There is NO direct CloudWatch appender in the application config, and that's intentional. CloudWatch ingestion happens at the infra layer: every ECS task definition declares the `awslogs` log driver, which captures `stdout` and `stderr` from the container and ships them to a CloudWatch log group named after the service. The app doesn't know it's logging to CloudWatch; it just logs.",
      },
      {
        type: "callout",
        label: "Why this matters",
        text: "If you ever want to move off CloudWatch (to Datadog, to OpenSearch, to anything else), you change the ECS log driver in the task definition — not thirty service configs. Decoupling 'how the app writes logs' from 'where logs end up' is one of those tiny architecture decisions that saves you years later.",
      },
      {
        type: "paragraph",
        text: "Querying CloudWatch logs in practice means CloudWatch Logs Insights — its mini-SQL is awkward at first but pays off the moment you need to grep across all thirty services for a correlation ID. The query I keep saved: `fields @timestamp, @message | filter @message like /correlation-id=abc123/ | sort @timestamp asc`. Cross-service tracing through one shared log group beats any APM tool we've tried — partly because it forces every service to write structured logs, partly because Insights is fast enough that 'just grep production' is a viable debugging strategy.",
      },

      { type: "heading", text: "The batch processor: cron jobs that pretend they're services" },
      {
        type: "paragraph",
        text: "One of the thirty services is `batch-processor`, and most of what lives in there is a collection of `*ImageArchiveScheduler` classes — one each for admin user images, business user images, category images, menu images, item images, property images, and a couple more. Each one does the same thing on a `@Scheduled` cron: walks the DB to collect every image URL still in use, lists S3 for that bucket, computes the set difference, and deletes the orphans.",
      },
      {
        type: "code",
        language: "java",
        caption: "The orphan-prune pattern, applied to every image bucket",
        code: `@Scheduled(cron = "0 30 2 * * SUN")   // 2:30am Sunday, off-peak
public void archiveOrphans() {
    // Source of truth: every URL currently referenced in the DB
    Set<String> liveKeys = imageRepo.findAllCurrentImageUrls().stream()
        .map(this::extractKeyFromCdnUrl)
        .collect(Collectors.toSet());

    // Walk S3 (LIST is paginated — handle continuation tokens)
    ListObjectsV2Iterable pages = s3Client.listObjectsV2Paginator(
        ListObjectsV2Request.builder().bucket(bucketName).build());

    pages.contents().stream()
        .map(S3Object::key)
        .filter(key -> !liveKeys.contains(key))
        .forEach(orphan -> {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName).key(orphan).build());
            log.info("Archived orphan key={}", orphan);
        });
}`,
      },
      {
        type: "paragraph",
        text: "Two things to know if you build something like this. First: the DB lookup is the source of truth, not S3. Anything in S3 that isn't referenced by a current DB row is, by definition, orphan — keys that were uploaded by a request that subsequently failed, or that were replaced by a new upload but never deleted. Second: run it at 2:30am Sunday, not 9am Monday. The first time we ran the property-images sweep mid-week it deleted ~40,000 keys in a few minutes — totally correct, slightly terrifying when you see the deletion graph in real time.",
      },
      {
        type: "paragraph",
        text: "The scheduler classes I've seen so far: `AdminUserImageArchiveScheduler`, `BusinessUserImageArchiveScheduler`, `UserImageArchiveScheduler`, `CategoryImageArchiveScheduler`, `MenuImageArchiveScheduler`, `ItemImageArchiveScheduler`, `PropertyImagesArchiveScheduler`. There's a similar pattern that could be turned into a generic `ImageArchiveScheduler<TEntity>` someday — but each variant has subtly different DB lookups (some entities reference images via JSONB columns, some via direct columns, some via a join table), and the duplication is honest about that.",
      },

      { type: "heading", text: "The bits NOT in the code — and why that's fine" },
      {
        type: "paragraph",
        text: "CloudFront distributions are paired one-to-one with each bucket, but you won't find any `CloudFrontClient` in the codebase — distributions are created and invalidated outside the apps, by infra tooling (the CloudFront URLs themselves are just config values). Same for the ECS cluster, the ALB / Route 53 / ACM stack the deploys land on — implied by every step of the CI/CD pipeline, but the apps don't talk to those services directly. They're shaped by whoever owns the infra repo, not by application code.",
      },
      {
        type: "paragraph",
        text: "That split — app code talks to AWS for the things it uses (S3, Cognito, SES, SNS, Pinpoint, Secrets Manager, SQS), infra code provisions the things the app runs ON (ECS, ALB, CloudFront, Route 53, ACM) — is the cleanest line we've drawn. The day-to-day backend engineer never edits a Terraform file. The infra engineer never edits a Spring config. Both can move independently, and when something breaks, the blame domain is obvious within thirty seconds of seeing the failure.",
      },

      { type: "heading", text: "Lessons I'd pass on" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pick one region and live with it until your customers demand otherwise — multi-region AWS is an entire org's job, not a side quest.",
          "Use multiple Cognito pools for multiple audiences; never share a pool between admin and end-users, even if 'we can just check a role claim' looks tempting.",
          "Set up OIDC federation between GitHub Actions and AWS before your first deploy pipeline — migrating later is painful and rarely scheduled until something leaks.",
          "Many small S3 buckets beat one big one — retention, encryption, CORS, and CloudFront distributions can all be tuned per domain, and the per-bucket overhead disappears once your config is tidy.",
          "Always serve CloudFront URLs to clients, never raw S3 ones — it costs nothing now and saves you a database migration later.",
          "Run an orphan-prune scheduler from day one, not when storage cost gets noticed — and run it off-peak the first time.",
          "Keep app-level logging dumb (Logback to stdout) and let the infra ship logs wherever — that decoupling is the difference between 'we want to try Datadog' being a quarter of work or thirty pull requests.",
          "Two parallel SMS paths is fine. Migrating SMS providers without downtime IS the work; pretending you can swap in one commit is how outages happen.",
          "Anything that moves money — and anything that grants identity — goes through Secrets Manager. Anything else lives in plain config; you're paying for a round-trip you don't need.",
          "Cleanup is a feature. The ECS task-definition pruning step is five lines of shell and saves a maintenance task from ever existing.",
        ],
      },

      {
        type: "paragraph",
        text: "None of what's here is exotic AWS — it's the foundational stuff (Cognito, S3, ECS, CloudWatch, Secrets Manager, SES, SNS, Pinpoint) wired together by people who'd rather get the boring parts right once and never think about them again. The interesting work is rarely in any one service; it's in the boundaries between them — which pool authenticates which audience, which bucket holds which kind of file, which IAM role gets which permission. Those boundaries are what's actually load-bearing.",
      },
    ],
  },

  {
    slug: "stripe-connect-in-production",
    title: "Stripe Connect in Production — Onboarding, Terminal, Payouts & Instant Payouts",
    excerpt:
      "Everything I actually learned wiring a multi-PSP platform onto Stripe Connect — account setup, in-person card payments, payout cadence, instant payouts, and the mistakes that taught me the most.",
    category: "Integrations",
    tags: ["Stripe", "Stripe Connect", "Payments", "Java", "Spring Boot"],
    readTime: "14 min",
    publishedDate: "2026-06",
    status: "published",
    image: "/learning/stripe-connect.jpg",
    body: [
      {
        type: "svg",
        caption: "Stripe Connect · one merchant's money, start to end. Onboarding becomes an active account, a payment authorizes then captures with the fee split, the balance settles out via payout + transfer — with Terminal reader pairing and subscriptions shown as their own branches.",
        svg: `<svg viewBox="0 0 1560 760" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
  <defs>
    <marker id="sh-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#67e8f9"/></marker>
    <marker id="sh-violet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#c084fc"/></marker>
    <marker id="sh-rose" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f9a8d4"/></marker>
    <marker id="sh-w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.4)"/></marker>
  </defs>

  <rect width="1560" height="760" fill="#070707"/>
  <text x="20" y="28" fill="#e5e5e5" font-size="14" letter-spacing="1.2" font-weight="500">Stripe Connect · one merchant's money, start to end</text>
  <text x="20" y="46" fill="rgba(255,255,255,0.35)" font-size="10">20 steps · onboarding → payment → payout, with Terminal + subscriptions as branches</text>

  <!-- ================= LANE 1: ONBOARDING (cyan) ================= -->
  <text x="20" y="82" fill="#67e8f9" font-size="11" font-weight="500" letter-spacing="0.5">ONBOARDING</text>
  <g font-size="9.5">
    <rect x="20"   y="95" width="175" height="72" rx="6" fill="rgba(103,232,249,0.06)" stroke="#67e8f9" stroke-width="1.2"/>
    <text x="107" y="120" text-anchor="middle" fill="#e5e5e5">1 · Create account</text>
    <text x="107" y="136" text-anchor="middle" fill="rgba(165,243,252,0.7)" font-size="8.5">POST /v1/accounts</text>
    <text x="107" y="150" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">fees, capabilities set</text>

    <rect x="210"  y="95" width="175" height="72" rx="6" fill="rgba(103,232,249,0.06)" stroke="#67e8f9" stroke-width="1.2"/>
    <text x="297" y="120" text-anchor="middle" fill="#e5e5e5">2 · Account link</text>
    <text x="297" y="136" text-anchor="middle" fill="rgba(165,243,252,0.7)" font-size="8.5">POST /v1/account_links</text>
    <text x="297" y="150" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">hosted onboarding URL</text>

    <rect x="400"  y="95" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="487" y="120" text-anchor="middle" fill="#e5e5e5">3 · Merchant fills KYC</text>
    <text x="487" y="136" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">Stripe's hosted page</text>

    <rect x="590"  y="95" width="175" height="72" rx="6" fill="rgba(103,232,249,0.06)" stroke="#67e8f9" stroke-width="1.2"/>
    <text x="677" y="120" text-anchor="middle" fill="#e5e5e5">4 · Poll status</text>
    <text x="677" y="136" text-anchor="middle" fill="rgba(165,243,252,0.7)" font-size="8.5">GET /v1/account</text>
    <text x="677" y="150" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">details_submitted etc.</text>

    <rect x="780"  y="95" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="867" y="120" text-anchor="middle" fill="#e5e5e5">5 · account.updated</text>
    <text x="867" y="136" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">webhook fires</text>

    <rect x="970"  y="95" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="1057" y="120" text-anchor="middle" fill="#e5e5e5">6 · Capability check</text>
    <text x="1057" y="136" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">card_payments + transfers</text>
    <text x="1057" y="150" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">both must read active</text>

    <rect x="1160" y="95" width="175" height="72" rx="6" fill="rgba(134,239,172,0.06)" stroke="#86efac" stroke-width="1.2"/>
    <text x="1247" y="120" text-anchor="middle" fill="#e5e5e5">7 · Merchant active</text>
    <text x="1247" y="136" text-anchor="middle" fill="rgba(187,247,208,0.7)" font-size="8.5">can now take payments</text>

    <rect x="1350" y="95" width="190" height="72" rx="6" fill="rgba(103,232,249,0.06)" stroke="#67e8f9" stroke-width="1.2" stroke-dasharray="4 3"/>
    <text x="1445" y="120" text-anchor="middle" fill="#e5e5e5">8 · Terminal Location</text>
    <text x="1445" y="136" text-anchor="middle" fill="rgba(165,243,252,0.7)" font-size="8.5">POST /v1/terminal/locations</text>
    <text x="1445" y="150" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">auto-created alongside</text>
  </g>
  <g fill="none" stroke="#67e8f9" stroke-width="1.5" stroke-opacity="0.85" marker-end="url(#sh-cyan)">
    <line x1="195" y1="131" x2="208" y2="131"/>
    <line x1="385" y1="131" x2="398" y2="131"/>
    <line x1="575" y1="131" x2="588" y2="131"/>
    <line x1="765" y1="131" x2="778" y2="131"/>
    <line x1="955" y1="131" x2="968" y2="131"/>
    <line x1="1145" y1="131" x2="1158" y2="131"/>
    <line x1="1335" y1="131" x2="1348" y2="131"/>
  </g>

  <!-- Terminal Reader branch — off Terminal Location, feeds the in-person payment path -->
  <line x1="1445" y1="167" x2="1445" y2="181" stroke="#67e8f9" stroke-width="1.4" marker-end="url(#sh-cyan)"/>
  <rect x="1325" y="184" width="215" height="40" rx="5" fill="rgba(103,232,249,0.05)" stroke="#67e8f9" stroke-width="1.1" stroke-dasharray="3 3"/>
  <text x="1432" y="200" text-anchor="middle" fill="#e5e5e5" font-size="9">Pair a Terminal Reader</text>
  <text x="1432" y="214" text-anchor="middle" fill="rgba(165,243,252,0.7)" font-size="8">POST /v1/terminal/readers · once per device</text>

  <!-- ================= connector: onboarding → payment ================= -->
  <path d="M 107 167 L 107 245 L 780 245 L 780 263" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.4" marker-end="url(#sh-w)"/>
  <text x="450" y="240" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="8.5" font-style="italic">merchant active → can now accept a payment</text>

  <!-- ================= LANE 2: PAYMENT (violet) ================= -->
  <text x="20" y="298" fill="#c084fc" font-size="11" font-weight="500" letter-spacing="0.5">PAYMENT</text>
  <g font-size="9.5">
    <rect x="20"   y="311" width="175" height="72" rx="6" fill="rgba(192,132,252,0.07)" stroke="#c084fc" stroke-width="1.2"/>
    <text x="107" y="336" text-anchor="middle" fill="#e5e5e5">9 · Checkout Session</text>
    <text x="107" y="352" text-anchor="middle" fill="rgba(233,213,255,0.75)" font-size="8.5">POST /v1/checkout/sessions</text>
    <text x="107" y="366" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">or /v1/payment_links</text>

    <rect x="210"  y="311" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="297" y="336" text-anchor="middle" fill="#e5e5e5">10 · PaymentIntent</text>
    <text x="297" y="352" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">auto-created by Stripe</text>

    <rect x="400"  y="311" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="487" y="336" text-anchor="middle" fill="#e5e5e5">11 · Customer pays</text>
    <text x="487" y="352" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">card online or Terminal tap</text>
    <text x="487" y="366" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">→ requires_capture</text>

    <rect x="590"  y="311" width="175" height="72" rx="6" fill="rgba(192,132,252,0.07)" stroke="#c084fc" stroke-width="1.2"/>
    <text x="677" y="336" text-anchor="middle" fill="#e5e5e5">12 · Resolve fee</text>
    <text x="677" y="352" text-anchor="middle" fill="rgba(233,213,255,0.75)" font-size="8.5">GET /v1/charges/:id</text>
    <text x="677" y="366" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">brand, funding, country</text>

    <rect x="780"  y="311" width="175" height="72" rx="6" fill="rgba(192,132,252,0.07)" stroke="#c084fc" stroke-width="1.2"/>
    <text x="867" y="336" text-anchor="middle" fill="#e5e5e5">13 · Capture</text>
    <text x="867" y="352" text-anchor="middle" fill="rgba(233,213,255,0.75)" font-size="8.5">POST .../capture</text>
    <text x="867" y="366" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">fee splits here</text>

    <rect x="970"  y="311" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="1057" y="336" text-anchor="middle" fill="#e5e5e5">14 · payment_intent</text>
    <text x="1057" y="352" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">.succeeded webhook</text>

    <rect x="1160" y="311" width="175" height="72" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
    <text x="1247" y="336" text-anchor="middle" fill="#e5e5e5">15 · Match metadata</text>
    <text x="1247" y="352" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8.5">merchantId, reference</text>

    <rect x="1350" y="311" width="190" height="72" rx="6" fill="rgba(134,239,172,0.06)" stroke="#86efac" stroke-width="1.2"/>
    <text x="1445" y="336" text-anchor="middle" fill="#e5e5e5">16 · Balance updates</text>
    <text x="1445" y="352" text-anchor="middle" fill="rgba(187,247,208,0.7)" font-size="8.5">merchant + platform</text>
  </g>
  <g fill="none" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.85" marker-end="url(#sh-violet)">
    <line x1="195" y1="347" x2="208" y2="347"/>
    <line x1="385" y1="347" x2="398" y2="347"/>
    <line x1="575" y1="347" x2="588" y2="347"/>
    <line x1="765" y1="347" x2="778" y2="347"/>
    <line x1="955" y1="347" x2="968" y2="347"/>
    <line x1="1145" y1="347" x2="1158" y2="347"/>
    <line x1="1335" y1="347" x2="1348" y2="347"/>
  </g>

  <!-- ================= SUBSCRIPTIONS branch — step 20, off the Checkout Session box ================= -->
  <line x1="107" y1="383" x2="107" y2="397" stroke="#c084fc" stroke-width="1.4" marker-end="url(#sh-violet)"/>
  <text x="20" y="412" fill="#c084fc" font-size="10" font-weight="500" letter-spacing="0.5">20 · SUBSCRIPTIONS (repeats 9-15)</text>
  <g font-size="9">
    <rect x="20"  y="422" width="175" height="46" rx="5" fill="rgba(192,132,252,0.06)" stroke="#c084fc" stroke-width="1.1" stroke-dasharray="3 3"/>
    <text x="107" y="441" text-anchor="middle" fill="#e5e5e5">Create a Price</text>
    <text x="107" y="455" text-anchor="middle" fill="rgba(233,213,255,0.7)" font-size="8">POST /v1/prices</text>

    <rect x="210" y="422" width="175" height="46" rx="5" fill="rgba(192,132,252,0.06)" stroke="#c084fc" stroke-width="1.1" stroke-dasharray="3 3"/>
    <text x="297" y="441" text-anchor="middle" fill="#e5e5e5">Session, mode=subscription</text>
    <text x="297" y="455" text-anchor="middle" fill="rgba(233,213,255,0.7)" font-size="8">POST /v1/checkout/sessions</text>

    <rect x="400" y="422" width="175" height="46" rx="5" fill="rgba(192,132,252,0.06)" stroke="#c084fc" stroke-width="1.1" stroke-dasharray="3 3"/>
    <text x="487" y="441" text-anchor="middle" fill="#e5e5e5">invoice.paid (renewal)</text>
    <text x="487" y="455" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">skips step 15's metadata match</text>
  </g>
  <g fill="none" stroke="#c084fc" stroke-width="1.3" stroke-opacity="0.8" marker-end="url(#sh-violet)">
    <line x1="195" y1="445" x2="208" y2="445"/>
    <line x1="385" y1="445" x2="398" y2="445"/>
  </g>

  <!-- ================= connector: payment → payout ================= -->
  <path d="M 1445 383 L 1445 500 L 685 500 L 685 518" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.4" marker-end="url(#sh-w)"/>
  <text x="1112" y="495" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="8.5" font-style="italic">settled balance sits on Stripe until paid out</text>

  <!-- ================= LANE 3: PAYOUT (rose) ================= -->
  <text x="400" y="555" fill="#f9a8d4" font-size="11" font-weight="500" letter-spacing="0.5">PAYOUT</text>
  <g font-size="9.5">
    <rect x="400"  y="568" width="175" height="72" rx="6" fill="rgba(249,168,212,0.07)" stroke="#f9a8d4" stroke-width="1.2"/>
    <text x="487" y="593" text-anchor="middle" fill="#e5e5e5">17 · Check balance</text>
    <text x="487" y="609" text-anchor="middle" fill="rgba(251,207,232,0.75)" font-size="8.5">GET /v1/balance</text>

    <rect x="590"  y="568" width="175" height="72" rx="6" fill="rgba(249,168,212,0.07)" stroke="#f9a8d4" stroke-width="1.2"/>
    <text x="677" y="593" text-anchor="middle" fill="#e5e5e5">18a · Standard payout</text>
    <text x="677" y="609" text-anchor="middle" fill="rgba(251,207,232,0.75)" font-size="8.5">POST /v1/payouts</text>
    <text x="677" y="623" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">a few business days</text>

    <rect x="780"  y="568" width="175" height="72" rx="6" fill="rgba(249,168,212,0.07)" stroke="#f9a8d4" stroke-width="1.2"/>
    <text x="867" y="593" text-anchor="middle" fill="#e5e5e5">18b · Instant payout</text>
    <text x="867" y="609" text-anchor="middle" fill="rgba(251,207,232,0.75)" font-size="8.5">POST /v1/payouts</text>
    <text x="867" y="623" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">method=instant, a fee</text>

    <rect x="970"  y="568" width="175" height="72" rx="6" fill="rgba(249,168,212,0.07)" stroke="#f9a8d4" stroke-width="1.2"/>
    <text x="1057" y="593" text-anchor="middle" fill="#e5e5e5">19 · Transfer</text>
    <text x="1057" y="609" text-anchor="middle" fill="rgba(251,207,232,0.75)" font-size="8.5">POST /v1/transfers</text>
    <text x="1057" y="623" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">platform's own cut</text>
  </g>
  <g fill="none" stroke="#f9a8d4" stroke-width="1.5" stroke-opacity="0.85" marker-end="url(#sh-rose)">
    <line x1="575" y1="604" x2="588" y2="604"/>
    <line x1="765" y1="604" x2="778" y2="604"/>
    <line x1="955" y1="604" x2="968" y2="604"/>
  </g>

  <text x="20" y="705" fill="rgba(255,255,255,0.3)" font-size="9" font-style="italic">merchant's share → their bank via payout (standard or instant) · platform's fee → platform account via transfer</text>
  <text x="20" y="722" fill="rgba(255,255,255,0.3)" font-size="9" font-style="italic">Terminal reader pairing (onboarding) feeds the in-person tap in step 11 · subscriptions branch off step 9, same lifecycle as a one-off payment</text>
</svg>`,
      },

      {
        type: "paragraph",
        text: "I spent about five months living inside Stripe Connect — onboarding merchants, taking payments both online and in person, registering card readers, and moving money back out through payouts and transfers. This is a walkthrough of how that actually works, end to end, with the real code behind each piece.",
      },

      { type: "heading", text: "The end-to-end flow, before the code" },
      {
        type: "paragraph",
        text: "Every term below gets its own real endpoint and its own code further down — this is just the order they happen in, start to finish.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Create a connected account — POST /v1/accounts (sets who owns fees/losses/dashboard, requests capabilities)",
          "Create an account link — POST /v1/account_links (hosted onboarding URL)",
          "Merchant fills in KYC on Stripe's hosted page",
          "Poll status anytime via GET /v1/account (details_submitted, charges_enabled, payouts_enabled)",
          "Stripe reviews in the background, fires account.updated webhook",
          "Webhook checks capabilities (card_payments, transfers) — both must read active",
          "Merchant marked active → can now take payments",
          "(Also happens here) a Terminal Location is auto-created via the SDK, for readers to attach to later",
          "Customer wants to pay → create a Checkout Session — POST /v1/checkout/sessions (or, for a standing reusable link instead of a one-off session, POST /v1/payment_links)",
          "Stripe auto-creates a PaymentIntent behind that session",
          "Customer pays (card online, or taps a Terminal Reader in person) → payment authorizes, PaymentIntent → requires_capture",
          "Resolve the fee amount (card brand/funding from GET /v1/charges/:id, country, merchant)",
          "Capture — POST /v1/payment_intents/:id/capture with amount_to_capture + application_fee_amount — money actually splits here",
          "payment_intent.succeeded webhook confirms it actually went through",
          "Match that event to your own order via metadata (merchantId, merchantReference)",
          "Merchant's share sits in their connected account balance, platform's fee sits in yours",
          "Check balance anytime — GET /v1/balance",
          "Payout — POST /v1/payouts — merchant's share → their bank",
          "Transfer — POST /v1/transfers — platform's fee → platform's account",
          "Subscriptions repeat steps 9-15 the same way, but create a Price first (POST /v1/prices) and put the session in mode=subscription; renewals (invoice.paid) skip step 15's metadata match entirely",
        ],
      },
      {
        type: "callout",
        label: "One theme runs through all of it",
        text: "Almost everything below talks to Stripe over a raw, reactive WebClient — not the official Stripe Java SDK. The SDK's HTTP client blocks; dropping it into a fully non-blocking Spring WebFlux service would stall a thread on every Stripe call. So payments, payouts, transfers, and onboarding are all hand-built WebClient calls against Stripe's REST API. The two exceptions — Terminal and the mobile payment sheet — genuinely do use the SDK, for reasons that make sense once you see them.",
      },

      { type: "heading", text: "1 · Connect onboarding" },
      {
        type: "paragraph",
        text: "Three Stripe calls and one webhook get a merchant from nothing to a live, payable account: create the connected account, hand them a hosted link to finish it, check on its status, and wait for Stripe to tell you the capabilities are actually active. Here's each one as Stripe itself sees it — endpoint, and the real payload we send.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Create the account — POST /v1/accounts",
          "Create the hosted onboarding link — POST /v1/account_links",
          "Retrieve account status — GET /v1/account",
          "Capability check — account.updated webhook, card_payments + transfers both active",
          "Create the Terminal Location, automatically, right after the account — POST /v1/terminal/locations",
        ],
      },

      { type: "heading", text: "Create a connected account", level: 3 },
      {
        type: "paragraph",
        text: "Every account we create is configured the same deliberate way: the platform (not the merchant) owns fees, losses, and Stripe Dashboard access, and all three payment capabilities are requested upfront. That's what \"controller\" and \"capabilities\" below are doing.",
      },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/accounts",
        code: `curl https://api.stripe.com/v1/accounts \\
  -u sk_test_your_key_here: \\
  -d country=GB \\
  -d email="merchant@example.com" \\
  -d business_type=company \\
  -d "company[name]"="Example Cafe Ltd" \\
  -d "company[address][line1]"="10 Downing Street" \\
  -d "company[address][city]"="London" \\
  -d "company[address][postal_code]"="SW1A 2AA" \\
  -d "capabilities[card_payments][requested]"=true \\
  -d "capabilities[transfers][requested]"=true \\
  -d "capabilities[link_payments][requested]"=true \\
  -d "controller[fees][payer]"=application \\
  -d "controller[losses][payments]"=application \\
  -d "controller[requirement_collection]"=application \\
  -d "controller[stripe_dashboard][type]"=none`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response — the account exists, but nothing is active yet",
        code: `{
  "id": "acct_1NwNv52eZvKYlo2C",
  "object": "account",
  "country": "GB",
  "email": "merchant@example.com",
  "capabilities": {
    "card_payments": "pending",
    "transfers": "pending",
    "link_payments": "pending"
  },
  "charges_enabled": false,
  "payouts_enabled": false,
  "details_submitted": false
}`,
      },

      { type: "heading", text: "Create an account link (hosted onboarding)", level: 3 },
      {
        type: "paragraph",
        text: "The account id from the last response is all this call needs — Stripe returns a short-lived URL to its own hosted onboarding UI, where the merchant fills in the KYC details we didn't already supply.",
      },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/account_links",
        code: `curl https://api.stripe.com/v1/account_links \\
  -u sk_test_your_key_here: \\
  -d account=acct_1NwNv52eZvKYlo2C \\
  -d type=account_onboarding \\
  -d return_url="https://example.com/onboarding/complete" \\
  -d refresh_url="https://example.com/onboarding/refresh"`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response — a one-time link, expires in 5 minutes if unused",
        code: `{
  "object": "account_link",
  "created": 1690000000,
  "expires_at": 1690000300,
  "url": "https://connect.stripe.com/setup/e/acct_1NwNv52eZvKYlo2C/gGqXXXXXXXX"
}`,
      },

      { type: "heading", text: "Retrieve account status", level: 3 },
      {
        type: "paragraph",
        text: "Polled whenever the merchant checks their onboarding progress in our own dashboard — not how we find out capabilities went active, just how we show \"still pending\" vs. \"done\" in the UI in the meantime.",
      },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/account",
        code: `curl https://api.stripe.com/v1/account \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C"`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response, abbreviated",
        code: `{
  "id": "acct_1NwNv52eZvKYlo2C",
  "details_submitted": true,
  "charges_enabled": true,
  "payouts_enabled": true,
  "capabilities": {
    "card_payments": "active",
    "transfers": "active",
    "link_payments": "active"
  }
}`,
      },

      { type: "heading", text: "account.updated webhook — the capability check", level: 3 },
      {
        type: "paragraph",
        text: "This is the only place \"pending\" actually turns into \"active.\" Every time Stripe re-reviews the account, it fires this event — we read card_payments and transfers off it, and only once both say active do we mark the merchant as ready to take money.",
      },
      {
        type: "code",
        language: "bash",
        caption: "Simulating it locally with the Stripe CLI",
        code: `stripe trigger account.updated`,
      },
      {
        type: "code",
        language: "json",
        caption: "The event body our webhook endpoint receives",
        code: `{
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_1NwNv52eZvKYlo2C",
      "capabilities": {
        "card_payments": "active",
        "transfers": "active",
        "link_payments": "active"
      }
    }
  }
}`,
      },
      {
        type: "code",
        language: "java",
        caption: "Reading it — both have to say \"active\" before we act",
        code: `JsonNode capabilities = body.get("data").get("object").get("capabilities");

if (capabilities.has("transfers")) {
    String paymentStatus = capabilities.get("card_payments").asText("");
    String transferStatus = capabilities.get("transfers").asText("");

    if ("active".equalsIgnoreCase(paymentStatus) && "active".equalsIgnoreCase(transferStatus)) {
        // merchant is now allowed to take real payments
        publishOnboardingActive(accountId, merchantId);
    }
}`,
      },
      {
        type: "callout",
        label: "A rough edge worth naming",
        text: "That check assumes capabilities is always present on the event — it isn't guarded. An account.updated event that doesn't touch capabilities at all (Stripe fires this event for lots of unrelated account changes too) would throw here rather than just skip. Worth a null check that never quite made it in.",
      },
      { type: "heading", text: "Create the Terminal Location", level: 3 },
      {
        type: "paragraph",
        text: "One more thing rides along with account creation: if the merchant supplied an address, this call runs automatically right after, so a physical card reader has somewhere to belong later.",
      },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/terminal/locations",
        code: `curl https://api.stripe.com/v1/terminal/locations \\
  -u sk_test_your_key_here: \\
  -d "display_name"="Example Cafe Ltd" \\
  -d "address[line1]"="10 Downing Street" \\
  -d "address[city]"="London" \\
  -d "address[country]"=GB \\
  -d "address[postal_code]"="SW1A 2AA"`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response",
        code: `{
  "id": "tml_FGaWM4TCd8Cm3F",
  "object": "terminal.location",
  "display_name": "Example Cafe Ltd",
  "address": {
    "line1": "10 Downing Street",
    "city": "London",
    "country": "GB",
    "postal_code": "SW1A 2AA"
  }
}`,
      },

      { type: "heading", text: "2 · Payments & Checkout (ECOM)" },
      {
        type: "paragraph",
        text: "Online payments go through a Checkout Session — the session carries the connected account as its destination, the customer pays on Stripe's hosted page, and we get a client secret back for the frontend. The charge uses manual capture, so authorization and capture are two separate calls — which is what lets us attach the platform's fee only at capture time.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Create a Checkout Session — POST /v1/checkout/sessions",
          "Retrieve a session (poll for status) — GET /v1/checkout/sessions/:id",
          "Capture the payment, fee taken in the same call — POST /v1/payment_intents/:id/capture",
          "Payment Links, a reusable alternative to a one-off session — POST /v1/payment_links",
          "Retrieve charge details for the fee calculation — GET /v1/charges/:id",
        ],
      },

      { type: "heading", text: "Create a Checkout Session", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/checkout/sessions",
        code: `curl https://api.stripe.com/v1/checkout/sessions \\
  -u sk_test_your_key_here: \\
  -d mode=payment \\
  -d customer_email="jane@example.com" \\
  -d "payment_method_types[]"=card \\
  -d "line_items[0][price_data][currency]"=gbp \\
  -d "line_items[0][price_data][unit_amount]"=2500 \\
  -d "line_items[0][price_data][product_data][name]"="Table booking deposit" \\
  -d "line_items[0][quantity]"=1 \\
  -d "metadata[merchantId]"="merchant_882" \\
  -d "metadata[merchantReference]"="ORD-77213"`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response — clientSecret is what the frontend mounts",
        code: `{
  "id": "cs_test_a1B2c3D4e5F6g7H8",
  "object": "checkout.session",
  "mode": "payment",
  "status": "open",
  "payment_intent": "pi_3NwXyZ2eZvKYlo2C1a2B3c4D",
  "client_secret": "cs_test_a1B2c3D4e5F6g7H8_secret_ijKlMnOp",
  "metadata": {
    "merchantId": "merchant_882",
    "merchantReference": "ORD-77213"
  }
}`,
      },

      { type: "heading", text: "Retrieve a session (poll for status)", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/checkout/sessions/:id",
        code: `curl https://api.stripe.com/v1/checkout/sessions/cs_test_a1B2c3D4e5F6g7H8 \\
  -u sk_test_your_key_here:`,
      },

      { type: "heading", text: "Capture the payment — the platform fee is taken here", level: 3 },
      {
        type: "paragraph",
        text: "Stripe splits the money at this exact moment: application_fee_amount goes to the platform, the rest settles to the connected account. Nothing else in the flow moves the fee.",
      },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/payment_intents/:id/capture",
        code: `curl https://api.stripe.com/v1/payment_intents/pi_3NwXyZ2eZvKYlo2C1a2B3c4D/capture \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C" \\
  -d amount_to_capture=2500 \\
  -d application_fee_amount=75`,
      },

      { type: "heading", text: "Payment Links — for merchants who don't have their own checkout page", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/payment_links",
        code: `curl https://api.stripe.com/v1/payment_links \\
  -u sk_test_your_key_here: \\
  -d "line_items[0][price_data][currency]"=gbp \\
  -d "line_items[0][price_data][unit_amount]"=2500 \\
  -d "line_items[0][price_data][product_data][name]"="Table booking deposit" \\
  -d "line_items[0][quantity]"=1 \\
  -d "after_completion[type]"=redirect \\
  -d "after_completion[redirect][url]"="https://example.com/thanks"`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response — a reusable, hosted URL, no session needed on our end",
        code: `{
  "id": "plink_1NwXyZ2eZvKYlo2C",
  "object": "payment_link",
  "url": "https://buy.stripe.com/test_aEU7sN3Z1abcdefghij",
  "active": true
}`,
      },

      { type: "heading", text: "Retrieve charge details — for the fee calculation in section 7", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/charges/:id",
        code: `curl https://api.stripe.com/v1/charges/ch_3NwXyZ2eZvKYlo2C1a2B \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C"`,
      },
      {
        type: "paragraph",
        text: "We read payment_method_details.card.brand and .funding off this response — that's the card brand and debit-vs-credit distinction the fee calculator needs before it can quote a percentage.",
      },
      
      { type: "heading", text: "3 · Subscriptions" },
      {
        type: "paragraph",
        text: "Recurring billing reuses the same Checkout Session call — just with mode set to subscription. The one wrinkle is multi-item carts: a subscription line item needs its own Stripe Price, so a cart with three recurring products means creating three Prices first, then a single session referencing all three.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Create a Price — POST /v1/prices",
          "Subscription-mode Checkout Session, referencing that Price — POST /v1/checkout/sessions",
          "Cancel a subscription — DELETE /v1/subscriptions/:id",
          "invoice.paid webhook — no session metadata, routed straight through instead of matched",
        ],
      },

      { type: "heading", text: "Create a Price", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/prices",
        code: `curl https://api.stripe.com/v1/prices \\
  -u sk_test_your_key_here: \\
  -d currency=gbp \\
  -d unit_amount=1999 \\
  -d "recurring[interval]"=month \\
  -d "product_data[name]"="Monthly parking pass"`,
      },
      {
        type: "code",
        language: "json",
        caption: "Response — this id is what the session below references",
        code: `{
  "id": "price_1NwYab2eZvKYlo2C",
  "object": "price",
  "unit_amount": 1999,
  "currency": "gbp",
  "recurring": { "interval": "month" }
}`,
      },

      { type: "heading", text: "Subscription-mode Checkout Session", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/checkout/sessions",
        code: `curl https://api.stripe.com/v1/checkout/sessions \\
  -u sk_test_your_key_here: \\
  -d mode=subscription \\
  -d "line_items[0][price]"=price_1NwYab2eZvKYlo2C \\
  -d "line_items[0][quantity]"=1`,
      },

      { type: "heading", text: "Cancel a subscription", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "DELETE /v1/subscriptions/:id",
        code: `curl -X DELETE https://api.stripe.com/v1/subscriptions/sub_1NwZcd2eZvKYlo2C \\
  -u sk_test_your_key_here:`,
      },

      { type: "heading", text: "invoice.paid — billed on Stripe's own schedule", level: 3 },
      {
        type: "paragraph",
        text: "Recurring invoices are generated by Stripe's billing engine, not in response to anything we called — so this event carries no metadata we set. It's routed straight onto Kafka rather than through the metadata-matching path every other payment event goes through.",
      },
      {
        type: "code",
        language: "json",
        caption: "The event body — note there's no merchantId/merchantReference to key off",
        code: `{
  "type": "invoice.paid",
  "data": {
    "object": {
      "id": "in_1NwZef2eZvKYlo2C",
      "subscription": "sub_1NwZcd2eZvKYlo2C",
      "amount_paid": 1999,
      "currency": "gbp"
    }
  }
}`,
      },
      {
        type: "code",
        language: "java",
        caption: "No metadata lookup — publish straight through to Kafka",
        code: `if ("invoice.paid".equals(eventType)) {
    this.applicationEventPublisher.publishEvent(
            ExternalStripePaymentWebhookDataRecord.builder().webhookData(body).build());
    return Mono.just(STRIPE_WEBHOOK_RESPONSE_STRING);
}`,
      },

      { type: "heading", text: "4 · Terminal / in-person (POS)" },
      {
        type: "paragraph",
        text: "This is the one other corner of the integration on the Stripe Java SDK instead of raw REST. A physical card reader has to be paired with a registration code shown on its screen, and it's a one-time setup call per reader — not on the hot path — so the SDK's blocking client was never a problem here.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Pair a reader with its registration code — POST /v1/terminal/readers",
          "List readers for one merchant, scoped to their account — GET /v1/terminal/readers",
          "List readers at one location — GET /v1/terminal/readers?location=...",
          "Delete a reader — DELETE /v1/terminal/readers/:id",
        ],
      },

      { type: "heading", text: "Pair a reader", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/terminal/readers (shown as the Stripe endpoint the SDK calls under the hood)",
        code: `curl https://api.stripe.com/v1/terminal/readers \\
  -u sk_test_your_key_here: \\
  -d registration_code=puppies-plug-could \\
  -d label="Front counter" \\
  -d location=tml_FGaWM4TCd8Cm3F`,
      },
      {
        type: "code",
        language: "java",
        caption: "The actual code — Stripe Java SDK, not WebClient",
        code: `Stripe.apiKey = stripeApiKey;   // resolved per merchant before this call

ReaderCreateParams.Builder paramsBuilder = ReaderCreateParams.builder()
        .setRegistrationCode(createTerminalRequestRecord.registrationCode());

if (createTerminalRequestRecord.label() != null)    paramsBuilder.setLabel(createTerminalRequestRecord.label());
if (createTerminalRequestRecord.location() != null) paramsBuilder.setLocation(createTerminalRequestRecord.location());

Reader reader = Reader.create(paramsBuilder.build());`,
      },

      { type: "heading", text: "List readers for one merchant, list by location, delete a reader", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/terminal/readers — scoped to one connected account",
        code: `curl "https://api.stripe.com/v1/terminal/readers?limit=100" \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C"`,
      },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/terminal/readers?location=... — every reader at one site",
        code: `curl "https://api.stripe.com/v1/terminal/readers?limit=100&location=tml_FGaWM4TCd8Cm3F" \\
  -u sk_test_your_key_here:`,
      },
      {
        type: "code",
        language: "bash",
        caption: "DELETE /v1/terminal/readers/:id",
        code: `curl -X DELETE https://api.stripe.com/v1/terminal/readers/tmr_FBQiUyhtqp0IuC \\
  -u sk_test_your_key_here:`,
      },
      {
        type: "paragraph",
        text: "Every reader belongs to a Location, and a Location belongs to a connected account — created once, automatically, right after that account is created (see section 1). Listing readers is scoped with a RequestOptions carrying setStripeAccount(accountId), so one Stripe secret key can never accidentally list another merchant's hardware.",
      },

      { type: "heading", text: "5 · Payouts & transfers" },
      {
        type: "paragraph",
        text: "Money leaves Stripe two ways, and they're deliberately separate calls. A payout moves the merchant's balance to their bank — standard or instant, just by adding method=instant. A transfer moves the platform's own cut out of the merchant's connected account into the platform's account. Keeping them separate means one can fail without silently taking the other down with it.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Standard payout — POST /v1/payouts",
          "Instant payout — POST /v1/payouts",
          "List payouts, paginated and date-filtered — GET /v1/payouts",
          "Transfer the platform's cut to the platform account — POST /v1/transfers",
          "Check balance — GET /v1/balance",
        ],
      },

      { type: "heading", text: "Standard payout — a few business days", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/payouts",
        code: `curl https://api.stripe.com/v1/payouts \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C" \\
  -d amount=48500 \\
  -d currency=gbp`,
      },

      { type: "heading", text: "Instant payout — minutes, for a fee", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/payouts",
        code: `curl https://api.stripe.com/v1/payouts \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C" \\
  -d amount=48500 \\
  -d currency=gbp \\
  -d method=instant`,
      },

      { type: "heading", text: "List payouts — paginated, date-filtered", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/payouts",
        code: `curl "https://api.stripe.com/v1/payouts?limit=100&created[gte]=1690000000&created[lte]=1692592000" \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C"`,
      },
      {
        type: "paragraph",
        text: "Past 100 payouts, starting_after=<last_payout_id> pages through the rest — same cursor pattern Stripe uses everywhere it paginates.",
      },

      { type: "heading", text: "Transfer — the platform's cut, moved as its own leg", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "POST /v1/transfers",
        code: `curl https://api.stripe.com/v1/transfers \\
  -u sk_test_your_key_here: \\
  -d amount=1500 \\
  -d currency=gbp \\
  -d destination=acct_platform_own_account`,
      },

      { type: "heading", text: "Balance", level: 3 },
      {
        type: "code",
        language: "bash",
        caption: "GET /v1/balance",
        code: `curl https://api.stripe.com/v1/balance \\
  -u sk_test_your_key_here: \\
  -H "Stripe-Account: acct_1NwNv52eZvKYlo2C"`,
      },

      { type: "heading", text: "6 · Webhooks" },
      {
        type: "paragraph",
        text: "Two separate endpoints receive events, split by concern: one for payments, one for onboarding (covered in section 1). Every object we ask Stripe to create carries our own metadata — merchantId, accountId, a merchantReference — and that metadata is the only thing that lets a webhook match an incoming event back to a row in our own database, since a Checkout Session or PaymentIntent's id isn't something we know before Stripe assigns it.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "POST /stripe/payment-webhook — checkout, capture, invoice events",
          "POST /stripe/onboarding-webhook — account.updated, capability checks (section 1)",
        ],
      },
      {
        type: "code",
        language: "java",
        caption: "The payment webhook controller",
        code: `@RestController
@RequestMapping("/stripe/payment-webhook")
@RequiredArgsConstructor
public class StripePaymentWebhookController {

    private final IStripePaymentWebhookService stripePaymentWebhookService;

    @PostMapping
    public Mono<String> handleWebhook(@RequestBody JsonNode body, @RequestHeader Map<String, String> headers) {
        return this.stripePaymentWebhookService.handleWebhook(body, headers);
    }
}`,
      },
      {
        type: "code",
        language: "java",
        caption: "Metadata is the bridge between \"a call we made\" and \"an event Stripe sent back\"",
        code: `JsonNode metadata = body.path("data").get("object").path("metadata");
String merchantId         = metadata.path("merchantId").asText(null);
String accountId          = metadata.path("accountId").asText(null);
String merchantReference  = metadata.path("merchantReference").asText(null);

this.applicationEventPublisher.publishEvent(
        ExternalStripePaymentWebhookDataRecord.builder().webhookData(body).build());
return Mono.just(body)
        .map(node -> ((ObjectNode) node).put("paymentId", merchantReference))
        .flatMap(node -> this.pspPaymentWebhookAuditService
                .createPaymentWebhookAudit(PspCodeEnum.STRIPE, accountId, merchantId, currencyCode, node)
                .thenReturn(STRIPE_WEBHOOK_RESPONSE_STRING));`,
      },
      {
        type: "callout",
        label: "What I'd tell past me",
        text: "A 200 back from a Stripe create-call means \"Stripe accepted the request,\" never \"the outcome happened.\" The webhook is the only place an outcome becomes true — design everything that reads payment status around that from day one, not as an afterthought once the polling code gets weird.",
      },
      {
        type: "callout",
        label: "A gap worth naming",
        text: "None of the three endpoints verify the Stripe-Signature header against a webhook secret — they trust whatever body arrives at the URL. Stripe's own SDK ships a one-line Webhook.constructEvent(...) helper for exactly this, and it's the first thing I'd add before calling this production-hardened.",
      },

      { type: "heading", text: "7 · Fees" },
      {
        type: "paragraph",
        text: "The platform's cut is taken as an application_fee_amount on the same capture call that settles the payment (section 2) — there's never a separate \"now go collect our fee\" step. The amount itself isn't a flat percentage; it's resolved just before capture based on the card's brand and funding source (read off the /charges response above), the cardholder's country, which merchant it is, and where the order came from.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Retrieve card brand and funding source — GET /v1/charges/:id (section 2)",
          "Resolve the fee amount from brand, funding, country and merchant",
          "Apply it as application_fee_amount on the capture call — POST /v1/payment_intents/:id/capture (section 2)",
        ],
      },
      {
        type: "code",
        language: "java",
        caption: "Resolving the fee before the capture call in section 2",
        code: `public Mono<Double> retrieveFeeDetails(String paymentMethod, String fundingSource,
                                        String originCountry, String merchantId, String orderSource) {

    return this.businessWebClient.get()
            .uri(RETRIEVE_FEE_DETAILS_ENDPOINT_STRING, merchantId, paymentMethod, fundingSource, originCountry, orderSource)
            .retrieve()
            .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(StripeErrorResponseRecord.class)
                    .flatMap(err -> Mono.error(new PspException(
                            "Exception occurred while retrieving fee details: "
                                    .concat(StripeUtils.INSTANCE.formatStripeErrorMessage(err))))))
            .bodyToMono(Double.class);
}`,
      },


      { type: "heading", text: "What actually mattered, looking back" },
      {
        type: "paragraph",
        text: "Two decisions did most of the work. First: picking WebClient over the SDK for anything on the payment hot path, and being honest that the SDK still earns its place in the two spots — Terminal and mobile — where it's a one-time or low-frequency call and matches what the client SDKs already expect. Second: treating metadata as the only thing a webhook can trust to identify \"which of our rows does this event belong to.\" Everything else — capture-time fees, two-legged payouts, onboarding as a wait-for-webhook state machine — falls out of those two choices pretty naturally.",
      },
    ],
  },
];

export default writings;
