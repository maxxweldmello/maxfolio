import type { Task } from "../tasks.data";

export const taskTransferFunds: Task = {
  taskId:    "task-transfer-funds",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Stripe SDK", "Spring @Scheduled", "Spring AOP", "PostgreSQL"],
  image:     "/tasks/transfer-funds/hero.jpg",

  title: "Cross-Service Transfer Funds — Admin Trigger, Batch Scheduler, Webhook Reconciliation",

  description: "End-to-end transfer-funds flow that pulls money from a merchant's connected Stripe account back to the platform — either as a single immediate Stripe SDK Charge or as a recurring schedule. Three services (admin → batch → webhook) coordinate the trigger, the batch scheduler, and the webhook reconciliation; four statuses track the row through every transition.",

  ideaPipeline: {
    steps: ["Admin: create + INITIATED", "Batch: pick due + live-balance guard + Charge", "Stripe charge.succeeded", "Webhook: per-row flip", "Parent recount → SUCCESS or PARTIAL"],
    caption: "Three services own three slices. Admin creates the parent + occurrence rows and fires the Stripe Charge inline for immediates. Batch's @Scheduled job picks SCHEDULED rows whose date came due, reads the live Stripe balance first (skip on shortfall → INSUFFICIENT_BALANCE), fires the Charge with metadata.transferId, and commits the row to INITIATED in a REQUIRES_NEW transaction so the webhook always finds a fresh status. Webhook matches by metadata.transferId, flips the row, recounts remaining SCHEDULED rows for the parent — > 0 → PARTIALLY_SUCCESSFUL, == 0 → SUCCESSFUL.",
  },

  problemStatement: "Operations needed a way to deduct platform charges (commission, fees, chargebacks) from a merchant's connected Stripe account on demand — but also as a schedule, e.g. 'pull £150 from this property every Monday for the next 12 weeks'. A single immediate Stripe SDK call from the admin service works for the immediate case, but the scheduled case can't live on the request thread (the operator would be waiting weeks). And whichever path fires the Charge, the eventual outcome (succeeded / failed / pending → captured) only lands as a Stripe webhook, not as a synchronous response — so the per-occurrence and parent-transfer statuses have to be reconciled out-of-band. We needed three services that each own their slice cleanly: admin creates the record + handles the immediate path, batch runs the per-occurrence Stripe Charges when their scheduled date comes due, and webhook converts Stripe's charge.succeeded events into row status updates.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [

    // ─── 2 · Admin trigger endpoint ─────────────────────────────────────
    {
      path: "POST /admin/transfer-funds",
      caption: "02 · One endpoint, two paths — the request body validates the same way for both. is_scheduled=false fires the Stripe Charge inline and stamps the parent row INITIATED; is_scheduled=true skips the Charge, writes the parent row + N occurrence rows in SCHEDULED status, and hands the rest to the batch scheduler (stage 05).",
      language: "http",
      code: `# Immediate (one-shot) — pulls funds now
curl -X POST https://api.kayana.io/admin/transfer-funds \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "Content-Type: application/json" \\
  --json '{
    "property_id": "PROP-2201",
    "amount": 150.00,
    "description": "Commission — Nov 2025",
    "is_scheduled": false,
    "scheduled_frequency_count": 0,
    "username": "ops@kayana.io",
    "psp": "STRIPE"
  }'

# → 200 ServiceResponseBean
{
  "status": true,
  "message": null,
  "propertyId": "PROP-2201"
}

# Recurring — 12 weekly occurrences starting 2025-12-01
curl -X POST https://api.kayana.io/admin/transfer-funds \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "Content-Type: application/json" \\
  --json '{
    "property_id": "PROP-2201",
    "amount": 150.00,
    "description": "Weekly Kayana charges",
    "is_scheduled": true,
    "scheduled_date": "01-12-2025",
    "schedule_frequency": "WEEKLY",
    "scheduled_frequency_count": 12,
    "username": "ops@kayana.io",
    "psp": "STRIPE"
  }'

# → 200  { "status": true }   — 1 parent row (SCHEDULED) + 12 occurrence rows`,
    },

    // ─── 3 · Admin service body — immediate path ────────────────────────
    {
      path: "com.kayana.service.impl.KayanaAdminTransferFundsService#transferFundsBetweenStripeAccounts",
      caption: "03 · Two branches: SCHEDULED writes parent+occurrences and returns; immediate fetches the psp-scoped Stripe secret via feign, sets Stripe.apiKey per-tenant, and fires Charge.create with metadata.transferId — that transferId is what the webhook (stage 09) later looks up.",
      language: "java",
      code: `@Override
public ServiceResponseBean transferFundsBetweenStripeAccounts(
        TransferFundRequestBean req, ServiceResponseBean srb) {
    try {
        String psp = req.getPsp();
        var property = propertyRepo.findByKbpdPropertyId(req.getPropertyId());
        if (property == null) { srb.setMessage("No property details found."); return srb; }
        String currencySymbol = KayanaCurrencySymbolUtils.getSymbol(property.getKbpdCurrencyCode());

        // account_id lives in psp_mapping.jsonb (keyed by property + psp + currency + ACTIVE)
        var mapping = pspMappingRepo.findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
                property.getKbpdPropertyId(), psp, property.getKbpdCurrencyCode(),
                GeneralStatusEnum.ACTIVE.getValue());
        String accountInfo = mapping
                .map(m -> objectMapper.valueToTree(m.getKbppmAccountInfo()).path("account_id").asText())
                .orElse(null);
        if (accountInfo == null) { srb.setMessage("No Balance Account id found for this property."); return srb; }

        String transferId  = KayanaCommonConstants.INSTANCE.TRANSFER_PREFIX
                              .concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());
        String scheduledId = KayanaCommonConstants.INSTANCE.SCHEDULED_PREFIX
                              .concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());
        var kayanaAcc = adminAccountsRepo.findByKaacCurrencyCode(property.getKbpdCurrencyCode());

        if (Boolean.TRUE.equals(req.getIsScheduled())) {
            // SCHEDULED path — parent row + N occurrences, no Stripe call
            createTransferObjects(transferId, req, accountInfo,
                    kayanaAcc.getKaacBalanceAccountId(),
                    Optional.ofNullable(req.getUsername()).orElse(""), currencySymbol);
            createScheduledTransferFunds(req, transferId, null);
        } else {
            // IMMEDIATE path — Stripe Charge inline
            ObjectNode secretJson = feign.getMerchantSecretByPspCodeAndCurrency(
                    psp, property.getKbpdCurrencyCode(), new String[]{"secret_key"});
            String credentials = secretJson.get("secret_key").get(0).asText();

            if (PspProviderEnum.STRIPE.getValue().equalsIgnoreCase(psp)) {
                Stripe.apiKey = credentials;

                Map<String, String> metadata = new HashMap<>();
                metadata.put("type",        "Deduction");
                metadata.put("business",    property.getKbpdPropertyTradingName());
                metadata.put("transferId",  transferId);              // ← keyed by the webhook
                metadata.put("propertyId",  property.getKbpdPropertyId());
                metadata.put("description", req.getDescription());

                ChargeCreateParams params = ChargeCreateParams.builder()
                        .setAmount(BigDecimal.valueOf(req.getAmount())
                                .multiply(BigDecimal.valueOf(100)).longValue())  // Stripe minor units
                        .setCurrency(property.getKbpdCurrencyCode())
                        .setSource(accountInfo)                                   // connected account_id
                        .setMetadata(metadata)
                        .build();

                Charge.create(params);                                            // ← the actual pull
                createTransferObjects(transferId, req, accountInfo,
                        kayanaAcc.getKaacBalanceAccountId(),
                        Optional.ofNullable(req.getUsername()).orElse(""), currencySymbol);
                createScheduledTransferFunds(req, transferId, scheduledId);
            }
        }
        srb.setStatus(true);
    } catch (Exception e) {
        log.error("Exception occurred :: {}", e);
        srb.setMessage(e.getLocalizedMessage());
    }
    return srb;
}`,
    },

    // ─── 4 · Row creation + occurrence layout ───────────────────────────
    {
      path: "com.kayana.service.impl.KayanaAdminTransferFundsService#createTransferObjects + #createScheduledTransferFunds",
      caption: "04 · Parent row lands in kayana_admin_transfer_funds with status = SCHEDULED (recurring) or INITIATED (immediate). createScheduledTransferFunds spreads N rows using scheduledDateTime(count, startDate, frequency) — that helper walks DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY with a Calendar.add call each iteration.",
      language: "java",
      code: `private void createTransferObjects(String transferId, TransferFundRequestBean req,
        String balanceAccountId, String companyBalanceAccount,
        String username, String currencySymbol) {

    KayanaAdminTransferFunds row = new KayanaAdminTransferFunds();
    row.setKatfPropertyId(req.getPropertyId());
    row.setKatfAmount(req.getAmount());
    row.setKatfDescription(req.getDescription());
    row.setKatfSourceAccountId(balanceAccountId);              // connected account
    row.setKatfDestinationAccountId(companyBalanceAccount);    // Kayana account (per currency)
    row.setKatfTransferId(transferId);
    row.setKatfTransferStatus(req.getIsScheduled()
            ? TransferFundStatusEnum.SCHEDULED.getValue()
            : TransferFundStatusEnum.INITIATED.getValue());
    row.setKatfCreatedBy(applicationName);
    row.setKatfCreatedDate(Calendar.getInstance());
    row.setKatfIsScheduled(req.getIsScheduled());
    row.setKatfPspCode(req.getPsp());
    transferRepo.save(row);

    // activity log line — "Transfer fund of £150.00 via STRIPE created successfully"
    String desc = String.format("Transfer fund of %s%s via %s created successfully",
            currencySymbol, req.getAmount(), req.getPsp());
    generateLogsForTransferSchedules(
            LogDetailsBean.of(username, req.getPropertyId(),
                    ActivityLogStatusEnum.TRANSFER_FUND_CREATED.getValue(),
                    applicationName, desc));
}

private void createScheduledTransferFunds(TransferFundRequestBean req,
                                          String transferId, String scheduleId) {
    int count = req.getScheduledFrequencyCount() == 0 ? 1 : req.getScheduledFrequencyCount();

    var rows = IntStream.range(0, count).mapToObj(i -> {
        var occ = new KayanaAdminScheduledTransferFundsDetails();
        String sid = KayanaCommonConstants.INSTANCE.SCHEDULED_PREFIX
                       .concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());

        occ.setKastfdTransferId(transferId);
        occ.setKastfdScheduledId(StringUtils.isBlank(scheduleId) ? sid : scheduleId);
        occ.setKastfdStatus(StringUtils.isBlank(scheduleId)
                ? TransferFundStatusEnum.SCHEDULED.getValue()
                : TransferFundStatusEnum.INITIATED.getValue());
        occ.setKastfdCreatedBy(applicationName);
        occ.setKastfdCreatedDate(Calendar.getInstance());

        if (req.getScheduledDate() != null) {
            String startAt = req.getScheduledDate() + " 00:00:00";
            occ.setKastfdScheduledDate(i == 0
                ? parseCalendar(startAt)
                : scheduledDateTime(i, startAt, req.getScheduleFrequency()));
        } else {
            occ.setKastfdTransferDate(Calendar.getInstance());
            occ.setKastfdScheduledDate(Calendar.getInstance());
        }
        return occ;
    }).collect(Collectors.toList());

    scheduledRepo.saveAll(rows);
}

// Frequency walk — one Calendar.add per iteration
private Calendar scheduledDateTime(int count, String scheduledDate, String frequency) {
    Calendar c = Calendar.getInstance();
    c.setTime(SDF_DD_MM_YYYY_HH_MM_SS.parse(scheduledDate));
    switch (frequency.toUpperCase()) {
        case "DAILY"     -> c.add(Calendar.DATE,  count);
        case "WEEKLY"    -> c.add(Calendar.DATE,  count * 7);
        case "MONTHLY"   -> c.add(Calendar.MONTH, count);
        case "QUARTERLY" -> c.add(Calendar.MONTH, count * 3);
        case "YEARLY"    -> c.add(Calendar.YEAR,  count);
    }
    return c;
}`,
    },

    // ─── 5 · Batch scheduler (cron) ─────────────────────────────────────
    {
      path: "com.kayana.scheduler.KayanaAdminTransferFundScheduler#adminTransferFundScheduler   (kayana-batch-processor)",
      caption: "05 · Cron cadence lives in config (`daily.transfer.funds.scheduler.cron`). Every tick pulls the SCHEDULED occurrences whose date came due, joins each back to its parent transfer + property, then per-row: reads the live Stripe balance, guards for shortfall, and (only if enough) fires the Charge. The rest of this stage — INSUFFICIENT_BALANCE and INITIATED — is on the next line.",
      language: "java",
      code: `@Scheduled(cron = "\${daily.transfer.funds.scheduler.cron}")
public void adminTransferFundScheduler() {
    log.info("Started Admin transfer fund scheduler");

    // findPropertiesToDoDeduction: SCHEDULED rows whose kastfd_scheduled_date <= now()
    List<KayanaAdminScheduledTransferFundsDetails> dueOccurrences =
            scheduledRepo.findPropertiesToDoDeduction(TransferFundStatusEnum.SCHEDULED.getValue());
    if (CollectionUtils.isEmpty(dueOccurrences)) return;

    // one round-trip each for the two joins
    Map<String, KayanaAdminTransferFunds> transferByTransferId =
            transferRepo.findByKatfTransferIdIn(
                    dueOccurrences.stream().map(KayanaAdminScheduledTransferFundsDetails::getKastfdTransferId).toList()
            ).stream().collect(Collectors.toMap(KayanaAdminTransferFunds::getKatfTransferId, Function.identity()));

    Map<String, KayanaBusinessPropertyDetail> propertyById =
            propertyRepo.findByKbpdPropertyIdIn(
                    transferByTransferId.values().stream().map(KayanaAdminTransferFunds::getKatfPropertyId).collect(Collectors.toSet())
            ).stream().collect(Collectors.toMap(KayanaBusinessPropertyDetail::getKbpdPropertyId, Function.identity()));

    for (var occ : dueOccurrences) {
        try {
            var transfer   = transferByTransferId.get(occ.getKastfdTransferId());
            var property   = propertyById.get(transfer.getKatfPropertyId());
            String psp     = transfer.getKatfPspCode();

            // account_id from psp_mapping.jsonb (same lookup as admin service)
            String accountInfo = pspMappingRepo
                    .findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
                            property.getKbpdPropertyId(), psp, property.getKbpdCurrencyCode(),
                            GeneralStatusEnum.ACTIVE.getValue())
                    .map(m -> objectMapper.valueToTree(m.getKbppmAccountInfo()).path("account_id").asText())
                    .orElse(null);
            if (accountInfo == null) continue;

            // per-tenant Stripe secret + live balance (single fan-out via feign to the payments layer)
            ObjectNode secret = feign.getMerchantSecretByPspCodeAndCurrency(
                    psp, property.getKbpdCurrencyCode(), new String[]{"secret_key"});
            String credentials = secret.get("secret_key").get(0).asText();

            ServiceResponseBean balResp = feign.account(property.getKbpdPropertyId(), psp, "BALANCE",
                    property.getKbpdCurrencyCode(), objectMapper.writeValueAsString(new ServiceResponseBean()));
            JsonNode balanceData = objectMapper.valueToTree(balResp.getData());

            // Stripe: /v1/balance → available[0].amount (minor units)
            BigDecimal available = PspProviderEnum.STRIPE.getValue().equalsIgnoreCase(psp)
                    ? BigDecimal.valueOf(balanceData.path("available").path(0).path("amount").asLong(0))
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal need = BigDecimal.valueOf(transfer.getKatfAmount());

            // 1) balance guard — flip to INSUFFICIENT_BALANCE, no Stripe call
            if (available.compareTo(need) < 0) {
                log.warn("Insufficient balance for property {} via {}. Available: {}, Required: {}",
                        property.getKbpdPropertyId(), psp, available, need);
                occ.setKastfdStatus(TransferFundStatusEnum.INSUFFICIENT_BALANCE.getValue());
                scheduledRepo.save(occ);
                continue;
            }

            // 2) fire the Stripe Charge with metadata.transferId (webhook looks this up)
            Stripe.apiKey = credentials;
            Map<String, String> metadata = Map.of(
                    "type",        "Deduction",
                    "business",    property.getKbpdPropertyTradingName(),
                    "transferId",  transfer.getKatfTransferId(),
                    "propertyId",  property.getKbpdPropertyId(),
                    "description", transfer.getKatfDescription());
            ChargeCreateParams params = ChargeCreateParams.builder()
                    .setAmount(need.multiply(BigDecimal.valueOf(100)).longValue())
                    .setCurrency(property.getKbpdCurrencyCode())
                    .setSource(accountInfo)
                    .setMetadata(metadata)
                    .build();
            Charge.create(params);

            // 3) commit the row status flip in ITS OWN transaction — webhook can arrive within ms
            helper.markAsInitiated(occ, transfer, applicationName);
        } catch (Exception ex) {
            log.error("Exception occurred :: {}", ex);
        }
    }
    log.info("Ended Admin transfer fund scheduler");
}`,
    },

    // ─── 6 · REQUIRES_NEW status commit ─────────────────────────────────
    {
      path: "com.kayana.services.KayanaAdminTransferFundSchedularHelper#markAsInitiated",
      caption: "06 · The whole point of this class: commit the SCHEDULED → INITIATED flip in its own transaction so the webhook (stage 09) always finds a fresh row. Without REQUIRES_NEW, Stripe's charge.succeeded can arrive milliseconds after the Charge.create call and race against the outer scheduler transaction that hasn't committed yet.",
      language: "java",
      code: `/**
 * Commits each scheduled detail's status to DB in its own transaction so that
 * PSP webhooks (which can arrive within milliseconds of the API call) always
 * find an INITIATED row instead of the stale SCHEDULED status.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KayanaAdminTransferFundSchedularHelper {

    private final IKayanaAdminScheduledTransferFundsDetailsRepo scheduledRepo;
    private final IKayanaAdminTransferFundsRepo                 transferRepo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)     // ← new tx, commits immediately
    public void markAsInitiated(KayanaAdminScheduledTransferFundsDetails occ,
                                KayanaAdminTransferFunds transfer,
                                String applicationName) {

        occ.setKastfdStatus(TransferFundStatusEnum.INITIATED.getValue());
        occ.setKastfdUpdatedBy(applicationName);
        occ.setKastfdUpdatedDate(Calendar.getInstance());
        scheduledRepo.save(occ);

        transfer.setKatfTransferStatus(TransferFundStatusEnum.INITIATED.getValue());
        transfer.setKatfTransferDate(Calendar.getInstance());
        transfer.setKatfUpdatedBy(applicationName);
        transfer.setKatfUpdatedDate(Calendar.getInstance());
        transferRepo.save(transfer);

        log.info("Committed INITIATED status for transferId={}", occ.getKastfdTransferId());
    }
}`,
    },

    // ─── 7 · Read APIs + schedule catalog ───────────────────────────────
    {
      path: "GET /admin/fetch-all-transfer-funds   +   /fetch-all-transfer-schedules   +   /fetch-all-frequency-schedules",
      caption: "07 · Read side of the console. `fetch-all-transfer-funds` is the parent table (optional propertyId filter, timezone-aware createdDate). `fetch-all-transfer-schedules` is the per-parent occurrence timeline. `fetch-all-frequency-schedules` is the static frequency dropdown source.",
      language: "http",
      code: `# All parent transfers for one property (or omit ?property_id= for a global view)
curl -X GET "https://api.kayana.io/admin/fetch-all-transfer-funds?property_id=PROP-2201" \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200 ServiceResponseBean
{
  "status": true,
  "data": [
    {
      "transferId":        "TRF_9f3a...",
      "soruceAccount":     "The Copper Pot Trading Ltd",   // property trading name
      "destinationAccount":"Kayana Account",
      "transferAmount":    "150.00",
      "transferStatus":    "INITIATED",
      "createdDate":       "27 November 2025 09:14 AM",    // in property timezone
      "reason":            "Weekly Kayana charges",
      "isScheduled":       true
    }
  ]
}

# Occurrence timeline for one parent transfer
curl -X GET "https://api.kayana.io/admin/fetch-all-transfer-schedules?transfer_id=TRF_9f3a..." \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200 (rows with status = DELETED are filtered out)
{
  "status": true,
  "data": [
    { "scheduleId":"SCH_a1...","transferId":"TRF_9f3a...","scheduledDate":"01-12-2025","transferDate":"01-12-2025","scheduleTransferStatus":"SUCCESSFUL", "reason":"-" },
    { "scheduleId":"SCH_a2...","transferId":"TRF_9f3a...","scheduledDate":"08-12-2025","transferDate":"08-12-2025","scheduleTransferStatus":"CAPTURED",  "reason":"-" },
    { "scheduleId":"SCH_a3...","transferId":"TRF_9f3a...","scheduledDate":"15-12-2025","transferDate":"-",         "scheduleTransferStatus":"INSUFFICIENT_BALANCE", "reason":"notEnoughBalance" },
    { "scheduleId":"SCH_a4...","transferId":"TRF_9f3a...","scheduledDate":"22-12-2025","transferDate":"-",         "scheduleTransferStatus":"SCHEDULED",           "reason":"-" }
  ]
}

# Static frequency catalog for the schedule dropdown
curl -X GET https://api.kayana.io/admin/fetch-all-frequency-schedules \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200
{ "status": true, "data": ["YEARLY","QUARTERLY","MONTHLY","WEEKLY","DAILY"] }`,
    },

    // ─── 8 · Delete parent / delete occurrence ──────────────────────────
    {
      path: "DELETE /admin/delete-transfer-fund   +   /admin/delete-transfer-schedule",
      caption: "08 · Cancellation obeys one rule: nothing SUCCESSFUL can be removed. Parent delete refuses when any occurrence is SUCCESSFUL and otherwise soft-deletes the whole tree; single-occurrence delete refuses on its own SUCCESSFUL state and, if it turns out to be the last non-DELETED occurrence, cascades DELETED up to the parent. Both endpoints are @LogActivity-annotated so the audit rows land automatically (see task-audit).",
      language: "http",
      code: `# Cancel the whole recurring plan
curl -X DELETE "https://api.kayana.io/admin/delete-transfer-fund?transfer_id=TRF_9f3a...&username=ops@kayana.io" \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200 (ok)                                             |  → 200 (blocked)
{                                                        |  {
  "status": true,                                        |    "status": false,
  "message": "Deleted successfully.",                    |    "message": "Deletion not allowed. One or more Deductions have a status of 'SUCCESSFUL'"
  "propertyId": "PROP-2201",                             |  }
  "description": "Transfer fund cancelled: TRF_9f3a..."  |
}                                                        |

# Cancel one occurrence
curl -X DELETE "https://api.kayana.io/admin/delete-transfer-schedule?schedule_id=SCH_a4...&username=ops@kayana.io" \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200
{
  "status": true,
  "message": "Deleted successfully.",
  "description": "Transfer schedule cancelled: SCH_a4..."
  // if this was the last non-DELETED occurrence, the parent transfer flips to DELETED too
}

# @LogActivity emits either TRANSFER_FUND_CANCELED or TRANSFER_SCHEDULE_CANCELED
# on the aspect return — one audit row per successful call.`,
    },

    // ─── 9 · Webhook — per-row flip + parent recount ────────────────────
    {
      path: "POST /webhook/stripe/transfer-funds     →     com.kayana.service.impl.KayanaTransferFundsWebhookService#tranferFundsNotifications",
      caption: "09 · Stripe's charge.succeeded arrives as a transfer-funds notification. The service looks the occurrence up by `data.reference` (== kastfd_scheduled_id — the same id set on Charge metadata upstream), then decides outgoing/incoming + booked/refused. On `incoming booked`, the occurrence → SUCCESSFUL and the parent recounts remaining SCHEDULED rows: zero → SUCCESSFUL, non-zero → parent stays put (partial). Every event, matched or not, is journaled into kayana_transfer_funds_webhook_request.",
      language: "java",
      code: `@Override
public void tranferFundsNotifications(String payload) {
    try {
        JsonNode event = objectMapper.readTree(payload);
        var request = new KayanaTransferFundsWebhookRequest();
        if (event == null) return;

        String reference = event.get("data").get("reference").asText();    // == kastfd_scheduled_id
        String direction = event.get("data").get("direction").asText();    // outgoing | incoming
        String status    = event.get("data").get("status").asText();       // booked | refused
        String reason    = event.get("data").get("reason").asText();

        var occ = scheduledRepo.findByKastfdScheduledId(reference);
        if (occ == null) return;
        var transfer = transferRepo.findByKatfTransferId(occ.getKastfdTransferId());

        if (status.equalsIgnoreCase("booked") || status.equalsIgnoreCase("refused")) {

            // outgoing booked = funds left the source
            if (direction.equalsIgnoreCase("outgoing") && status.equalsIgnoreCase("booked")) {
                occ.setKastfdStatus(TransferFundStatusEnum.CAPTURED.getValue());
                occ.setKastfdReason(reason);
            }

            // incoming booked = funds landed at Kayana → occurrence SUCCESSFUL
            if (direction.equalsIgnoreCase("incoming") && status.equalsIgnoreCase("booked")) {
                occ.setKastfdStatus(TransferFundStatusEnum.SUCCESSFUL.getValue());
                occ.setKastfdReason(reason);

                if (!transfer.getKatfIsScheduled()) {
                    // one-shot transfer — parent tracks the one occurrence
                    transfer.setKatfTransferStatus(TransferFundStatusEnum.SUCCESSFUL.getValue());
                    transfer.setKatfUpdatedBy(applicationName);
                    transfer.setKatfUpdatedDate(Calendar.getInstance());
                } else {
                    // recurring — parent is SUCCESSFUL only when no more SCHEDULED occurrences remain
                    Long remaining = scheduledRepo.findCountByTranferIdAndStatus(
                            TransferFundStatusEnum.SCHEDULED.getValue(),
                            occ.getKastfdTransferId());
                    if ((remaining == null ? 0L : remaining) == 0L) {
                        transfer.setKatfTransferStatus(TransferFundStatusEnum.SUCCESSFUL.getValue());
                        transfer.setKatfUpdatedBy(applicationName);
                        transfer.setKatfUpdatedDate(Calendar.getInstance());
                    }
                    // if remaining > 0 → the parent stays as-is (partial), later ticks close it
                }
            }

            // refused — occurrence bounces back to SCHEDULED for recurring, REFUSED for one-shot
            if (status.equalsIgnoreCase("refused")) {
                occ.setKastfdReason(reason);
                occ.setKastfdStatus(transfer.getKatfIsScheduled()
                        ? TransferFundStatusEnum.SCHEDULED.getValue()
                        : TransferFundStatusEnum.REFUSED.getValue());
                if (!transfer.getKatfIsScheduled()) {
                    transfer.setKatfTransferStatus(TransferFundStatusEnum.REFUSED.getValue());
                    transfer.setKatfUpdatedBy(applicationName);
                    transfer.setKatfUpdatedDate(Calendar.getInstance());
                }
            }

            occ.setKastfdTransferDate(Calendar.getInstance());
            occ.setKastfdUpdatedBy(applicationName);
            occ.setKastfdUpdatedDate(Calendar.getInstance());
            scheduledRepo.save(occ);
            transferRepo.save(transfer);
        }

        // Everything gets journaled — the raw event body lands in ktfwr_webhook_request (jsonb)
        request.setKtfwrPropertyId(transfer.getKatfPropertyId());
        request.setKtfwrTransferId(reference);
        request.setKtfwrDirection(direction);
        request.setKtfwrStatus(status);
        request.setKtfwrWebhookRequest(event);
        request.setKtfwrCreatedBy(applicationName);
        request.setKtfwrCreatedDate(Calendar.getInstance());
        webhookRequestRepo.save(request);

    } catch (Exception e) {
        log.error("Exception Occured :: ", e.getLocalizedMessage());
    }
}`,
    },

    // ─── 10 · DDL + enums ───────────────────────────────────────────────
    {
      path: "PostgreSQL — kayana_admin_transfer_funds / _scheduled_transfer_funds_details / _transfer_funds_webhook_request     +     TransferFundStatusEnum / TransferFundsFrequencyEnum",
      caption: "10 · Three tables and two enums close the loop. Parent row holds the truth of the plan (amount, source, destination, psp, is_scheduled). Occurrence rows track each attempt. Webhook journal is append-only, keyed by transfer_id and direction so failed lookups are still queryable later.",
      language: "sql",
      code: `-- Parent transfer (one per Admin create)
CREATE TABLE kayana_admin_transfer_funds (
    katf_seq_id                BIGSERIAL PRIMARY KEY,
    katf_property_id           VARCHAR(64) NOT NULL,
    katf_source_account_id     VARCHAR(128),                -- connected PSP account
    katf_destination_account_id VARCHAR(128),               -- Kayana account (per currency)
    katf_description           TEXT,
    katf_transfer_id           VARCHAR(64) UNIQUE NOT NULL, -- TRF_...
    katf_tranfer_status        VARCHAR(32) NOT NULL,        -- SCHEDULED / INITIATED / CAPTURED / SUCCESSFUL / REFUSED / DELETED
    katf_amount                NUMERIC(19,2),
    katf_reason                VARCHAR(255),
    katf_is_scheduled          BOOLEAN,
    katf_scheduled_date        TIMESTAMPTZ,
    katf_transfer_date         TIMESTAMPTZ,
    katf_psp_code              VARCHAR(32),                 -- "STRIPE"
    katf_created_by            VARCHAR(64), katf_created_date TIMESTAMPTZ,
    katf_updated_by            VARCHAR(64), katf_updated_date TIMESTAMPTZ
);

-- One row per occurrence (N per parent, 1 for immediate)
CREATE TABLE kayana_admin_scheduled_transfer_funds_details (
    kastfd_seq_id         BIGSERIAL PRIMARY KEY,
    kastfd_transfer_id    VARCHAR(64) NOT NULL,             -- FK to parent
    kastfd_scheduled_id   VARCHAR(64) UNIQUE NOT NULL,      -- SCH_... — the webhook lookup key
    kastfd_scheduled_date TIMESTAMPTZ NOT NULL,             -- when the batch should attempt
    kastfd_transfer_date  TIMESTAMPTZ,                      -- when the attempt actually ran
    kastfd_reason         VARCHAR(255),                     -- 'notEnoughBalance' | webhook 'reason'
    kastfd_status         VARCHAR(32)  NOT NULL,            -- SCHEDULED / INITIATED / CAPTURED / SUCCESSFUL / REFUSED / INSUFFICIENT_BALANCE / DELETED
    kastfd_created_by     VARCHAR(64), kastfd_created_date TIMESTAMPTZ,
    kastfd_updated_by     VARCHAR(64), kastfd_updated_date TIMESTAMPTZ
);
CREATE INDEX ix_kastfd_scheduled_status_date
    ON kayana_admin_scheduled_transfer_funds_details (kastfd_status, kastfd_scheduled_date);
--                                          ^^ findPropertiesToDoDeduction uses (status = 'SCHEDULED' AND date <= now())

-- Append-only webhook journal — every event, matched or not
CREATE TABLE kayana_transfer_funds_webhook_request (
    ktfwr_seq_id          BIGSERIAL PRIMARY KEY,
    ktfwr_property_id     VARCHAR(64),
    ktfwr_transfer_id     VARCHAR(64),                      -- == kastfd_scheduled_id from event.data.reference
    ktfwr_direction       VARCHAR(16),                      -- outgoing | incoming
    ktfwr_status          VARCHAR(16),                      -- booked | refused
    ktfwr_webhook_request JSONB,                            -- raw event body
    ktfwr_created_by      VARCHAR(64),
    ktfwr_created_date    TIMESTAMPTZ
);

-- Enum values (com.kayana.enums.TransferFundStatusEnum + TransferFundsFrequencyEnum)
--   TransferFundStatusEnum: INITIATED, CAPTURED, REFUSED, SUCCESSFUL, SCHEDULED
--                                (INSUFFICIENT_BALANCE is used by the batch scheduler for the shortfall branch)
--   TransferFundsFrequencyEnum : YEARLY, QUARTERLY, MONTHLY, WEEKLY, DAILY

-- End-to-end recap  ─────────────────────────────────────────────────
--   Admin form               → stage 01
--   POST /admin/transfer-funds → stages 02–04
--   Batch scheduler picks due  → stage 05  (balance guard → INSUFFICIENT_BALANCE OR Charge.create)
--   REQUIRES_NEW status flip   → stage 06  (INITIATED committed before webhook can race)
--   Read APIs (parent+child)   → stage 07
--   Delete parent / occurrence → stage 08  (SUCCESSFUL blocks; @LogActivity audit)
--   Webhook flips row + parent → stage 09
--   Storage + status vocabulary→ stage 10`,
    },
  ],

  keyInsight: "Three services keep the same source of truth (admin_transfer_funds + admin_scheduled_transfer_funds_details) in sync without any of them owning the other's lifecycle. The cross-service link is metadata.transferId — added by admin (or batch) when it fires the Charge, looked up by the webhook when Stripe pushes the outcome. The status state machine is shaped around the fact that Stripe's webhook can race the outer transaction: the batch commits INITIATED in its own REQUIRES_NEW transaction so the webhook never finds a stale SCHEDULED, AND the webhook still accepts SCHEDULED as a fallback in case it does. The PARTIALLY_SUCCESSFUL vs SUCCESSFUL split on the parent is a recount-after-flip, not a greedy update — so a 12-week schedule shows partial progress correctly until the last week's webhook lands.",

  requestTrace: [
    { phase: "CREATE",        detail: "Admin POST /admin/transfer-funds → transferFundsBetweenStripeAccounts. Resolves (property, PSP, currency, ACTIVE) mapping → connected acct_…. Mints TRF_… (transferId) + SCH_… (scheduledId). isScheduled=true → write parent + occurrences in SCHEDULED. isScheduled=false → fire Charge inline." },
    { phase: "IMMEDIATE",     detail: "getMerchantSecretByPspCodeAndCurrency → per-currency Stripe.apiKey. Build metadata { type=Deduction, business, transferId, propertyId, description }; ChargeCreateParams with amount × 100; Charge.create(params). createTransferObjects writes parent INITIATED; createScheduledTransferFunds writes the single occurrence INITIATED." },
    { phase: "BATCH-PICK",    detail: "Batch @Scheduled cron runs. findPropertiesToDoDeduction(SCHEDULED) pulls every occurrence whose date came due. Parents + properties indexed up front; per-row loop resolves connected acct_… + per-currency Stripe secret." },
    { phase: "BALANCE-GUARD", detail: "Per row, /account?action=BALANCE → JsonNode. Stripe shape: data.available[0].amount / 100. availableAmount < transferAmount → flip occurrence to INSUFFICIENT_BALANCE and return without firing." },
    { phase: "BATCH-CHARGE",  detail: "Solvent row: Stripe.apiKey set to per-currency secret; Charge.create with same metadata.transferId the admin path uses. KayanaAdminTransferFundSchedularHelper.markAsInitiated runs in a REQUIRES_NEW transaction — commits INITIATED on the occurrence + parent before the webhook can race the batch's outer transaction." },
    { phase: "WEBHOOK-IN",    detail: "Stripe POSTs charge.succeeded to /webhook/stripe-payment. Controller extracts metadata.donation_id / orderId / transferId; non-blank transferId routes to handleStripeTransferFunds. Always returns 200 — non-2xx triggers Stripe retries." },
    { phase: "WEBHOOK-AUDIT", detail: "handleStripeTransferFunds writes the raw event to kayana_transfer_funds_webhook_request (audit trail). Finance can replay any historical reconciliation from this table." },
    { phase: "ROW-LOOKUP",    detail: "Find parent by transferId. Find next occurrence with status IN (INITIATED, SCHEDULED) ordered by scheduledDate. Accepting SCHEDULED is the safety net for when the webhook beats the batch's REQUIRES_NEW commit." },
    { phase: "STATUS-FLIP",   detail: "Map Stripe outcome: succeeded+paid+captured → occurrence SUCCESSFUL; failed → REFUSED; pending → no-op (await settlement); else → CAPTURED. Persist the occurrence." },
    { phase: "PARENT-RECOUNT", detail: "After SUCCESSFUL flip only: findCountByTranferIdAndStatus(SCHEDULED, transferId). > 0 → parent PARTIALLY_SUCCESSFUL. == 0 → parent SUCCESSFUL. Persist the parent." },
    { phase: "CANCEL",        detail: "Admin DELETE /admin/transfer-funds/{transferId} → deleteTransferFund. Refuses if any occurrence is already SUCCESSFUL; otherwise flips parent + every pending occurrence to DELETED. Single-occurrence cancel via deleteTransferSchedule mirrors the same shape but only flips the parent if every other occurrence is also DELETED." },
  ],

  constraintsLimitations: [
    "The batch is not idempotent on cron restart — a SCHEDULED row whose date came due during a restart will be picked up on the next tick, but a row that was in the middle of Charge.create when the JVM died lands in an ambiguous state (Stripe may have fired the charge but the helper never committed INITIATED). The webhook reconciles, but the operator sees a brief window where 'INITIATED' is missing.",
    "handleStripeTransferFunds only acts on event type 'charge.succeeded' — Stripe's chargeback / refund events for the same chargeId never flip the row back. Manual finance intervention is required for post-success drift.",
    "findCountByTranferIdAndStatus(SCHEDULED, transferId) only counts pure SCHEDULED — INSUFFICIENT_BALANCE rows are intentionally not counted, so a 12-week schedule with one shortfall week still flips the parent to SUCCESSFUL when the last week lands.",
    "Per-currency Stripe secret resolution runs per occurrence inside the batch loop — N Feign calls per cron tick. Caching the resolved secret per (PSP, currency) for the cron's duration would cut a big chunk of latency on busy days.",
    "The webhook accepts both INITIATED and SCHEDULED as the 'next occurrence' candidate; if two webhooks for the same transferId arrive concurrently, the second can land on a SCHEDULED row that the first already processed — needs a row-level lock to be airtight.",
  ],

  conclusion: "Three services, one shared source of truth, one cross-service correlation id (metadata.transferId), one race-condition fix (REQUIRES_NEW), and one reconciliation rule (recount remaining SCHEDULED → SUCCESSFUL or PARTIALLY_SUCCESSFUL). Operators trigger immediately or schedule for 12 weeks out, the batch fires the Charges when their dates come due, and the webhook tells the truth about what Stripe actually did.",
};
