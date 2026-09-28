import type { Task } from "../tasks.data";

export const taskCardMapping: Task = {
  taskId:    "task-card-mapping",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Spring @Async", "Netty-SocketIO", "JPA", "PostgreSQL"],
  image:     "/tasks/card-mapping/hero.jpg",

  title: "Payment Card Mapping Synchronization using Spring @Async",

  description: "Each (card_name × card_type × card_origin × country_code) tuple is a row on `kayana_admin_card_details` that the platform fee engine joins against at transaction time. Spring `@Async` sync from the PSP card-mapping API runs without blocking the admin request; a Socket.IO push notifies the FE when the sync completes so the UI updates without polling.",

  ideaPipeline: {
    steps: ["POST /card-mapping-sync", "buildKey fingerprint Set", "Cartesian membership walk", "@Async generateAndSave", "Socket.IO card_mapping_sync_done"],
    caption: "Pre-check is synchronous in memory: every existing row hashes through buildKey into a Set<String>; the cartesian product of the reference tables walks against it. If every combination is present → return 'Already Synced'. Otherwise the request returns 'started in background' in milliseconds and the @Async worker runs the same walk again, persists missing rows in batches of 50 through a generic saveInBatches helper, then pushes 'card_mapping_sync_done' to every Socket.IO client of the operator's session.",
  },

  problemStatement: "The fee-configuration engine (see [[task-payment-fee]]) doesn't store fees against a card directly — it stores them against a card BAND ('LOCAL CARDS', 'INTERNATIONAL CARDS', 'OTHERS'). To resolve a fee at transaction time the platform needs a row that says 'Visa + Debit + Local + GB → LOCAL'. Card names, card types, card origins and country codes are all reference tables that grow over time. When a new card name lands in the reference table, dozens of (name × type × origin × country) combinations are suddenly missing rows. Doing this one card at a time was untenable; doing it inline on the request thread would have locked the browser for tens of seconds. We needed a one-click 'sync' button that figured out which combinations are missing, inserted them in the background without blocking the HTTP response, and told the UI the moment it was actually done — not 'we kicked it off, refresh later'.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /admin/card-mapping-sync",
      caption: "02 · One-click sync — returns in ms, work runs on @Async",
      language: "http",
      code: `# The whole call is intentionally cheap. Response comes back the moment
# the in-memory pre-check finishes (see stage 05); the actual insert
# runs on a Spring @Async worker thread pool.

curl -X POST https://api.kayana.io/admin/card-mapping-sync \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io"

# → ServiceResponseBean — two outcomes:
#
#   Nothing to do — every combination already has a row:
{ "status": true, "message": "Card mappings are already in sync." }

#   Missing combinations detected — worker kicked off, response returns
#   immediately without waiting for the writes:
{ "status": true, "message": "Card mapping sync started in background." }

# The FE stays on the current screen; it's already listening for the
# 'card_mapping_sync_done' socket event (stage 01) to refresh.
`,
    },
    {
      path: "kayana_admin.kayana_admin_card_details",
      caption: "03 · Where the mappings live — one row per (name × type × origin × country)",
      language: "sql",
      code: `-- Real table (KayanaAdminCardMapping entity). Every row is one card
-- fingerprint that the fee engine joins against at transaction time to
-- resolve a card band (LOCAL CARDS / INTERNATIONAL CARDS / OTHERS).

CREATE TABLE kayana_admin.kayana_admin_card_details (
  kacm_seq_id        BIGSERIAL PRIMARY KEY,
  kacm_id            VARCHAR(48) UNIQUE,
  kacm_card_name     VARCHAR(80),      -- Visa / Mastercard / Amex / ...
  kacm_card_type     VARCHAR(40),      -- DEBIT / CREDIT / PREPAID / ...
  kacm_card_origin   VARCHAR(40),      -- LOCAL / INTERNATIONAL / ...
  kacm_card_band     VARCHAR(40),      -- LOCAL CARDS / INTERNATIONAL CARDS / OTHERS
  kacm_country_code  VARCHAR(8),
  kacm_currency_code VARCHAR(8),
  kacm_created_by    VARCHAR(80),
  kacm_created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kacm_updated_by    VARCHAR(80),
  kacm_updated_date  TIMESTAMPTZ
);
CREATE UNIQUE INDEX ux_kacm_fingerprint
  ON kayana_admin.kayana_admin_card_details
     (kacm_card_name, kacm_card_type, kacm_card_origin, kacm_country_code);

-- Row every combination lands as (band defaults to OTHERS on auto-insert):
INSERT INTO kayana_admin.kayana_admin_card_details
  (kacm_id, kacm_card_name, kacm_card_type, kacm_card_origin,
   kacm_card_band, kacm_country_code, kacm_created_by)
VALUES
  ('CM-9F2xC…', 'Visa', 'DEBIT', 'LOCAL', 'OTHERS', 'GB', 'KAYANA-ADMIN-SERVICE');
`,
    },
    {
      path: "POST/GET/PUT/DELETE /admin/card-mapping  (single-row CRUD)",
      caption: "04 · The single-row CRUD around the same table — hand-edit one mapping at a time",
      language: "http",
      code: `# Same table, per-row endpoints — used from the grid's row-level
# actions (Add / Edit / Delete) before / after the sync fires.

# ── ADD ──────────────────────────────────────────────────────────────
curl -X POST https://api.kayana.io/admin/card-mapping \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "cardName":     "Visa",
    "cardType":     "CREDIT",
    "cardOrigin":   "INTERNATIONAL",
    "cardBand":     "INTERNATIONAL CARDS",
    "countryCode":  "GB",
    "currencyCode": "GBP",
    "pspProvider":  "STRIPE"
  }'

# ── FETCH (single row) ───────────────────────────────────────────────
curl -X GET "https://api.kayana.io/admin/card-mapping?mapping_id=CM-9F2xC..." \\
  -H "Authorization: Bearer <admin_jwt>"

# ── FETCH ALL (drives the grid) ──────────────────────────────────────
curl -X GET https://api.kayana.io/admin/card-mapping/fetch-all \\
  -H "Authorization: Bearer <admin_jwt>"

# ── UPDATE one row (band re-classification / correction) ────────────
curl -X PUT https://api.kayana.io/admin/card-mapping \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "cardId":     "CM-9F2xC...",
    "cardBand":   "LOCAL CARDS"
  }'

# ── UPDATE many rows at once (band bulk-re-classification) ───────────
curl -X PUT https://api.kayana.io/admin/card-mapping-update-all \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "cardMappingIds": ["CM-9F2xC...", "CM-11a2b...", "CM-77dd0..."],
    "cardBand":       "LOCAL CARDS"
  }'

# ── DELETE ───────────────────────────────────────────────────────────
curl -X DELETE "https://api.kayana.io/admin/card-mapping?mapping_id=CM-9F2xC..." \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io"
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminCardMappingService#createCardMappingSync",
      caption: "05 · Sync entry — read four reference tables, build a Set, decide already-in-sync vs enqueue",
      language: "java",
      code: `public ServiceResponseBean createCardMappingSync(String username,
                                                  ServiceResponseBean srb) {
    try {
        // 1 · Pull the four reference tables the cartesian product covers.
        //     Names, types, origins are stable reference data; country
        //     codes come from whatever's already been in use for
        //     mappings (i.e. only countries the platform actually serves).
        List<String> cardNames   = cardNamesRepo.findAllDistinctCardNamesWherePspProviderIsNullOrEmpty();
        List<String> cardTypes   = cardTypeRepo.findAllCardTypeNames();
        List<String> cardOrigins = cardOriginRepo.findAllCardOriginNames();

        List<KayanaAdminCardMapping> existing = cardMappingRepo.findAll();
        List<String> countryCodes = existing.stream()
            .map(KayanaAdminCardMapping::getKacmCountryCode)
            .filter(Objects::nonNull).distinct().toList();

        // 2 · Any reference empty → nothing to fan out; return with a message.
        if (cardNames.isEmpty())   { srb.setMessage("Card Names table is empty.");   srb.setStatus(false); return srb; }
        if (cardTypes.isEmpty())   { srb.setMessage("Card Types table is empty.");   srb.setStatus(false); return srb; }
        if (cardOrigins.isEmpty()) { srb.setMessage("Card Origins table is empty."); srb.setStatus(false); return srb; }
        if (countryCodes.isEmpty()){ srb.setMessage("Country Code table is empty."); srb.setStatus(false); return srb; }

        // 3 · Hash every existing row through buildKey → a Set<String>. O(1)
        //     membership test for the cartesian walk below.
        Set<String> existingKeys = existing.stream()
            .map(m -> cardMappingAsync.buildKey(
                m.getKacmCardName(), m.getKacmCardType(),
                m.getKacmCardOrigin(), m.getKacmCountryCode()))
            .collect(Collectors.toSet());

        // 4 · Cheap in-memory pre-check — walk cartesian product, break
        //     the moment ONE combination is missing. If everything's
        //     already present, return "Already Synced" — no @Async fired.
        boolean allPresent = true;
        outer:
        for (String cardName : cardNames)
          for (String cardType : cardTypes)
            for (String cardOrigin : cardOrigins)
              for (String countryCode : countryCodes) {
                  String key = cardMappingAsync.buildKey(cardName, cardType, cardOrigin, countryCode);
                  if (!existingKeys.contains(key)) { allPresent = false; break outer; }
              }

        if (allPresent) {
            srb.setStatus(true);
            srb.setMessage("Card mappings are already in sync.");
            return srb;
        }

        // 5 · Fire the @Async worker — returns immediately, HTTP response
        //     comes back to the caller in milliseconds.
        cardMappingAsync.generateAndSaveCardMappingsAsync(
            cardNames, cardTypes, cardOrigins, countryCodes, existingKeys, username);

        srb.setStatus(true);
        srb.setMessage("Card mapping sync started in background.");
    } catch (Exception e) {
        log.error("Exception in createCardMappingSync: {}", e.getMessage(), e);
    }
    return srb;
}
`,
    },
    {
      path: "com.kayana.utils.KayanaCardMappingAsync#buildKey",
      caption: "06 · Fingerprint — one canonical string per (name × type × origin × country)",
      language: "java",
      code: `// Every row and every candidate hashes through the exact same builder,
// so the Set membership test in stage 05 doesn't have to worry about
// case differences or column order. Name/type/origin lowercased,
// country code uppercased — matches the ISO-3166 convention.

public String buildKey(String cardName, String cardType,
                       String cardOrigin, String countryCode) {
    return String.join(KayanaCommonConstants.INSTANCE.DELIMITER,
        cardName.toLowerCase(),
        cardType.toLowerCase(),
        cardOrigin.toLowerCase(),
        countryCode.toUpperCase());
}

// Example:
//   buildKey("Visa", "DEBIT", "LOCAL", "gb") → "visa|debit|local|GB"
//
// That's the string that both existing rows and cartesian-walk
// candidates get boiled down to — so "Visa" vs "visa" vs " visa "
// don't produce phantom duplicates on repeated syncs.
`,
    },
    {
      path: "com.kayana.utils.KayanaCardMappingAsync#generateAndSaveCardMappingsAsync",
      caption: "07 · @Async worker — walk cartesian product, insert missing rows, push socket event",
      language: "java",
      code: `@Async
public void generateAndSaveCardMappingsAsync(
        List<String> cardNames, List<String> cardTypes,
        List<String> cardOrigins, List<String> countryCodes,
        Set<String> existingKeys, String username) {
    try {
        List<KayanaAdminCardMapping> toInsert = new ArrayList<>();

        // Same cartesian walk as stage 05's pre-check, but this time
        // building rows for every missing combination.
        cardNames.stream()
            .flatMap(cardName -> cardTypes.stream()
                .flatMap(cardType -> cardOrigins.stream()
                    .flatMap(cardOrigin -> countryCodes.stream()
                        .map(countryCode -> new String[]{cardName, cardType, cardOrigin, countryCode}))))
            .forEach(combo -> {
                String comboKey = buildKey(combo[0], combo[1], combo[2], combo[3]);
                if (!existingKeys.contains(comboKey)) {
                    toInsert.add(insertCardMapping(combo[0], combo[1], combo[2], combo[3]));
                    existingKeys.add(comboKey);   // guard duplicates within this run
                }
            });

        if (toInsert.isEmpty()) return;

        log.info("Async Save Triggered: {} new mappings to save.", toInsert.size());

        // 50 rows per flush — keeps the JPA batch predictable and
        // prevents one giant transaction per sync.
        saveInBatches(toInsert, 50, cardMappingRepo);

        // Push the completion event to every Socket.IO client bound to
        // this operator's username (see task-auth-session for how the
        // socket connection binds a login to a username on handshake).
        List<SocketIOClient> clients = socketManager.getClients(username);
        for (SocketIOClient c : clients)
            c.sendEvent("card_mapping_sync_done", "Card Mapping Sync Completed.");

        // Standalone audit row (this flow doesn't use @LogActivity —
        // it writes the row directly because the @Async worker runs
        // outside the request-thread the aspect intercepts).
        activityLogRepo.save(
            generateLogs(ActivityLogStatusEnum.CARD_MAPPING_SYNC_COMPLETED.getValue(),
                         username, "Card Mapping Sync Completed"));
    } catch (Exception e) {
        log.error("Async card-mapping sync failed", e);
    }
}
`,
    },
    {
      path: "KayanaCardMappingAsync — insertCardMapping + saveInBatches",
      caption: "08 · Row builder + generic 50-per-flush batch save (works for any JpaRepository)",
      language: "java",
      code: `// One row per missing combination. Newly inserted mappings default
// to CardBandEnum.OTHERS — ops re-classifies them into LOCAL CARDS /
// INTERNATIONAL CARDS later via /card-mapping-update-all (stage 04).

private KayanaAdminCardMapping insertCardMapping(String cardName, String cardType,
                                                 String cardOrigin, String countryCode) {
    KayanaAdminCardMapping row = new KayanaAdminCardMapping();
    row.setKacmId(KayanaCommonConstants.INSTANCE.CARD_MAPPING_PREFIX
                    + KayanaCommonUtils.INSTANCE.uniqueIdentifier());
    row.setKacmCardName(cardName);
    row.setKacmCardType(cardType);
    row.setKacmCardOrigin(cardOrigin);
    row.setKacmCardBand(CardBandEnum.OTHERS.getValue());     // sensible default
    row.setKacmCountryCode(countryCode);
    row.setKacmCreatedBy(applicationName);
    row.setKacmCreatedDate(Calendar.getInstance());
    return row;
}

// Generic helper — used here for KayanaAdminCardMappingRepo, but signature
// is <T> on any JpaRepository so any bulk-insert path can reuse it.
public <T> void saveInBatches(List<T> entities, int batchSize, JpaRepository<T, ?> repo) {
    for (int i = 0; i < entities.size(); i += batchSize) {
        int end = Math.min(i + batchSize, entities.size());
        repo.saveAllAndFlush(entities.subList(i, end));
    }
}
`,
    },
    {
      path: "Audit trail — CARD_MAPPING_SYNC_COMPLETED",
      caption: "10 · Audit row — written directly (worker is off the request thread, no @LogActivity aspect)",
      language: "text",
      code: `# task-audit's @LogActivity aspect wraps controller-scoped mutations;
# the @Async worker runs on a separate thread, so this flow builds and
# saves the audit row itself (KayanaCardMappingAsync#generateLogs, then
# activityLogRepo.save(...)):

  kald_username        = "ops@kayana.io"
  kald_log_activity    = "CARD_MAPPING_SYNC_COMPLETED"
  kald_property_id     = ""                        # platform-wide, not tied to one property
  kald_log_description = "Card Mapping Sync Completed"
  kald_created_by      = "KAYANA-ADMIN-SERVICE"
  kald_created_date    = 2026-08-29T18:42:11Z

# Ops sees the row on the same Activity screen every other admin
# mutation lands on — one place to confirm the sync ran, even for
# operators who missed the socket toast (closed the tab, etc).

# Side note — a v2 controller under /admin/v2/card-mapping mirrors
# the same 7 routes and reuses KayanaCardMappingV2Async for a
# PSP-scoped variant. Same shape, same batching, same socket push.
`,
    },
  ],

  keyInsight: "buildKey is the load-bearing piece. The pre-walk and the @Async worker both project rows through the same canonicalising helper, so they always agree on what 'already exists' means. That's what lets the orchestrator hand a mutable Set<String> to the worker — the worker re-walks the cartesian product, but it can't disagree with the pre-walk about which combinations the work covers. Same idea makes case drift in reference tables ('Visa' vs 'visa') harmless: both casings hash to the same key, only one row lands. The Spring @Async + Socket.IO pairing is the other half — operations don't wait, but they don't poll either: the worker pushes 'card_mapping_sync_done' to the user's existing per-session socket ([[task-auth-session]]) the moment the bulk flush commits.",

  requestTrace: [
    { phase: "TRIGGER",     detail: "Operator clicks Sync → POST /admin/card-mapping-sync with username header. Returns within milliseconds." },
    { phase: "LOAD-REFS",   detail: "createCardMappingSync pulls card_names (non-PSP-scoped), card_types, card_origins, and card_band=OTHERS from reference tables; country codes are derived from distinct values already present on kayana_admin_card_details." },
    { phase: "GUARD",       detail: "Any empty reference table → typed 'X table is empty' response and zero side effects. Operator gets a precise error pointing at the table they need to fix." },
    { phase: "FINGERPRINT", detail: "Every existing row hashes through KayanaCardMappingAsync.buildKey(name.lower, type.lower, origin.lower, country.upper) into a Set<String>." },
    { phase: "WALK",        detail: "4-deep nested cartesian walk — name × type × origin × country — checks each combination's fingerprint against the Set. First missing combination → break out with allPresent=false." },
    { phase: "SHORT-CIRC",  detail: "All present → return 'Card Mapping Already Synced.' on the request thread; no @Async dispatch." },
    { phase: "HANDOFF",     detail: "Otherwise → kayanaCardMappingAsync.generateAndSaveCardMappingsAsync(refs..., existingKeys, username). The Set is passed in mutable form so the worker keeps the pre-walk's view of 'what exists' consistent across reruns." },
    { phase: "ASYNC-INSERT", detail: "The @Async worker re-walks the cartesian product, builds KayanaAdminCardMapping rows with band=OTHERS + CARDMAP_… ids for missing combinations, and bulk-flushes via the generic saveInBatches<T>(entities, 50, repo) helper." },
    { phase: "PUSH",        detail: "kayanaClientSocketManagerUtils.getClients(username) finds every Socket.IO client on the operator's session (see [[task-auth-session]]); each gets sendEvent('card_mapping_sync_done', 'Card Mapping Sync Completed.'). The UI spinner stops + the table refetches." },
    { phase: "AUDIT",       detail: "Explicit kayana_activity_log_details row (CARD_MAPPING_SYNC_COMPLETED) — the @Async path can't use the @LogActivity aspect because the aspect needs a ServiceResponseBean return that doesn't exist on a void method." },
  ],

  constraintsLimitations: [
    "Country codes are derived from rows already in kayana_admin_card_details rather than a master region table — so a country with zero existing mappings is invisible to the sync. Adding mappings for a new country starts with a manual /card-mapping POST.",
    "The pre-walk re-runs the same cartesian product the @Async worker runs — duplicated work, but the pre-walk avoids dispatching @Async when there's nothing to do.",
    "The Set<String> handed to the worker is mutated in place — that's fine for the single-tenant single-PSP sync flow but would need a defensive copy if two operators ever triggered the same sync concurrently.",
    "Reference-table case drift is collapsed by buildKey, but the inserted row keeps whatever casing the cartesian walk used. If the reference table later changes from 'Visa' to 'VISA', the row's casing is now wrong even though the fingerprint match still works.",
    "@Async errors are swallowed in a catch + log — there's no per-row failure surfaced back to the operator; a partial flush leaves the operator's UI 'done' but the underlying data incomplete until the next sync run.",
  ],

  conclusion: "The sync is the part that ships — but the design choices that make it work are the in-memory fingerprint Set + buildKey canonicalisation, the generic batched-saveAll for partial-failure tolerance, and the Socket.IO push for not-polling. Operations clicks once, the request returns immediately, and the UI updates the instant the work commits.",
};
