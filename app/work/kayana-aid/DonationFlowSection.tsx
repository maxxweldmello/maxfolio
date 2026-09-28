import type { CSSProperties, ReactNode } from "react";

/* Donation & payment flow — how a gift becomes an order, a transaction and a paid donation, and how the
   fee is taken. Read from the donation service (initiation) and the webhook service (payment events). */

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };
const Mono = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "12px", color: "var(--ink)" }}>{children}</span>
);
const Sub = ({ children }: { children: ReactNode }) => (
  <h4 className="font-light tracking-tight" style={{ fontSize: "1.15rem", color: "var(--ink)", marginBottom: 6 }}>{children}</h4>
);
const Lead = ({ children }: { children: ReactNode }) => (
  <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)", marginBottom: 22 }}>{children}</p>
);
const Tag = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.06em", padding: "2px 8px", border: "1px solid var(--ink-30)", borderRadius: 999, color: "var(--ink)" }}>{children}</span>
);

/* ── 1. journey: sequence diagram ── */
const LANES = [
  { id: "donor", x: 100, name: "Donor" },
  { id: "donation", x: 320, name: "Donation service" },
  { id: "stripe", x: 560, name: "Stripe" },
  { id: "webhook", x: 790, name: "Webhook service" },
] as const;
type LaneId = (typeof LANES)[number]["id"];
const laneX = (id: LaneId) => LANES.find((l) => l.id === id)!.x;

type Msg = { n: number; from: LaneId; to: LaneId; label: string; dashed?: boolean };
const MSGS: Msg[] = [
  { n: 1, from: "donor", to: "donation", label: "initiate-donation" },
  { n: 2, from: "donation", to: "donor", label: "client secret", dashed: true },
  { n: 3, from: "donation", to: "stripe", label: "create payment" },
  { n: 4, from: "donor", to: "stripe", label: "card authorised" },
  { n: 5, from: "stripe", to: "webhook", label: "amount_capturable_updated" },
  { n: 6, from: "webhook", to: "stripe", label: "capture + application fee" },
  { n: 7, from: "stripe", to: "webhook", label: "payment_intent.succeeded" },
  { n: 8, from: "webhook", to: "stripe", label: "tip, if any (off-session)" },
  { n: 9, from: "donor", to: "donation", label: "confirm-donation" },
];
const ROW0 = 96;
const ROW = 46;

function Journey() {
  const h = ROW0 + MSGS.length * ROW + 30;
  return (
    <svg viewBox={`0 0 900 ${h}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Sequence of a donation between donor, donation service, Stripe and webhook service">
      <defs>
        <marker id="dj-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--ink-45)" />
        </marker>
      </defs>
      {LANES.map((l) => (
        <g key={l.id}>
          <rect x={l.x - 70} y={14} width={140} height={34} rx={6} fill="var(--paper-raised)" stroke="var(--rule)" />
          <text x={l.x} y={36} textAnchor="middle" className="mono" fontSize="11" fontWeight="700" fill="var(--ink)">{l.name}</text>
          <line x1={l.x} y1={48} x2={l.x} y2={h - 10} stroke="var(--rule)" strokeDasharray="3 4" />
        </g>
      ))}
      {MSGS.map((m, i) => {
        const y = ROW0 + i * ROW;
        const x1 = laneX(m.from);
        const x2 = laneX(m.to);
        const dir = x2 > x1 ? 1 : -1;
        const mid = (x1 + x2) / 2;
        return (
          <g key={m.n}>
            <line x1={x1} y1={y} x2={x2 - dir * 4} y2={y} stroke="var(--ink-45)" strokeWidth="1" strokeDasharray={m.dashed ? "4 3" : undefined} markerEnd="url(#dj-arrow)" />
            <circle cx={x1 + dir * 0} cy={y} r={9} fill="var(--ink)" />
            <text x={x1} y={y + 3.5} textAnchor="middle" className="mono" fontSize="9.5" fontWeight="700" fill="var(--paper)">{m.n}</text>
            <text x={mid} y={y - 8} textAnchor="middle" className="mono" fontSize="10" fill="var(--ink-45)">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 2. records written ── */
type RecordCard = { title: string; table: string; donor: string[]; system: string[]; starts: string[] };
const RECORDS: RecordCard[] = [
  {
    title: "Donation record",
    table: "donation_record",
    donor: ["First and last name", "Email and mobile", "Message", "Anonymous flag", "Amount", "One-off or monthly", "Impact level chosen", "Gift Aid flag and terms consent"],
    system: ["Donation id", "Donor id (per charity, by email)", "Order id", "Campaign and fundraiser ids", "Charity's currency", "Source"],
    starts: ["PENDING"],
  },
  {
    title: "Order",
    table: "user_order_details",
    donor: ["Gift Aid name and address (kept as additional info)"],
    system: [
      "Order id, charity id, user GUEST",
      "Type and source DONATION, Stripe charity payment",
      "Subtotal and grand total (amount plus service tax)",
      "Card payment mode, reference number",
      "Tax details: service tax, application fee, authorisation fee, Gift Aid amount, tip amount",
    ],
    starts: ["ORDER_PLACED", "PAYMENT_INITIATED"],
  },
  {
    title: "Transaction",
    table: "user_transaction_details",
    donor: [],
    system: ["Transaction id and order id", "Charity id, payment mode, subtotal", "The payment request that was sent", "The payment response that came back"],
    starts: ["INITIATED"],
  },
];

/* ── 2b. currency accounts ── */
const CURRENCIES = ["GBP", "USD", "AUD", "CAD", "EUR", "NZD"];
const MASTER_ROWS: [string, string][] = [
  ["GBP", "UK - Charities - KWL"],
  ["USD", "US - Charities - KWL"],
  ["AUD", "AU - Charities - KWL"],
];
const MONEY_PATH: { t: string; d: string }[] = [
  { t: "Donor's card", d: "Charged in the charity's currency" },
  { t: "Platform account", d: "The one for that currency" },
  { t: "Connected account", d: "The charity's own, created under it" },
];
const FILTER = `// one filter on the Stripe client: every outgoing call passes through it
currency = request.attribute("currency")            // the charity's currency
psp      = request.attribute("psp_code")            // STRIPE for donations
master   = superMerchantMaster.find(psp, currency, status = ACTIVE)
request.header("Authorization", "Bearer " + master.accessInfo.apiKeys[0].key)`;

/* ── 3. fee ── */
const FEE_STEPS: string[] = [
  "The authorisation event carries the card's variant, funding source and issuer country. Together they decide the card band: local debit, local credit, international or commercial, or other.",
  "Three amounts make up the fee. The application fee was stamped on the order at initiation. The authorisation fee is a per-transaction amount, set to zero for a charity inside its promotion window. The card fee is the band's percentage of the donation. Rates come from the charity's own fee schedule, with the default fee table as fallback.",
  "Their sum is the total fee, and it is written back into the order's tax details together with the band, funding source and payment method.",
  "The capture call to Stripe carries the amount to capture and an application-fee amount equal to that total. Stripe keeps the fee for the platform and the remainder stays with the charity's connected account. A charity set to postpaid settlement has no fee taken at capture.",
  "Any revenue split configured for the charity is then applied to the fee, and the order and transaction move to CAPTURE_INITIATED.",
];
const SEGMENTS: { label: string; w: number; tone: string }[] = [
  { label: "Charity receives", w: 78, tone: "var(--ink)" },
  { label: "Card fee", w: 10, tone: "var(--ink-45)" },
  { label: "Authorisation", w: 4, tone: "var(--ink-30)" },
  { label: "Application", w: 8, tone: "#c9971f" },
];

/* ── 4. events ── */
type Ev = { stripe: string; code: string; does: string[] };
const EVENTS: Ev[] = [
  {
    stripe: "payment_intent.amount_capturable_updated",
    code: "AUTHORISATION",
    does: [
      "The card is authorised. Fees are worked out and the capture call is made, as above.",
      "The order and transaction become CAPTURE_INITIATED, and the donation record becomes PAID.",
      "The donor profile is created or refreshed, unless the gift is anonymous. The campaign and fundraiser totals go up, the campaign completes if the goal is met, and the receipt email is sent.",
    ],
  },
  {
    stripe: "payment_intent.succeeded",
    code: "CAPTURE",
    does: [
      "The money is captured. The transaction becomes COMPLETED and the order PAID and handed over.",
      "The donation handling runs again and is skipped, because the record is already PAID.",
      "If the payment carried a tip, it is charged now as a separate off-session payment on the platform account, and the tip status in the order becomes PAID or FAILED.",
    ],
  },
  {
    stripe: "payment_intent.canceled",
    code: "CANCELLATION",
    does: ["The transaction becomes CANCELLED and the order PAYMENT_CANCELLED."],
  },
  {
    stripe: "refund.succeeded · charge.refunded",
    code: "REFUND",
    does: [
      "A full refund marks the transaction REFUNDED, the order PAYMENT_REFUNDED, and moves the order to ORDER_REJECTED.",
      "A partial refund marks them PARTIAL_REFUND and PAYMENT_PARTIAL_REFUNDED and leaves the order otherwise as it was.",
    ],
  },
  {
    stripe: "charge.dispute.created · charge.dispute.closed",
    code: "CHARGEBACK",
    does: ["The order is flagged as disputed, with the dispute status and its defence deadline. It stays PAID; closing a dispute is mapped as won or lost."],
  },
  {
    stripe: "payment_intent.payment_failed · charge.failed · refund.failed",
    code: "REFUSAL · CAPTURE_FAILED · REFUND_FAILED",
    does: [
      "The mapper recognises these and gives them their own codes, but the payment handler has no branch that acts on them. The order and transaction stay as they were, the donation record stays PENDING, and no total moves.",
    ],
  },
];

export default function DonationFlowSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Donation &amp; Payment Flow
        </h3>
        <p style={P}>
          A donation is made in two halves. The donation service accepts the request, records who is giving and
          what, and sets up the payment. The webhook service then reacts to what Stripe reports, takes the fee and
          marks the gift paid. Nothing is marked paid on the donor&apos;s say-so.
        </p>
        <p style={P}>
          The path below is for a one-off gift. Monthly gifts are set up as a Stripe subscription and follow their own recurring path.
        </p>
      </div>

      {/* journey */}
      <div>
        <Sub>The journey</Sub>
        <Lead>Nine messages, in order. Solid arrows are requests; the dashed one is a reply.</Lead>
        <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "12px 8px", overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}><Journey /></div>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 12 }}>
          Messages 5 and 7 do not reach the webhook service directly: Stripe&apos;s events are published to Kafka and
          consumed there, then handed to the same webhook handler.
        </p>
      </div>

      {/* initiation */}
      <div>
        <Sub>Making the donation</Sub>
        <Lead>
          <Mono>POST /donation/public/initiate-donation</Mono> runs in <Mono>DonationRecordService.initiateDonation</Mono>. It needs no login.
        </Lead>
        <ol style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {[
            "Guards: the campaign must be ACTIVE and not past its end date; the charity must be ACTIVE, with Stripe charges enabled and transactions allowed.",
            "The charity's Stripe connected account is read from its payment mapping. The currency is the charity's own, saved on its property, so a donor never chooses it.",
            "Service tax is worked out from the charity's tax settings, giving the grand total.",
            "The order is saved, then a reference number is generated, then the application fee is calculated and stamped on it.",
            "The payment is created with Stripe against the connected account, using the charity-donations account for that currency. If the donor added a tip, a Stripe customer is created first so the card can be reused later.",
            "The transaction row is saved with the request and response, the Gift Aid amount and address are added if asked for, the donor profile is created or updated, and the donation record is saved as PENDING.",
          ].map((t, i) => (
            <li key={i} style={{ display: "flex", gap: 14, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
              <span className="mono" style={{ flexShrink: 0, width: 16, fontSize: "10px", color: "#c9971f", paddingTop: 4 }}>{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 16, alignItems: "start" }}>
          {RECORDS.map((r) => (
            <div key={r.table} style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "var(--ink)", color: "var(--paper)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700 }}>{r.title}</p>
                <p className="mono" style={{ fontSize: "9.5px", opacity: 0.6, marginTop: 2 }}>{r.table}</p>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                {r.donor.length > 0 && (
                  <div>
                    <p className="mono" style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 6 }}>From the donor</p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {r.donor.map((f) => <li key={f} style={{ fontSize: "12.5px", lineHeight: 1.55, color: "var(--ink)" }}>{f}</li>)}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="mono" style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 6 }}>Set by the system</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {r.system.map((f) => <li key={f} style={{ fontSize: "12.5px", lineHeight: 1.55, color: "var(--ink-45)" }}>{f}</li>)}
                  </ul>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 10, borderTop: "1px dashed var(--ink-30)" }}>
                  <span className="mono" style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)" }}>starts as</span>
                  {r.starts.map((s) => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* currency accounts */}
      <div>
        <Sub>Right currency, right Stripe account</Sub>
        <Lead>
          Charities are paid in their own currency, and Stripe accounts are per currency. The payments layer keeps one
          platform account row for each currency, and every Stripe call is signed with the key of the row it matches. The
          donation service never chooses a key.
        </Lead>
        <div className="grid grid-cols-1 lg:grid-cols-[150px_1fr_1.1fr]" style={{ gap: 18, alignItems: "stretch" }}>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "14px 16px" }}>
            <p className="mono" style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 8 }}>Currency</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} className="lg:flex-col">
              {CURRENCIES.map((c) => (
                <span key={c} className="mono" style={{ fontSize: "11px", color: "var(--ink)", padding: "2px 8px", border: "1px solid var(--ink-30)", borderRadius: 4, width: "fit-content" }}>{c}</span>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--ink)", color: "var(--paper)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700 }}>Platform account per currency</p>
              <p className="mono" style={{ fontSize: "9.5px", opacity: 0.6, marginTop: 2 }}>one row per (STRIPE, currency)</p>
            </div>
            {MASTER_ROWS.map(([c, acct], i) => (
              <div key={c} style={{ padding: "10px 16px", borderTop: i > 0 ? "1px solid var(--rule)" : undefined }}>
                <p className="mono" style={{ fontSize: "11px", color: "var(--ink)" }}>STRIPE · {c}</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{acct}</p>
                <p className="mono" style={{ fontSize: "9.5px", color: "var(--ink-30)", marginTop: 2 }}>account id · secret key · publishable key · status</p>
              </div>
            ))}
            <p className="mono" style={{ fontSize: "9.5px", color: "var(--ink-30)", padding: "8px 16px", borderTop: "1px solid var(--rule)" }}>shape only · six currencies are supported</p>
          </div>

          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
            {MONEY_PATH.map((m, i) => (
              <div key={m.t}>
                <div style={{ border: "1px solid var(--rule)", background: "var(--paper-raised)", borderRadius: 6, padding: "9px 12px" }}>
                  <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)" }}>{m.t}</p>
                  <p style={{ fontSize: "12px", color: "var(--ink-45)", marginTop: 1 }}>{m.d}</p>
                </div>
                {i < MONEY_PATH.length - 1 && <p className="mono" style={{ textAlign: "center", fontSize: "12px", color: "var(--ink-30)", lineHeight: 1.6 }}>↓</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, marginTop: 24, alignItems: "start" }}>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "The currency is fixed early: it is saved on the charity's property when the organisation is created, so a donor never chooses it.",
              <>
                The connected account was created under the platform account for that same currency during charity
                onboarding, so the payment goes into the right connected account and its currency always matches (see{" "}
                <a href="#charity-onboarding" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>Charity Onboarding · Payment setup</a>).
              </>,
              "Each Stripe call carries the currency and the account code. A request filter looks up the ACTIVE row for that pair and adds its key. A currency with no active row simply cannot be charged.",
              "The order stores its account code and currency. Capture, refunds, revenue splits and the tip charge all read them back, so every later call reaches the same account.",
            ].map((t, i) => (
              <li key={i} style={{ display: "flex", gap: 14, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
                <span className="mono" style={{ flexShrink: 0, width: 16, fontSize: "10px", color: "#c9971f", paddingTop: 4 }}>{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <pre className="mono" style={{ margin: 0, background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 8, padding: "16px 18px", fontSize: "11.5px", lineHeight: 1.75, color: "var(--ink)", overflowX: "auto" }}>
            <code>{FILTER}</code>
          </pre>
        </div>
      </div>

      {/* fee */}
      <div>
        <Sub>How the fee is cut</Sub>
        <Lead>
          The fee is taken at capture, inside <Mono>PaymentWebhookService.capturePayment</Mono>, not at initiation. Initiation only works out and stamps the application fee.
        </Lead>
        <div style={{ display: "flex", height: 30, borderRadius: 6, overflow: "hidden", border: "1px solid var(--rule)" }}>
          {SEGMENTS.map((s) => (
            <div key={s.label} style={{ width: `${s.w}%`, background: s.tone }} title={s.label} />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 10 }}>
          {SEGMENTS.map((s) => (
            <span key={s.label} className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "10px", color: "var(--ink-45)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.tone }} />{s.label}
            </span>
          ))}
          <span className="mono" style={{ fontSize: "10px", color: "var(--ink-30)" }}>· not to scale</span>
        </div>
        <ol style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {FEE_STEPS.map((t, i) => (
            <li key={i} style={{ display: "flex", gap: 14, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
              <span className="mono" style={{ flexShrink: 0, width: 16, fontSize: "10px", color: "#c9971f", paddingTop: 4 }}>{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* events */}
      <div>
        <Sub>Every payment event</Sub>
        <Lead>
          Stripe&apos;s events are published to a Kafka topic and read by <Mono>KafkaStripeWebhookEventListener</Mono>, which passes
          each to <Mono>PaymentWebhookController.handleStripeWebhook</Mono>. <Mono>StripeWebhookEventMapper</Mono> turns the
          event into a notification with a payment code, and <Mono>PaymentWebhookService.processPaymentEvent</Mono> finds the
          order and transaction by their reference and acts on the code.
        </Lead>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {EVENTS.map((e) => (
            <div key={e.code} className="dj-event">
              <div className="dj-event-head">
                <p className="mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{e.code}</p>
                <p className="mono" style={{ fontSize: "10px", color: "var(--ink-30)", marginTop: 4, overflowWrap: "anywhere" }}>{e.stripe}</p>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {e.does.map((d, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
                    <span style={{ flexShrink: 0, marginTop: 10, width: 4, height: 4, borderRadius: "50%", background: "var(--ink-30)" }} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 16 }}>
          Every step is safe to repeat. Once a donation record is PAID, a replayed event is skipped, so a duplicate delivery
          cannot double-count a gift.
        </p>
      </div>

      <style>{`
        .dj-event { display: grid; grid-template-columns: 1fr; gap: 12px; padding: 16px 0 16px 18px; border-left: 2px solid var(--ink); }
        @media (min-width: 900px) { .dj-event { grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr); gap: 32px; } }
      `}</style>
    </div>
  );
}
