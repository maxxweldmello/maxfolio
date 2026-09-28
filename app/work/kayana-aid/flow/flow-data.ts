import type { FlowConfig, FlowStepNode, FlowStepEdge } from "./types";

const S = (slug: string) => `/data/kayana-screenshots/${slug}.jpg`;

/** Build nodes + explicit edges (edge label = transition action, not destination title) */
function buildFlow(
  idPrefix: string,
  steps: { title: string; desc: string; category?: string; action?: string; result?: string; image?: string | null }[],
  edgeLabels: string[]
): { nodes: FlowStepNode[]; edges: FlowStepEdge[] } {
  const nodes: FlowStepNode[] = steps.map((s, i) => ({
    id: `${idPrefix}-${i}`,
    title: s.title,
    description: s.desc,
    image: s.image ?? null,
    category: s.category,
    metadata: {
      action: s.action ?? s.desc,
      result: s.result,
    },
  }));
  const edges: FlowStepEdge[] = steps.slice(1).map((_, i) => ({
    id: `${idPrefix}-e${i}`,
    source: `${idPrefix}-${i}`,
    target: `${idPrefix}-${i + 1}`,
    label: "",
  }));
  return { nodes, edges };
}

/* ── CHARITY FLOW ── 23 steps ────────────────────────────────────────────── */
const charityBuilt = buildFlow(
  "charity",
  [
    // ── Auth ──────────────────────────────────────────────────────────────
    {
      title: "Sign Up",
      category: "Auth",
      desc: "Step 1 of 3-step signup wizard. Charity admin enters full name, email, password (with live PasswordStrength indicator), and phone number (react-phone-input-2 with country dial codes). A ConsentCheckbox records T&C acceptance server-side before the account is created. Submitting the form dispatches a 6-digit OTP to the registered email.",
      action: "Enter name, email, password, phone → tick T&C ConsentCheckbox → Submit",
      result: "User account created; 6-digit OTP sent to email",
    },
    {
      title: "Verify Email",
      category: "Auth",
      desc: "Step 2 of the wizard. Enter the 6-digit OTP received by email to verify ownership. Two resend options are available: 'Resend via email' (30-second cooldown) and 'Resend via SMS' (shown only when a phone number was provided in Step 1, calls /business/authentication/resend-otp-via-sms/). On success the session is established and the wizard advances to Step 3.",
      action: "Enter 6-digit OTP → verify (or Resend via email / Resend via SMS after 30 s)",
      result: "Email verified; session established; advance to Organisation Details",
    },
    {
      title: "Organisation Details",
      category: "Onboarding",
      desc: "Step 3 of the wizard. Enter charity name, trading name, country (searchable dropdown), registered address via LocationAutocomplete (Google Places), city, postcode, state, currency, and a short description. All required fields are validated before the property record (business unit) is created on the backend. On submit the wizard is complete and the user lands on the Dashboard.",
      action: "Submit org name, trading name, country, address, currency, description",
      result: "Property record created; redirect to Dashboard",
    },
    {
      title: "Login",
      category: "Auth",
      desc: "Re-entry point for returning charity admins. Select login type — Charity or Donor — then enter email and password. Charities with a custom subdomain are routed via getCustomDomainUrl(). 'Forgot password' sends a reset link to the registered email. Successful login lands on the Dashboard.",
      action: "Select Charity login type → enter email + password → Login",
      result: "Authenticated session; redirect to Dashboard",
    },
    // ── Dashboard ─────────────────────────────────────────────────────────
    {
      title: "Dashboard",
      category: "Dashboard",
      desc: "Main home screen after login. Four stat cards show Total Raised (total_raised_amount), Donors (total_donors with 'X unique donors' subtext), Average Gift (computed as total_raised_amount ÷ total_donors), and Active Campaigns (total_active_campaigns with 'X campaigns live' subtext). A Recharts BarChart displays donation totals over time with presets: Today, Yesterday, 7 Days, This Month, Last Month, and a Custom date range via DateRangePicker. Gift Aid estimate percentage is shown separately. A PSP banner appears at the top if Stripe Connect onboarding is incomplete.",
      action: "View stat cards, donations chart (switch date preset), active campaigns, recent donations",
      result: "Live fundraising overview; PSP banner prompts payment setup if Stripe not connected",
    },
    {
      title: "Connect Payments",
      category: "Onboarding",
      desc: "Separate Stripe Connect onboarding flow at /signup/payment-setup, triggered from the dashboard PSP banner. Collects organisation type (Charity/Non-profit, Company, or Individual), legal structure (varies by org type and currency — e.g. Incorporated non-profit, Private corporation), representative details (gender, date of birth, address), and bank account information before redirecting to the Stripe hosted onboarding link. Status is tracked via pollPspComplete().",
      action: "Select org type + structure → enter representative details → complete Stripe onboarding",
      result: "Stripe Connect account created; PSP banner removed; Payment & Rates section unlocked",
    },
    // ── Shop ──────────────────────────────────────────────────────────────
    {
      title: "Shop",
      category: "Shop",
      desc: "Hardware marketplace for donation devices (card terminals, kiosks, accessories). Products are loaded from a CloudFront CDN (NEXT_PUBLIC_SHOP_CDN_BASE). Browse in grid or list view (toggle via viewMode). A horizontal products carousel with scroll (productsCarouselRef) highlights featured items. List view paginates at 3 products per page. Clicking Add to Cart slides in a cart side panel with quantity controls and order total. A separate Orders tab lists all past hardware purchases as HardwareOrder records with status tracking.",
      action: "Browse grid/list → add to cart (side panel) → checkout → track in Orders tab",
      result: "Hardware order placed; invoice generated and visible in Reports › Invoices",
    },
    // ── Campaigns ─────────────────────────────────────────────────────────
    {
      title: "Campaigns",
      category: "Fundraising",
      desc: "Create and manage fundraising campaigns. New campaign form fields: campaign name, description, category_type (dropdown populated from Campaign Settings / campaign_category group), cover_image_url, impact_levels (each with optional label + required amount), and fund allocation rows (category + percentage). The charity's property name (charity_name) is auto-attached. A live preview renders the donor-facing page at /campaign-preview before publishing. Campaigns can be listed, edited, paused, or completed.",
      action: "Create campaign → set category, impact levels, allocations → preview → publish",
      result: "Campaign live on the donation platform; appears in public Find Campaigns listing",
    },
    // ── Events ────────────────────────────────────────────────────────────
    {
      title: "Events",
      category: "Fundraising",
      desc: "Create and manage fundraising events linked to a campaign. Event type: IN_PERSON, VIRTUAL, or HYBRID (virtual/hybrid events show an online link field instead of a venue; isVirtual = eventType === 'VIRTUAL' || eventType === 'HYBRID'). Fields: event title, campaign_id (links to a live campaign), start_date, end_date, registration_start_date, location_name (LocationAutocomplete / Google Places for in-person), cover_image_url, and description. Events can be edited, published, or deleted.",
      action: "Set event type (In-Person/Virtual/Hybrid) → link campaign → set dates → add location/link → publish",
      result: "Event live and accepting registrations",
    },
    // ── Fundraisers ───────────────────────────────────────────────────────
    {
      title: "Fundraisers",
      category: "Fundraising",
      desc: "View all supporter-created fundraising pages linked to the charity's campaigns. Data fetched from /donation/fundraiser/pages-by-property. A campaign filter dropdown narrows results. The list shows page content, fundraiser pages, and individual fundraisers. Charity can publish a fundraiser page (change status to 'ACTIVE'). The tab is read-only for monitoring supporter activity — the charity does not create pages here.",
      action: "Filter by campaign → browse supporter pages → publish pending pages to ACTIVE",
      result: "All supporter fundraising activity visible and manageable in one place",
    },
    // ── Donations ─────────────────────────────────────────────────────────
    {
      title: "Donations",
      category: "Donations",
      desc: "Full ledger of all incoming donations. Five filter controls: search (donor name / reference), campaignId (also pre-filled from URL ?campaign_id=xxx), fundraiserId, origin, and type. Date filter defaults to last 30 days (dateFilter = '30d'). A viewFilter toggles between 'All' and other VIEW_FILTERS (e.g. Gift Aid only). Results are paginated. An Export button downloads the current filtered set. Clicking a donation row opens full detail: payment reference, donor info, Gift Aid eligibility, and receipt.",
      action: "Search / filter by campaign, fundraiser, origin, type, date → export or drill into row",
      result: "Filtered donation ledger with export and individual receipt access",
    },
    // ── Reports ───────────────────────────────────────────────────────────
    {
      title: "Reports",
      category: "Reports",
      desc: "Two sub-sections. Campaign Reports (default view at /reports/campaigns): filter campaigns by status — All, ACTIVE, DRAFT, PAUSED, or COMPLETED — then drill into any campaign to see its full summary. Invoices tab: lists HardwareOrder records from the Shop; each order expands to show Invoice sub-rows with invoice_id, billing_period_start, billing_period_end, amount, currency, and created_date. Both tabs are read-only.",
      action: "Filter campaigns by status → drill into campaign report; or view Invoices tab for hardware",
      result: "Campaign financial summaries and hardware invoices available for reconciliation",
    },
    // ── Support ───────────────────────────────────────────────────────────
    {
      title: "Support",
      category: "Support",
      desc: "Raise and track support tickets with the Kayana Aid team. New ticket form: title (required), priority (high / medium / low, default medium), and description (required). Ticket statuses: open → pending → in_progress → waiting_for_dev → waiting_for_compliance → waiting_for_release → resolved → closed. A search/status filter (ALL or any specific status) narrows the ticket list. The SupportSubnav component is shared with the Reported Issues page.",
      action: "Create ticket (title + priority + description) → track status through to resolved/closed",
      result: "Support request logged with priority; status updates as Kayana team responds",
    },
    // ── Reported Issues ───────────────────────────────────────────────────
    {
      title: "Reported Issues",
      category: "Support",
      desc: "Log and monitor technical bugs found in the platform. Uses a 'Report a problem' button (not 'Report a Bug'). Issues are auto-grouped when identical errors repeat. Each issue has a Tier (A = Critical, B = Major, C = Minor) and a status (OPEN / RECEIVED / IN_PROGRESS / RESOLVED / FIXED / DISMISSED). A screenshotKey field links to the captured screenshot. RESOLVED issues can be reopened via PATCH /api/bug-report/{id}/reopen. Issue list fetched from /donation/bug-report/my-list. SupportSubnav is shared with the Support page.",
      action: "Click 'Report a problem' → describe issue → submit; monitor status; reopen if needed",
      result: "Bug logged with tier and screenshot; status tracked through to FIXED or DISMISSED",
    },
    // ── Settings ──────────────────────────────────────────────────────────
    {
      title: "My Profile",
      category: "Settings",
      desc: "Personal account settings for the logged-in admin. Fields: display name, phone number, and profile photo (image upload). A Login Sessions panel lists all active sessions as LoginSession records showing browser_detail, os_detail, location, and date_and_time — stale or suspicious sessions can be revoked from here.",
      action: "Edit name / phone / profile photo → save; review and revoke login sessions",
      result: "Personal details updated; unwanted sessions terminated",
    },
    {
      title: "Business Profile",
      category: "Settings",
      desc: "Update the charity's registered business information: property_name (charity name), trading_name, registration number, full address (street, city, postcode, state, country), currency_code, time_zone, business_type, contact_name, contact_number, and store_contact_number. Charity logo upload is here. All changes persist to the property record on the backend.",
      action: "Edit business name, address, registration, contact details, logo → save",
      result: "Charity profile updated across the platform including donor-facing pages",
    },
    {
      title: "Payment & Rates",
      category: "Settings",
      desc: "Read-only view of live processing fees. Only visible after Stripe Connect onboarding is complete (pspComplete === true via usePspStatus()). Rates are fetched live via fetchKayanaAidFee(currencyCode) and show Kayana Aid's application fee percentage and any fixed per-transaction charge for the charity's active currency.",
      action: "View live fee rates (tab only visible after PSP setup complete)",
      result: "Charity can see exact processing cost per donation in their currency",
    },
    {
      title: "Custom Branding",
      category: "Settings",
      desc: "White-label the charity's public-facing pages. SubdomainStatus cycles through NONE → PENDING → ACTIVE; the charity requests their subdomain_requested URL and Kayana activates it. Upload separate banner images for campaigns_banner, events_banner, and fundraisings_banner pages. Toggle toggle_enabled to activate branding. Two hide options: hide_help removes the Help link and hide_book_demo removes the Book a Demo link from all public pages. subdomain_url stores the live branded URL once ACTIVE.",
      action: "Request subdomain → upload campaign/event/fundraising banners → toggle hide_help / hide_book_demo",
      result: "Branded subdomain ACTIVE; public pages serve charity's own banners and hide Kayana links",
    },
    {
      title: "Custom Donation Email",
      category: "Settings",
      desc: "Design the transactional confirmation email donors receive after giving. Upload a logo and cover_image. Write email body using supported merge fields: {{donor_name}}, {{donation_amount}}, {{donation_date}}, {{donation_type}}, {{campaign_name}}, {{donation_context_label}}, {{donation_id}}, {{order_id}}, {{donor_email}}, {{donor_message}}, {{payment_status}}, {{donation_source}}. Toggle the custom email on or off. A preview renders the final email layout before saving.",
      action: "Upload logo + cover image → write body with merge fields → preview → toggle on → save",
      result: "Donors receive a branded confirmation email with the charity's custom message and assets",
    },
    {
      title: "Gift Aid",
      category: "Settings",
      desc: "Configure Gift Aid for UK taxpayer donations. GiftAidConfig fields: name (label shown on donation form), description, unit (PERCENTAGE or FIXED), value (default 25 for 25%), and status (ACTIVE / inactive toggle). Once active a Gift Aid eligibility checkbox appears on all donation forms, donor address is collected, and the gift_aid_estimate is tracked and shown on the Dashboard stat cards.",
      action: "Set Gift Aid name, description, unit (PERCENTAGE/FIXED), value → toggle ACTIVE → save",
      result: "Gift Aid checkbox live on all donation forms; 25% reclaim tracked per eligible donation",
    },
    {
      title: "Embedded Widget",
      category: "Settings",
      desc: "Generate a script-tag embed to add a Kayana Aid donation widget to the charity's own website. Three-step flow: Step 1 — select a campaign from a dropdown. Step 2 — choose widget type: 'Button Only' (opens the donation form in a new tab) or 'Full Widget' (embeds the entire donation form inline on the host page). Step 3 — copy the generated <script> tag (WIDGET_BASE_URL = window.location.origin + '/widget') and paste it into any webpage.",
      action: "Select campaign → choose Button Only or Full Widget → copy script tag",
      result: "Donations can be collected directly from the charity's own website",
    },
    {
      title: "Campaign Settings",
      category: "Settings",
      desc: "Manage the category taxonomy used in campaign creation. Each Category has setting_key, setting_label, setting_value, sort_order, and is_active flag; GROUP = 'campaign_category'. Add new categories, toggle them active or inactive, reorder by dragging the GripVertical handle, and delete unused ones. Changes appear immediately in the campaign creation category_type dropdown.",
      action: "Add category → drag GripVertical to reorder → toggle active/inactive → delete unused",
      result: "Campaign creation dropdown reflects updated categories instantly",
    },
    {
      title: "Event Settings",
      category: "Settings",
      desc: "Same structure as Campaign Settings but scoped to events (GROUP = 'event_category'). Manage the categories shown in the event creation form — add, reorder via GripVertical, toggle active/inactive, and delete. Keeps event taxonomy aligned with the charity's programme structure.",
      action: "Add category → drag to reorder → toggle → delete",
      result: "Event creation dropdown reflects updated categories instantly",
    },
    {
      title: "Team",
      category: "Settings",
      desc: "Manage staff access to the charity dashboard. Invite new members by email, first name, last name, phone number, and assigned role (Staff[] with Role[]). Invited staff receive an email and must accept to gain access. Existing members can be removed. Custom roles can be created with a role_name and role_description, then assigned to any team member.",
      action: "Invite staff (email + name + phone + role) → manage roles → remove members",
      result: "Multi-user dashboard access with custom role-based permissions",
    },
  ],
  []
);

export const charityFlowConfig: FlowConfig = {
  id: "charity-flow",
  title: "Charity Flow",
  description: "Complete charity admin journey — 3-step signup wizard, email OTP verification, organisation setup, dashboard, payments, shop, campaigns, events, fundraisers, donations, reports, support, and all 9 settings sections.",
  nodes: charityBuilt.nodes,
  edges: charityBuilt.edges,
  // Row 1: Signup/Auth (0–5), Row 2: Activity (6–13), Row 3: Settings (14–23)
  rowGroups: [
    ["charity-0","charity-1","charity-2","charity-3","charity-4","charity-5"],
    ["charity-6","charity-7","charity-8","charity-9","charity-10","charity-11","charity-12","charity-13"],
    // Team (23) moved after Business Profile (15)
    ["charity-14","charity-15","charity-23","charity-16","charity-17","charity-18","charity-19","charity-20","charity-21","charity-22"],
  ],
};

/* ── SUPPORTER FLOW ── 6 steps ────────────────────────────────────────────── */
const supporterBuilt = buildFlow(
  "supporter",
  [
    {
      title: "Pick a Campaign",
      category: "Discover",
      desc: "Browse the public Find Campaigns page or follow a direct campaign link. Supporter selects a live campaign they want to fundraise for.",
      action: "Browse /find-campaigns or follow a shared link",
      result: "Campaign selected as the fundraising target",
    },
    {
      title: "Create Fundraising Page",
      category: "Setup",
      desc: "Choose solo or team page. Enter a page title, personal story (up to 5,000 characters), fundraising target amount, and optional cover photo.",
      action: "Fill title, story, target amount → upload cover photo",
      result: "Draft fundraising page created at /fundraise/[slug]",
    },
    {
      title: "Set Impact Levels",
      category: "Setup",
      desc: "Optionally override the campaign's impact levels with custom ones, or inherit them directly. Each level has a label (e.g. 'Feed a family for a week') and an amount.",
      action: "Choose campaign impact levels or define custom ones",
      result: "Donation amounts visible on the public fundraising page",
    },
    {
      title: "Share the Page",
      category: "Promote",
      desc: "Copy and share the unique fundraising page URL across social media, email, or messaging apps. Each page has Open Graph metadata for rich link previews.",
      action: "Copy page link → share on social / email",
      result: "Supporters start donating via the personal fundraising page",
    },
    {
      title: "Track Progress",
      category: "Progress",
      desc: "Monitor total raised vs target, donor count, donor messages, and the team leaderboard in real time from the fundraiser dashboard.",
      action: "View fundraiser dashboard → check raised total and leaderboard",
      result: "Live progress tracking with donor recognition",
    },
  ],
  [
    "start fundraising page",
    "set impact levels",
    "share page link",
    "donations arrive",
  ]
);

export const supporterFlowConfig: FlowConfig = {
  id: "supporter-flow",
  title: "Supporter Flow",
  description: "How a supporter turns into a fundraiser — creating a solo or team page off a live campaign and driving donations through their network.",
  nodes: supporterBuilt.nodes,
  edges: supporterBuilt.edges,
  rowGroups: [
    ["supporter-0","supporter-1","supporter-2","supporter-3","supporter-4"],
  ],
};

/* ── DONOR FLOW ── 6 steps ────────────────────────────────────────────────── */
const donorBuilt = buildFlow(
  "donor",
  [
    {
      title: "Discover",
      category: "Browse",
      desc: "Find a campaign via /find-campaigns search (with category filters), an event on /discover-events, or a supporter's personal fundraising page shared on social media.",
      action: "Browse campaigns / events or follow a shared link",
      result: "Campaign, event, or fundraising page selected",
    },
    {
      title: "Choose Amount",
      category: "Donate",
      desc: "Select a preset impact level (e.g. 'Feed a family for a week — £25') or enter a custom amount. Progress bar and raised total are visible on the page.",
      action: "Pick an impact level or enter a custom amount",
      result: "Donation amount set",
    },
    {
      title: "Fill Donor Details",
      category: "Donate",
      desc: "Enter first name, last name, email address, and optional phone number and message to the charity. Choose to donate anonymously to hide name from the public donor list.",
      action: "Enter name, email, optional phone, message; toggle anonymous",
      result: "Donor record prepared",
    },
    {
      title: "Gift Aid & Pay",
      category: "Payment",
      desc: "If the charity has Gift Aid enabled: confirm UK taxpayer status and provide address so Kayana can claim 25p per £1 on the charity's behalf. Pay by card via Stripe (3DS handled automatically).",
      action: "Tick Gift Aid checkbox + enter address → pay by card (Stripe)",
      result: "Payment authorised; donation recorded with Gift Aid flag",
    },
    {
      title: "Confirmation & Receipt",
      category: "Confirm",
      desc: "Redirect to /donate/[slug]/complete. An email receipt is sent immediately, including a PDF download link. The charity's custom confirmation message is shown if configured.",
      action: "View confirmation page → receive email with PDF receipt",
      result: "Donation confirmed; instant email + PDF receipt sent",
    },
    {
      title: "Donor Account",
      category: "Account",
      desc: "Optionally create a donor account at /donor/signup to see donation history across all charities, manage profile, revisit past receipts, and track fundraising pages the donor has supported.",
      action: "Sign up for donor account → view donation history",
      result: "Persistent donor profile with cross-charity donation record",
    },
  ],
  [
    "choose amount",
    "fill details",
    "confirm Gift Aid + pay",
    "payment succeeds",
    "create donor account",
  ]
);

export const donorFlowConfig: FlowConfig = {
  id: "donor-flow",
  title: "Donor Flow",
  description: "The complete giving experience — from discovering a campaign to receiving a receipt and optionally keeping a donor account.",
  nodes: donorBuilt.nodes,
  edges: donorBuilt.edges,
  rowGroups: [
    ["donor-0","donor-1","donor-2","donor-3","donor-4","donor-5"],
  ],
};
