import type { Task } from "../tasks.data";

export const taskStripePayoutSchedule: Task = {
  taskId:    "task-stripe-payout-schedule",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Stripe SDK", "Stripe Connect", "Feign"],
  image:     "/tasks/stripe-payout-schedule/hero.jpg",

  title: "Stripe Payout Schedule & Listing",

  description: "Ops fetch + update a Stripe Connect connected-account's payout schedule (manual / daily / weekly / monthly with `delay_days` and weekly / monthly anchor) directly via the Stripe Java SDK on `Account.retrieve` / `Account.update`. Direct SDK from admin, Feign-listing for the table view, plus a local projection so the listing reads stay fast without re-hitting Stripe.",

  ideaPipeline: {
    steps: ["POST /update-payout-schedule", "Validate anchor + delay", "Resolve per-currency Stripe secret", "Stripe SDK Account.update", "Mirror payout_scheduled locally"],
    caption: "One controller entry-point. The request hits the Stripe Java SDK directly (Account.retrieve + Account.update with settings.payouts.schedule). The new schedule is mirrored on the local PSP mapping so the admin grid renders without re-reading Stripe on every page.",
  },

  problemStatement: "Different merchants want different payout cadences — some want their funds nightly (Stripe daily with delay_days=2), some weekly anchored on Friday so the books reconcile clean, some on the 1st of each month. Sending merchants to Stripe Dashboard to change this themselves isn't an option (they don't have Dashboard logins for the connected acct_…). Finance also needs to see a list of payouts per merchant with arrival_date / status / amount, without hitting Stripe's API on every grid scroll.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "PATCH /admin/stripe/update-payout",
      caption: "02 · Update — one PATCH per schedule change, dispatched by PSP header",
      language: "http",
      code: `# One endpoint, PSP-scoped via the psp header. Body carries the type
# and the shape needed for that type: scheduleDays for weekly/monthly,
# delayDays for the Stripe clearing window.

# ── weekly, anchored on Friday, delay 2 days ────────────────────────
curl -X PATCH https://api.kayana.io/admin/stripe/update-payout \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "psp: STRIPE" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":   "PROP-2201",
    "type":         "weekly",
    "scheduleDays": ["friday"],
    "delayDays":    2
  }'

# → ServiceResponseBean — description is HTML-formatted for the audit log
{
  "status": true,
  "description": "Payout schedule for '<b>Riverside Cafe</b>' changed from <b>daily</b> (delay 2) to <b>weekly</b> anchored on <b>Friday</b> (delay 2).",
  "propertyId": "PROP-2201"
}

# ── monthly, anchored on the 1st ────────────────────────────────────
curl -X PATCH https://api.kayana.io/admin/stripe/update-payout \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "psp: STRIPE" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":   "PROP-2201",
    "type":         "monthly",
    "scheduleDays": ["1"],
    "delayDays":    3
  }'

# ── manual (stop auto-payouts entirely) ─────────────────────────────
curl -X PATCH https://api.kayana.io/admin/stripe/update-payout \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "psp: STRIPE" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId": "PROP-2201",
    "type":       "manual"
  }'
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminStripeAccountService#updatePayoutSchedule",
      caption: "03 · Entry — validate the payload for the picked type, then hand off to setStripePayout",
      language: "java",
      code: `@Override
@LogActivity(status = ActivityLogStatusEnum.PAYOUT_SCHEDULE_UPDATED, username = "username")
public ServiceResponseBean updatePayoutSchedule(String propertyId, String type,
                                                String cronExpression, String username,
                                                String psp,
                                                List<String> scheduleDays,
                                                Integer delayDays,
                                                ServiceResponseBean srb) {

    KayanaBusinessPropertyDetail property =
        propertyRepo.findByKbpdPropertyId(propertyId);
    if (property == null || psp == null || psp.isBlank()) return srb;

    if (PspProviderEnum.getStripeValue().equalsIgnoreCase(psp)) {

        List<String>  weeklyDays  = null;
        List<Integer> monthlyDays = null;

        // ── weekly: scheduleDays must be a non-empty list of valid weekdays.
        if (PayoutTypeEnum.WEEKLY.getValue().equalsIgnoreCase(type)) {
            if (scheduleDays == null || scheduleDays.isEmpty()) {
                srb.setMessage("Weekly payout requires at least one day to be selected.");
                return srb;
            }
            Set<String> validWeekdays = Set.of("sunday","monday","tuesday","wednesday","thursday","friday","saturday");
            for (String day : scheduleDays) {
                if (day == null || !validWeekdays.contains(day.trim().toLowerCase())) {
                    srb.setMessage("Invalid weekday: \\"" + day
                        + "\\". Allowed values are: Sunday..Saturday.");
                    return srb;
                }
            }
            weeklyDays = scheduleDays;
        }

        // ── monthly: scheduleDays must parse as ints 1..31.
        else if (PayoutTypeEnum.MONTHLY.getValue().equalsIgnoreCase(type)) {
            if (scheduleDays == null || scheduleDays.isEmpty()) {
                srb.setMessage("Monthly payout requires at least one date to be selected.");
                return srb;
            }
            List<Integer> parsedDays = new ArrayList<>();
            for (String day : scheduleDays) {
                try {
                    int d = Integer.parseInt(day.trim());
                    if (d < 1 || d > 31) {
                        srb.setMessage("Invalid monthly date: \\"" + day
                            + "\\". Allowed range is 1 to 31.");
                        return srb;
                    }
                    parsedDays.add(d);
                } catch (NumberFormatException ex) {
                    srb.setMessage("Invalid monthly date value: \\"" + day
                        + "\\". Only numbers 1..31 are allowed.");
                    return srb;
                }
            }
            monthlyDays = parsedDays;
        }

        // manual + daily need no scheduleDays validation — fall through.
        setStripePayout(property, type, weeklyDays, monthlyDays, delayDays, srb);
        return srb;
    }

    return srb;
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminStripeAccountService#setStripePayout",
      caption: "04 · Stripe SDK — build settings.payouts.schedule, Account.retrieve → Account.update",
      language: "java",
      code: `private void setStripePayout(KayanaBusinessPropertyDetail property,
                              String type,
                              List<String>  weeklyDays,
                              List<Integer> monthlyDays,
                              Integer       delayDays,
                              ServiceResponseBean srb) throws Exception {

    if (!PayoutTypeEnum.isValid(type)) {
        srb.setMessage("Invalid payout type. Allowed: " + PayoutTypeEnum.getAllValues());
        return;
    }

    // Per-currency Stripe secret key — different countries land on
    // different Stripe platforms so the same admin call resolves the
    // right key by (PSP, currency).
    String stripeSecretKey = pspServiceUtils.fetchSecretKey(
        PspProviderEnum.getStripeValue(), property.getKbpdCurrencyCode());
    if (stripeSecretKey == null || stripeSecretKey.isEmpty()) {
        srb.setMessage("Unable to fetch Stripe secret key.");
        return;
    }

    // Resolve the connected acct_… from the PSP mapping row.
    KayanaBusinessPropertyPspMapping mapping = pspMappingRepo
        .findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
            property.getKbpdPropertyId(),
            PspProviderEnum.getStripeValue(),
            property.getKbpdCurrencyCode(),
            GeneralStatusEnum.ACTIVE.getValue())
        .orElseThrow(() -> new RuntimeException("No Stripe mapping for this property."));

    String stripeAccountId =
        objectMapper.readTree(objectMapper.writeValueAsString(mapping.getKbppmAccountInfo()))
                    .path("account_id").asText();

    // Grab the current schedule so we can build a diff description for the audit row.
    JsonNode previousData = getStripePayoutData(property);

    // Build settings.payouts.schedule for Stripe.
    Map<String, Object> schedule = new HashMap<>();
    schedule.put("interval", PayoutTypeEnum.fromString(type).getValue().toLowerCase());
    if (delayDays != null) schedule.put("delay_days", delayDays);
    if ("weekly".equalsIgnoreCase(type) && weeklyDays  != null && !weeklyDays.isEmpty())
        schedule.put("weekly_anchor",  weeklyDays.get(0));      // Stripe takes one day
    if ("monthly".equalsIgnoreCase(type) && monthlyDays != null && !monthlyDays.isEmpty())
        schedule.put("monthly_anchor", monthlyDays.get(0));     // Stripe takes one date

    Map<String, Object> params = Map.of("settings",
        Map.of("payouts", Map.of("schedule", schedule)));

    // Per-account SDK context — key + Stripe-Account header for this acct_.
    RequestOptions opts = RequestOptions.builder()
        .setApiKey(stripeSecretKey)
        .setStripeAccount(stripeAccountId)
        .build();

    try {
        Account account        = Account.retrieve(stripeAccountId, opts);
        Account updatedAccount = account.update(params, opts);

        if (updatedAccount != null) {
            // Mirror the schedule locally so the admin grid renders without
            // re-reading Stripe on every page load — see stage 06.
            mapping.setKbppmPayoutScheduled(PayoutTypeEnum.fromString(type).getValue().toLowerCase());
            mapping.setKbppmLastPayoutDate(Calendar.getInstance());
            pspMappingRepo.save(mapping);
        }
    } catch (StripeException e) {
        srb.setMessage("Stripe payout schedule update failed: " + e.getMessage());
    }

    JsonNode updatedData = getStripePayoutData(property);
    buildStripePayoutDescription(property, previousData, updatedData, srb);
}
`,
    },
    {
      path: "GET /admin/stripe/fetch-payout",
      caption: "05 · Read schedule — one call to see the current interval + anchor + delay",
      language: "http",
      code: `# Admin grid reads the current schedule for the property. Same PSP
# dispatch (psp header) — response shape is the interval + delay days
# + weekly / monthly anchor if applicable.

curl -X GET "https://api.kayana.io/admin/stripe/fetch-payout\\
?property_id=PROP-2201" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "psp: STRIPE"

# → ServiceResponseBean
{
  "status": true,
  "data": {
    "interval":       "weekly",
    "delayDays":      2,
    "weeklyAnchor":   "friday",
    "monthlyAnchor":  null,
    "connectAccount": "acct_1PXk9K..."
  }
}
`,
    },
    {
      path: "kayana_business.kayana_business_property_psp_mapping — mirror columns",
      caption: "06 · Local mirror — one row per (property, PSP, currency) carries the schedule",
      language: "sql",
      code: `-- The PSP mapping row is the local source of truth for the schedule so
-- the admin grid never has to round-trip Stripe on every render. Stripe
-- stays the source of truth for whether a payout actually pays out.
-- Only the columns setStripePayout touches are shown below.

ALTER TABLE kayana_business.kayana_business_property_psp_mapping
  ADD COLUMN kbppm_payout_scheduled   VARCHAR(16),      -- manual / daily / weekly / monthly
  ADD COLUMN kbppm_last_payout_date   TIMESTAMPTZ,
  ADD COLUMN kbppm_account_info       JSONB;            -- carries account_id, capabilities, ...

-- After the successful update in stages 03–04, the row on PROP-2201's
-- STRIPE/GBP mapping looks like this:
--   kbppm_payout_scheduled = 'weekly'
--   kbppm_last_payout_date = 2026-08-29 18:42:11+00
--   kbppm_account_info     = { "account_id": "acct_1PXk9K...", ... }
`,
    },
    {
      path: "GET /admin/account/v2/fetch-all-payouts",
      caption: "07 · Payout listing — Finance's grid for arrival dates, statuses, amounts",
      language: "http",
      code: `# Preferred listing endpoint (v2) — required params are property_id,
# psp_code, currency_code. Optional date + status filters. Under the
# hood it calls Stripe's payouts.list scoped to the connected acct_.

curl -X GET "https://api.kayana.io/admin/account/v2/fetch-all-payouts\\
?property_id=PROP-2201\\
&psp_code=STRIPE\\
&currency_code=GBP\\
&limit=25\\
&status=paid\\
&start_date=1724716800000\\
&end_date=1725321600000" \\
  -H "Authorization: Bearer <admin_jwt>"

# → ServiceResponseBean
{
  "status": true,
  "data": {
    "hasMore": false,
    "payouts": [
      {
        "payoutId":     "po_1PYm4x...",
        "amount":       12480,          # smallest currency unit (pence)
        "currency":     "gbp",
        "status":       "paid",
        "arrivalDate":  "2026-08-27",
        "created":      "2026-08-25T14:12:04Z",
        "method":       "standard",
        "bankAccount":  "*** 4321 · Barclays"
      }
    ]
  }
}
`,
    },
    {
      path: "GET /admin/account/fetch-payouts  (legacy paged listing)",
      caption: "08 · Legacy list — local paged view used before v2 landed",
      language: "http",
      code: `# Older paged endpoint driven off the local mirror + a per-page Stripe
# fill. Still wired into some admin screens; the v2 endpoint above is
# preferred for new panels.

curl -X GET "https://api.kayana.io/admin/account/fetch-payouts\\
?property_id=PROP-2201\\
&page=0\\
&size=20\\
&search_text=&sort_by=created&sort_order=desc" \\
  -H "Authorization: Bearer <admin_jwt>"

# → ServiceResponseBean
{
  "status": true,
  "data": {
    "page":  0,
    "size":  20,
    "total": 137,
    "rows":  [ /* same payout shape as v2 */ ]
  }
}
`,
    },
    {
      path: "GET /admin/account/fetch-payout-balance-transactions",
      caption: "09 · Drill-down — every balance transaction that fed one payout",
      language: "http",
      code: `# When finance opens a specific payout row, this call fetches every
# balance transaction that Stripe rolled into that payout (charges,
# refunds, application fees, adjustments). Same connected-account
# context as the listing — resolved via (property, PSP, currency).

curl -X GET "https://api.kayana.io/admin/account/fetch-payout-balance-transactions\\
?payout_id=po_1PYm4x...\\
&property_id=PROP-2201\\
&psp_code=STRIPE\\
&currency_code=GBP" \\
  -H "Authorization: Bearer <admin_jwt>"

# → ServiceResponseBean
{
  "status": true,
  "data": [
    { "type": "charge",          "amount": 15000, "fee": 45, "net": 14955 },
    { "type": "application_fee", "amount": -600,  "fee":  0, "net":  -600 },
    { "type": "refund",          "amount": -1875, "fee": -6, "net": -1869 }
  ]
}

# Also on the same controller:
#   GET /admin/account/fetch-payout-details          — one payout, full row
#   GET /admin/account/fetch-payout-summary-details  — one payout, aggregates
#   GET /admin/account/fetch-transit-amount          — money already captured
#                                                       but not yet paid out
`,
    },
    {
      path: "Audit trail — @LogActivity + description composer",
      caption: "10 · Every schedule change lands as an audit row with a full before/after diff",
      language: "text",
      code: `# updatePayoutSchedule is wrapped in the @LogActivity aspect (see
# task-audit) with status = PAYOUT_SCHEDULE_UPDATED. The description
# used on that row is composed by buildStripePayoutDescription()
# BEFORE and AFTER pulling the schedule from Stripe, so the audit row
# carries a real diff — not just "schedule updated".

  kald_username        = "ops@kayana.io"
  kald_log_activity    = "PAYOUT_SCHEDULE_UPDATED"
  kald_property_id     = "PROP-2201"
  kald_log_description = "Payout schedule for '<b>Riverside Cafe</b>'
                          changed from <b>daily</b> (delay 2)
                          to <b>weekly</b> anchored on <b>Friday</b> (delay 2)."
  kald_created_by      = "KAYANA-ADMIN-SERVICE"
  kald_created_date    = 2026-08-29T18:42:11Z

# Read endpoints — /fetch-payout, /fetch-all-payouts, per-payout drilldowns —
# stay unaudited; the aspect is set to skip read-only calls to keep the
# ledger signal-heavy.
`,
    },
  ],

  keyInsight: "The schedule update path is a Stripe-SDK call direct from the admin service because the request shape is structured and idempotent — settings.payouts.schedule is the same map every time. The listing path routes through a dedicated Stripe listing integration where pagination, parallel bank-detail enrichment, and per-page rate-limit handling live. And the per-payout breakdown is read from a local transaction projection because BalanceTransaction.list at finance-grid scale would hammer Stripe's API. Three different transport choices, one consistent admin-facing API.",

  requestTrace: [
    { phase: "READ",        detail: "GET /admin/stripe/fetch-payout → KayanaAdminStripeAccountService.fetchPayout → getStripePayout (Stripe Account.retrieve, parse settings.payouts.schedule + first external_account currency)." },
    { phase: "UPDATE",      detail: "PATCH /admin/stripe/update-payout → KayanaAdminStripeAccountService.updatePayoutSchedule. Validates weekly_anchor (one of 7 weekday names) and monthly_anchor (int 1..31) server-side before touching Stripe." },
    { phase: "STRIPE-WRITE", detail: "setStripePayout resolves per-currency Stripe.apiKey + acct_…, builds the schedule map ({interval, delay_days, weekly_anchor / monthly_anchor}), calls Account.retrieve then Account.update with settings.payouts.schedule. KayanaBusinessPropertyPspMapping.payoutScheduled is flipped to mirror the new state." },
    { phase: "LIST",        detail: "GET /admin/account/fetch-all-payouts → KayanaAdminAccountService.fetchAllPayouts builds {limit, status, startDate, endDate} body, dispatches to the Stripe listing integration with a typed FETCH_PAYOUT_LIST action. That side resolves the connected acct_ from the merchant mapping, single-pages or recursively paginates, enriches each row with destination ba_… last4 in parallel." },
    { phase: "FORMAT",      detail: "Admin formatPayoutResponseDates walks the listing response: created + arrival_date → dd-MM-yyyy HH:mm:ss a; amount minor-units → currency-symbol-prefixed string. Returned straight to the finance UI." },
    { phase: "DRILL-IN",    detail: "GET /admin/stripe/fetch-payout-details-new?payoutId=… → fetchPayoutDetailsNew walks kayana_stripe_transaction_report between the previous + current bookingDate for the account holder, buckets transactions by reference pattern (TIP / merchant-split / business / fee / refund / internalTransfer), aggregates into one PayoutDetailBean." },
    { phase: "AUDIT",       detail: "updatePayoutSchedule runs under @LogActivity (PAYOUT_SCHEDULE_UPDATED — see [[task-audit]]); description is built by buildStripePayoutDescription with the old → new diff." },
  ],

  constraintsLimitations: [
    "The Stripe schedule code uses one weekly_anchor / monthly_anchor — Stripe's API also allows one anchor per interval, so 'pay every Monday and Friday' isn't representable today. The validation already accepts multiple days from the UI; only the first is sent.",
    "Stripe-listing pagination only kicks in past limit > 100; finance UIs that request 1000+ at once will recursive-fetch synchronously inside one HTTP response — fine today but the wrong tool for >10k payouts.",
  ],

  conclusion: "Three different transport choices for three different jobs — Stripe Account.retrieve / Account.update direct from admin for schedule, a paginated Stripe Payout.list integration for listing, local projection for per-payout breakdown — sitting behind one admin-facing API that the front-end uses identically regardless of which PSP the merchant runs on. The split between admin (controller + validation + audit + mirror) and the Stripe integration side (SDK + pagination + bank enrichment) keeps each side small enough to reason about.",
};
