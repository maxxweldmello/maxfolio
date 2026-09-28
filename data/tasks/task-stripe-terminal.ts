import type { Task } from "../tasks.data";

export const taskStripeTerminal: Task = {
  taskId:    "task-stripe-terminal",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Spring WebFlux", "Stripe SDK", "Stripe Terminal", "Feign"],
  image:     "/tasks/stripe-terminal/hero.jpg",

  title: "Stripe Terminal — Location & Reader Management",

  description: "Operators register / list / rename / remove physical Stripe Terminal readers (S700, WisePOS) on a connected `acct_…` via the Kayana Web Admin Portal. The admin service keeps the local source of truth (property, PSP mapping, terminal location, audit row); the Stripe Terminal integration owns the actual `stripe.Reader.create / list / update / delete` calls so Stripe secrets never touch admin.",

  ideaPipeline: {
    steps: ["Admin /assign-terminals", "Feign /terminal (REGISTER)", "Stripe SDK Reader.create", "Local mirror row", "Audit @LogActivity"],
    caption: "Admin keeps the local source of truth (property, PSP mapping, terminal location); the Stripe Terminal integration owns the Stripe SDK call. Every mutation goes through one typed action — REGISTER for create, FETCH_TERMINALS for list, REMOVE_TERMINAL for delete — and the admin service writes the local mirror on success.",
  },

  problemStatement: "Each merchant onboarded onto Stripe Connect needs at least one Terminal location and one or more physical readers before they can take in-person card payments. Operations onboarding doesn't scale if every reader registration is a support ticket against the dev team, and storing reader metadata only on Stripe means every admin page render becomes N round-trips to api.stripe.com. We needed an admin UI flow where operations could register a reader against an existing terminal location with the registration code the device prints, rename it without touching Stripe directly, and remove it cleanly — with the admin service written thinly on top of Stripe Terminal so we could add more Stripe Terminal locations and reader types without touching the admin path.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /admin/terminal/assign-terminals",
      caption: "02 · Register — one JSON in, Stripe reader created + local mirror row lands",
      language: "http",
      code: `# Real endpoint on kayana-admin-service. propertyId + pspProvider +
# currencyCode narrow to the exact PSP mapping; label / registrationCode
# / serialNumber describe the physical device being paired.

curl -X POST https://api.kayana.io/admin/terminal/assign-terminals \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":       "PROP-2201",
    "label":            "Till #2 — main counter",
    "registrationCode": "puppy-cat-mouse",
    "serialNumber":     "STRM26E60003",
    "pspProvider":      "STRIPE",
    "currencyCode":     "GBP"
  }'

# → ServiceResponseBean — description is HTML-formatted for the audit log
{
  "status":  true,
  "description": "Assigned reader '<b>Till #2 — main counter</b>' (<b>tmr_FpKQm...</b>) with serial number '<b>STRM26E60003</b>' to '<b>Riverside Cafe</b>'.",
  "propertyId": "PROP-2201"
}

# Failure paths return status:false with a clear message:
#   "No property details found."
#   "Property PSP Mapping not found."
#   "No terminal location found."
#   "Failed to create terminal via Stripe: <extracted Stripe error>"
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminTerminalService#assignTerminalV2",
      caption: "03 · Service — lookup property + PSP mapping + terminal location, then delegate to Stripe",
      language: "java",
      code: `@Override
@LogActivity(status = ActivityLogStatusEnum.READER_ADDED, username = "username")
public ServiceResponseBean assignTerminalV2(ReaderDetailsRequestBean req,
                                            String username,
                                            ServiceResponseBean srb) {
    try {
        // 1 · Property must exist.
        KayanaBusinessPropertyDetail property =
            propertyRepo.findByKbpdPropertyId(req.getPropertyId());
        if (property == null) {
            srb.setMessage("No property details found.");
            return srb;
        }

        // 2 · The (property, PSP, currency) mapping must be ACTIVE — each
        //     currency lands on its own Stripe connected account, and readers
        //     are attached to one currency.
        Optional<KayanaBusinessPropertyPspMapping> mapping = pspMappingRepo
            .findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
                req.getPropertyId(), req.getPspProvider(), req.getCurrencyCode(),
                GeneralStatusEnum.ACTIVE.getValue());
        if (mapping.isEmpty()) {
            srb.setMessage("Property PSP Mapping not found.");
            return srb;
        }

        // 3 · Every currency also has a Stripe Terminal Location row —
        //     readers must attach to a location, not directly to the account.
        KayanaBusinessTerminalLocations loc = terminalLocationRepo
            .findAllByKbtlPropertyIdAndKbtlPspCodeAndKbtlCurrencyCode(
                req.getPropertyId(), req.getPspProvider(), req.getCurrencyCode());
        if (loc == null) {
            srb.setMessage("No terminal location found.");
            return srb;
        }

        // 4 · Build the Stripe Terminal registration body and delegate.
        //     Admin never holds Stripe credentials — the Stripe Terminal
        //     integration owns them; this hop is a typed action.
        Map<String, Object> body = Map.of(
            "label",             req.getLabel(),
            "registration_code", req.getRegistrationCode(),
            "location_id",       loc.getKbtlLocationId(),
            "serial_number",     req.getSerialNumber());

        ServiceResponseBean terminalResp = stripeTerminalClient.terminal(
            req.getPropertyId(), req.getPspProvider(),
            PspActionTypeEnum.REGISTER.getValue(),
            req.getCurrencyCode(),
            new ObjectMapper().writeValueAsString(body));

        if (!Boolean.TRUE.equals(terminalResp.getStatus())) {
            srb.setMessage("Failed to create terminal via Stripe: " + terminalResp.getMessage());
            return srb;
        }

        // 5 · Stripe returns terminal_id + serial_number — pull them out
        //     regardless of Map- or String-shaped payload.
        String terminalId = null, serialNumber = null;
        if (terminalResp.getData() instanceof Map<?,?> m) {
            terminalId   = (String) m.get("terminal_id");
            serialNumber = (String) m.get("serial_number");
        } else if (terminalResp.getData() instanceof String s) {
            terminalId   = firstMatch("terminal_id=([^,}]+)",   s);
            serialNumber = firstMatch("serial_number=([^,}]+)", s);
        }

        // 6 · Build the audit-friendly HTML description that lands on
        //     the READER_ADDED audit row (see stage 10).
        srb.setStatus(true);
        srb.setPropertyId(req.getPropertyId());
        srb.setDescription("Assigned reader '<b>" + req.getLabel() + "</b>' (<b>"
            + terminalId + "</b>) with serial number '<b>"
            + (req.getSerialNumber() != null ? req.getSerialNumber() : serialNumber)
            + "</b>' to '<b>" + property.getKbpdPropertyTradingName() + "</b>'.");
    } catch (Exception e) {
        srb.setMessage(extractStripeMessage(e.getMessage()));
    }
    return srb;
}
`,
    },
    {
      path: "Stripe Terminal integration — what actually hits Stripe",
      caption: "04 · The Stripe SDK call — Reader.create against the merchant's connected account",
      language: "java",
      code: `// The Stripe Terminal integration owns the SDK call; admin only
// forwards a typed action + the JSON body assembled above. This is
// what the integration runs when action = REGISTER:

Map<String, Object> params = Map.of(
    "label",             body.get("label"),
    "registration_code", body.get("registration_code"),
    "location",          body.get("location_id"),
    "metadata",          Map.of("property_id", propertyId, "kayana_currency", currencyCode)
);

// stripe-java v30 — connected-account context via RequestOptions.
RequestOptions opts = RequestOptions.builder()
    .setStripeAccount(mapping.getConnectedAccountId())   // acct_1PXk9K...
    .build();

com.stripe.model.terminal.Reader reader =
    com.stripe.model.terminal.Reader.create(params, opts);

// The response is what admin extracts terminal_id + serial_number from
// in stage 03 — same shape either as a typed Map or the SDK's toString.
return Map.of(
    "terminal_id",   reader.getId(),        // tmr_FpKQm...
    "serial_number", reader.getSerialNumber(),
    "label",         reader.getLabel(),
    "location",      reader.getLocation()   // tml_...
);
`,
    },
    {
      path: "kayana_admin.kayana_business_reader_details",
      caption: "05 · Local mirror — one row per registered reader, keyed by (property, reader)",
      language: "sql",
      code: `-- Every registered reader is mirrored locally so admin screens can list
-- readers without an N-round-trip fan-out to api.stripe.com on every
-- page render. Stripe stays the source of truth for the device; this
-- table is the source of truth for "which property owns which reader,
-- what's it called, when was it added."
CREATE TABLE kayana_admin.kayana_business_reader_details (
  kbrd_seq_id        BIGSERIAL PRIMARY KEY,
  kbrd_property_id   VARCHAR(64),
  kbrd_location_id   VARCHAR(64),        -- Stripe Terminal Location (tml_...)
  kbrd_reader_id     VARCHAR(64),        -- Stripe Terminal Reader   (tmr_...)
  kbrd_label         VARCHAR(120),
  kbrd_created_by    VARCHAR(80),
  kbrd_created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kbrd_updated_by    VARCHAR(80),
  kbrd_updated_date  TIMESTAMPTZ
);
CREATE UNIQUE INDEX ux_kbrd_property_reader
  ON kayana_admin.kayana_business_reader_details (kbrd_property_id, kbrd_reader_id);

-- The row that lands after the successful register in stages 02–03:
INSERT INTO kayana_admin.kayana_business_reader_details
  (kbrd_property_id, kbrd_location_id, kbrd_reader_id, kbrd_label,
   kbrd_created_by, kbrd_updated_by)
VALUES
  ('PROP-2201', 'tml_9F2xC...', 'tmr_FpKQm...', 'Till #2 — main counter',
   'KAYANA-ADMIN-SERVICE', 'KAYANA-ADMIN-SERVICE');
`,
    },
    {
      path: "GET /admin/terminal/fetch-all-readers",
      caption: "06 · List — every reader across every currency the property is onboarded on",
      language: "http",
      code: `# One property can have Stripe onboarding on multiple currencies
# (GBP, EUR, USD, …). Each currency has its own Stripe Terminal
# Location + reader list. The endpoint fans out across every ACTIVE
# PSP mapping under the property and returns the union.

curl -X GET "https://api.kayana.io/admin/terminal/fetch-all-readers\\
?property_id=PROP-2201&psp_code=STRIPE" \\
  -H "Authorization: Bearer <admin_jwt>"

# → ServiceResponseBean
{
  "status": true,
  "data": [
    {
      "readerId":       "tmr_FpKQm...",
      "label":          "Till #2 — main counter",
      "serialNumber":   "STRM26E60003",
      "locationId":     "tml_9F2xC...",
      "currencyCode":   "GBP",
      "pspProvider":    "STRIPE",
      "status":         "online"
    },
    {
      "readerId":       "tmr_JnLm4...",
      "label":          "EU counter",
      "serialNumber":   "STRM26E60011",
      "locationId":     "tml_A11bB...",
      "currencyCode":   "EUR",
      "pspProvider":    "STRIPE",
      "status":         "offline"
    }
  ]
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminTerminalService#fetchAllReadersV2",
      caption: "07 · List service — iterate every ACTIVE PSP mapping, ask Stripe per currency, merge",
      language: "java",
      code: `public ServiceResponseBean fetchAllReadersV2(String propertyId,
                                             String pspCode,
                                             ServiceResponseBean srb) {
    try {
        if (pspCode == null || pspCode.isBlank())
            pspCode = PspProviderEnum.STRIPE.getValue();

        KayanaBusinessPropertyDetail property =
            propertyRepo.findByKbpdPropertyId(propertyId);
        if (property == null) {
            srb.setMessage("No property details found");
            return srb;
        }

        // One property = many currency-scoped Stripe mappings.
        List<KayanaBusinessPropertyPspMapping> mappings = pspMappingRepo
            .findAllByKbppmPropertyIdAndKbppmPspProviderAndKbppmStatus(
                propertyId, pspCode, GeneralStatusEnum.ACTIVE.getValue());
        if (mappings.isEmpty()) {
            srb.setMessage("No PSP mapping found for this property");
            return srb;
        }

        List<ReaderDetailsResponseBean> allReaders = new ArrayList<>();

        // One Stripe fetch per (currency) — results are merged into one list.
        for (KayanaBusinessPropertyPspMapping m : mappings) {
            ServiceResponseBean listResp = stripeTerminalClient.terminal(
                propertyId, pspCode,
                PspActionTypeEnum.FETCH_TERMINALS.getValue(),
                m.getKbppmCurrencyCode(), null);

            if (Boolean.TRUE.equals(listResp.getStatus()) && listResp.getData() instanceof List<?> stripeReaders) {
                for (Object raw : stripeReaders) {
                    ReaderDetailsResponseBean r = objectMapper.convertValue(raw, ReaderDetailsResponseBean.class);
                    r.setCurrencyCode(m.getKbppmCurrencyCode());
                    r.setPspProvider(pspCode);
                    // Join with local mirror so we get the label ops set,
                    // not just whatever Stripe last saw.
                    localReaderRepo.findByKbrdPropertyIdAndKbrdReaderId(propertyId, r.getReaderId())
                        .ifPresent(local -> r.setLabel(local.getKbrdLabel()));
                    allReaders.add(r);
                }
            }
        }

        srb.setStatus(true);
        srb.setData(allReaders);
    } catch (Exception e) {
        srb.setMessage(e.getLocalizedMessage());
    }
    return srb;
}
`,
    },
    {
      path: "PUT /admin/terminal/update-reader",
      caption: "08 · Rename — label change stays local; Stripe reload is a follow-up fetch",
      language: "http",
      code: `# Reader-label is a Kayana-side concept — the label on the physical
# Stripe device barely matters. So rename is a local flip + immediate
# fetch-all-readers to return the fresh list.

curl -X PUT https://api.kayana.io/admin/terminal/update-reader \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "readerId":    "tmr_FpKQm...",
    "label":       "Till #2 — moved to bar",
    "pspProvider": "STRIPE"
  }'

# → ServiceResponseBean — description is again HTML-formatted for audit.
{
  "status": true,
  "description": "Reader (tmr_FpKQm...) has been updated with new label (Till #2 — moved to bar) for (Riverside Cafe).",
  "propertyId": "PROP-2201",
  "data": [ /* fresh full reader list from stage 06/07 */ ]
}
`,
    },
    {
      path: "GET /admin/terminal/delete-reader",
      caption: "09 · Remove — Stripe delete + local row cleanup, one call",
      language: "http",
      code: `# GET (with query params) rather than DELETE — every param is required
# because Stripe's Reader.delete needs the connected-account context
# resolved via (propertyId, pspCode, currencyCode) before it fires.

curl -X GET "https://api.kayana.io/admin/terminal/delete-reader\\
?property_id=PROP-2201\\
&reader_id=tmr_FpKQm...\\
&serial_number=STRM26E60003\\
&psp_code=STRIPE\\
&currency_code=GBP" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io"

# → ServiceResponseBean
{
  "status": true,
  "description": "Removed reader '<b>tmr_FpKQm...</b>' (serial <b>STRM26E60003</b>) from '<b>Riverside Cafe</b>'.",
  "propertyId": "PROP-2201"
}

# Under the hood: the Stripe Terminal integration runs
#   Reader.retrieve(readerId, opts).delete(opts)
# on the connected acct_, then admin flips the local row's kbrd_status
# (deleted) so it drops out of every future fetch-all-readers call.
`,
    },
    {
      path: "Audit trail — @LogActivity rows the flow produces",
      caption: "10 · Every mutation lands as an audit row — same aspect the rest of admin uses",
      language: "text",
      code: `# The @LogActivity aspect (see task-audit) wraps every mutating call
# in this flow. status codes come from ActivityLogStatusEnum, username
# comes off the required "username" request header:

  READER_ADDED          ← POST /admin/terminal/assign-terminals
  READER_UPDATED        ← PUT  /admin/terminal/update-reader
  READER_REMOVED        ← GET  /admin/terminal/delete-reader

# The audit row's description is the HTML-formatted string the service
# sets on ServiceResponseBean.setDescription (see stage 03) — support
# reads the trail directly, no post-processing needed:

  kald_username        = "ops@kayana.io"
  kald_log_activity    = "READER_ADDED"
  kald_property_id     = "PROP-2201"
  kald_log_description = "Assigned reader '<b>Till #2 — main counter</b>'
                          (<b>tmr_FpKQm...</b>) with serial number
                          '<b>STRM26E60003</b>' to '<b>Riverside Cafe</b>'."
  kald_created_by      = "KAYANA-ADMIN-SERVICE"
  kald_created_date    = 2026-08-29T18:42:11Z

# Fetch flows (fetch-all-readers) are read-only and stay unaudited —
# the aspect is set to skip GET-only reads to keep the trail signal-heavy.
`,
    },
  ],

  keyInsight: "The split is the design. Admin owns the local source of truth — property, PSP mapping, terminal location row, audit row — and never imports the Stripe SDK. The Stripe Terminal integration owns the Stripe SDK, the per-currency Stripe.apiKey, and the Stripe-Account header. They communicate through one typed action per verb. That's why the admin grid can render readers without ever round-tripping to Stripe at page-load, and why Stripe secrets never touch admin.",

  requestTrace: [
    { phase: "REGISTER",  detail: "POST /admin/terminal/assign-terminals with label + registration code + serial. Admin guards property + PSP mapping + terminal location row; builds {label, registration_code, location_id, serial_number} body; hands it to the Stripe Terminal integration with a typed REGISTER action." },
    { phase: "STRIPE",    detail: "Stripe Terminal integration resolves the merchant's connected acct_… and per-currency Stripe.apiKey, builds ReaderCreateParams, calls Reader.create(params). Returns tmr_…, serial_number, device_type, ip_address back to admin." },
    { phase: "FETCH",     detail: "GET /admin/terminal/fetch-all-readers walks every ACTIVE (property, STRIPE, currency) mapping, resolves the per-currency terminal location, dispatches a FETCH_TERMINALS action for each. Under the hood Reader.list(setLocation, limit=100); admin merges + stamps currency on each row before returning the union to the UI grid." },
    { phase: "RENAME",    detail: "PUT /admin/terminal/update-reader flips the label locally on the reader mirror row and immediately re-runs fetchAllReadersV2 so the response carries the fresh status / ipAddress / serial from Stripe. No Stripe-side label mutation; the admin grid reads labels from the local mirror." },
    { phase: "REMOVE",    detail: "GET /admin/terminal/delete-reader dispatches REMOVE_TERMINAL. Stripe integration runs Reader.retrieve(id) → reader.delete() — retrieve first so a missing tmr_… surfaces as a clean 'Terminal not found' instead of a raw SDK 404." },
    { phase: "LOCATION",  detail: "Locations themselves are minted earlier by the connect-account onboarding flow ([[task-property-onboarding]]). Location.create runs with locale-specific address rules (EUR → mapSpanishStateToProvinceCode, USD/AUD/CAD pass state through, GBP omits); a KayanaTerminalLocationEventRecord is published and admin writes the kayana_business_terminal_locations row." },
    { phase: "AUDIT",     detail: "Every admin mutation is wrapped in @LogActivity (READER_ADDED / READER_UPDATED / READER_REMOVED) — see [[task-audit]]; the description field carries the human-readable summary that lands in kayana_activity_log_details." },
  ],

  constraintsLimitations: [
    "Stripe is the source of truth — if Stripe is unreachable, the admin grid can't list readers (no local replica of reader status). The local mirror only caches the location_id, not the full reader collection.",
    "Renaming a reader doesn't sync the label back to Stripe; the local label drives the admin UI but Stripe Dashboard will still show the original Stripe-Account-side label.",
    "Multi-currency reader fetches go through fetchTerminalsByLocation, which is currency-aware end-to-end. A legacy single-merchant fetch path defaults to GBP and is still marked as a TODO in the code.",
    "The wire response between admin and the Stripe integration isn't strictly typed — assignTerminalV2 has a regex fallback for when Jackson hands back a stringified Map instead of a real Map.",
  ],

  conclusion: "One typed action per verb (REGISTER / FETCH_TERMINALS / REMOVE_TERMINAL) cleanly separates the admin's local source of truth from the Stripe SDK ownership. Admin owns property, PSP mapping, terminal location row, and audit row; the Stripe Terminal integration owns Reader.create / Reader.list / Reader.delete and the per-currency Stripe.apiKey — with the credentials boundary drawn where it belongs.",
};
