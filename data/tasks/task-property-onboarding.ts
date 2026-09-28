import type { Task } from "../tasks.data";

export const taskPropertyOnboarding: Task = {
  taskId:    "task-property-onboarding",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "AWS Cognito", "Branch.io", "Feign", "Kafka", "Google Maps API"],
  image:     "/tasks/property-onboarding/hero.jpg",

  title: "Business Property Creation & Payment Provider Onboarding Workflow (Branch.io)",

  description: "Ops creates a pre-initialised property row before the merchant ever signs in. A Branch.io deep link is generated against the row, delivered by Kafka-driven email, and resolves back to a guided onboarding flow on the merchant app — joining the right property to the right merchant on first install without the user having to type anything.",

  ideaPipeline: {
    steps: ["POST /add-pre-initialized", "Branch.io deep link", "Kafka invite email", "Merchant taps link", "POST /onboard → Stripe"],
    caption: "One transactional call seeds the property graph in PREINITIALIZED state, computes per-platform fees and country-default tax, builds the Branch.io deep link with a JSON payload that survives the app install, and emails the merchant via Kafka. When the merchant lands in the app and finishes the journey, /onboard hands off to Stripe onboarding for the actual account provisioning.",
  },

  problemStatement: "Onboarding a new merchant used to take operations a full day per property — collecting business details, geolocating the address, computing per-platform fees in the merchant's currency, sizing default tax rates against the country, seeding role / setting / timing / notification rows, then chasing the merchant by email to complete sign-up and Stripe onboarding. The handoff to Stripe was a manual ticket. We needed a single API call that creates the entire property graph in PREINITIALIZED state, generates a Branch.io deep link that survives an app-not-installed install, emails it to the merchant, and — when the merchant completes the in-app flow — kicks off Stripe onboarding automatically.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /admin/property/add-pre-initialized-business-property",
      caption: "02 · Pre-init — one call seeds the property row, fee defaults, and the invite email",
      language: "http",
      code: `# Reactive endpoint on kayana-admin-service. Real request body → real
# ServiceResponseBean out. The merchant hasn't signed up yet — this row
# is created in PREINITIALIZED status and holds them until they do.

curl -X POST "https://api.kayana.io/admin/property/add-pre-initialized-business-property\\
?to_merchant_partner=false" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyEmail":       "hello@riversidecafe.com",
    "propertyName":        "Riverside Cafe",
    "propertyTradingName": "Riverside Cafe",
    "contactName":         "Priya Nair",
    "dialCode":            "+44",
    "contactNumber":       "7911123456",
    "propertyAddress":     "12 Riverside Rd",
    "propertyCity":        "London",
    "propertyState":       "England",
    "propertyCountry":     "United Kingdom",
    "propertyCountryCode": "GB",
    "postalCode":          "SE1 2AB",
    "currencyCode":        "GBP",
    "businessType":        "CAFE",
    "pspProvider":         "STRIPE",
    "onBoardingType":      "HOSTED"
  }'

# → ServiceResponseBean
{
  "status":     true,
  "message":    "Property pre-initialized",
  "propertyId": "PROP-8842",
  "description": "Pre-initialised Riverside Cafe (PROP-8842) — invite email queued"
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminPropertyService#addPreinitializedBusinessProperty",
      caption: "03 · Service — property row + fee matrix + defaults, all inside one transactional call",
      language: "java",
      code: `public ServiceResponseBean addPreinitializedBusinessProperty(
        AddBusinessPropertyRequestBean req, String username,
        Boolean toMerchantPartner, ServiceResponseBean srb) {

    // 1 · Guardrails — email must be unique across users AND property emails.
    if (userMasterRepo.existsByKbumEmail(req.getPropertyEmail())) {
        srb.setMessage("A business user with this email already exists.");
        return srb;
    }
    if (propertyRepo.existsByKbpdPropertyEmail(req.getPropertyEmail())) {
        srb.setMessage("A business property with this email already exists.");
        return srb;
    }

    // 2 · Build the row in PREINITIALIZED (unless it's a cash-only merchant).
    String propertyId = KayanaCommonConstants.INSTANCE.PROPERTY_PREFIX
        .concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());

    KayanaBusinessPropertyDetail row = new KayanaBusinessPropertyDetail();
    row.setKbpdPropertyId(propertyId);
    row.setKbpdPropertyEmail(req.getPropertyEmail());
    row.setKbpdPropertyName(req.getPropertyName());
    row.setKbpdPropertyTradingName(req.getPropertyTradingName());
    row.setKbpdContactName(req.getContactName());
    row.setKbpdDialCode(req.getDialCode());
    row.setKbpdContactNumber(req.getContactNumber());
    row.setKbpdCurrencyCode(req.getCurrencyCode());
    row.setKbpdBusinessType(req.getBusinessType());
    row.setKbpdPropertyAddress(req.getPropertyAddress());
    row.setKbpdPropertyCity(req.getPropertyCity());
    row.setKbpdPropertyCountry(req.getPropertyCountry());
    row.setKbpdPropertyCountryCode(req.getPropertyCountryCode());
    row.setKbpdPostalCode(req.getPostalCode());
    row.setKbpdCreatedDate(Calendar.getInstance());
    row.setKbpdCreatedBy(applicationName);
    row.setKbpdPropertyStatus(
        PspProviderEnum.CASH.getValue().equalsIgnoreCase(req.getPspProvider())
            ? PropertyStatusEnum.ACTIVE.getValue()
            : PropertyStatusEnum.CREATED.getValue());

    // 3 · Fee matrix — per-platform charges resolved by (business type, currency)
    // from applicationChargeService. Charity/religious orgs get charity rates;
    // regular merchants get standard rates. Every platform (Kiosk, EPOS,
    // Terminal, MPOS, Web, Mobile, PayByLink, QR, TapToPay, MOTO, KayanaAid,
    // KayPay, Ticketing) gets its own fee stamped onto the row.
    applyFeeMatrix(row, req);

    // 4 · Country default tax + seed rows for role / setting / timing /
    //     notification / PSP mapping / default pins are all created here too
    //     (elided — same transactional call).
    propertyRepo.saveAndFlush(row);
    seedDefaults(row, req);

    // 5 · Build the Branch.io deep link + Kafka-publish the invite email
    //     (see stage 06 for the exact payload the link carries).
    dispatchInviteEmail(row, toMerchantPartner);

    srb.setStatus(true);
    srb.setPropertyId(propertyId);
    srb.setDescription("Pre-initialised " + req.getPropertyName()
                        + " (" + propertyId + ") — invite email queued");
    return srb;
}
`,
    },
    {
      path: "POST /admin/property/update-pre-initialized-business-property",
      caption: "04 · Correction — ops fixes a typo on the pre-init row before the merchant taps the link",
      language: "http",
      code: `# The pre-init row is editable until the merchant completes signup.
# Same shape as add, keyed by propertyId; only the fields provided are
# updated on the row.

curl -X POST https://api.kayana.io/admin/property/update-pre-initialized-business-property \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":     "PROP-8842",
    "contactNumber":  "7911999999",
    "postalCode":     "SE1 2AC"
  }'

# → ServiceResponseBean
{
  "status":  true,
  "message": "Pre-initialised property updated",
  "propertyId": "PROP-8842"
}
`,
    },
    {
      path: "POST /admin/property/resend-email-to-preinitialized-property",
      caption: "05 · Resend — rebuild the Branch.io link + republish the invite email",
      language: "http",
      code: `# Called when the merchant never received the invite (or it expired /
# was archived). Reads the current property + PSP mapping, rebuilds the
# Branch.io short link with a fresh inviteData payload, publishes on the
# email Kafka topic. No side effects on the row itself.

curl -X POST "https://api.kayana.io/admin/property/resend-email-to-preinitialized-property\\
?property_id=PROP-8842&to_merchant_partner=false" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io"

# → ServiceResponseBean
{
  "status":  true,
  "message": "Invite email resent to hello@riversidecafe.com",
  "propertyId": "PROP-8842"
}

# Common failure — no active PSP mapping yet (shouldn't happen if the
# initial add succeeded, but the guard exists):
{
  "status":  false,
  "message": "No active PSP mapping found for property ID: PROP-8842"
}
`,
    },
    {
      path: "Branch.io deep-link payload built in resendEmailToPreinitializedProperty",
      caption: "06 · Deep-link payload — what survives an app-not-installed install",
      language: "java",
      code: `// Every field in this map is what the merchant's app will see when it
// opens for the first time after tapping the Branch.io link — even if
// the app wasn't installed until after the tap. That's what "deep link
// survives app-not-installed" actually means in practice: Branch stores
// the payload against the device fingerprint, and hands it to the app
// on first launch.

Map<String, Object> data = new HashMap<>();
data.put(KayanaCommonConstants.PROPERTY_ID,       row.getKbpdPropertyId());
data.put(KayanaCommonConstants.PROPERTY_NAME,     row.getKbpdPropertyName());
data.put(KayanaCommonConstants.PROPERTY_EMAIL,    row.getKbpdPropertyEmail());
data.put(KayanaCommonConstants.CURRENCY_CODE,     row.getKbpdCurrencyCode());
data.put(KayanaCommonConstants.COUNTRY_CODE,      row.getKbpdPropertyCountryCode());
data.put(KayanaCommonConstants.CONTACT_NAME,      row.getKbpdContactName());
data.put(KayanaCommonConstants.DIAL_CODE,         row.getKbpdDialCode());
data.put(KayanaCommonConstants.CONTACT_NUMBER,    row.getKbpdContactNumber());
data.put(KayanaCommonConstants.PSP_PROVIDER,      pspMapping.getKbppmPspProvider());   // "STRIPE"
data.put(KayanaCommonConstants.ONBOARDING_TYPE,   pspMapping.getKbppmOnboardingType()); // "HOSTED"
data.put(KayanaCommonConstants.CREATED_DATE,      row.getKbpdCreatedDate());
data.put(KayanaCommonConstants.IS_SIGNUP_DONE,
    GeneralStatusEnum.ACTIVE.getValue().equalsIgnoreCase(
        existingBusinessUser != null ? existingBusinessUser.getKbumAccountStatus() : ""));

// Wrapped once so the app knows exactly where to find the invite blob,
// with a $desktop_url fallback that opens the equivalent signup page
// on kayana.io if the recipient clicks from a desktop browser.
Map<String, Object> dataWrapper = new HashMap<>();
dataWrapper.put(KayanaCommonConstants.INVITE_DATA, data);
dataWrapper.put("$desktop_url", buildSignupUrlWithInviteData(data));

// The Branch.io API request itself:
Map<String, Object> params = new HashMap<>();
params.put(KayanaCommonConstants.BRANCH_KEY,    branchBusinessKey);
params.put(KayanaCommonConstants.BRANCH_SECRET, branchBusinessSecret);
params.put("data",                              dataWrapper);
// → POST https://api2.branch.io/v1/url  → returns a shortlink like
//    https://kayana.app.link/xJk9Aa   — that's what lands in the email.
`,
    },
    {
      path: "POST /admin/property/onboard",
      caption: "08 · Onboard — hands off to Stripe onboarding once the merchant finishes signup",
      language: "http",
      code: `# The merchant finished the in-app signup and hit "Set up payments".
# The app calls this endpoint. All PSP-specific config (Stripe account
# type, redirect URLs, business identifiers) is passed via headers +
# body — the endpoint itself is generic.

curl -X POST https://api.kayana.io/admin/property/onboard \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: hello@riversidecafe.com" \\
  -H "x-psp-code: STRIPE" \\
  -H "x-currency-code: GBP" \\
  -H "x-onboarding-type: HOSTED" \\
  -H "x-instance-id: eu-live-1" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId":     "PROP-8842",
    "onboardingFlow": "MERCHANT_SIGNUP",
    "merchantType":   "STANDARD",
    "returnUrl":      "https://kayana.app.link/onboarding-complete",
    "contactInfo": {
      "ownerName":       "Priya",
      "ownerFamilyName": "Nair",
      "email":           "hello@riversidecafe.com",
      "phone":           "+447911123456",
      "dateOfBirth":     "1988-04-12",
      "nationalities":   ["GB"]
    },
    "businessInfo": {
      "legalName":     "Riverside Cafe Ltd",
      "tradingName":   "Riverside Cafe",
      "website":       "https://riversidecafe.com",
      "mcc":           "5812",
      "businessType":  "CAFE",
      "registrationNumber":"14882111",
      "vatNumber":     "GB123456789",
      "businessPhone": "+442071234567",
      "businessEmail": "hello@riversidecafe.com"
    },
    "address": {
      "streetAndNumber": "12 Riverside Rd",
      "city":            "London",
      "postalCode":      "SE1 2AB",
      "country":         "GB"
    }
  }'

# → Response returns Stripe's hosted onboarding link the app immediately
# redirects the merchant to for KYC / bank details.
{
  "status": true,
  "data":   {
    "onboardingUrl": "https://connect.stripe.com/setup/e/acct_1PXk9K…",
    "expiresAt":     "2026-08-30T18:15:00Z",
    "propertyId":    "PROP-8842"
  }
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminPropertyService#onboard",
      caption: "09 · Service — validate the pre-init PSP mapping, delegate to Stripe onboarding, seed default pins",
      language: "java",
      code: `public ServiceResponseBean onboard(CommonOnboardingRequestBean req,
                                    String pspCode, String currencyCode,
                                    String onboardingType, String instanceId,
                                    String username) {

    ServiceResponseBean srb = new ServiceResponseBean();
    try {
        // 1 · There must be a PREINITIALIZED PSP mapping matching the
        //     property, PSP, and currency the merchant is completing for.
        Optional<KayanaBusinessPropertyPspMapping> mapping = pspMappingRepo
            .findByKbppmPropertyIdAndKbppmPspProviderAndKbppmCurrencyCodeAndKbppmStatus(
                req.getPropertyId(),
                pspCode.toUpperCase(),
                currencyCode.toUpperCase(),
                PropertyStatusEnum.PREINITIALIZED.getValue());
        if (mapping.isEmpty()) {
            srb.setStatus(false);
            return srb;
        }

        // 2 · Delegate the PSP-specific onboarding call. The Stripe integration
        //     handles account creation, KYC document flow, and returns the
        //     hosted onboarding URL the app redirects the merchant to.
        req.setCallerService("admin_service");
        srb = stripeOnboardingClient.onboardMerchant(
                req.getPropertyId(), pspCode, onboardingType,
                instanceId, currencyCode, req);

        // 3 · Seed the property's default encrypted PINs asynchronously so
        //     the merchant can log into the POS as soon as Stripe returns.
        String propertyId = req.getPropertyId();
        if (propertyId != null && !propertyId.isBlank()) {
            dynamicPinsService
                .setDefaultEncryptedPins(new ServiceResponseBean(), List.of(propertyId))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                    r -> log.info("Default pins setup completed for property: {}", propertyId),
                    e -> log.error("Error setting up default pins for {}: {}", propertyId, e.getMessage()));
        }

        return srb;
    } catch (Exception e) {
        log.error("Exception occurred while onboarding :: ", e);
        srb.setMessage(e.getMessage());
        return srb;
    }
}
`,
    },
    {
      path: "State transitions & downstream Kafka",
      caption: "10 · Final state — property flips PREINITIALIZED → ACTIVE, downstream services reload",
      language: "text",
      code: `Property lifecycle in kayana_business.kayana_business_property_details:

  CREATED          ← addPreinitializedBusinessProperty(...) lands the row
     │
     │ merchant fills the app signup screen (stage 07) and Stripe onboarding
     │ from stage 09 returns success (KYC + bank details captured)
     ▼
  ACTIVE           ← kbpd_property_status flipped once Stripe onboarding completes;
                    default pins are seeded; property can now accept orders.

Downstream broadcasts on completion (over Kafka):

  • property-created   → kayana-business-service builds role / setting /
                         timing / notification rows if any were missing
  • property-onboarded → kayana-cache-service invalidates any stale
                         property-level caches
  • property-onboarded → kayana-integration-service enables Deliverect /
                         UrbanPiper if the merchant opted in

Admin audit (see task-audit) — the whole flow lands as three rows:
  1. ADD_PRE_INITIALIZED_PROPERTY
  2. RESEND_INVITE                   (only if stage 05 was hit)
  3. PROPERTY_ONBOARDED              (fired from stage 09 on success)
`,
    },
  ],

  keyInsight: "The decoupling is the design. Admin owns the property graph and the invite; Stripe owns the merchant account and KYC; Branch.io owns the deep link; Kafka owns the email send. Each can fail independently — a Branch.io outage leaves the property row valid and lets the operator resend; an SMTP blip is a Kafka retry, not a failed create; Stripe's own outages don't touch the pre-init state. The Branch.io payload carries the full invite state, so the in-app screen renders without a server round-trip — and the update path PUTs against the same alias so resend doesn't reissue links.",

  requestTrace: [
    { phase: "CREATE",     detail: "POST /admin/property/add-pre-initialized-business-property. Duplicate-guard against user-master and property tables; mint a property ID; seed currency-aware per-platform fees; seed PSP split-payment rows; create default roles; geocode + time-zone; pull country tax defaults; build settings / timings / notifications; create PSP mapping in PREINITIALIZED state." },
    { phase: "DEEP-LINK",  detail: "Build params (alias=propertyId, branchKey) + data (propertyName, email, PSP, onboarding type, contact info, isSignupDone). kayanaBranchIOUtils.executeBranchIoBusinessRedirectLinkRequest POSTs to Branch.io, returns the deep link URL." },
    { phase: "EMAIL",      detail: "kafkaProducerSender.sendBusinessRedirectLinkEmailToBusinessProperty publishes an event with the property + deep link. SMTP send is decoupled — the create transaction commits regardless of email-service availability." },
    { phase: "INSTALL",    detail: "Merchant taps the link on a device that may or may not have the app. Branch.io routes web → store install → in-app, then hands the JSON payload to the app on launch — so the onboarding screen renders without a server round-trip." },
    { phase: "UPDATE",     detail: "Ops edits via POST /update-pre-initialized-business-property. If email changed, adminUserGlobalSignOut + adminUpdateUserAttributes rotate Cognito. updateBranchIoBusinessRedirectLinkRequest PUTs against the existing URL so the link stays the same." },
    { phase: "RESEND",     detail: "POST /resend-email-to-preinitialized-property re-fires the Branch.io PUT and the Kafka invite without mutating anything else." },
    { phase: "ONBOARD",    detail: "Merchant completes the in-app journey → POST /admin/property/onboard. Service verifies the (property, PSP, currency) mapping is still PREINITIALIZED, then hands off to Stripe onboarding — the Stripe integration runs the actual account provisioning and returns the hosted onboarding URL." },
    { phase: "PINS",       detail: "On Stripe-onboarding success, kayanaBusinessDynamicPinsService.setDefaultEncryptedPins runs on Schedulers.boundedElastic so the merchant can sign into POS / kiosk immediately on first launch — without blocking the onboard response." },
  ],

  constraintsLimitations: [
    "Branch.io is the deep-link source of truth; if Branch.io is unreachable the property is saved and the operator must resend to mint a link.",
    "The Cognito email rotation has no automated rollback — if adminUpdateUserAttributes fails after the globalSignOut, the merchant is signed out from Cognito but still sees the old email locally until the operator retries.",
    "Geocoding requires the property address and city — addresses Google Maps can't resolve cause the create to fail with 'Invalid Address details' rather than degrading to a manual time-zone choice.",
    "Per-platform fees are looked up at create time only — currency or pricing changes don't propagate retroactively to existing properties.",
  ],

  conclusion: "One POST creates the property graph, mints a Branch.io deep link, fires a Kafka invite, seeds RBAC roles and country-default tax, and hands the Stripe onboarding off cleanly on the merchant's first tap. The decoupling is what makes it ship-worthy: admin owns the property state, Branch.io owns the deep link, Cognito owns identity, Stripe owns the merchant account and KYC. Each owns one thing well, and the merchant gets a single tap to start trading.",
};
