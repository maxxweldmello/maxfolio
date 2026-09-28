import type { Task } from "../tasks.data";

export const taskCompliance: Task = {
  taskId:    "task-compliance",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "MySQL", "AWS S3", "WebFlux", "Kafka", "Country-aware Templates"],
  image:     "/tasks/compliance/hero.jpg",

  title: "Business Compliance Review — Approval Workflow, Reason Catalog, Notes & Communications",

  description: "Three-state compliance workflow (Approve / Reject / Reset) on every property in `PROPERTY_UNDER_COMPLIANCE`. A configurable rejection-reason catalog with parent / child structure, freeform notes, and an email + SMS + dashboard communications dispatch — all behind one endpoint where the three actions share a property-scoped repo lookup so state transitions stay atomic.",

  ideaPipeline: {
    steps: ["One endpoint · 3 actions", "Status flip + compliance row", "Country template resolve", "Kafka email + SMS", "@LogActivity audit"],
    caption: "APPROVED / REJECTED / RESET land on a single endpoint. Each branch shares the expensive parts — country-keyed template lookup, structured reason payload, S3-backed notes, audit row — and only differs in the status enum and which template chunks compose the email body. The DONATIONS signup-source is the load-bearing example: same compliance decision, two different downstream comms paths through Kafka.",
  },

  problemStatement: "Before this module, a 'compliance check' on a new merchant was a Slack thread between operations and the partnerships team. Decisions weren't recorded against the property, rejection reasons were free-text and inconsistent across reviewers, supporting documents were emailed around as attachments and lost track of, and the merchant was notified by whichever reviewer remembered to email them — often in the wrong language for their market. There was no audit trail, no central catalog of reasons, no governance view of where each property sat in the review queue, and no way to send a targeted compliance email or SMS without copy-pasting templates. We needed a single endpoint per decision that flipped the property's status, stamped a reason from a curated catalog, captured optional reviewer notes, persisted any supporting documents to S3, and dispatched the right country-localized email and SMS via Kafka — all under one @LogActivity audit aspect.",

  howItWorks: "Operations reviews a property sitting in PROPERTY_UNDER_COMPLIANCE and calls POST /admin/property/update-property-compliance-review with one of three actions: APPROVED, REJECTED, or RESET. The service loads the property and the active business-user master, then resolves the right email template for the merchant's country through EmailTemplateResolverService.getTemplateByEventIdAndCountryCode. APPROVED flips the property to ACTIVE, upserts a row in business_property_compliance_details with the action + reason + notes, builds the approval email body from country-localized message chunks (APPROVAL_INTRO + APPROVAL_SMS), and either routes to the donations-platform 'Kayana Aid Onboarding Complete' email (if signup source is DONATIONS) or to the standard compliance email + SMS via KafkaProducerSender.publishPropertyComplianceEmailAndSms. REJECTED requires a non-empty list of structured rejection reasons; the property flips to COMPLIANCE_REVIEW_REJECTED, the compliance row records the reason payload, and the email body is composed as REJECTION_INTRO + REASON_BLOCK (formatted with the reason list) + optional NOTES_BLOCK. RESET sends the property back to PROPERTY_UNDER_COMPLIANCE so the merchant can resubmit. Every branch ends by writing an HTML-formatted ActivityLogDetails row with the property + reviewer + reason + notes. The reason catalog is administered by createPropertyComplianceReason and a sibling fetch endpoint that returns reasons ordered by priority. updatePropertyComplianceReviewStage and updatePropertyComplianceLegendColor write governance metadata directly onto the property — the review stage drives the queue UI, the legend color drives the dashboard. createPropertyComplianceNote streams each FilePart through a Reactor pipeline, uploads to S3 under propertyId/notes/<uniqueId>.<ext>, builds a list of document beans with their CDN URLs, then persists the note + document list against the property. fetchPropertyComplianceNotesByPropertyId returns the timeline in reverse-chronological order, enriched with the reviewer's display name from the admin master. sendPropertyComplianceEmail and sendPropertyComplianceSms are standalone communication endpoints: they resolve the country-keyed template, attach optional files, and hand off to KafkaProducerSender.sendComplianceEmail / sendComplianceSms — the same Kafka topic the decision path uses, just without the status flip.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "GET /admin/property/fetch-all-property-compliance-reasons",
      caption: "02 · Reason catalog — parent/child rejection reasons, ordered by priority",
      language: "http",
      code: `# Reasons live in their own table with parent/child hierarchy so reviewers
# can pick from a curated list (Documents → Missing VAT number, KYC → …)
# instead of typing free text. Priority drives the display order.

curl -X GET https://api.kayana.io/admin/property/fetch-all-property-compliance-reasons \\
  -H "Authorization: Bearer <admin_jwt>"

# → ServiceResponseBean
{
  "status": true,
  "data": [
    {
      "reasonId":       "RSN-001",
      "reason":         "Documents",
      "parentReasonId": null,
      "priority":       1,
      "status":         "ACTIVE"
    },
    {
      "reasonId":       "RSN-002",
      "reason":         "Missing VAT number",
      "parentReasonId": "RSN-001",
      "priority":       1,
      "status":         "ACTIVE"
    }
  ]
}
`,
    },
    {
      path: "POST /admin/property/create-property-compliance-reason",
      caption: "03 · Catalog admin — add a new reason (also PUT /update-property-compliance-reason)",
      language: "http",
      code: `# The compliance lead can grow the catalog without a redeploy. Both
# create and update are one call; every mutation is audit-logged via
# @LogActivity so who added which reason and when is traceable.

curl -X POST https://api.kayana.io/admin/property/create-property-compliance-reason \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "reason":         "Missing VAT number",
    "parentReasonId": "RSN-001",
    "priority":       1,
    "status":         "ACTIVE"
  }'

# → ServiceResponseBean
{
  "status":  true,
  "message": "Compliance reason created",
  "data":    { "reasonId": "RSN-002" }
}

# Update — PUT the same body with ?reason_id=RSN-002:
curl -X PUT "https://api.kayana.io/admin/property/update-property-compliance-reason\\
?reason_id=RSN-002" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "reason":   "Missing VAT / registration number",
    "priority": 2
  }'
`,
    },
    {
      path: "kayana_business.kayana_business_property_compliance_details",
      caption: "04 · Where the decision lives — one row per property, upserted on every action",
      language: "sql",
      code: `-- One row per property (upsert on every APPROVED / REJECTED / RESET call).
-- kbpcd_reason is a jsonb blob of the full PropertyComplianceReasonBean so
-- the exact list of parent/child rejections + reasonId + text is preserved.
CREATE TABLE kayana_business.kayana_business_property_compliance_details (
  kbpcd_seq_id                       BIGSERIAL PRIMARY KEY,
  kbpcd_property_id                  VARCHAR(64),
  kbpcd_property_compliance_status   VARCHAR(80),   -- ComplianceStatusEnum.value
  kbpcd_reason                       JSONB,         -- PropertyComplianceReasonBean
  kbpcd_disabled_features            JSONB,         -- feature-level exceptions
  kbpcd_note                         TEXT,
  kbpcd_created_by                   VARCHAR(80),
  kbpcd_created_date                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kbpcd_updated_by                   VARCHAR(80),
  kbpcd_updated_date                 TIMESTAMPTZ
);
CREATE UNIQUE INDEX ux_kbpcd_property_id
  ON kayana_business.kayana_business_property_compliance_details (kbpcd_property_id);

-- Enum values used in kbpcd_property_compliance_status:
--   PROPERTY COMPLIANCE APPROVED
--   PROPERTY COMPLIANCE REJECTED
--   PROPERTY COMPLIANCE RESET
`,
    },
    {
      path: "POST /admin/property/update-property-compliance-review",
      caption: "05 · The decision — one endpoint, three actions (APPROVE / REJECT / RESET)",
      language: "http",
      code: `# ─── APPROVE ────────────────────────────────────────────────────────
curl -X POST https://api.kayana.io/admin/property/update-property-compliance-review \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId": "PROP-2201",
    "action":     "PROPERTY COMPLIANCE APPROVED",
    "notes":      "All KYC docs verified. Cleared to trade."
  }'

# → property flips to ACTIVE, approval email sent in the merchant's language
{ "status": true, "message": "Property approved" }


# ─── REJECT ─────────────────────────────────────────────────────────
# Requires a non-empty rejections array. Each rejection carries
# the reasonId from the catalog + its display text — the whole bean
# is stored as jsonb on kbpcd_reason (see stage 04).
curl -X POST https://api.kayana.io/admin/property/update-property-compliance-review \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId": "PROP-2201",
    "action":     "PROPERTY COMPLIANCE REJECTED",
    "reason": {
      "rejections": [
        { "reasonId": "RSN-002", "reason": "Missing VAT number" },
        { "reasonId": "RSN-007", "reason": "Bank statement > 90 days old" }
      ]
    },
    "notes": "Please re-upload VAT cert and a bank statement from the last 3 months."
  }'

# → property flips to COMPLIANCE_REVIEW_REJECTED, rejection email composed as
#   REJECTION_INTRO + REASON_BLOCK (per rejection) + NOTES_BLOCK
{ "status": true, "message": "Property rejected" }


# ─── RESET ──────────────────────────────────────────────────────────
# Sends the property back to PROPERTY_UNDER_COMPLIANCE so the merchant
# can resubmit — no email.
curl -X POST https://api.kayana.io/admin/property/update-property-compliance-review \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId": "PROP-2201",
    "action":     "PROPERTY COMPLIANCE RESET"
  }'
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminPropertyService#updatePropertyComplianceReview",
      caption: "06 · Service — one method, three branches, one shared setup (property + user + country template)",
      language: "java",
      code: `public ServiceResponseBean updatePropertyComplianceReview(
        PropertyComplianceReviewRequestBean req,
        String username, ServiceResponseBean srb) {

    String propertyId = req.getPropertyId();
    String action     = req.getAction();
    PropertyComplianceReasonBean reasonBean = req.getReason();
    String notes = req.getNotes();

    // Shared setup — load property, active business user, country-scoped email template.
    KayanaBusinessPropertyDetail property =
        propertyRepo.findByKbpdPropertyId(propertyId);
    if (property == null) return srb;

    String countryCode = property.getKbpdPropertyCountryCode();
    KayanaBusinessUserMaster user = userMasterRepo
        .findByKbumUsernameAndKbumAccountStatus(
            property.getKbpdUsername(), GeneralStatusEnum.ACTIVE.getValue());
    if (user == null) return srb;

    // Country-keyed template resolver — different email copy per market.
    KayanaEmailTemplateMaster template = null;
    try {
        template = emailTemplateResolverService.getTemplateByEventIdAndCountryCode(
            EventKeyEnum.PROPERTY_COMPLIANCE_REVIEW.getValue(), countryCode);
    } catch (IllegalStateException e) {
        log.warn("Template not found for {}, skipping email", countryCode);
    }

    // ── APPROVE ─────────────────────────────────────────────────────
    if (ComplianceStatusEnum.PROPERTY_COMPLIANCE_APPROVED.getValue().equalsIgnoreCase(action)) {
        property.setKbpdPropertyStatus(PropertyStatusEnum.ACTIVE.getValue());
        property.setKbpdUpdatedBy(applicationName);
        property.setKbpdUpdatedDate(Calendar.getInstance());
        propertyRepo.saveAndFlush(property);

        upsertComplianceRow(propertyId, action, reasonBean, notes);

        // DONATIONS signup source gets a different comms path — the
        // Kayana Aid onboarding-complete email — so charities land in
        // their own dashboard instead of the merchant POS.
        if ("DONATIONS".equalsIgnoreCase(property.getKbpdSignupSource())) {
            kafkaProducer.publishKayanaAidOnboardingCompleteEmail(user, property);
        } else {
            String emailBody = compose(template, "APPROVAL_INTRO", "APPROVAL_SMS", dataMap(user, property));
            kafkaProducer.publishPropertyComplianceEmailAndSms(user, property, emailBody);
        }
    }

    // ── REJECT ──────────────────────────────────────────────────────
    else if (ComplianceStatusEnum.PROPERTY_COMPLIANCE_REJECTED.getValue().equalsIgnoreCase(action)) {
        if (reasonBean == null || reasonBean.getRejections() == null || reasonBean.getRejections().isEmpty()) {
            srb.setMessage("Rejection reasons are required.");
            return srb;
        }
        property.setKbpdPropertyStatus(PropertyStatusEnum.COMPLIANCE_REVIEW_REJECTED.getValue());
        property.setKbpdUpdatedBy(applicationName);
        property.setKbpdUpdatedDate(Calendar.getInstance());
        propertyRepo.saveAndFlush(property);

        upsertComplianceRow(propertyId, action, reasonBean, notes);

        StringBuilder reasonsText = new StringBuilder();
        reasonBean.getRejections().forEach(r ->
            reasonsText.append("- ").append(r.getReason()).append("<br>"));

        String emailBody = compose(template,
            "REJECTION_INTRO",
            "REASON_BLOCK:" + reasonsText,
            notes != null ? "NOTES_BLOCK:" + notes : null,
            dataMap(user, property));

        kafkaProducer.publishPropertyComplianceEmailAndSms(user, property, emailBody);
    }

    // ── RESET ───────────────────────────────────────────────────────
    else if (ComplianceStatusEnum.PROPERTY_COMPLIANCE_RESET.getValue().equalsIgnoreCase(action)) {
        property.setKbpdPropertyStatus(PropertyStatusEnum.PROPERTY_UNDER_COMPLIANCE.getValue());
        propertyRepo.saveAndFlush(property);
        upsertComplianceRow(propertyId, action, reasonBean, notes);
        // no email — the merchant will resubmit and we'll re-review.
    }

    srb.setStatus(true);
    srb.setPropertyId(propertyId);
    srb.setDescription("Compliance " + action + " for " + property.getKbpdPropertyName());
    return srb;
}
`,
    },
    {
      path: "POST /admin/property/update-property-compliance-review-stage",
      caption: "07 · Governance metadata — stage + legend color live on the property row itself",
      language: "http",
      code: `# The queue UI groups properties by review stage (INTAKE / DOCS / MANAGER-SIGNOFF / …)
# and colors rows by legend color (RED = urgent, AMBER = waiting on merchant, GREEN = ready).
# Two dedicated endpoints so a reviewer can move a property through the queue
# without triggering an approve/reject decision.

curl -X POST https://api.kayana.io/admin/property/update-property-compliance-review-stage \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  --json '{ "propertyId": "PROP-2201", "reviewStage": "MANAGER_SIGNOFF" }'

curl -X POST https://api.kayana.io/admin/property/update-property-compliance-legend-color \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  --json '{ "propertyId": "PROP-2201", "legendColor": "AMBER" }'

# Also — feature-level compliance bypass (KYC lite for certain markets):
curl -X POST https://api.kayana.io/admin/property/update-property-compliance-bypass-verification \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  --json '{
    "propertyId":         "PROP-2201",
    "bypassVerification": true,
    "reason":             "Charity — low-risk market"
  }'
`,
    },
    {
      path: "POST /admin/property/create-property-compliance-note  (multipart)",
      caption: "08 · Notes + documents — Reactor pipeline streams each FilePart to S3",
      language: "http",
      code: `# Reviewers attach evidence + notes as they work through a case. Real
# multipart upload — 'notes' is a small JSON part, 'documents' is a
# Flux<FilePart> of arbitrary files.

curl -X POST https://api.kayana.io/admin/property/create-property-compliance-note \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -F 'notes={"propertyId":"PROP-2201","notes":"Merchant supplied updated VAT cert."};type=application/json' \\
  -F "documents=@vat-cert-2026.pdf" \\
  -F "documents=@bank-statement-aug.pdf"

# → ServiceResponseBean
{
  "status":  true,
  "message": "Note created with 2 document(s)",
  "data": {
    "noteId": "NOTE-8812",
    "documents": [
      { "documentId": "DOC-A1", "documentUrl": "https://cdn.kayana.io/PROP-2201/notes/9f3a2c1e.pdf" },
      { "documentId": "DOC-A2", "documentUrl": "https://cdn.kayana.io/PROP-2201/notes/22b57b04.pdf" }
    ]
  }
}

# Note timeline read — reverse-chronological, enriched with reviewer display names:
curl -X GET "https://api.kayana.io/admin/property/fetch-property-compliance-notes-by-property-id\\
?property_id=PROP-2201" \\
  -H "Authorization: Bearer <admin_jwt>"
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminPropertyService#createPropertyComplianceNote",
      caption: "09 · Reactor pipeline — every FilePart lands on S3 under {propertyId}/notes/{uid}.{ext}",
      language: "java",
      code: `public ServiceResponseBean createPropertyComplianceNote(
        PropertyComplianceNotesRequestBean req,
        Flux<FilePart> fileParts, String username,
        ServiceResponseBean srb) {

    List<PropertyComplianceNotesDocumentBean> docs = new ArrayList<>();

    if (fileParts != null) {
        CountDownLatch latch = new CountDownLatch(1);

        fileParts.flatMap(file -> {
            String extension    = FilenameUtils.getExtension(file.filename());
            String storedName   = KayanaCommonUtils.INSTANCE.uniqueIdentifier() + "." + extension;

            return Mono.fromCallable(() -> {
                    Path temp = Files.createTempFile("temp", storedName);
                    return new AbstractMap.SimpleEntry<>(storedName, temp);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(entry -> {
                    Path temp = entry.getValue();
                    return DataBufferUtils.write(file.content(), temp)
                        .then(Mono.fromRunnable(() -> {
                            String propertyId = req.getPropertyId();
                            String s3Key      = propertyId + "/notes/" + storedName;

                            // Reactive streams under the hood, blocking S3 SDK
                            // put — safely off the WebFlux event loop thanks
                            // to Schedulers.boundedElastic() above.
                            s3Client.putObject(
                                PutObjectRequest.builder()
                                    .bucket(complianceDocumentsBucket)
                                    .key(s3Key)
                                    .contentType(file.headers().getContentType() != null
                                        ? file.headers().getContentType().toString()
                                        : "application/octet-stream")
                                    .build(),
                                RequestBody.fromFile(temp.toFile()));

                            try { Files.deleteIfExists(temp); } catch (Exception ignored) {}

                            String cdnUrl = complianceDocumentsCdnUrl.replaceAll("/$", "")
                                            + "/" + s3Key;

                            PropertyComplianceNotesDocumentBean d = new PropertyComplianceNotesDocumentBean();
                            d.setDocumentId("DOC-" + KayanaCommonUtils.INSTANCE.uniqueIdentifier());
                            d.setDocumentUrl(cdnUrl);
                            synchronized (docs) { docs.add(d); }
                        }));
                });
        }).doOnTerminate(latch::countDown).subscribe();

        latch.await();          // block until every part is on S3
    }

    // Persist the note row with the built document list on the property.
    persistNote(req.getPropertyId(), req.getNotes(), docs, username);

    srb.setStatus(true);
    srb.setData(Map.of("noteId", newNoteId, "documents", docs));
    return srb;
}
`,
    },
    {
      path: "POST /admin/property/send-property-compliance-email  &  /send-property-compliance-sms",
      caption: "10 · Standalone comms — same Kafka topic as the decision path, without the status flip",
      language: "http",
      code: `# Reviewers can push a one-off email or SMS at any point in the review
# — same country-scoped template resolver, same Kafka topics. Nothing on
# the property changes.

# ─── EMAIL (multipart — attachments optional) ────────────────────────
curl -X POST https://api.kayana.io/admin/property/send-property-compliance-email \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  -F 'compliance_communication_request={
        "propertyId":   "PROP-2201",
        "emails":       ["hello@riversidecafe.com"],
        "emailSubject": "One more document, please",
        "emailMessage": "Could you send us the updated bank statement dated within 90 days?",
        "sendEmail":    true
      };type=application/json' \\
  -F "attachments=@sample-bank-statement-template.pdf"

# ─── SMS ─────────────────────────────────────────────────────────────
curl -X POST https://api.kayana.io/admin/property/send-property-compliance-sms \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: compliance@kayana.io" \\
  --json '{
    "propertyId":    "PROP-2201",
    "mobileNumbers": ["+447911123456"],
    "smsMessage":    "Kayana: we need one more doc to complete your review — check your email.",
    "sendSms":       true
  }'

# Every stage in this flow — reason CRUD, review decision, stage /
# legend / bypass updates, note upload, comms — is wrapped in the
# @LogActivity aspect (see task-audit), so the entire compliance
# history for a property lands as an ordered audit trail.
`,
    },
  ],

  requestTrace: [
    { phase: "REVIEW REQUEST",      detail: "Operator POSTs /admin/property/update-property-compliance-review with { propertyId, action: APPROVED|REJECTED|RESET, reason: { rejections: [...] }, notes }." },
    { phase: "LOAD",                detail: "Service fetches the BusinessPropertyDetail and the ACTIVE BusinessUserMaster. Missing either short-circuits with a typed message — no DB write happens." },
    { phase: "TEMPLATE",            detail: "EmailTemplateResolverService.getTemplateByEventIdAndCountryCode picks the right template for the merchant's country code under event-key PROPERTY_COMPLIANCE_REVIEW." },
    { phase: "STATUS FLIP",         detail: "APPROVED → ACTIVE, REJECTED → COMPLIANCE_REVIEW_REJECTED, RESET → PROPERTY_UNDER_COMPLIANCE. Property is saveAndFlush-ed with updated_by + updated_date." },
    { phase: "COMPLIANCE ROW",      detail: "upsertComplianceRow creates a business_property_compliance_details row (if absent) or updates it (if present) with the action, structured reason JSON, and reviewer notes." },
    { phase: "EMAIL BODY",          detail: "For APPROVED: APPROVAL_INTRO chunk; for REJECTED: REJECTION_INTRO + REASON_BLOCK formatted with the reasons + optional NOTES_BLOCK; for RESET: no comms (audit only)." },
    { phase: "DISPATCH",            detail: "DONATIONS-source merchants get the Aid Onboarding Complete template via kafkaProducerSender.publish; standard merchants get publishPropertyComplianceEmailAndSms — one publish carries both email + SMS." },
    { phase: "AUDIT",               detail: "generateComplianceLog builds an HTML-formatted activity row (business name, owner, status, reason list, notes) and persists it through ActivityLogDetailsRepo." },
    { phase: "RESPONSE",            detail: "responseBean.status=true + a per-action success message, ready for the dashboard to flip the row's badge in real time." },
    { phase: "REASON CATALOG",      detail: "createPropertyComplianceReason mints PROPERTY_COMPLIANCE_REASON_<id>, defaults priority=1, captures optional parent_reason_id for hierarchical reasons. fetchAllPropertyComplianceReason returns an ordered Map<reasonId, reason> driven by priority + created-date." },
    { phase: "GOVERNANCE",          detail: "updatePropertyComplianceReviewStage and updatePropertyComplianceLegendColor write directly onto the property — drives the queue UI's stage column and the dashboard's legend color." },
    { phase: "NOTES TIMELINE",      detail: "createPropertyComplianceNote streams each FilePart via Reactor (temp file → S3 putObject → CDN URL), gathers the docs into a list, persists the note + docs against the property. fetchPropertyComplianceNotesByPropertyId returns the timeline in reverse-chronological order, enriched with reviewer display names." },
    { phase: "STANDALONE COMMS",    detail: "sendPropertyComplianceEmail / sendPropertyComplianceSms resolve the country template, attach optional files, and hand off to the same Kafka topic the decision path uses — without flipping the property status." },
  ],

  keyInsight: "Three actions on one endpoint are cheaper than three endpoints. The expensive part — country-aware templates, structured reasons, S3-backed notes, audit logs — is shared by all of them. The only per-action work is the status enum and which template chunks compose the email body. Storing the reason as a JSON payload (not a string) means a future reviewer can read it back as a typed bean and the same field powers both the email body and the dashboard's structured filter. The DONATIONS branch is the load-bearing example: same compliance decision, two different downstream comms, both driven by a flag on the business user — adding new tenant types later is one if-branch and a new template.",

  constraintsLimitations: [
    "The rejection email dispatch is reportedly not wired up automatically yet — a rejected merchant currently needs a follow-up manual send.",
    "The notes file-upload pipeline blocks the request thread on a latch rather than being fully reactive end-to-end.",
    "Donation-specific handling is a hardcoded branch rather than a generalized strategy, so adding a third tenant type means growing the same conditional.",
  ],

  conclusion: "Compliance becomes one endpoint per decision instead of a Slack thread. Reasons come from a curated catalog, notes carry their own files, every email speaks the merchant's local market, every decision lands in the audit log, and the same Kafka pipeline that handles approvals also handles ad-hoc comms. One model — three actions, one workflow, one trail — turned a manual review into a queryable governance system.",
};
