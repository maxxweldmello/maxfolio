import type { Task } from "../tasks.data";

export const taskStripeInstantPayout: Task = {
  taskId:    "task-stripe-instant-payout",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Stripe REST", "Stripe Connect", "Spring WebFlux", "Feign", "Kafka", "Spring AOP"],
  image:     "/tasks/stripe-instant-payout/hero.jpg",

  title: "Stripe Instant Payout — Request, Compliance Approval & Two-Leg Trigger",

  description: "Instant payout flow that straddles two services. Merchant requests through the business service (per-property fee compute + live-balance guard + pre-approval cap), compliance dispatches via email + SMS + dashboard, and the admin service fires the two-leg Stripe trigger directly against the Stripe REST surface. Three statuses across the request → approval → payout journey keep the state machine legible.",

  ideaPipeline: {
    steps: ["Business: request + fee + balance", "≤ cap → auto-approve", "> cap → compliance fan-out", "Admin: live-balance re-check", "Stripe: POST /payouts + POST /transfers"],
    caption: "Business side does the fee math, freezes it on the row, and dispatches by the per-property pre-approval cap. Above the cap, compliance gets email + SMS + a dashboard-notification row per role. Admin re-validates the live Stripe balance at approval time (money moves between request and approval), then fires two REST calls — instant payout on the merchant's connected account for the net, transfer from connected → platform for the fee. Three trigger statuses tell finance which leg failed.",
  },

  problemStatement: "Merchants want their money same-day. Stripe's instant Payout API lets us move funds from the connected acct_… to the merchant's debit card in seconds, but the platform takes a fee for that — which means a single 'instant payout' is actually TWO money movements (merchant's net + platform's fee), each of which can fail independently. We also can't auto-approve unbounded amounts (fraud + cash-flow exposure) or human-review every small request (compliance queue saturation), so the flow needs a configurable per-property pre-approval cap. The fee config itself is per-property (FIXED or PERCENTAGE), audited on every change, frozen onto the row at request time so a later config change can't silently reprice an in-flight request, and re-validated server-side at admin approval time because the balance moves between request and approval.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /business/account/create-instant-payout-request",
      caption: "02 · Request — merchant asks for money, fee is frozen onto the row before anything else",
      language: "http",
      code: `# One POST does the whole request path: duplicate-request guard, live
# Stripe balance fetch, per-property fee compute (FIXED / PERCENTAGE),
# pre-approval cap dispatch, and — for over-cap — the compliance fan-out.

curl -X POST https://api.kayana.io/business/account/create-instant-payout-request \\
  -H "Authorization: Bearer <business_jwt>" \\
  -H "username: manager@rivercafe.com" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":   "PROP-2201",
    "pspCode":      "STRIPE",
    "currencyCode": "GBP",
    "instantPayoutDetails": {
      "instantPayoutRequestedAmount": 480.00,
      "instantPayoutRemarks": [ { "reason": "Weekend restock" } ]
    }
  }'

# → ServiceResponseBean — status flips based on whether the amount ≤ cap
# (auto-approved) or > cap (routed to compliance and left PENDING).
{
  "status": true,
  "data": {
    "instantPayoutId":   "IPO-77321",
    "status":            "APPROVED",
    "amountAfterFee":    478.80,
    "feeAmount":         1.20,
    "stripeBalanceAtRequest": {
      "availableAmount": 5210.55,
      "currency":        "gbp"
    }
  }
}

# Over-cap example:
# { "status": true, "data": { "instantPayoutId": "IPO-77322", "status": "PENDING" } }
`,
    },
    {
      path: "com.kayana.service.impl.KayanaBusinessAccountService#createInstantPayoutRequest",
      caption: "03 · Business service — fee compute + live-balance guard + pre-approval dispatch",
      language: "java",
      code: `public ServiceResponseBean createInstantPayoutRequest(InstantPayoutRequestBean req,
                                                      String username,
                                                      ServiceResponseBean srb) {

    // 1 · Property + user guards.
    KayanaBusinessPropertyDetail property =
        propertyRepo.findByKbpdPropertyId(req.getPropertyId());
    if (property == null) { I18nUtils.setI18nMessage(srb, "noPropertyFound"); return srb; }
    KayanaBusinessUserMaster user = userRepo.findByKbumUsername(property.getKbpdUsername());
    if (user == null)     { I18nUtils.setI18nMessage(srb, "noUserFound");     return srb; }

    // 2 · This flow is Stripe-only — Nuvei/others branch elsewhere.
    Optional<KayanaBusinessPropertyPspMapping> mapping = pspMappingRepo
        .findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
            property.getKbpdPropertyId(), "STRIPE",
            req.getCurrencyCode(), GeneralStatusEnum.ACTIVE.getValue());
    if (mapping.isEmpty()) { I18nUtils.setI18nMessage(srb, "noStripeMappingFound"); return srb; }

    // 3 · Per-property fee config must exist (see stage 04). Frozen on
    //     the row so a later fee-config change can't reprice an in-flight request.
    KayanaBusinessSettingDetail settings =
        settingRepo.findByKbsdPropertyId(req.getPropertyId());
    if (settings == null || settings.getKbsdInstantPayoutFee() == null) {
        I18nUtils.setI18nMessage(srb, "instantPayoutFeeNotConfigured");
        return srb;
    }

    // 4 · Live Stripe balance — refuses the request if the merchant's
    //     available amount is less than what they're asking for.
    StripeBalanceBean stripeBalance = fetchStripeBalances(
        req.getPropertyId(), req.getPspCode(), req.getCurrencyCode());
    if (stripeBalance == null) { I18nUtils.setI18nMessage(srb, "errorFetchingStripeBalances"); return srb; }
    BigDecimal availableAmount = stripeBalance.getAvailableAmount();

    // 5 · Fee compute (FIXED or PERCENTAGE) — frozen onto the row alongside
    //     the requested amount + the balance snapshot at request time.
    InstantPayoutDetailsBean details = req.getInstantPayoutDetails() != null
        ? req.getInstantPayoutDetails() : new InstantPayoutDetailsBean();
    computeAndFreezeFee(details, settings.getKbsdInstantPayoutFee());
    details.setStripeBalanceAtRequest(stripeBalance);

    // 6 · Pre-approval cap — the per-property InstantPayoutLimit row.
    //     ≤ cap → PENDING flips straight to APPROVED (skips compliance).
    //     > cap → stays PENDING and dispatches compliance email + SMS +
    //             a dashboard-notification row per role.
    boolean autoApprove = details.getInstantPayoutRequestedAmount()
                                 .compareTo(preApprovalCap(property)) <= 0;

    KayanaBusinessInstantPayoutDetails row = buildRow(req, details,
        autoApprove ? InstantPayoutStatusEnum.APPROVED : InstantPayoutStatusEnum.PENDING);
    instantPayoutRepo.save(row);

    if (!autoApprove) {
        complianceFanOut.email(user, property, details);
        complianceFanOut.sms(user, property, details);
        dashboardNotifications.publishPerRole(property, "INSTANT_PAYOUT_REVIEW", details);
    }

    srb.setStatus(true);
    srb.setData(Map.of(
        "instantPayoutId",       row.getKbipdInstantPayoutId(),
        "status",                row.getKbipdStatus(),
        "amountAfterFee",        details.getInstantPayoutAmountAfterFee(),
        "feeAmount",             details.getInstantPayoutFeeAmount(),
        "stripeBalanceAtRequest",stripeBalance));
    return srb;
}
`,
    },
    {
      path: "POST /admin/settings/update-instant-payout-fee  &  /admin/extra-detail/save-instant-payout-limit",
      caption: "04 · Fee config + pre-approval cap — the two knobs the whole flow reads",
      language: "http",
      code: `# The per-property fee (FIXED / PERCENTAGE) is what stage 03 freezes
# onto the row. The pre-approval limit is what decides auto-approve vs
# compliance. Both are audit-logged under @LogActivity.

# ── fee config (per property) ────────────────────────────────────────
curl -X POST "https://api.kayana.io/admin/settings/update-instant-payout-fee\\
?notify=true" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId": "PROP-2201",
    "settingKey": "INSTANT_PAYOUT_FEE",
    "settingValue": {
      "type":  "PERCENTAGE",   // or "FIXED"
      "value": 0.25
    }
  }'

# ── pre-approval cap (per property) ──────────────────────────────────
curl -X POST https://api.kayana.io/admin/extra-detail/save-instant-payout-limit \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":     "PROP-2201",
    "limitAmount":    500.00,
    "currencyCode":   "GBP"
  }'

# ── read ────────────────────────────────────────────────────────────
curl -X GET https://api.kayana.io/admin/extra-detail/fetch-instant-payout-limits \\
  -H "Authorization: Bearer <admin_jwt>"
`,
    },
    {
      path: "kayana_business.kayana_business_instant_payout_details",
      caption: "05 · Where the request lives — one row per request, status walks through the state machine",
      language: "sql",
      code: `-- One row per request, upserted through the whole lifecycle.
-- kbipd_instant_payout_details is a jsonb blob (InstantPayoutDetailsBean)
-- so amount, frozen fee, remarks, and both Stripe reference IDs live
-- next to each other on one row.
CREATE TABLE kayana_business.kayana_business_instant_payout_details (
  kbipd_seq_id                 BIGSERIAL PRIMARY KEY,
  kbipd_instant_payout_id      VARCHAR(48),
  kbipd_property_id            VARCHAR(64),
  kbipd_psp_code               VARCHAR(24),   -- STRIPE
  kbipd_currency_code          VARCHAR(8),
  kbipd_instant_payout_details JSONB,         -- see below
  kbipd_status                 VARCHAR(24),   -- InstantPayoutStatusEnum
  kbipd_created_by             VARCHAR(80),
  kbipd_created_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kbipd_updated_by             VARCHAR(80),
  kbipd_updated_date           TIMESTAMPTZ
);

-- Status enum walked by the flow:
--   PENDING            ← created (auto-approved requests skip straight to APPROVED)
--   REJECTED           ← rejected by compliance in stage 06
--   APPROVED           ← ready to be triggered in stage 07
--   TRANSFER_FAILURE   ← payout leg succeeded, fee-transfer leg failed
--   SUCCESS            ← both legs succeeded
--   FAILURE            ← payout leg itself failed

-- Row shape after stage 03's request lands:
INSERT INTO kayana_business.kayana_business_instant_payout_details
  (kbipd_instant_payout_id, kbipd_property_id, kbipd_psp_code, kbipd_currency_code,
   kbipd_status, kbipd_instant_payout_details, kbipd_created_by)
VALUES
  ('IPO-77321', 'PROP-2201', 'STRIPE', 'GBP', 'APPROVED',
   '{ "instantPayoutRequestedAmount": 480.00,
      "instantPayoutFee":             { "type": "PERCENTAGE", "value": 0.25 },
      "instantPayoutFeeAmount":       1.20,
      "instantPayoutAmountAfterFee":  478.80,
      "instantPayoutRemarks": [ { "reason": "Weekend restock" } ],
      "stripeBalanceAtRequest":       { "availableAmount": 5210.55, "currency": "gbp" } }'::jsonb,
   'KAYANA-BUSINESS-SERVICE');
`,
    },
    {
      path: "PUT /admin/account/update-instant-payout-request",
      caption: "06 · Compliance decision — approve or reject an over-cap PENDING request",
      language: "http",
      code: `# Wrapped in @LogActivity(UPDATE_INSTANT_PAYOUT_REQUEST) — approver +
# reason land on the audit trail with the whole request context.

# ── APPROVE ─────────────────────────────────────────────────────────
curl -X PUT https://api.kayana.io/admin/account/update-instant-payout-request \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "instantPayoutId": "IPO-77322",
    "propertyId":      "PROP-2201",
    "pspCode":         "STRIPE",
    "currencyCode":    "GBP",
    "status":          "APPROVED",
    "instantPayoutDetails": {
      "instantPayoutRemarks": [
        { "reason": "Amount + reason verified. Merchant good standing." }
      ]
    }
  }'

# ── REJECT ──────────────────────────────────────────────────────────
curl -X PUT https://api.kayana.io/admin/account/update-instant-payout-request \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "instantPayoutId": "IPO-77323",
    "propertyId":      "PROP-2201",
    "pspCode":         "STRIPE",
    "currencyCode":    "GBP",
    "status":          "REJECTED",
    "instantPayoutDetails": {
      "instantPayoutRemarks": [
        { "reason": "Missing supporting documents — please resubmit." }
      ]
    }
  }'
`,
    },
    {
      path: "POST /admin/account/trigger-instant-payout-request",
      caption: "07 · Trigger — the two-leg Stripe fire (payout + fee transfer)",
      language: "http",
      code: `# Runs the actual money movement for an APPROVED row. Refuses if the
# row is already in a finalized state (SUCCESS). Response carries the
# HTML-formatted diff summary that lands on the audit row (stage 10).

curl -X POST https://api.kayana.io/admin/account/trigger-instant-payout-request \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "instantPayoutId": "IPO-77322",
    "propertyId":      "PROP-2201",
    "pspCode":         "STRIPE",
    "currencyCode":    "GBP"
  }'

# → ServiceResponseBean
{
  "status":  true,
  "message": "Instant Payout Completed Successfully",
  "propertyId": "PROP-2201",
  "description": "Instant Payout Trigger Summary
    <br><b>Instant Payout ID:</b> IPO-77322
    <br><b>Net Payout Amount:</b> £478.80
    <br><b>Fee Amount:</b> £1.20
    <br><b>Trigger Status:</b> SUCCESS
    <br><b>Remark:</b> Instant Payout Completed Successfully"
}

# Partial failure shape — merchant's money moved, platform fee didn't:
# {
#   "status":  false,
#   "message": "Fee transfer failed: insufficient funds",
#   "description": "...<b>Trigger Status:</b> TRANSFER FAILURE
#                   <br><b>Remark:</b> Fee Transfer Failed
#                   <br><b>Failure Reason:</b> insufficient funds"
# }
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminAccountService#triggerInstantPayoutFromRecord",
      caption: "08 · Admin trigger — load row, guard finalized states, delegate the two-leg fire",
      language: "java",
      code: `@LogActivity(status = ActivityLogStatusEnum.INSTANT_PAYOUT_TRIGGERED, username = "username")
public ServiceResponseBean triggerInstantPayoutFromRecord(
        InstantPayoutRequestBean req, String username, ServiceResponseBean srb) {

    // 1 · Row must exist and must not already be finalized.
    KayanaBusinessInstantPayoutDetails row = instantPayoutRepo
        .findByKbipdInstantPayoutId(req.getInstantPayoutId())
        .orElseThrow(() -> new IllegalStateException("No Instant Payout found with the given ID."));
    if (InstantPayoutStatusEnum.SUCCESS.getValue().equalsIgnoreCase(row.getKbipdStatus())) {
        srb.setMessage("This instant payout is already finalized (" + row.getKbipdStatus() + ").");
        return srb;
    }

    // 2 · Resolve property + Stripe connected-account context.
    KayanaBusinessPropertyDetail property =
        propertyRepo.findByKbpdPropertyId(row.getKbipdPropertyId());
    KayanaBusinessPropertyPspMapping mapping = pspMappingRepo
        .findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
            property.getKbpdPropertyId(), row.getKbipdPspCode(),
            row.getKbipdCurrencyCode(), GeneralStatusEnum.ACTIVE.getValue())
        .orElseThrow(() -> new IllegalStateException("No PSP mapping found for this property."));

    String stripeAccountId = objectMapper
        .convertValue(mapping.getKbppmAccountInfo(), JsonNode.class)
        .path("account_id").asText();

    // 3 · Rehydrate the InstantPayoutDetailsBean from the jsonb blob.
    InstantPayoutDetailsBean details = rehydrateDetails(row.getKbipdInstantPayoutDetails());
    BigDecimal netAmount = details.getInstantPayoutAmountAfterFee();
    BigDecimal feeAmount = details.getInstantPayoutFeeAmount();
    if (netAmount == null || netAmount.compareTo(BigDecimal.ZERO) <= 0) {
        srb.setMessage("Invalid payout amount. Cannot proceed.");
        return srb;
    }

    // 4 · Two-leg Stripe fire (stage 09). Returns trigger_status +
    //     payout_id + transfer_id regardless of which leg failed.
    ServiceResponseBean stripeResp = executeInstantPayoutWithFeeTransfer(
        property, stripeAccountId, row.getKbipdCurrencyCode(), netAmount, feeAmount);

    Map<String,Object> result = (Map<String,Object>) stripeResp.getData();
    String triggerStatus = (String) result.getOrDefault("trigger_status", "FAILURE");
    String payoutId      = (String) result.get("payout_id");
    String transferId    = (String) result.get("transfer_id");

    // 5 · Append a remark per outcome so the audit trail is legible.
    List<InstantPayoutRemark> remarks =
        details.getInstantPayoutRemarks() != null
            ? details.getInstantPayoutRemarks() : new ArrayList<>();
    InstantPayoutRemark remark = new InstantPayoutRemark();
    remark.setStatus(triggerStatus);
    remark.setCreatedDate(Calendar.getInstance());
    remark.setReason(switch (triggerStatus) {
        case "SUCCESS"          -> "Instant Payout Completed Successfully";
        case "TRANSFER FAILURE" -> "Fee Transfer Failed";
        default                 -> "Instant Payout Failed";
    });
    remarks.add(remark);
    details.setInstantPayoutRemarks(remarks);
    details.setPayoutReferenceId(payoutId);
    details.setFeeTransferReferenceId(transferId);

    // 6 · Persist final state + build HTML description for the audit row.
    row.setKbipdStatus(triggerStatus);
    row.setKbipdInstantPayoutDetails(details);
    row.setKbipdUpdatedBy(applicationName);
    row.setKbipdUpdatedDate(Calendar.getInstance());
    instantPayoutRepo.save(row);

    srb.setPropertyId(row.getKbipdPropertyId());
    srb.setDescription(buildTriggerDescription(row, netAmount, feeAmount, remark, stripeResp));
    srb.setStatus(stripeResp.getStatus());
    srb.setMessage(stripeResp.getMessage());
    return srb;
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminAccountService#executeInstantPayoutWithFeeTransfer",
      caption: "09 · Two-leg Stripe fire — POST /v1/payouts (instant) then POST /v1/transfers (fee)",
      language: "java",
      code: `private ServiceResponseBean executeInstantPayoutWithFeeTransfer(
        KayanaBusinessPropertyDetail property,
        String stripeAccountId,
        String currencyCode,
        BigDecimal netPayoutAmount,
        BigDecimal feeAmount) {

    Map<String,Object> resultMap = new HashMap<>();
    String triggerStatus = InstantPayoutStatusEnum.FAILURE.getValue();
    String payoutId = null, transferId = null;

    // 1 · Money is smallest-currency-unit on the wire — pence, not pounds.
    int payoutMinor = netPayoutAmount.multiply(BigDecimal.valueOf(100))
                                      .setScale(0, RoundingMode.HALF_UP).intValueExact();
    int feeMinor    = feeAmount.multiply(BigDecimal.valueOf(100))
                                .setScale(0, RoundingMode.HALF_UP).intValueExact();

    // 2 · Resolve the platform-side Stripe connected account for this
    //     currency — this is where the fee half of the movement lands.
    String platformAccountId = stripeIntegration
        .getMerchantAccountByPspCodeAndCurrency("STRIPE", currencyCode, new String[]{"account_id"})
        .path("account_id").asText();

    String descriptor = buildDescriptor(property);

    // 3 · LEG 1 — Stripe POST /v1/payouts (method=instant) on the
    //     merchant's own connected acct_. Moves NET to the merchant's
    //     debit card in seconds.
    String payoutBody = String.format(
        "{\\"amount\\":%d,\\"currency\\":\\"%s\\",\\"method\\":\\"instant\\",\\"statement_descriptor\\":\\"%s\\"}",
        payoutMinor, currencyCode.toLowerCase(), descriptor);

    ServiceResponseBean payoutResp = stripeIntegration.createPayout(
        property.getKbpdPropertyId(), "STRIPE", "INSTANT_PAYOUT_REQUEST",
        currencyCode, "instant", payoutBody);
    if (payoutResp == null || payoutResp.getData() == null)
        throw new RuntimeException("Payout API returned null response");
    Map<?,?> payoutMap = (Map<?,?>) payoutResp.getData();
    if (payoutMap.get("failure_message") != null)
        throw new RuntimeException("Instant payout failed: " + payoutMap.get("failure_message"));

    payoutId = String.valueOf(payoutMap.get("payout_id"));

    // 4 · LEG 2 — Stripe POST /v1/transfers moves the FEE from the
    //     merchant's acct_ back to the platform's acct_. Independent
    //     failure: TRANSFER_FAILURE state exists so finance can see the
    //     merchant got paid but the platform didn't collect its fee.
    String transferBody = String.format(
        "{\\"amount\\":%d,\\"currency\\":\\"%s\\",\\"method\\":\\"transfer\\",\\"destination\\":\\"%s\\","
        + "\\"description\\":\\"Instant Payout Fee Transfer\\",\\"source_account\\":\\"%s\\"}",
        feeMinor, currencyCode.toLowerCase(), platformAccountId, stripeAccountId);

    ServiceResponseBean transferResp = stripeIntegration.createPayout(
        property.getKbpdPropertyId(), "STRIPE", "INSTANT_PAYOUT_FEE_TRANSFER",
        currencyCode, "transfer", transferBody);
    Map<?,?> transferMap = (Map<?,?>) transferResp.getData();

    if (transferMap != null && transferMap.get("failure_message") == null) {
        transferId    = String.valueOf(transferMap.get("transfer_id"));
        triggerStatus = InstantPayoutStatusEnum.SUCCESS.getValue();          // both legs OK
    } else {
        triggerStatus = InstantPayoutStatusEnum.TRANSFER_FAILURE.getValue(); // leg 1 OK, leg 2 not
    }

    resultMap.put("trigger_status", triggerStatus);
    resultMap.put("payout_id",       payoutId);
    resultMap.put("transfer_id",     transferId);

    ServiceResponseBean out = new ServiceResponseBean();
    out.setStatus(triggerStatus.equals(InstantPayoutStatusEnum.SUCCESS.getValue()));
    out.setData(resultMap);
    return out;
}
`,
    },
    {
      path: "GET /admin/account/fetch-instant-payout-request  +  Audit trail",
      caption: "10 · Ops screen — read every request + every finalized audit row",
      language: "http",
      code: `# Ops queue read — every instant payout request across the platform,
# scoped by propertyId when set.
curl -X GET "https://api.kayana.io/admin/account/fetch-instant-payout-request\\
?property_id=PROP-2201" \\
  -H "Authorization: Bearer <admin_jwt>"

# Response carries the full jsonb blob per row: requested amount, frozen
# fee, remarks (audit narrative from every state change), Stripe balance
# snapshot at request time, and both Stripe reference IDs when triggered.

# ─── Audit trail written by this flow ────────────────────────────────
# Each mutation on this flow is wrapped in @LogActivity (see task-audit):
#
#   UPDATE_INSTANT_PAYOUT_FEE           ← stage 04, per-property fee change
#   SAVE_INSTANT_PAYOUT_LIMIT           ← stage 04, per-property cap change
#   CREATE_INSTANT_PAYOUT_REQUEST       ← stage 03, request lands (auto/pending)
#   UPDATE_INSTANT_PAYOUT_REQUEST       ← stage 06, compliance approve / reject
#   INSTANT_PAYOUT_TRIGGERED            ← stage 07, two-leg fire
#
# And when the trigger fails, a second row is written directly for the
# failure — so an operator can see SUCCESS attempts and FAILURE attempts
# on the same audit ledger without cross-referencing state changes:
#
#   kald_log_activity    = "INSTANT_PAYOUT_TRIGGERED"
#   kald_username        = "ops@kayana.io"
#   kald_property_id     = "PROP-2201"
#   kald_log_description = "Instant Payout Trigger Summary
#                           <br><b>Instant Payout ID:</b> IPO-77322
#                           <br><b>Net Payout Amount:</b> £478.80
#                           <br><b>Fee Amount:</b> £1.20
#                           <br><b>Trigger Status:</b> TRANSFER FAILURE
#                           <br><b>Remark:</b> Fee Transfer Failed
#                           <br><b>Failure Reason:</b> insufficient funds"
`,
    },
  ],

  keyInsight: "The whole flow is structured around three failure planes that finance needs to tell apart. Plane one: 'can the merchant even ask?' — answered by the per-property fee config + live-balance guard at request time. Plane two: 'should we let this go through?' — answered by the pre-approval cap, with a real re-check of the live balance at admin approval because money moves between request and approval. Plane three: 'did the money actually land?' — answered by the two-leg trigger and the three trigger statuses (SUCCESS / FAILURE / TRANSFER_FAILURE). The fee being frozen onto the row at request time is what makes the whole thing auditable — a later fee-config change can't silently reprice an in-flight request, so finance can always tell what the merchant agreed to.",

  requestTrace: [
    { phase: "REQUEST",         detail: "Merchant POST /business/account/instant-payout/request → createInstantPayoutRequest. Guards property + user + (property, STRIPE, currency, ACTIVE) mapping + fee config presence." },
    { phase: "LIVE-BALANCE",    detail: "fetchStripeBalances dispatches a BALANCE action against the Stripe integration; under the hood Stripe Balance.retrieve on the connected acct_…; available is the field the guard uses." },
    { phase: "FEE-FREEZE",      detail: "Fee config JSON ({ type: FIXED|PERCENTAGE, value }) read, fee + net + balance snapshot computed and frozen onto kbipd_instant_payout_details. A later fee-config change can't reprice this row." },
    { phase: "DISPATCH",        detail: "≤ kbsdInstantPayoutPreapprovedValue → APPROVED + triggerInstantPayout inline. > cap → PENDING + compliance fan-out: email + SMS to every active admin in the configured role list + one KayanaAdminDashboardNotification row per role." },
    { phase: "ADMIN-APPROVE",   detail: "POST /admin/instant-payout/update with status=APPROVED → updateInstantPayoutRequest. Refuses to mutate SUCCESS rows; parses the existing details bean defensively (Map / String / typed); appends typed remark; re-reads the LIVE balance; CANCELs + Kafka-notifies on shortfall." },
    { phase: "TRIGGER",         detail: "triggerInstantPayoutFromRecord resolves the connected acct_… from the PSP mapping, pulls frozen netAmount + feeAmount, calls executeInstantPayoutWithFeeTransfer." },
    { phase: "LEG-1-PAYOUT",    detail: "Admin dispatches an INSTANT_PAYOUT_REQUEST action; under the hood Stripe POST /v1/payouts with Stripe-Account=acct_… and method=instant. Failure → triggerStatus=FAILURE." },
    { phase: "LEG-2-TRANSFER",  detail: "Platform acct_… resolved via getMerchantAccountByPspCodeAndCurrency. Admin dispatches an INSTANT_PAYOUT_FEE_TRANSFER action; under the hood Stripe POST /v1/transfers with destination=platform + Stripe-Account=connected. Failure → triggerStatus=TRANSFER_FAILURE." },
    { phase: "AUDIT",           detail: "SUCCESS path runs under @LogActivity (INSTANT_PAYOUT_TRIGGERED — see [[task-audit]]). Failure path writes an explicit kayana_activity_log_details row because @LogActivity only fires on serviceResponseBean.status=TRUE." },
    { phase: "FEE-CRUD",        detail: "POST /admin/setting/instant-payout-fee/update → updateInstantPayoutFee. Validates type + parseable BigDecimal, writes new FeeTypeBean to kbsdInstantPayoutFee, and only if the value actually changed: creates kayana_business_fee_history row + (optionally) Kafka-notifies the merchant." },
  ],

  constraintsLimitations: [
    "Two-leg execution means a partial-failure window exists by design: the payout leg can succeed and the fee leg fail (TRANSFER_FAILURE), leaving the platform short the fee until a finance retry. There is no transactional 'both-or-neither' available on Stripe's REST surface.",
    "The pre-approval cap is per-property only; a malicious merchant who fragments one large payout into many sub-cap requests can still drain instant balance without compliance review.",
    "Live balance is read from Stripe on every request and re-read on every admin approval — at finance-grid scale that's a Stripe API call per row. A short-lived per-property cache would help but is not yet wired.",
    "Statement descriptor is sanitised + capped at 22 chars; merchants with names that strip to blank fall back to 'BUSINESS PAYOUT', which is generic on the merchant's debit card statement.",
    "The instant payout fee is currently FIXED or PERCENTAGE only — tiered fees (5% on the first 1000, 2% after) aren't representable in the JSON schema and would need a config-shape change.",
  ],

  conclusion: "Two services, two Stripe REST calls, one frozen fee snapshot, and a per-property pre-approval cap that auto-routes by amount. The split is what makes the flow shippable: business owns the merchant-facing experience and the fee math, admin owns the human review, the live-balance re-check, and the two-leg Stripe fire. Three trigger statuses give finance the resolution they need to reconcile partial failures without re-running anything.",
};
