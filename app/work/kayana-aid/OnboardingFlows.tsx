"use client";

import { useRef, useState } from "react";

/* Charity onboarding — four backend flows, each broken into steps. Selecting a flow and a step shows the
   endpoint, the call path through the backend classes, and how the step runs internally.
   Class names are shown without their platform prefix. */

type Call = { d: number; c: string; m: string };
type Step = { id: string; title: string; endpoint: string; chain: Call[]; writes: string[]; how: string[] };
type Flow = { id: string; n: number; title: string; stepper: string; blurb: string; steps: Step[] };

const FLOWS: Flow[] = [
  {
    id: "user",
    n: 1,
    title: "User creation",
    stepper: "Stepper 1 · Account",
    blurb: "Creates the person: a Cognito identity plus a charity user record.",
    steps: [
      {
        id: "check",
        title: "Check the email",
        endpoint: "GET /donation/onboard/user?email=",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "fetchUserByEmail" },
          { d: 1, c: "DonationOnboardingService", m: "fetchUserByEmail" },
          { d: 2, c: "BusinessUserMasterRepo", m: "findByKbumEmail" },
        ],
        writes: [],
        how: [
          "The email is trimmed and lower-cased.",
          "The user table is searched by that email. No match answers “User not found”, so a new account is created.",
          "A match returns the username, name, dial code, phone number and account status. INACTIVE means the OTP was never confirmed; ACTIVE means it was.",
          "This is how a returning visitor resumes at the right step instead of signing up twice. The call only reads.",
        ],
      },
      {
        id: "signup",
        title: "Sign up",
        endpoint: "POST /business/authentication/v2/signup",
        chain: [
          { d: 0, c: "BusinessUserAuthenticationController", m: "signUpV2" },
          { d: 1, c: "BusinessUserAuthenticationService", m: "signUpV2" },
          { d: 2, c: "BusinessUserMasterRepo", m: "findByKbumEmailIgnoreCase" },
          { d: 2, c: "BusinessUserMasterRepo", m: "findByKbumDialCodeAndKbumPhoneNumber" },
          { d: 2, c: "CognitoIdentityProviderClient", m: "signUp" },
          { d: 2, c: "BusinessUserMasterRepo", m: "saveAndFlush" },
          { d: 2, c: "BusinessUserAuthenticationService", m: "generateAndSendSmsOtp" },
          { d: 3, c: "AsyncNotificationFeignClient", m: "publish" },
          { d: 2, c: "BusinessUserAuthenticationService", m: "deleteUser" },
          { d: 3, c: "CognitoIdentityProviderClient", m: "adminDeleteUser" },
        ],
        writes: ["Cognito · business pool", "business_user_master"],
        how: [
          "The email and the phone number are each looked up first. If either already belongs to a user, no duplicate is made: the existing username and its verification state come back so the wizard can resume.",
          "For a new user a unique username is generated and the Cognito attributes are built: email, phone and, when a property is known, its locale.",
          "Cognito signUp runs against the business user pool. Cognito enforces the password policy and emails its own confirmation code.",
          "The user record is built from the request: name, Cognito id, email, phone (unverified), status INACTIVE, sign-up method SELF, region, IP and location. Platform access is chosen from the sign-up source, so a donations sign-up gets the donations platform.",
          "saveAndFlush stores it. If that save throws, deleteUser removes the new Cognito user again, so nothing is left half-created.",
          "A 6-digit SMS OTP is generated, held in memory for 10 minutes and sent through the notification service asynchronously.",
          "If a property id was supplied, that property is linked to the new username and the sign-up is logged. The username is returned.",
        ],
      },
    ],
  },
  {
    id: "verify",
    n: 2,
    title: "Email verification",
    stepper: "Stepper 2 · Verify",
    blurb: "Proves the person owns the email or phone, activates the account and signs them in.",
    steps: [
      {
        id: "resend",
        title: "Send or resend a code",
        endpoint: "GET /business/authentication/resend-otp/{username}",
        chain: [
          { d: 0, c: "BusinessUserAuthenticationController", m: "resendOtp" },
          { d: 1, c: "BusinessUserAuthenticationService", m: "resendOtp" },
          { d: 2, c: "BusinessUserAuthenticationService", m: "checkAndRecordResend" },
          { d: 2, c: "CognitoIdentityProviderClient", m: "resendConfirmationCode" },
          { d: 0, c: "BusinessUserAuthenticationController", m: "resendOtpViaSms" },
          { d: 1, c: "BusinessUserAuthenticationService", m: "resendOtpViaSms" },
          { d: 2, c: "BusinessUserAuthenticationService", m: "checkAndRecordResend" },
          { d: 2, c: "BusinessUserAuthenticationService", m: "generateAndSendSmsOtp" },
          { d: 3, c: "AsyncNotificationFeignClient", m: "publish" },
        ],
        writes: [],
        how: [
          "Sign-up already sent the first codes: Cognito's email code and the SMS OTP. This step is for the “send again” button.",
          "Every resend, email or SMS, passes one shared per-username guard: a rolling window with a cooldown. It checks and records in a single atomic operation, so two simultaneous resends cannot both slip through.",
          "An email resend asks Cognito to resend its confirmation code.",
          "An SMS resend generates a fresh 6-digit OTP, replaces the stored one (10-minute expiry) and publishes the message.",
          "A blocked resend returns a message that explains why.",
        ],
      },
      {
        id: "confirm",
        title: "Confirm the code",
        endpoint: "POST /business/authentication/confirm-signup",
        chain: [
          { d: 0, c: "BusinessUserAuthenticationController", m: "confirmSignUp" },
          { d: 1, c: "BusinessUserAuthenticationService", m: "confirmSignUp" },
          { d: 2, c: "BusinessUserMasterRepo", m: "findByKbumUsername" },
          { d: 2, c: "CognitoIdentityProviderClient", m: "adminConfirmSignUp" },
          { d: 2, c: "CognitoIdentityProviderClient", m: "adminUpdateUserAttributes" },
          { d: 2, c: "CognitoIdentityProviderClient", m: "confirmSignUp" },
          { d: 2, c: "BusinessUserMasterRepo", m: "saveAndFlush" },
          { d: 2, c: "SlackNotificationUtils", m: "sendSlackNotification" },
          { d: 2, c: "AsyncNotificationFeignClient", m: "publish" },
        ],
        writes: ["business_user_master", "Cognito · user confirmed"],
        how: [
          "The user is loaded by username; an unknown username is an error.",
          "The submitted code is checked against the in-memory SMS OTP first, for both value and expiry. A valid one is confirmed with an admin-confirm in Cognito, and the phone attribute is marked verified.",
          "Any other code is treated as Cognito's email code and passed to Cognito's own confirmSignUp, which rejects wrong or expired ones.",
          "Either way the stored SMS OTP is cleared.",
          "On success the verified flags and the ACTIVE status are saved, and an internal alert records that an owner signed up with no organisation yet.",
          "If the user already has an organisation, a registration email is also published through the notification service.",
        ],
      },
      {
        id: "signin",
        title: "Sign in",
        endpoint: "POST /business/authentication/signin",
        chain: [
          { d: 0, c: "BusinessUserAuthenticationController", m: "signIn" },
          { d: 1, c: "BusinessUserAuthenticationService", m: "signIn" },
          { d: 2, c: "BusinessUserMasterRepo", m: "findByEmailOrUsernameIgnoreCase" },
          { d: 2, c: "CognitoIdentityProviderClient", m: "adminInitiateAuth" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "findByKbpdUsernameAndKbpdPropertyStatusNotIn" },
          { d: 2, c: "BusinessUserMasterRepo", m: "save" },
          { d: 2, c: "BusinessUserAuthenticationService", m: "generateLogsForSignIn" },
        ],
        writes: ["business_user_master (lockout counters)"],
        how: [
          "Once the code is confirmed the wizard signs the new user in with the credentials just entered, so a session exists for the next step.",
          "The user is found by email or username. A locked-out account (5 wrong passwords, 30 minutes) is refused before Cognito is called, and platform access and ACTIVE status are checked.",
          "Cognito adminInitiateAuth returns the ID, access and refresh tokens.",
          "The user's property is looked up, and a deactivated one blocks sign-in. A brand-new user has none yet, so the tokens come back without one.",
          "Failure counters and any lockout are reset, and the sign-in is logged.",
        ],
      },
    ],
  },
  {
    id: "business",
    n: 3,
    title: "Business creation",
    stepper: "Stepper 3 · Organisation",
    blurb: "Builds the charity tenant in one transaction: organisation, fees, roles and compliance.",
    steps: [
      {
        id: "load",
        title: "Load the form and resume",
        endpoint: "GET /donation/onboard/regions · /countries · /property-by-user",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "fetchRegions" },
          { d: 1, c: "DonationOnboardingService", m: "fetchRegions" },
          { d: 2, c: "RegionRepo", m: "findAllActiveOrdered" },
          { d: 0, c: "DonationOnboardingController", m: "fetchCountries" },
          { d: 1, c: "DonationOnboardingService", m: "fetchCountries" },
          { d: 2, c: "CountryCurrencyMasterRepo", m: "findAllOrderedByCountryName" },
          { d: 0, c: "DonationOnboardingController", m: "fetchPropertyByUsername" },
          { d: 1, c: "DonationOnboardingService", m: "fetchPropertyByUsername" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "findFirstByKbpdUsernameOrderByKbpdCreatedDateDesc" },
        ],
        writes: [],
        how: [
          "Regions and countries, with their currencies, fill the form's dropdowns.",
          "The property lookup returns the newest property for this username: id, names, status, business type, currency, country and contact details.",
          "If one already exists, creation is skipped and the user carries on from where they stopped. All three calls only read.",
        ],
      },
      {
        id: "create",
        title: "Create the organisation",
        endpoint: "POST /donation/onboard/pre-init",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "preInitProperty" },
          { d: 1, c: "DonationOnboardingService", m: "preInitProperty" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "findFirstByKbpdUsernameOrderByKbpdCreatedDateDesc" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "existsByKbpdPropertyEmail" },
          { d: 2, c: "TermsAndConditionsRepo", m: "findByKtacTncForAndKtacIsLatestTrue" },
          { d: 2, c: "DefaultTaxDetailRepo", m: "findByKdtdCountryCodeIgnoreCase" },
          { d: 2, c: "ApplicationChargeService", m: "getApplicationCharge" },
          { d: 2, c: "ApplicationChargeService", m: "setDefaultSplitPayments" },
          { d: 2, c: "BusinessPropertyPspSplitDetailsRepo", m: "saveAll" },
          { d: 2, c: "DonationOnboardingService", m: "createDonationPropertySettings" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "saveAndFlush" },
          { d: 2, c: "BusinessPropertyTimingDetailsRepo", m: "saveAndFlush" },
          { d: 2, c: "BusinessNotificationSettingRepo", m: "saveAndFlush" },
          { d: 2, c: "BusinessPropertyPspMappingRepo", m: "saveAndFlush" },
        ],
        writes: [
          "business_property_details",
          "business_property_psp_split_details",
          "business_setting_detail",
          "business_timing_details",
          "business_notification_settings",
          "business_property_psp_mapping (PREINITIALIZED)",
        ],
        how: [
          "The method is transactional, so everything below commits together or not at all.",
          "It is idempotent: if the same username already has a property, that property is returned untouched. An email already used by another property is rejected.",
          "A property id is generated, and defaults are applied when the request leaves them out: Stripe charity provider, hosted onboarding, business type Charity_S, and United Kingdom, GB and GBP.",
          "The property record is built: names, registration number, contact (dial code plus number), address, country, a URL slug made from the name and the encoded id, status CREATED, and acceptance of the latest charity terms when consent was sent. Tax details come from the country defaults; time zone and geolocation are best-effort.",
          "The currency is saved on the property here and is never asked for again. It later decides which Stripe platform account the charity is connected under.",
          "The fee schedule is copied from the default-fee table for the currency: one charge for in-person sources, one for online sources, and the individual ones for pay-by-link and ticketing.",
          "One payment-split row is created per platform, and the property's settings row is created.",
          "Timing, notification settings and a Stripe payment mapping in PREINITIALIZED state are prepared, and all the records are saved at the end. The new property id is returned.",
        ],
      },
      {
        id: "roles",
        title: "Seed roles and owner",
        endpoint: "Runs inside POST /donation/onboard/pre-init",
        chain: [
          { d: 0, c: "DonationOnboardingService", m: "preInitProperty" },
          { d: 1, c: "DonationOnboardingService", m: "createDefaultRolesForProperty" },
          { d: 2, c: "BusinessFunctionMasterRepo", m: "findByKbfmStatus" },
          { d: 2, c: "BusinessRoleMasterRepo", m: "saveAll" },
          { d: 2, c: "BusinessRoleFunctionMappingRepo", m: "saveAll" },
          { d: 2, c: "BusinessRoleMasterRepo", m: "findByKbrmPropertyIdAndKbrmRoleName" },
          { d: 2, c: "BusinessUserMasterRepo", m: "save" },
        ],
        writes: ["business_role_master", "business_role_function_mapping", "business_user_master (role)"],
        how: [
          "All active functions are loaded from the function master.",
          "For each default role (owner, charity manager, finance officer, treasurer and the internal platform role) a role row is created for this property.",
          "Each role is mapped to every active function with view, edit and delete allowed, and both lists are saved in bulk.",
          "The OWNER role of this property is looked up and assigned to the signing-up user, which is what makes them the owner.",
          "Errors here are logged, not thrown, so a problem in role seeding does not fail the creation.",
        ],
      },
      {
        id: "compliance",
        title: "Compliance and guest orders",
        endpoint: "Runs inside POST /donation/onboard/pre-init",
        chain: [
          { d: 0, c: "DonationOnboardingService", m: "preInitProperty" },
          { d: 1, c: "BusinessPropertyComplianceDetailsRepo", m: "findByKbpcdPropertyId" },
          { d: 1, c: "BusinessPropertyComplianceDetailsRepo", m: "saveAndFlush" },
          { d: 1, c: "DonationHardwareCheckoutService", m: "claimGuestOrders" },
        ],
        writes: ["business_property_compliance_details (PENDING_REVIEW)", "hardware order rows (claimed)"],
        how: [
          "If the property has no compliance record yet, one is created as PENDING_REVIEW. A charity needs a manual review before it can be activated.",
          "Any hardware-shop order placed as a guest with the same email is attached to the new property, so it shows up in the shop area at first login. This is best-effort and can never fail the creation.",
          "The response carries the new property id, which the next flow needs.",
        ],
      },
    ],
  },
  {
    id: "payment",
    n: 4,
    title: "Payment setup",
    stepper: "Inside the dashboard",
    blurb: "Connects the charity to Stripe, records the fee acknowledgement and takes it live.",
    steps: [
      {
        id: "start",
        title: "Start Stripe onboarding",
        endpoint: "POST /donation/onboard/psp",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "pspOnboard" },
          { d: 1, c: "DonationOnboardingService", m: "pspOnboard" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "findByKbpdPropertyId" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "save" },
          { d: 2, c: "StripeFeignClient", m: "onboardMerchant" },
        ],
        writes: ["business_property_details (registration number, website)", "business_property_psp_mapping (account id)"],
        how: [
          "The property is loaded by id; an unknown id is an error.",
          "A charity or company registration number is required unless the merchant type is individual. When given it is saved on the property.",
          "The currency comes from the request header, falling back to the property's own. Together with the CHARITY account type it selects the platform Stripe account for that currency, and the connected account is created under it. A charity in pounds and one in dollars therefore sit under different platform accounts.",
          "The request is passed on with the provider fixed to Stripe, the flow to HOSTED and the account type to CHARITY. Stripe creates the connected account and returns a hosted onboarding link, which is returned to the caller.",
          "If that succeeded and a website was supplied, the website is saved on the property.",
        ],
      },
      {
        id: "link",
        title: "Resume the link",
        endpoint: "GET /donation/onboard/psp-link",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "fetchPspLink" },
          { d: 1, c: "DonationOnboardingService", m: "fetchPspLink" },
          { d: 2, c: "StripeFeignClient", m: "getStripeExistingAccountDetails" },
        ],
        writes: [],
        how: [
          "Used when a charity left Stripe half-way and comes back.",
          "The existing connected account is asked for a fresh account link. The reply carries the temporary link, an already-onboarded flag, the account id, and whether charges are enabled and details submitted.",
          "With no account yet, the reply says no link is available. Nothing is written.",
        ],
      },
      {
        id: "status",
        title: "Check the status",
        endpoint: "GET /donation/onboard/psp-status",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "fetchPspStatus" },
          { d: 1, c: "DonationOnboardingService", m: "fetchPspStatus" },
          { d: 2, c: "BusinessPropertyPspMappingRepo", m: "findAllByKbppmPropertyId" },
          { d: 2, c: "DonationOnboardingService", m: "extractRequiresAdditionalInfo" },
        ],
        writes: [],
        how: [
          "The property's Stripe mapping is read.",
          "Payment setup counts as complete only when an ACTIVE Stripe mapping exists and holds a real connected-account id.",
          "The verification block on the mapping is inspected to tell whether Stripe still needs more information.",
          "The reply gives complete or not, started or not, needs-more-info, and the id of the fee document already acknowledged. The dashboard polls this until it turns complete.",
        ],
      },
      {
        id: "fee",
        title: "Acknowledge fees",
        endpoint: "POST /donation/onboard/acknowledge-fee",
        chain: [
          { d: 0, c: "DonationOnboardingController", m: "acknowledgeFee" },
          { d: 1, c: "DonationOnboardingService", m: "acknowledgeFee" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "findByKbpdPropertyId" },
          { d: 2, c: "TermsAndConditionsRepo", m: "findByKtacTncForAndKtacIsLatestTrue" },
          { d: 2, c: "BusinessPropertyDetailRepo", m: "save" },
        ],
        writes: ["business_property_details (fee acknowledgement id)"],
        how: [
          "The latest published fee-acknowledgement document is loaded. If none is published, the call fails with a message saying so.",
          "The property is stamped with that document's id, so the record shows exactly which version was accepted.",
          "A later fee change publishes a new version, which asks for a fresh acknowledgement.",
        ],
      },
      {
        id: "live",
        title: "Go live (event)",
        endpoint: "Kafka event — no HTTP call",
        chain: [
          { d: 0, c: "KafkaWebhookEventListener", m: "onboardingEventConsumer" },
          { d: 1, c: "BusinessPropertyPspMappingRepo", m: "save" },
          { d: 1, c: "BusinessPropertyDetailRepo", m: "save" },
          { d: 1, c: "NotificationUtils", m: "sendEmailToComplianceUsers" },
          { d: 1, c: "BusinessPropertyComplianceDetailsRepo", m: "save" },
          { d: 1, c: "KafkaWebhookEventListener", m: "enablePaymentSelectors" },
          { d: 1, c: "SlackNotificationUtils", m: "sendSlackNotification" },
          { d: 1, c: "AsyncNotificationFeignClient", m: "publish" },
          { d: 1, c: "PromoFeeWaiverUtils", m: "activatePromoIfEnrolled" },
        ],
        writes: [
          "business_property_psp_mapping (account info, status)",
          "business_property_details (status)",
          "business_property_compliance_details",
        ],
        how: [
          "Stripe's account events reach the webhook service through Kafka. The consumer reads the property id, status, account id and verification info from each one.",
          "The account info on the property's mapping is refreshed every time. Interim, non-ACTIVE events stop there.",
          "On the ACTIVE event the mapping status moves to ACTIVE. Then the property moves too: to PROPERTY UNDER COMPLIANCE, with an email to the compliance team, or straight to ACTIVE with the compliance record approved when the onboarding source skips manual review.",
          "Payment selectors are enabled for the property and an internal alert is sent, only on the first move to ACTIVE.",
          "For charities that signed up through the donations platform, the onboarding-complete email goes out, again only once.",
          "Finally the fee-waiver promotion is claimed if a slot is free, which starts its window.",
        ],
      },
    ],
  },
];

/* group a step's calls by class, in order of first appearance, for the "Components" carousel */
function componentsOf(step: Step) {
  const map = new Map<string, string[]>();
  step.chain.forEach((k) => {
    const list = map.get(k.c) ?? [];
    if (!list.includes(k.m)) list.push(k.m);
    map.set(k.c, list);
  });
  return [...map.entries()].map(([name, methods]) => ({ name, methods }));
}

function kindOf(name: string) {
  if (name.endsWith("Controller")) return "Controller";
  if (name.endsWith("Service")) return "Service";
  if (name.endsWith("Repo")) return "Repository";
  if (name.endsWith("FeignClient") || name.endsWith("ProviderClient")) return "Client";
  if (name.endsWith("Listener")) return "Listener";
  if (name.endsWith("Utils")) return "Utility";
  return "Component";
}

const ACCENT = "#c9971f";

export default function OnboardingFlows() {
  const [fi, setFi] = useState(0);
  const [si, setSi] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 312, behavior: "smooth" });
  const flow = FLOWS[fi];
  const step = flow.steps[Math.min(si, flow.steps.length - 1)];
  const components = componentsOf(step);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* flow selector — drawn as a stepper */}
      <div style={{ position: "relative" }}>
        <div className="ob-flows" role="tablist" aria-label="Onboarding flows">
          {FLOWS.map((f, i) => {
            const on = i === fi;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={on}
                onClick={() => { setFi(i); setSi(0); }}
                style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit" }}
              >
                <span
                  className="mono"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%",
                    fontSize: "11px", border: "1px solid var(--ink-30)",
                    background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink)",
                  }}
                >
                  {f.n}
                </span>
                <span style={{ display: "block", marginTop: 10, fontSize: "14px", fontWeight: on ? 700 : 500, color: on ? "var(--ink)" : "var(--ink-45)" }}>{f.title}</span>
                <span className="mono" style={{ display: "block", marginTop: 3, fontSize: "9.5px", letterSpacing: "0.06em", color: "var(--ink-30)" }}>{f.stepper}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>{flow.blurb}</p>

      {flow.id === "payment" && (
        <div>
          <h4 className="font-light tracking-tight" style={{ fontSize: "1.15rem", color: "var(--ink)", marginBottom: 6 }}>Currency and Stripe account</h4>
          <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)", marginBottom: 16 }}>
            Charities in different regions are paid in different currencies, and the platform keeps a separate Stripe
            account for each currency. Which one a charity is created under is decided by its currency code alone.
          </p>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {[
              "The currency is set when the organisation is created, from the country it registers in: pounds for a UK charity, dollars for a US one, and so on. It is saved on the property and never asked for again.",
              "When Stripe onboarding starts, that currency travels with the request together with the STRIPE account code.",
              "The payments layer looks up the platform account for that pair and creates the charity's connected account under it. A UK charity therefore sits under the UK account and a US charity under the US one.",
              "The connected account id is saved on the charity's payment mapping. Every donation later reads it and is charged in the same currency, so money always reaches an account of the matching currency.",
            ].map((x, i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span className="mono" style={{ flexShrink: 0, width: 18, fontSize: "10px", color: ACCENT, paddingTop: 4 }}>{i + 1}</span>
                <span style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>{x}</span>
              </li>
            ))}
          </ol>
          <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 10 }}>Which account each currency lands in</p>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
            {[
              ["GBP", "UK - Charities - KWL"],
              ["USD", "US - Charities - KWL"],
              ["AUD", "AU - Charities - KWL"],
              ["CAD", "CA - Charities - KWL"],
              ["EUR", "EU - Charities - KWL"],
              ["NZD", "NZ - Charities - KWL"],
            ].map(([cur, acct], i) => (
              <div key={cur} className="flex flex-col sm:flex-row sm:items-center" style={{ gap: "6px 16px", padding: "12px 18px", borderTop: i > 0 ? "1px solid var(--rule)" : undefined, background: i % 2 ? "var(--paper-raised)" : undefined }}>
                <span className="mono" style={{ fontSize: "12px", color: "var(--ink)", minWidth: 210 }}>STRIPE · {cur}</span>
                <span className="mono" style={{ fontSize: "12px", color: "var(--ink-30)" }}>→</span>
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>{acct}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* steps + detail */}
      <div className="ob-panel">
        <div className="ob-steps" role="tablist" aria-label="Steps">
          {flow.steps.map((s, i) => {
            const on = i === si;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={on}
                onClick={() => setSi(i)}
                className="ob-step"
                style={{
                  borderLeft: on ? "2px solid var(--ink)" : "2px solid var(--rule)",
                  background: on ? "var(--paper-raised)" : "transparent",
                }}
              >
                <span className="mono" style={{ fontSize: "9.5px", color: on ? ACCENT : "var(--ink-30)" }}>{`${flow.n}.${i + 1}`}</span>
                <span style={{ fontSize: "13px", fontWeight: on ? 700 : 500, color: on ? "var(--ink)" : "var(--ink-45)", lineHeight: 1.4 }}>{s.title}</span>
              </button>
            );
          })}
        </div>

        <div className="ob-detail">
          <p className="mono" style={{ fontSize: "11px", color: "var(--ink)", padding: "10px 14px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper-raised)", overflowWrap: "anywhere" }}>
            {step.endpoint}
          </p>

          <div style={{ background: "#0a0a0a", borderRadius: 8, padding: "16px 18px", overflowX: "auto" }}>
            <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6f6f6f", marginBottom: 12 }}>Call path</p>
            <pre className="mono" style={{ margin: 0, fontSize: "11.5px", lineHeight: 1.8 }}>
              {step.chain.map((k, i) => (
                <div key={i} style={{ paddingLeft: k.d * 20, whiteSpace: "pre" }}>
                  <span style={{ color: "#4d4d4d" }}>{k.d > 0 ? "└ " : ""}</span>
                  <span style={{ color: "#9a9a9a" }}>{k.c}</span>
                  <span style={{ color: "#4d4d4d" }}>.</span>
                  <span style={{ color: "#f2f2f2", fontWeight: 700 }}>{k.m}</span>
                  <span style={{ color: "#4d4d4d" }}>()</span>
                </div>
              ))}
            </pre>
          </div>

          {step.writes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              <span className="mono" style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)", marginRight: 2 }}>writes</span>
              {step.writes.map((w) => (
                <span key={w} className="mono" style={{ fontSize: "10px", padding: "2px 8px", border: "1px dashed var(--ink-30)", borderRadius: 4, color: "var(--ink-45)" }}>{w}</span>
              ))}
            </div>
          )}

          {/* components in this step — carousel */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
              <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", flex: 1, minWidth: 0 }}>
                Components in this step · {components.length} {components.length === 1 ? "class" : "classes"}
              </p>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {([-1, 1] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => slide(dir)}
                    aria-label={dir === -1 ? "Previous components" : "Next components"}
                    className="mono"
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", cursor: "pointer", fontSize: "13px", lineHeight: 1 }}
                  >
                    {dir === -1 ? "‹" : "›"}
                  </button>
                ))}
              </div>
            </div>
            <div key={`${flow.id}-${step.id}`} ref={track} className="ob-components">
              {components.map((c) => (
                <div key={c.name} className="ob-card">
                  <p className="mono" style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>{c.name}</p>
                  <p className="mono" style={{ fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-30)", margin: "2px 0 8px" }}>{kindOf(c.name)}</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {c.methods.map((m) => (
                      <li key={m} className="mono" style={{ fontSize: "10.5px", lineHeight: 1.5, color: "var(--ink)", fontWeight: 700, overflowWrap: "anywhere" }}>
                        <span style={{ color: ACCENT }}>● </span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 12 }}>How it runs</p>
            <ol style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {step.how.map((h, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span className="mono" style={{ flexShrink: 0, width: 18, fontSize: "10px", color: ACCENT, paddingTop: 3 }}>{i + 1}</span>
                  <span style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>{h}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <style>{`
        .ob-flows { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; position: relative; }
        .ob-flows > button { position: relative; padding-top: 0; }
        .ob-flows > button::before {
          content: ""; position: absolute; top: 15px; left: 38px; right: -8px; height: 1px; background: var(--rule);
        }
        .ob-flows > button:last-child::before { display: none; }
        .ob-flows > button > span:first-child { position: relative; z-index: 1; }
        .ob-panel { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .ob-steps { display: flex; flex-direction: column; gap: 6px; }
        .ob-step {
          display: flex; gap: 10px; align-items: baseline; text-align: left; cursor: pointer;
          border: none; border-radius: 0 6px 6px 0; padding: 10px 14px; min-width: 0;
        }
        .ob-detail { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .ob-components { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; overscroll-behavior-x: contain; }
        .ob-card { flex: 0 0 300px; scroll-snap-align: start; border: 1px solid var(--rule); border-radius: 8px; padding: 12px 14px; align-self: stretch; }
        @media (min-width: 1024px) {
          .ob-panel { grid-template-columns: 250px minmax(0, 1fr); gap: 32px; align-items: start; }
          .ob-steps { flex-direction: column; flex-wrap: nowrap; gap: 6px; }
        }
        @media (max-width: 640px) {
          .ob-flows { gap: 6px; }
          .ob-flows > button::before { display: none; }
          .ob-flows > button { min-width: 0; }
          .ob-flows > button > span:nth-child(2) { font-size: 11.5px !important; line-height: 1.25; margin-top: 8px !important; }
          .ob-flows > button > span:nth-child(3) { font-size: 8px !important; letter-spacing: 0 !important; overflow-wrap: anywhere; }
        }
      `}</style>
    </div>
  );
}
