/* Shared schema data: drawn by DatabaseSchema (diagram) and listed by DataLayer (inventory).
   Fields are the key columns of each table, not every column. */

export type Field = { name: string; kind: "pk" | "fk" | "plain"; target?: string };

const pk = (name: string): Field => ({ name, kind: "pk" });
const fk = (name: string, target: string): Field => ({ name, kind: "fk", target });
const f  = (name: string): Field => ({ name, kind: "plain" });

export type RawEntity = { id: string; table: string; fields: Field[]; service: string };
export type Bucket = { key: string; label: string; entities: RawEntity[] };

export const BUCKETS: Bucket[] = [
  {
    key: "business", label: "Business Users",
    entities: [
      { id: "bum",  table: "business_user_master", service: "business-security-service", fields: [pk("seq_id"), f("username"), f("name"), f("email"), f("cognito_id"), f("account_status")] },
      { id: "brm",  table: "business_role_master", service: "business-security-service", fields: [pk("seq_id"), f("role_id"), f("role_name"), fk("property_id", "business_property_details"), f("status")] },
      { id: "brfm", table: "business_role_function_mapping", service: "business-security-service", fields: [pk("seq_id"), fk("role_id", "business_role_master"), f("function_id"), f("status")] },
      { id: "bspm", table: "business_staff_property_mapping", service: "business-security-service", fields: [pk("seq_id"), fk("username", "business_user_master"), fk("property_id", "business_property_details")] },
    ],
  },
  {
    key: "biz-onboarding", label: "Business Property",
    entities: [
      { id: "bpd",  table: "business_property_details", service: "business-security-service", fields: [pk("seq_id"), f("property_id"), fk("username", "business_user_master"), f("property_name"), fk("business_type", "business_types"), f("currency_code"), f("property_status")] },
      { id: "bppm", table: "business_property_psp_mapping", service: "business-security-service", fields: [pk("seq_id"), fk("property_id", "business_property_details"), f("psp_provider"), f("onboarding_type"), f("status")] },
      { id: "bppsd", table: "business_property_psp_split_details", service: "donation-service", fields: [pk("seq_id"), fk("property_id", "business_property_details"), f("psp_code"), f("platform"), f("currency_code")] },
      { id: "bpcd", table: "business_property_compliance_details", service: "donation-service", fields: [pk("seq_id"), fk("property_id", "business_property_details"), f("compliance_status"), f("reason"), f("disabled_features")] },
      { id: "btype",table: "business_types", service: "business-security-service", fields: [pk("seq_id"), f("business_type"), f("business_code")] },
      { id: "dsettings", table: "donation_settings", service: "donation-service", fields: [pk("seq_id"), fk("property_id", "business_property_details"), f("setting_group"), f("setting_key"), f("setting_value")] },
      { id: "gift",  table: "business_gift_aid_details", service: "donation-service", fields: [pk("seq_id"), f("gift_aid_id"), fk("property_id", "business_property_details"), f("name"), f("value"), f("status")] },
      { id: "feecfg", table: "default_fee_configuration", service: "donation-service", fields: [pk("seq_id"), f("order_source_id"), f("fee_type"), f("currency_code"), f("application_fee_type")] },
      { id: "taxdet", table: "default_tax_details", service: "donation-service", fields: [pk("seq_id"), f("country_code"), f("country_name"), f("tax_details")] },
    ],
  },
  {
    key: "donor", label: "Donor",
    entities: [
      { id: "um",   table: "user_master", service: "security-service", fields: [pk("seq_id"), f("username"), f("name"), f("email"), f("cognito_id"), f("user_status")] },
      { id: "donor", table: "public_donor", service: "donation-service", fields: [pk("seq_id"), f("donor_id"), fk("property_id", "business_property_details"), f("email"), f("first_name"), f("last_name")] },
    ],
  },
  {
    key: "campaigns", label: "Campaigns & Fundraising",
    entities: [
      { id: "camp", table: "donation_campaign", service: "donation-service", fields: [pk("seq_id"), f("campaign_id"), f("slug"), fk("property_id", "business_property_details"), f("title"), f("goal_amount"), f("raised_amount")] },
      { id: "fpage", table: "donation_fundraising_page", service: "donation-service", fields: [pk("seq_id"), f("fundraiser_id"), fk("campaign_id", "donation_campaign"), fk("event_id", "donation_events"), f("target_amount"), f("raised_amount")] },
      { id: "fsupp", table: "donation_fundraiser_supportors", service: "donation-service", fields: [pk("seq_id"), f("supporter_id"), fk("fundraiser_id", "donation_fundraising_page"), fk("campaign_id", "donation_campaign"), f("team_id"), f("email")] },
      { id: "impact",table: "donation_impact_level", service: "donation-service", fields: [pk("seq_id"), f("impact_level_id"), fk("campaign_id", "donation_campaign"), fk("fundraiser_id", "donation_fundraising_page"), f("amount"), f("label")] },
    ],
  },
  {
    key: "donations", label: "Donations",
    entities: [
      { id: "drec",  table: "donation_record", service: "donation-service", fields: [pk("seq_id"), f("donation_id"), f("order_id"), fk("campaign_id", "donation_campaign"), fk("fundraiser_id", "donation_fundraising_page"), fk("impact_level_id", "donation_impact_level"), f("amount"), f("stripe_subscription_id")] },
      { id: "order",  table: "user_order_details", service: "security-service", fields: [pk("seq_id"), f("order_id"), fk("property_id", "business_property_details"), fk("username", "user_master"), f("order_status"), f("grand_total")] },
      { id: "utd",   table: "user_transaction_details", service: "donation-service", fields: [pk("seq_id"), fk("order_id", "user_order_details"), f("transaction_id"), f("payment_intent_id"), f("payment_intent_request")] },
    ],
  },
  {
    key: "events", label: "Events",
    entities: [
      { id: "ev",    table: "donation_events", service: "donation-service", fields: [pk("seq_id"), f("event_id"), fk("property_id", "business_property_details"), fk("campaign_id", "donation_campaign"), f("title"), f("start_date"), f("end_date")] },
      { id: "evreg", table: "donation_event_registration", service: "donation-service", fields: [pk("seq_id"), f("registration_id"), fk("event_id", "donation_events"), fk("supporter_id", "donation_fundraiser_supportors"), fk("campaign_id", "donation_campaign"), f("status")] },
    ],
  },
  {
    key: "shop", label: "Shop & Hardware",
    entities: [
      { id: "hword",  table: "donation_hardware_order", service: "donation-service", fields: [pk("seq_id"), f("order_id"), fk("property_id", "business_property_details"), f("customer_email"), f("amount_total"), f("stripe_session_id"), f("status")] },
      { id: "hwitem", table: "donation_hardware_order_item", service: "donation-service", fields: [pk("seq_id"), fk("order_id", "donation_hardware_order"), f("product_id"), f("product_name"), f("unit_amount"), f("quantity")] },
      { id: "hwinv",  table: "donation_hardware_invoice", service: "donation-service", fields: [pk("seq_id"), f("invoice_id"), fk("order_id", "donation_hardware_order"), fk("property_id", "business_property_details"), f("stripe_invoice_id")] },
    ],
  },
  {
    key: "webhook", label: "Webhook & Payment Events",
    entities: [
      { id: "paywh",  table: "payment_webhook_request", service: "webhook-service", fields: [pk("seq_id"), f("username"), fk("order_id", "user_order_details"), fk("property_id", "business_property_details"), f("transaction_id"), f("event_type")] },
      { id: "conwh",  table: "connect_account_webhook_request", service: "webhook-service", fields: [pk("seq_id"), f("username"), fk("property_id", "business_property_details"), f("event_type"), f("status")] },
    ],
  },
];


