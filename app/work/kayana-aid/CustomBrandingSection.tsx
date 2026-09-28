import type { CSSProperties, ReactNode } from "react";

/* Custom branding, in the order it happens: the look is stored as one document, a subdomain is requested,
   activated, and then every public call for that domain is answered for that one charity. Read from the
   donation service (settings and public controllers). */

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
const Writes = ({ items }: { items: string[] }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 16 }}>
    <span className="mono" style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)", marginRight: 2 }}>stores</span>
    {items.map((w) => (
      <span key={w} className="mono" style={{ fontSize: "10px", padding: "2px 8px", border: "1px dashed var(--ink-30)", borderRadius: 4, color: "var(--ink-45)" }}>{w}</span>
    ))}
  </div>
);

/* 1. the look */
const DOC = `// business_property_details.custom_branding   (one jsonb document per charity)
{
  "toggle_enabled":      true,      // master switch
  "campaigns_banner":    "<cdn>/properties/<property id>/banners/campaigns.jpg",
  "events_banner":       "<cdn>/properties/<property id>/banners/events.jpg",
  "fundraisings_banner": "<cdn>/properties/<property id>/banners/fundraisings.jpg",
  "hide_help":           true,
  "hide_book_demo":      true,
  "subdomain_requested": "hope.<base host>",
  "subdomain_status":    "ACTIVE",  // NONE · PENDING · ACTIVE
  "last_reminder_ts":    1767225600000
}`;
const SETS: [string, string][] = [
  ["PUT /donation/settings/custom-branding/toggle", "toggle_enabled"],
  ["PUT /donation/settings/custom-branding/nav-links", "hide_help, hide_book_demo"],
  ["POST /donation/settings/custom-branding/banner/{type}", "{type}_banner, after an upload to storage"],
  ["POST /donation/settings/business-profile/logo", "the logo, kept with the property's images"],
  ["POST /donation/settings/business-profile/cover-image", "the cover images list"],
  ["GET /donation/settings/custom-branding", "reads the document, filling any missing key with a default"],
];

/* 3. states */
const STATES: { s: string; d: string; via?: string }[] = [
  { s: "NONE", d: "the default site" },
  { s: "PENDING", d: "requested, DevOps emailed", via: "request-subdomain" },
  { s: "ACTIVE", d: "the charity's own domain", via: "activate-subdomain" },
];

/* 4. serving */
const SERVE: [string, string][] = [
  ["GET /donation/public/property-by-domain", "The charity that owns the domain: id, slug, names, excerpt, logo, cover images, and its branding flags and banners."],
  ["GET /donation/public/campaigns-by-domain", "The same campaign listing as the public one, for that charity only."],
  ["GET /donation/public/events-by-domain", "The charity's events, by status."],
  ["GET /donation/public/fundraiser-pages-by-domain", "The charity's supporter fundraising pages."],
];

export default function CustomBrandingSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Custom Branding
        </h3>
        <p style={P}>
          A charity&apos;s public presence is configured, not built. Its look is one JSON document on its property record.
          Its address is a subdomain that goes through a request-and-activate workflow. Once that is live, every public
          call made for that domain is answered for that one charity.
        </p>
      </div>

      <Stage
        n={1}
        title="Store the look"
        lead="Everything about a charity's branding sits in one jsonb column on its property record, so each setting is a small partial write into the same document."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, alignItems: "start" }}>
          <div>
            <Cap>The document</Cap>
            <Code>{DOC}</Code>
          </div>
          <div>
            <Cap>What writes each part</Cap>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {SETS.map(([e, d], i) => (
                <div key={e} style={{ padding: "9px 0", borderTop: i === 0 ? "1px solid var(--rule)" : undefined, borderBottom: "1px solid var(--rule)" }}>
                  <p className="mono" style={{ fontSize: "11px", color: "var(--ink)", overflowWrap: "anywhere" }}>{e}</p>
                  <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-45)", marginTop: 2 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 16 }}>
          An uploaded image goes to the property-images bucket under <Mono>properties/&lt;property id&gt;/banners/&lt;type&gt;</Mono> and
          is served from the CDN; the CDN URL is what gets saved in the document. Colours are not part of it, so every
          branded site keeps the platform&apos;s own palette.
        </p>
      </Stage>

      <Stage
        n={2}
        title="Request a subdomain"
        lead={<><Mono>POST /donation/settings/request-subdomain</Mono> asks for a name under the platform&apos;s base host.</>}
      >
        <Steps
          items={[
            <><B>Format.</B> 3 to 50 lowercase letters, digits or hyphens, not starting or ending with a hyphen.</>,
            <><B>Availability.</B> Refused if this charity already has an active subdomain, or if another charity holds the name or has it pending.</>,
            <><B>Notify.</B> An email with an activation link goes to the DevOps team. If it cannot be sent, nothing is saved, so there are no orphan requests.</>,
            <><B>Save.</B> The document gets <Mono>subdomain_requested</Mono>, status PENDING and a reminder timestamp.</>,
          ]}
        />
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 14 }}>
          <Mono>POST /donation/settings/resend-subdomain-reminder</Mono> repeats the email for a PENDING request, at most once every 24 hours.
        </p>
      </Stage>

      <Stage
        n={3}
        title="Activate"
        lead="DevOps sets up the DNS, then opens the link from the email."
      >
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 0, border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden", marginBottom: 22 }}>
          {STATES.map((s, i) => (
            <div key={s.s} style={{ padding: "14px 16px", borderLeft: i > 0 ? "1px solid var(--rule)" : undefined, background: i === 2 ? "var(--paper-raised)" : undefined }}>
              <p className="mono" style={{ fontSize: "9.5px", color: "var(--ink-30)", minHeight: 14 }}>{s.via ? `← ${s.via}` : "start"}</p>
              <p className="mono" style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{s.s}</p>
              <p style={{ fontSize: "12.5px", color: "var(--ink-45)", marginTop: 4 }}>{s.d}</p>
            </div>
          ))}
        </div>
        <Steps
          items={[
            <><Mono>POST /donation/public/activate-subdomain</Mono> works only from PENDING. An ACTIVE or unrequested property is refused.</>,
            <>It sets the status to ACTIVE, stores the subdomain as the property&apos;s domain URL, and switches <Mono>hide_help</Mono> and <Mono>hide_book_demo</Mono> on, so the platform&apos;s own calls to action disappear.</>,
            <>The charity is emailed that its subdomain is live.</>,
          ]}
        />
        <Writes items={["custom_branding.subdomain_status = ACTIVE", "business_property_details.domain_url"]} />
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 14 }}>
          A domain URL can also be set directly with <Mono>PUT /donation/settings/update-domain-url</Mono>, which refuses one already used by another charity.
        </p>
      </Stage>

      <Stage
        n={4}
        title="Answer for that domain"
        lead="Public calls carry the domain instead of a charity id. The service finds the one property that owns it and answers only for that property."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SERVE.map(([e, d], i) => (
            <div key={e} className="flex flex-col lg:flex-row lg:items-baseline" style={{ gap: "2px 22px", padding: "10px 0", borderTop: i === 0 ? "1px solid var(--rule)" : undefined, borderBottom: "1px solid var(--rule)" }}>
              <span className="lg:min-w-[340px]" style={{ overflowWrap: "anywhere" }}><Mono>{e}</Mono></span>
              <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-45)" }}>{d}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 14 }}>
          A domain no charity owns answers &ldquo;No charity found for this domain.&rdquo; The first call returns the branding flags and banners together with the charity&apos;s details.
        </p>
      </Stage>
    </div>
  );
}
