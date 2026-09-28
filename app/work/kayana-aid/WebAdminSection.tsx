import type { CSSProperties, ReactNode } from "react";

/* The web admin's own APIs, called from the site's server routes with keys held on the server:
   Website Leads and Bookings (CRM), and Policy Hub (legal text and consent). */

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };
const Mono = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "11px", color: "var(--ink)" }}>{children}</span>
);

const CARDS: { n: number; title: string; uses: string; calls: string[]; lines: ReactNode[] }[] = [
  {
    n: 1,
    title: "Website Leads",
    uses: "Sales CRM",
    calls: ["POST /api/crm/website-leads", "PATCH /api/crm/website-leads/{id}/stage"],
    lines: [
      <>The first signup step creates a lead. The CRM upserts on platform and external user id, so a repeat never duplicates it.</>,
      <>Later steps move it forward only: signed_up, email_verified, business_signed_up, payment_setup, activated. <Mono>business_signed_up</Mono> also needs the organisation name and country.</>,
      <>It is best-effort. The route always answers 200 and a CRM failure is only logged, so it never blocks signup.</>,
    ],
  },
  {
    n: 2,
    title: "Bookings",
    uses: "Book a demo",
    calls: ["GET /api/crm/bookings/availability", "POST /api/crm/bookings"],
    lines: [
      <>Availability is read for a start date and a number of days, about two months on the demo page.</>,
      <>A booking needs a start time, name and email. Phone, company and notes are optional. The CRM returns the booking status, a meet link and a manage link.</>,
      <>A missing field is a 400, an unset integration a 503, and an unreachable CRM a 502.</>,
    ],
  },
  {
    n: 3,
    title: "Policy Hub: reading",
    uses: "Legal pages",
    calls: ["GET /api/policy-hub/public?slug="],
    lines: [
      <>Terms, privacy, SMS and cookie policies are fetched by slug, with the visitor&apos;s region and locale.</>,
      <>Terms, privacy and cookies fall back from the hub to the CMS and then to bundled text. The SMS policy comes from the hub only.</>,
      <>Only the configured hub is ever called. A missing PROD hub never serves DEV text.</>,
    ],
  },
  {
    n: 4,
    title: "Policy Hub: consent",
    uses: "Terms acceptance",
    calls: ["POST /api/policy-hub/accept"],
    lines: [
      <>Sent when a charity signs up and when a donor gives on a donate page, the widget or a fundraiser page. It carries the terms version, the person and a source tag.</>,
      <>The server adds the real client IP and user agent, so the hub records the person and not the proxy.</>,
      <>Consent has its own base URL, defaulting to the reading one. It is fire-and-forget, and a failure never stops the flow.</>,
    ],
  },
];

export default function WebAdminSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Web Admin Integrations
        </h3>
        <p style={P}>
          The company&apos;s web admin also exposes APIs, used for four separate jobs. The site calls them from its own
          server routes, so the keys stay on the server and the browser only ever talks to the site. The base URL comes
          from the environment, which is how development and production each reach their own web admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
        {CARDS.map((c) => (
          <div key={c.n} style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p className="mono" style={{ fontSize: "10px", color: "#c9971f" }}>{c.n} · {c.uses}</p>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{c.title}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {c.calls.map((x) => (
                <p key={x} className="mono" style={{ fontSize: "10.5px", color: "var(--ink)", background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", overflowWrap: "anywhere" }}>{x}</p>
              ))}
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {c.lines.map((l, i) => (
                <li key={i} style={{ fontSize: "12.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
