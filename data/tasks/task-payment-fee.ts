import type { Task } from "../tasks.data";

export const taskPaymentFee: Task = {
  taskId:    "task-payment-fee",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Reflection", "Spring AOP", "Kafka", "PostgreSQL (jsonb)"],
  image:     "/tasks/payment-fee/hero.jpg",

  title: "Dynamic Platform Payment Fee Configuration",

  description: "One `POST /admin/property/add-fee` endpoint writes any of 17 platform-specific fee structures onto a merchant's property — Kiosk / Epos / Web / Mobile / KayPay / Terminal / Mpos / PayByLink / QR / etc. Reflection + an enum-keyed dispatcher map each `fee_type` to the right setter on the property row so the endpoint stays one method and new fee types are a single enum entry, not a new controller.",

  ideaPipeline: {
    steps: ["POST /add-fee?fee_type=…", "ApplicationFeeTypeEnum → column", "Reflection FeeHandler", "Diff + fee-history + Kafka", "UpdateContext → AOP audit"],
    caption: "The catalog of fee types is the enum; every entry has a _COLUMN variant whose VALUE is the PascalCase suffix on the property's jsonb column. createDynamicHandler(feeName) uses Method getKbpd<feeName> + setKbpd<feeName> via reflection. Adding a new fee = add an enum constant + add the jsonb column. Zero new code paths.",
  },

  problemStatement: "The platform charges different fees for every channel — a tap-to-pay sale carries a different processing fee from a kiosk order, an EPOS lane, a web checkout, a chargeback, a refund, or a WooCommerce plugin payment. Each fee structure has the same shape (local_debit / local_credit / international / other_card / wechat_pay / additional_merchant_fee / application_fee + type / etc.), but they're stored as 17 different jsonb columns on kayana_business_property_detail. Writing a separate addQrFee / addPayByLinkFee / addEposFee / … endpoint per fee would have meant 17 controllers, 17 service methods, 17 hand-rolled diff-and-log paths, 17 places where the fee-history audit row could silently drift from the property entity, and 17 chances to forget the Kafka email. We needed one POST endpoint, one service method, and one diff/audit/notification pipeline that worked for every fee type — including new fee types that get added later (we're at 17 today; we were at 9 when we started).",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /admin/property/add-fee",
      caption: "02 · One endpoint — writes any of 17 fee columns on the property row",
      language: "http",
      code: `# Real endpoint on kayana-admin-service. fee_type is the enum name;
# the body is always ApplicationCharge (same JSON shape for every lane).
# send_notification = true triggers the merchant-facing email + writes a
# fee-history row (stage 07); off-canvas controls which "why did this
# change?" tag lands on the audit row.

curl -X POST "https://api.kayana.io/admin/property/add-fee\\
?property_id=PROP-2201\\
&fee_type=KIOSK\\
&send_notification=true\\
&off-canvas=RENEGOTIATED" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "localDebitCardFee":              0.20,
    "localCardFee":                   0.22,
    "localCreditCardFee":             1.50,
    "internationalAndCommercialFee":  2.90,
    "otherCardFee":                   2.50,
    "additionalMerchantFee":          0.10,
    "applicationFeeValue":            1.25,
    "applicationFeeType":             "PERCENTAGE",
    "merchantFeeValueCriterion":      10.00,
    "merchantFeeLessThanCriterion":   0.10,
    "merchantFeeEqualOrGreaterThanCriterion": 0.25,
    "chargeBackFee":                  15.00,
    "refundFee":                       0.10
  }'

# → ServiceResponseBean — 200/true is the entire success signal; the
# audit + fee-history + notification pipeline handles the rest.
{ "status": true }

# Same endpoint, different lane — one line changes:
#   ?fee_type=EPOS     → writes kbpdEposFee   (kbpd_epos_fee    jsonb column)
#   ?fee_type=WEBAPP   → writes kbpdWebAppFee (kbpd_web_fee     jsonb column)
#   ?fee_type=KIOSK    → writes kbpdKioskFee  (kbpd_kiosk_fee   jsonb column)
#   ... 14 more lanes, all through the same POST above.
`,
    },
    {
      path: "com.kayana.enums.ApplicationFeeTypeEnum",
      caption: "03 · The catalog — enum drives every fee lane; _COLUMN suffix is the PascalCase setter name",
      language: "java",
      code: `// Every fee lane has a fee_type enum entry (used as ?fee_type=…) and a
// matching _COLUMN entry whose VALUE is the PascalCase suffix on the
// property setter. Adding a new fee = add one _COLUMN entry + one
// jsonb column on the property. Zero new controller code.

public enum ApplicationFeeTypeEnum {

    // ── 17 lanes exposed as ?fee_type=… on the endpoint ───────────────
    KIOSK("KIOSK"),                       EPOS("EPOS"),
    WEBAPP("WEBAPP"),                     MOBILEAPP("MOBILEAPP"),
    KAYPAY("KAYPAY"),                     TERMINAL("TERMINAL"),
    MPOS("MPOS"),                         PAYBYLINK("PAYBYLINK"),
    QR("QR"),                             TAPTOPAY("TAPTOPAY"),
    KAYANAEATS("KAYANAEATS"),             KAYANAWOOCOMMERCE("KAYANAWOOCOMMERCE"),
    MOTO("MOTO"),                         KAYANATICKETING("KAYANATICKETING"),
    CHARGEBACK("CHARGEBACK"),             REFUND("REFUND"),
    PROCESSING("PROCESSING"),

    // ── _COLUMN entries — the PascalCase suffix reflection uses to build
    //    getKbpd<Suffix>() and setKbpd<Suffix>() at runtime.
    KIOSK_FEE_COLUMN("KioskFee"),         EPOS_FEE_COLUMN("EposFee"),
    WEBAPP_FEE_COLUMN("WebAppFee"),       MOBILEAPP_FEE_COLUMN("MobileAppFee"),
    KAYPAY_FEE_COLUMN("KayPayFee"),       TERMINAL_FEE_COLUMN("TerminalFee"),
    MPOS_FEE_COLUMN("MposFee"),           PAYBYLINK_FEE_COLUMN("PayByLinkFee"),
    QR_FEE_COLUMN("QrFee"),               TAPTOPAY_FEE_COLUMN("TapToPayFee"),
    KAYANAEATS_FEE_COLUMN("KayanaEatsFee"),
    KAYANAWOOCOMMERCE_FEE_COLUMN("KayanaWooCommerceFee"),
    MOTO_FEE_COLUMN("MotoFee"),           KAYANATICKETING_FEE_COLUMN("KayanaTicketingFee"),
    CHARGEBACK_FEE_COLUMN("ChargebackFee"), REFUND_FEE_COLUMN("RefundFee"),
    PROCESSING_FEE_COLUMN("ProcessingFee"),
    KAYANAAID_FEE_COLUMN("KayanaAidFee");

    // Helper the service calls with (enumName + "_COLUMN") to get the
    // reflection suffix, e.g. getColumnName("KIOSK_COLUMN") → "KioskFee".
    public static String getColumnName(String columnKey) { ... }
}
`,
    },
    {
      path: "com.kayana.beans.ApplicationCharge",
      caption: "04 · One JSON shape, every lane — no per-lane request bean",
      language: "java",
      code: `// The body is the same class on every /add-fee call. Some fields are
// used by every lane (merchant fee criterion, card-type fees, application
// fee %/flat); some are only meaningful on specific lanes (QR fee only
// makes sense on QR; delivery fee only on delivery). Unused fields stay
// null on that lane's jsonb blob.

public class ApplicationCharge {
    // ── Bracket-based merchant fee (< / ≥ criterion) ─────────────────
    private Double merchantFeeValueCriterion;
    private Double merchantFeeLessThanCriterion;
    private Double merchantFeeEqualOrGreaterThanCriterion;
    private Double additionalMerchantFee;

    // ── Platform take (fixed or percentage) ──────────────────────────
    private Double applicationFeeValue;
    private String applicationFeeType;                // "FIXED" | "PERCENTAGE"

    // ── Card mix — one entry per card type on the acquirer side ──────
    private Double localDebitCardFee;
    private Double localCardFee;
    private Double localCreditCardFee;
    private Double internationalAndCommercialFee;
    private Double otherCardFee;
    private Double directDebitFee;

    // ── Lane-specific extras ─────────────────────────────────────────
    private Double qrFee;
    private Double deliveryFee;
    private Double deliveryFeeVat = 0.0;
    private Double orderFee;
    private Double chargeBackFee;
    private Double refundFee;

    // ── Split payments (per-mcc / per-currency splits — used by /v2) ─
    private List<SplitPayment>          splitPayments               = new ArrayList<>();
    private List<AdditionalOverheadCharges> additionalOverheadCharges = new ArrayList<>();
    private List<SplitPayment>          splitMerchantPayments       = new ArrayList<>();
    private List<SplitPayment>          splitLocalDebitCardFee      = new ArrayList<>();
    private List<SplitPayment>          splitLocalCreditCardFee     = new ArrayList<>();
    private List<SplitPayment>          splitInternationalCommercialCardFee = new ArrayList<>();
    private List<SplitPayment>          splitOtherCardFee           = new ArrayList<>();
    private List<SplitPayment>          splitDirectDebitFee         = new ArrayList<>();

    // ── WeChat / other rails ─────────────────────────────────────────
    private List<FeeTypeBean>   weChatPayFee;
    private List<SplitPayment>  splitWechatPayFee;
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminPropertyService#addFee",
      caption: "05 · Service — resolve column name, read old, write new, publish diff",
      language: "java",
      code: `@Override
public ServiceResponseBean addFee(String propertyId,
                                   ApplicationFeeTypeEnum feeTypeEnum,
                                   ApplicationCharge applicationCharge,
                                   String username,
                                   Boolean sendNotification,
                                   String offCanvas,
                                   ServiceResponseBean srb) {

    KayanaBusinessPropertyDetail property =
        propertyRepo.findByKbpdPropertyId(propertyId);
    if (property == null) return srb;

    // 1 · Resolve the PascalCase column suffix from the enum:
    //     "KIOSK" → getColumnName("KIOSK_COLUMN") → "KioskFee"
    //     Handler will use it as getKbpdKioskFee() / setKbpdKioskFee(...)
    String feeName = ApplicationFeeTypeEnum.getColumnName(feeTypeEnum.name() + "_COLUMN");

    // 2 · Read the current fee via reflection so we can build a real diff.
    ApplicationCharge previous = createDynamicHandler(feeName).getFee(property);
    if (previous == null) previous = new ApplicationCharge();

    // 3 · Notify + fee-history — only when ops explicitly asks (send_notification=true).
    //     Otherwise the change is silent (small internal adjustments, seeding, etc).
    if (sendNotification) {
        sendNotifications(property, applicationCharge, feeTypeEnum, getFeeLabel(feeTypeEnum));
        updateBusinessFeeHistory(property, feeTypeEnum, applicationCharge);
    }

    // 4 · Write the new fee onto the SAME jsonb column via the same handler.
    createDynamicHandler(feeName).setFee(property, applicationCharge);

    // 5 · Build a field-level diff (old → new) and stash it on the current
    //     thread — the AOP audit interceptor picks it up on save() so the
    //     audit row lands with a real "before/after" summary, not "updated".
    KayanaLogObjectDifference<ApplicationCharge> diff = new KayanaLogObjectDifference<>();
    String status = ActivityLogStatusEnum.FeeOffCanvasEnum.getDisplayName(offCanvas);
    Set<String> refPropertyIds = collectAllPropertyIds(applicationCharge);
    Map<String,String> nameMap = propertyRepo
        .findPropertyNamesByPropertyIds(refPropertyIds).stream()
        .collect(Collectors.toMap(r -> (String) r[0], r -> (String) r[1]));

    UpdateContext.setSource(new LogDetailsBean(
        propertyId, "KAYANA_ADMIN", username, feeName,
        status != null && !status.isEmpty() ? status : "UPDATED",
        "", "",
        diff.getLogDifference(previous, applicationCharge, nameMap)));

    propertyRepo.save(property);   // AOP reads UpdateContext, writes audit row
    srb.setStatus(true);
    return srb;
}
`,
    },
    {
      path: "KayanaAdminPropertyService#createDynamicHandler  (the reflection core)",
      caption: "06 · Reflection handler — getKbpd<Suffix>() + setKbpd<Suffix>(Object) on the property row",
      language: "java",
      code: `// Zero-boilerplate dispatcher. Given the PascalCase suffix from the
// enum in stage 03, it builds \`getKbpd<Suffix>()\` + \`setKbpd<Suffix>()\`
// once per call, invokes them against the property row. That's the
// only piece of code that has to change when a new fee lane is added
// — and even that only changes IF a new setter has a different naming
// convention. In practice, adding a new fee is:
//   1. add KIOSK_FEE_COLUMN("KioskFee") to the enum
//   2. add @Column("kbpd_kiosk_fee", jsonb) kbpdKioskFee on the entity
//   3. done — no new controller, no new service method, no new switch.

private FeeHandler createDynamicHandler(String feeName) {
    return new FeeHandler() {

        @Override
        public ApplicationCharge getFee(KayanaBusinessPropertyDetail detail) {
            try {
                Method getter = KayanaBusinessPropertyDetail.class
                                    .getMethod("getKbpd" + feeName);
                return objectMapper.readValue(
                    objectMapper.writeValueAsString(getter.invoke(detail)),
                    ApplicationCharge.class);
            } catch (Exception e) {
                throw new RuntimeException("Error accessing getter for: " + feeName, e);
            }
        }

        @Override
        public void setFee(KayanaBusinessPropertyDetail detail, ApplicationCharge value) {
            try {
                Method setter = KayanaBusinessPropertyDetail.class
                                    .getMethod("setKbpd" + feeName, Object.class);
                setter.invoke(detail, value);
            } catch (Exception e) {
                throw new RuntimeException("Error accessing setter for: " + feeName, e);
            }
        }
    };
}
`,
    },
    {
      path: "kayana_business_property_detail  (fee-column subset)",
      caption: "07 · Where the fees land — one jsonb column per lane on the property row",
      language: "sql",
      code: `-- Every ?fee_type=… on stage 02 flips one of these jsonb columns.
-- 17 lanes, one jsonb column each. The reflection handler in stage 06
-- writes here without ever naming a column at compile time.

-- kayana_business.kayana_business_property_detail  (selected fee columns)
--   kbpd_mobile_fee          JSONB    -- MOBILEAPP  → setKbpdMobileAppFee(...)
--   kbpd_web_fee             JSONB    -- WEBAPP     → setKbpdWebAppFee(...)
--   kbpd_kay_pay_fee         JSONB    -- KAYPAY     → setKbpdKayPayFee(...)
--   kbpd_kiosk_fee           JSONB    -- KIOSK      → setKbpdKioskFee(...)
--   kbpd_terminal_fee        JSONB    -- TERMINAL   → setKbpdTerminalFee(...)
--   kbpd_mpos_fee            JSONB    -- MPOS       → setKbpdMposFee(...)
--   kbpd_pay_by_link_fee     JSONB    -- PAYBYLINK  → setKbpdPayByLinkFee(...)
--   kbpd_epos_fee            JSONB    -- EPOS       → setKbpdEposFee(...)
--   kbpd_tap_to_pay_fee      JSONB    -- TAPTOPAY   → setKbpdTapToPayFee(...)
--   kbpd_qr_fee              JSONB    -- QR         → setKbpdQrFee(...)
--   ...  and 7 more lanes (KayanaEats / KayanaWooCommerce / Moto /
--                          KayanaTicketing / KayanaAid / Chargeback /
--                          Refund / Processing)

-- Row shape after stage 02's KIOSK fee update:
UPDATE kayana_business.kayana_business_property_detail
SET kbpd_kiosk_fee = '{
      "localDebitCardFee":              0.20,
      "localCardFee":                   0.22,
      "localCreditCardFee":             1.50,
      "internationalAndCommercialFee":  2.90,
      "otherCardFee":                   2.50,
      "additionalMerchantFee":          0.10,
      "applicationFeeValue":            1.25,
      "applicationFeeType":             "PERCENTAGE",
      "merchantFeeValueCriterion":     10.00,
      "merchantFeeLessThanCriterion":   0.10,
      "merchantFeeEqualOrGreaterThanCriterion": 0.25,
      "chargeBackFee":                 15.00,
      "refundFee":                      0.10
    }'::jsonb
WHERE kbpd_property_id = 'PROP-2201';
`,
    },
    {
      path: "kayana_admin.kayana_business_fee_history",
      caption: "08 · Fee-history — one row per lane change when send_notification=true",
      language: "sql",
      code: `-- Written by updateBusinessFeeHistory() only when send_notification=true
-- on stage 02. Keeps a timestamped snapshot of the whole ApplicationCharge
-- per lane per property, so a merchant + finance can trace exactly what
-- their fee was on any given date without replaying audit descriptions.

CREATE TABLE kayana_admin.kayana_business_fee_history (
  kbfe_seq_id            BIGSERIAL PRIMARY KEY,
  kbfe_property_id       VARCHAR(64),
  kbfe_property_name     VARCHAR(255),

  -- one column per lane, same jsonb shape as the property row —
  -- only the lane that changed on this write is populated:
  kbfe_kiosk_fee         JSONB,
  kbfe_epos_fee          JSONB,
  kbfe_pay_by_link_fee   JSONB,
  kbfe_tap_to_pay_fee    JSONB,
  kbfe_qr_fee            JSONB,
  kbfe_woo_commerce_fee  JSONB,
  -- ...  and the other 11 lanes, same shape

  kbfe_created_by        VARCHAR(80),
  kbfe_created_date      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_kbfe_property_created
  ON kayana_admin.kayana_business_fee_history (kbfe_property_id, kbfe_created_date DESC);
`,
    },
    {
      path: "com.kayana.utils.UpdateContext + AOP audit hop",
      caption: "09 · Audit trail — diff stashed on ThreadLocal, AOP save-interceptor writes the row",
      language: "java",
      code: `// UpdateContext is a ThreadLocal so the service side can stash a rich
// LogDetailsBean without the audit aspect having to introspect the
// entity by itself. When Hibernate's save() fires under the aspect, it
// pulls the bean off the ThreadLocal, writes the audit row, and clears.
//
// Every fee change on stage 02 lands on this trail exactly once —
// with the field-level diff already computed (not "kbpd_kiosk_fee changed").

public class UpdateContext {
    private static final ThreadLocal<LogDetailsBean> field = new ThreadLocal<>();

    public static void setSource(LogDetailsBean bean) { field.set(bean); }
    public static LogDetailsBean getSource()          { return field.get(); }
    public static void clear()                        { field.remove(); }
}

// Audit row that lands (see task-audit for the full aspect):
//
//   kald_username        = "ops@kayana.io"
//   kald_log_activity    = "FEE_UPDATED"           // via LogDetailsBean.status
//   kald_property_id     = "PROP-2201"
//   kald_log_description = "KioskFee changed:
//                           localDebitCardFee 0.15 → 0.20;
//                           localCardFee      0.18 → 0.22;
//                           applicationFeeValue 1.00 → 1.25 (PERCENTAGE);
//                           chargeBackFee     12.50 → 15.00"
//   kald_created_by      = "KAYANA_ADMIN"
//   kald_created_date    = 2026-08-29T18:42:11Z
//
// off-canvas=RENEGOTIATED  → status = "RENEGOTIATED"
// off-canvas=BASELINE      → status = "BASELINE"
// no off-canvas param      → status = "UPDATED"
`,
    },
    {
      path: "POST /admin/property/v2/add-fee  (per-PSP / per-currency split fees)",
      caption: "10 · Split fees — same shape, extra scope: per-PSP + per-currency row in split_details",
      language: "http",
      code: `# Same body (ApplicationCharge), same reflection-driven dispatch —
# but instead of flipping a jsonb column on the property row, this
# writes a per-PSP / per-currency row on
# kayana_business_property_psp_split_details. Used for split-fee
# scenarios where the KIOSK fee for a merchant on STRIPE/GBP is
# different from the same lane on STRIPE/EUR or STRIPE/GBP.

curl -X POST "https://api.kayana.io/admin/property/v2/add-fee\\
?property_id=PROP-2201\\
&fee_type=KIOSK_FEE\\
&psp_code=STRIPE\\
&currency_code=GBP\\
&status=ACTIVE\\
&send_notification=true" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "localDebitCardFee": 0.20,
    "localCardFee":      0.22,
    "applicationFeeValue": 1.25,
    "applicationFeeType": "PERCENTAGE"
  }'

# → ServiceResponseBean
{ "status": true }

# Same story: fee_type is a different enum (ApplicationPspSplitFeeTypeEnum),
# but everything else — the reflection handler, the UpdateContext diff,
# the fee-history write, the notification path — is the same code path.
#
# Related read endpoints on the same controller:
#   GET /admin/property/fetch-application-charges-by-id?id=PROP-2201
#     → returns the full jsonb-per-lane snapshot for the property.
#   POST /admin/property/update-application-charges
#     → bulk-update path for onboarding scripts + fee-migration jobs.
`,
    },
  ],

  keyInsight: "The reflection + enum split is the entire trick. The catalog of fee types lives in one enum where every constant has a _COLUMN sibling whose value IS the PascalCase suffix on the property's jsonb column. createDynamicHandler(feeName) builds a FeeHandler by reflection at call time — getKbpd + feeName for the OLD value, setKbpd + feeName for the new. The only places that switch on fee type are the per-column fee-history routing and the email's per-channel label lookup — both purely declarative. Adding a fee type to the platform = one enum constant + one jsonb column. No new endpoint, no new service method, no new test surface.",

  requestTrace: [
    { phase: "REQUEST",         detail: "POST /admin/property/add-fee?property_id=PRP_…&fee_type=QR_FEE&send_notification=true with the new ApplicationCharge as the request body. fee_type is bound straight to the ApplicationFeeTypeEnum value by Spring." },
    { phase: "COLUMN-RESOLVE",  detail: "ApplicationFeeTypeEnum.getColumnName('QR_FEE_COLUMN') → 'QrFee'. createDynamicHandler('QrFee') returns an anonymous FeeHandler that uses Method.invoke on KayanaBusinessPropertyDetail.getKbpdQrFee / setKbpdQrFee." },
    { phase: "OLD-READ",        detail: "FeeHandler.getFee returns the OLD ApplicationCharge from the property entity — Jackson handles the jsonb → POJO conversion." },
    { phase: "NOTIFY",          detail: "If send_notification=true: sendNotifications looks up the TRANSACTIONAL_CHARGES email template scoped by the property's country code, runs compareCharges to build the diff body ('Local Debit Card Fee has changed from 0.50% to 0.40%.'), and Kafka-publishes — the email send is decoupled from the addFee transaction." },
    { phase: "HISTORY",         detail: "updateBusinessFeeHistory finds (or creates) the unaccepted history row, picks the right jsonb column via switch (kbfe_qr_fee), runs applyChargesIfChanged + copyChangedCharges to copy only the OLD values for the fields that actually changed." },
    { phase: "NEW-WRITE",       detail: "FeeHandler.setFee uses Method.invoke on setKbpdQrFee with the new ApplicationCharge — the property entity is mutated but not yet persisted." },
    { phase: "AUDIT-PREP",      detail: "KayanaLogObjectDifference builds a structured diff (oldCharge, newCharge, propertyNameMap) where any PRP_… ids inside the SplitPayment lists are pre-resolved to trading names via findPropertyNamesByPropertyIds." },
    { phase: "AUDIT-HANDOFF",   detail: "LogDetailsBean(propertyId, 'KAYANA_ADMIN', username, feeName, status, diff) is published via UpdateContext.setSource(...). The Spring AOP activity-log aspect (see [[task-audit]]) picks it up AFTER the @Transactional commit and writes the kayana_activity_log_details row out of band." },
    { phase: "PERSIST",         detail: "kayanaBusinessPropertyDetailRepo.save persists the new fee column. The whole thing commits transactionally; the email send happens through Kafka regardless of whether the SMTP service is up." },
  ],

  constraintsLimitations: [
    "Method names on the entity must follow the 'getKbpd' + COLUMN / 'setKbpd' + COLUMN convention exactly — a rename (e.g. KbpdQrFee → KbpdQrFees) breaks every fee type until the enum is updated.",
    "updateBusinessFeeHistory still uses a switch — adding a new fee type means an extra case arm there. The handler invocation itself is reflection-free, but the per-fee-column routing is still explicit because the history table has one named column per fee.",
    "The 'unaccepted history row' lookup is .findFirst() — if a property has accumulated more than one unaccepted history row through a partial-accept bug, this writes onto the first by insertion order rather than the most recent.",
    "addFeeV2 strips non-split fields from the body before serialisation — operators who confuse the two endpoints lose their non-split changes silently.",
  ],

  conclusion: "One endpoint, one service method, one enum, one reflection-backed handler, one diff pipeline, one Kafka template, one audit listener. Seventeen fee types today, more tomorrow — every new one a one-line enum addition and a one-column migration. The whole point of the design is that the next person who adds a fee doesn't need to know any of this exists.",
};
