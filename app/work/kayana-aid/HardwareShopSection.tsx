import type { CSSProperties, ReactNode } from "react";

/* Hardware shop & checkout, in the order it happens: connect to the company database, list products,
   check out, then what follows payment. Read from the donation service (catalogue, checkout, CRM write-back),
   the payments layer (Stripe account lookup) and the webhook service (payment result). */

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };
const Mono = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "12px", color: "var(--ink)" }}>{children}</span>
);
const Cap = ({ children }: { children: ReactNode }) => (
  <p className="mono" style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 8 }}>{children}</p>
);
const Steps = ({ items }: { items: ReactNode[] }) => (
  <ol style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {items.map((t, i) => (
      <li key={i} style={{ display: "flex", gap: 14, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
        <span className="mono" style={{ flexShrink: 0, width: 16, fontSize: "10px", color: "#c9971f", paddingTop: 4 }}>{i + 1}</span>
        <span>{t}</span>
      </li>
    ))}
  </ol>
);
const Code = ({ children }: { children: string }) => (
  <pre className="mono" style={{ margin: 0, background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 8, padding: "16px 18px", fontSize: "11.5px", lineHeight: 1.75, color: "var(--ink)", overflowX: "auto" }}>
    <code>{children}</code>
  </pre>
);
const B = ({ children }: { children: ReactNode }) => <b style={{ color: "var(--ink)", fontWeight: 600 }}>{children}</b>;
const Stage = ({ n, title, lead, children }: { n: number; title: string; lead: ReactNode; children: ReactNode }) => (
  <div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
      <span className="mono" style={{ fontSize: "12px", color: "#c9971f" }}>{n}</span>
      <h4 className="font-light tracking-tight" style={{ fontSize: "1.15rem", color: "var(--ink)" }}>{title}</h4>
    </div>
    <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)", marginBottom: 22, paddingLeft: 24 }}>{lead}</p>
    <div style={{ paddingLeft: 24 }}>{children}</div>
  </div>
);

const OUTLINE = ["Connect to the company database", "List the products", "Check out", "After payment"];

/* 1 */
const DBS: { name: string; holds: string; conn: string; hot?: boolean }[] = [
  { name: "Primary database", holds: "Shop orders, order items, invoices, charity properties", conn: "The service's default connection" },
  { name: "Company database", holds: "Products, regions, regional prices, stock, and the sales CRM", conn: "A second connection with its own login and pool", hot: true },
];
const CONFIG = `@EnableJpaRepositories(
    basePackages            = "…external.repositories",
    entityManagerFactoryRef = "externalEntityManagerFactory",
    transactionManagerRef   = "externalTransactionManager")

@Transactional(transactionManager = "externalTransactionManager", readOnly = true)
listHardwareProducts(propertyId)`;

/* 2 */
const LIST_STEPS: ReactNode[] = [
  <><B>Pick the region.</B> The property&apos;s country and currency choose a location: the exact pair first, then the first location with that currency. A guest sends the location of the currency they picked, else the default one.</>,
  <><B>Load the prices.</B> Every price row for that location is read once and keyed by product. A product is sold in a region only if it has a row there.</>,
  <><B>Load the products.</B> Active products on the donations platform are read and kept only if they have a price.</>,
  <><B>Add stock.</B> Available quantity is summed per product, and each item is returned with the row&apos;s price and currency.</>,
];
const ENDPOINTS: [string, string][] = [
  ["GET /donation/hardware-products", "signed-in charity"],
  ["GET /donation/public/hardware-locations", "regions for the currency switcher"],
  ["GET /donation/public/hardware-products", "guest shop"],
];

/* 3 */
const CHECKOUT_STEPS: ReactNode[] = [
  <>A signed-in charity must be Active. A guest has no property, so an email is required.</>,
  <>The currency is the property&apos;s. For a guest it is the currency of the region they picked.</>,
  <>Each product is read again from the company database. It must be active and sellable, and its price is the location price, else the product default. The cart total is worked out in minor units.</>,
  <>An embedded Stripe Checkout Session is requested for a one-time payment, on the company route. The payments layer finds the company&apos;s Stripe account for that currency and creates the session there.</>,
  <>A PENDING order and one item row per product are saved in the primary database, keyed by the session id. The client secret and publishable key go back to the buyer.</>,
];
const ROUTES: { who: string; title: string; lines: string[]; hot?: boolean }[] = [
  { who: "A donation", title: "Lands with the charity", lines: ["Charged on the charity's connected account.", "The platform keeps an application fee."] },
  { who: "A hardware order", title: "Lands with the company", hot: true, lines: ["Charged on the company's own Stripe account, the one that also bills software.", "No connected account and no application fee."] },
];
const REQUEST = `mode      payment            // one-time, not recurring
uiMode    embedded
amount    149900 GBP         // minor units, in the resolved currency
route     company account    // with the currency, picks the Stripe account
→ client_secret, publishable_key`;

/* 4 */
const AFTER: ReactNode[] = [
  <>The payment is taken on the company&apos;s Stripe account for hardware and software, and that account is per currency. A GBP order is paid into the company&apos;s GBP account, a USD order into its USD account, and so on. The currency was fixed at checkout, so the money reaches the matching account.</>,
  <>Stripe reports <Mono>checkout.session.completed</Mono>. The webhook service finds the order by session id and marks it PAID with the paid date. A repeat event is skipped.</>,
  <>An invoice row is written against the payment, and the confirmation email is sent from the country&apos;s template.</>,
  <>The return call answers “still processing” until the order is PAID or FAILED, so the buyer&apos;s page can retry.</>,
  <>Then the company&apos;s CRM is updated, in the company database: a PAID order creates a sales order (with its quote, items, paid invoice and the customer&apos;s contact, organisation and deal), and a failed one creates a lead. Each is skipped if already recorded.</>,
];

const ACCOUNTS: [string, string][] = [
  ["GBP", "UK - Software & Hardware - KWL"],
  ["USD", "USA - Software & Hardware - KFB"],
  ["AUD", "AUS - Software & Hardware - KFB"],
  ["CAD", "CAN - Software & Hardware - KFB"],
  ["EUR", "EU - Software & Hardware - KI"],
];

export default function HardwareShopSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Hardware Shop &amp; Checkout
        </h3>
        <p style={P}>
          The shop sells donation kiosks and card terminals. Its catalogue is not in the platform&apos;s own database but
          in the company&apos;s inventory database, and its payments go to the company&apos;s own Stripe account rather
          than a charity&apos;s. It runs in four steps.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
          {OUTLINE.map((o, i) => (
            <div key={o} style={{ padding: "12px 14px", borderLeft: i > 0 ? "1px solid var(--rule)" : undefined }}>
              <p className="mono" style={{ fontSize: "10px", color: "#c9971f" }}>{i + 1}</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{o}</p>
            </div>
          ))}
        </div>
      </div>

      <Stage
        n={1}
        title="Connect to the company database"
        lead="The donation service holds two sets of database wiring side by side. A repository uses one or the other according to its package."
      >
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
          {DBS.map((d) => (
            <div key={d.name} style={{ border: d.hot ? "1px solid var(--ink)" : "1px solid var(--rule)", borderRadius: 8, padding: "14px 16px" }}>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>{d.name}</p>
              <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-45)", marginTop: 6 }}>{d.holds}</p>
              <p className="mono" style={{ fontSize: "10px", color: "var(--ink-30)", marginTop: 8 }}>{d.conn}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, marginTop: 24, alignItems: "start" }}>
          <div>
            <Cap>How the second connection is wired</Cap>
            <Code>{CONFIG}</Code>
          </div>
          <div>
            <Cap>Worth knowing</Cap>
            <Steps
              items={[
                <>The service never changes this database&apos;s schema. Its entities only describe tables that already exist.</>,
                <>Two databases cannot share one transaction, so an order is saved in the primary one and its sales order in the company one as separate commits, each safe to repeat.</>,
                <>Nothing joins across them. Where both are needed, the service combines the results in code.</>,
              ]}
            />
          </div>
        </div>
      </Stage>

      <Stage
        n={2}
        title="List the products"
        lead="The catalogue is regional: what a charity sees, and what it pays, depends on its region and currency. Because it lives in the other database, the listing is built from four reads inside one read-only transaction on that connection."
      >
        <Steps items={LIST_STEPS} />
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 16 }}>
          So the same shop looks different by region: a UK charity sees pounds, a US charity dollars, and a product
          appears only in the regions where it has a price. A guest can switch region from the currency switcher.
          A region with no locations returns an empty list.
        </p>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column" }}>
          {ENDPOINTS.map(([e, d], i) => (
            <div key={e} className="flex flex-col sm:flex-row sm:items-baseline" style={{ gap: "2px 18px", padding: "9px 0", borderTop: i === 0 ? "1px solid var(--rule)" : undefined, borderBottom: "1px solid var(--rule)" }}>
              <Mono>{e}</Mono>
              <span style={{ fontSize: "12.5px", color: "var(--ink-45)" }}>{d}</span>
            </div>
          ))}
        </div>
      </Stage>

      <Stage
        n={3}
        title="Check out"
        lead={<><Mono>POST /donation/hardware/checkout/initiate</Mono> takes one product or a cart, and a public version of it runs the same code for guests.</>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, alignItems: "start" }}>
          <Steps items={CHECKOUT_STEPS} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Cap>What the Stripe session is created with</Cap>
              <Code>{REQUEST}</Code>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
              {ROUTES.map((r) => (
                <div key={r.who} style={{ border: r.hot ? "1px solid var(--ink)" : "1px solid var(--rule)", borderRadius: 8, padding: "12px 14px" }}>
                  <p className="mono" style={{ fontSize: "10px", color: "#c9971f" }}>{r.who}</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{r.title}</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
                    {r.lines.map((l) => <li key={l} style={{ fontSize: "12px", lineHeight: 1.55, color: "var(--ink-45)" }}>{l}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Stage>

      <Stage
        n={4}
        title="After payment"
        lead="The money goes to the company's Stripe account for the order's currency. Nothing is marked paid on the buyer's say-so: Stripe's event does it, and the rest follows."
      >
        <Steps items={AFTER} />
        <div style={{ marginTop: 24 }}>
          <Cap>Which company account each currency lands in</Cap>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
            {ACCOUNTS.map(([cur, acct], i) => (
              <div key={cur} className="flex flex-col sm:flex-row sm:items-center" style={{ gap: "6px 16px", padding: "12px 18px", borderTop: i > 0 ? "1px solid var(--rule)" : undefined, background: i % 2 ? "var(--paper-raised)" : undefined }}>
                <span className="mono" style={{ fontSize: "12px", color: "var(--ink)", minWidth: 210 }}>STRIPE · {cur}</span>
                <span className="mono" style={{ fontSize: "12px", color: "var(--ink-30)" }}>→</span>
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>{acct}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 16 }}>
          Orders that never finish are tidied up: closing the checkout sets the order to CANCELLED and records a lead, and an hourly job marks any order still PENDING as EXPIRED.
        </p>
      </Stage>
    </div>
  );
}
