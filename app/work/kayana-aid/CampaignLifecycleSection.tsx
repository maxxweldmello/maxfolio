import type { CSSProperties, ReactNode } from "react";

/* Campaign lifecycle — creation, the states that stop a campaign taking gifts, how suspension happens,
   how supporters and embeds plug in. Backend behaviour only; read from the donation, webhook and admin services. */

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };
const Mono = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "12px", color: "var(--ink)" }}>{children}</span>
);
const Label = ({ children }: { children: ReactNode }) => (
  <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 14 }}>{children}</p>
);
const Sub = ({ children }: { children: ReactNode }) => (
  <h4 className="font-light tracking-tight" style={{ fontSize: "1.15rem", color: "var(--ink)", marginBottom: 6 }}>{children}</h4>
);
const Lead = ({ children }: { children: ReactNode }) => (
  <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)", marginBottom: 20 }}>{children}</p>
);

/* ── 1. creation sheet ── */
const REQUIRED: [string, string][] = [
  ["Property id", "must be the organisation the signed-in user owns"],
  ["Title", "also the source of the web address"],
  ["Description", ""],
  ["Category", "BEREAVEMENT · EDUCATION · MEDICAL · EMERGENCY · COMMUNITY · OTHER"],
  ["Goal amount", ""],
  ["Currency code", ""],
  ["Start date", "yyyy-MM-dd"],
];
const OPTIONAL: [string, string][] = [
  ["Status", "DRAFT unless told otherwise"],
  ["End date", "left out means no end"],
  ["Slug", "otherwise built from the title"],
  ["Cover image", "one image, stored in S3"],
  ["Location", ""],
  ["Organiser name and quote", ""],
  ["Fund bullet points and allocation", ""],
  ["Impact levels", "amount required, label optional"],
];
const CHECKS: string[] = [
  "Ownership: the property in the request must belong to the caller, or the call is refused.",
  "Dates: a start date is required, and an end date may not fall before it.",
  "Publishing gate: any status other than DRAFT needs the organisation to be ACTIVE, otherwise the call fails with “Complete payment provider onboarding before publishing this campaign”.",
  "Web address: the slug is lower-cased, stripped of symbols and hyphenated. If it is taken, an 8-character suffix is added; a clash that still slips through returns “A campaign with this web address already exists”.",
  "One transaction: the campaign row, its impact levels and the image reference commit together. Any failure rolls everything back with “No changes were committed”.",
];

function Leaders({ rows }: { rows: [string, string][] }) {
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map(([k, v]) => (
        <li key={k} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{k}</span>
          <span style={{ flex: 1, minWidth: 12, borderBottom: "1px dotted var(--ink-30)", transform: "translateY(-3px)" }} />
          <span className="mono" style={{ fontSize: "10.5px", color: "var(--ink-45)", textAlign: "right", maxWidth: "55%" }}>{v}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── 2. gate matrix ── */
type Gate = { status: string; see: boolean; give: boolean; edit: boolean | null; via: string };
const GATES: Gate[] = [
  { status: "DRAFT", see: false, give: false, edit: true, via: "The default on creation." },
  { status: "ACTIVE", see: true, give: true, edit: true, via: "The owner publishes it; the organisation must be ACTIVE." },
  { status: "PAUSED", see: false, give: false, edit: true, via: "The owner pauses it." },
  { status: "COMPLETED", see: true, give: true, edit: true, via: "The goal is reached, or the owner sets it." },
  { status: "SUSPENDED", see: false, give: false, edit: false, via: "A platform admin takes it down." },
  { status: "DELETED", see: false, give: false, edit: null, via: "The owner deletes it." },
];
const Dot = ({ on }: { on: boolean | null }) => (
  <span className="mono" style={{ fontSize: "11px", color: on === null ? "var(--ink-30)" : on ? "var(--ink)" : "var(--ink-30)", fontWeight: on ? 700 : 400 }}>
    {on === null ? "—" : on ? "Yes" : "No"}
  </span>
);

/* ── 3. situations ── */
type Situation = { q: string; runs: string; backend: string[]; donors: string };
const SITUATIONS: Situation[] = [
  {
    q: "What if it is saved as a draft?",
    runs: "DonationCampaignService.addCampaign · updateCampaign",
    backend: [
      "DRAFT is the default. Nothing about a draft is public: a lookup by slug answers “Campaign not found”, exactly as it would for a campaign that never existed, and only the owning organisation can read it.",
      "It never appears in the public listing, which returns ACTIVE and COMPLETED campaigns of ACTIVE organisations only.",
      "Any fundraising page created under it starts as DRAFT, and an existing page cannot be set ACTIVE while the campaign is a draft.",
      "Moving an ACTIVE campaign back to DRAFT pulls every fundraising page under it to DRAFT too. That cascade is one-way: publishing the campaign again does not republish the pages, each needs its own Publish.",
      "Publishing is an update with status ACTIVE, and the organisation-is-ACTIVE check runs again.",
    ],
    donors: "Cannot see it and cannot give. A donation attempt is refused with “Donations are only accepted for active campaigns”.",
  },
  {
    q: "What if it is paused?",
    runs: "DonationCampaignService.updateCampaign",
    backend: [
      "PAUSED is an owner-set status. It is hidden from the public listing and from public lookups in the same way as a draft.",
      "Fundraising pages keep their own status, but a gift made through one is still refused, because donations are always judged against the campaign's status.",
      "Setting the status back to ACTIVE resumes everything; nothing was deleted or cascaded.",
    ],
    donors: "Cannot give while it is paused.",
  },
  {
    q: "What if it reaches its goal?",
    runs: "PaymentWebhookService.handleWebDonationCapture",
    backend: [
      "Completion is not a scheduled job. It happens inside the webhook that confirms a payment: the record goes PAID, the donation amount is added to the campaign's raised total, and if a goal is set and raised has reached it, the status becomes COMPLETED in the same step.",
      "The owner can also set COMPLETED by hand through the same update call.",
      "A completed campaign stays public. It is still listed and readable, showing its result, with the funded percentage capped at 100.",
      "It keeps taking payments. Completion changes what the public sees, not whether a donation can be made, so gifts through the campaign page, its fundraising pages and the embeds all continue.",
      "An end date is enforced separately: once the date passes, initiating a donation returns “This campaign has ended” even though the status is still ACTIVE, because no job flips it.",
    ],
    donors: "Can view it and can still give.",
  },
  {
    q: "What if it is suspended?",
    runs: "AdminDonationService.takeDownCampaign · reinstateCampaign",
    backend: [
      "Suspension is never set by the charity. Only a platform admin can do it, through a take-down call that requires a reason.",
      "The status becomes SUSPENDED, and a history entry is appended to the campaign's take-down record: the action, the reason, the status it had before, who did it and when.",
      "The charity's contact email is sent a take-down notice containing the reason, from a country-specific template.",
      "From then on the charity cannot edit it: the update call returns “Suspended campaigns cannot be updated”. It is hidden from the public like a draft, and donations are refused.",
      "Only an admin can lift it. Reinstate works only on a SUSPENDED campaign, only to ACTIVE or DRAFT, records a REINSTATED entry with the reason, and sends the charity a second email.",
    ],
    donors: "Cannot see it and cannot give.",
  },
  {
    q: "What if it is deleted?",
    runs: "DonationCampaignService.deleteCampaign",
    backend: [
      "Deletion is soft. The status becomes DELETED and the row stays, so donation records that point at it keep their history.",
      "It disappears from every list and from public lookups.",
    ],
    donors: "Cannot see it and cannot give.",
  },
];

/* ── record card for suspension ── */
const RECORD: [string, string][] = [
  ["action", "SUSPENDED · REINSTATED"],
  ["reason", "chosen by the admin, kept verbatim"],
  ["previousStatus", "the status it had before"],
  ["revertedToStatus", "ACTIVE or DRAFT, on reinstatement"],
  ["by", "the admin's display name, else username"],
  ["at", "timestamp"],
];

/* ── 4. support tree ── */
const TREE: { level: number; name: string; note: string }[] = [
  { level: 0, name: "Campaign", note: "the appeal, with its goal and raised total" },
  { level: 1, name: "Personal page", note: "one supporter raising for it" },
  { level: 1, name: "Team page", note: "a lead page that members are invited to by token" },
  { level: 2, name: "Team member page", note: "each accepted member's own page, linked to the team" },
  { level: 1, name: "In-memory page", note: "carries its own tribute details" },
  { level: 1, name: "Event registration", note: "signing up for an event can start a personal page in the same call" },
];

const SUPPORT_RULES: string[] = [
  "A supporter record is created first, then the page: its own title, story, target, currency and optional impact levels, with a slug built from the title.",
  "A page starts as DRAFT when its campaign is DRAFT or the organisation cannot collect yet. It is held rather than rejected, and one Publish puts it live later.",
  "Every gift made through a page carries its fundraiser id. When the payment is confirmed, the page's raised total and donor count go up and so does the campaign's total, in the same capture.",
  "The campaign stays in charge: a page can be public and shared while its campaign is paused or suspended, but the gift itself is refused. A completed campaign keeps taking gifts.",
  "Supporters edit their page through the public update route after an email ownership check, and can set ACTIVE, PAUSED or COMPLETED on it.",
];

/* ── 5. widget ── */
type WidgetCard = { name: string; tag: string; size: string; what: string; calls: string[]; sketch: ReactNode };
const WIDGETS: WidgetCard[] = [
  {
    name: "Button",
    tag: "Full-page donate",
    size: "220 × 70 embed",
    what: "A small embed that shows one button with a label and colour the charity picked. Clicking it opens the campaign's own full public page in a new tab, where the whole donation journey runs at full size.",
    calls: [
      "The campaign's slug is written into the embed code, so the button loads nothing from the backend to know where to link.",
      "Everything after the click is the normal campaign page and its public routes.",
    ],
    sketch: (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
        <span className="mono" style={{ fontSize: "11px", padding: "10px 22px", borderRadius: 999, background: "var(--ink)", color: "var(--paper)" }}>Donate Now</span>
      </div>
    ),
  },
  {
    name: "Full form",
    tag: "Embedded on the charity's page",
    size: "380 × 600 embed",
    what: "The complete donation form living inside the charity's own website: amount and impact levels, donor details, Gift Aid, then the card step and the thank-you state, without leaving the page.",
    calls: [
      "Loads the campaign by slug, then the Gift Aid setting, all public and without a login.",
      "Donating calls initiate-donation, which applies every gate on this page; the result is read back through confirm-donation.",
    ],
    sketch: (
      <div style={{ display: "flex", justifyContent: "center", height: 120 }}>
        <div style={{ width: 84, border: "1px solid var(--ink-30)", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ height: 6, background: "var(--rule)", borderRadius: 2 }} />
          <span style={{ height: 6, background: "var(--rule)", borderRadius: 2, width: "70%" }} />
          <span style={{ height: 14, border: "1px solid var(--rule)", borderRadius: 2 }} />
          <span style={{ height: 14, border: "1px solid var(--rule)", borderRadius: 2 }} />
          <span style={{ height: 12, background: "var(--ink)", borderRadius: 2, marginTop: "auto" }} />
        </div>
      </div>
    ),
  },
];

export default function CampaignLifecycleSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      <style>{`
        .cl-q { list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; }
        .cl-q::-webkit-details-marker { display: none; }
        .cl-q::after { content: "+"; font-family: ui-monospace, monospace; color: var(--ink-30); font-size: 16px; }
        details[open] > .cl-q::after { content: "–"; }
        .cl-item[open] { background: var(--paper-raised); }
        .cl-body { display: grid; grid-template-columns: 1fr; gap: 20px; padding: 0 20px 22px; }
        @media (min-width: 900px) { .cl-body { grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr); gap: 32px; } }
        .cl-tree li { position: relative; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Campaign Lifecycle
        </h3>
        <p style={P}>
          A campaign is the parent of everything a charity raises money for: its fundraising pages, its events and every
          donation hang off it. This section follows one campaign from the moment it is created, through the ways it
          can stop taking gifts, to how supporters and embeds plug into it.
        </p>
        <p style={P}>
          Every rule here is enforced by the backend, so a request gets the same answer however it arrives.
        </p>
      </div>

      {/* creation */}
      <div>
        <Sub>Creating a campaign</Sub>
        <Lead>
          One multipart call, <Mono>POST /donation/campaign/add-campaign</Mono>, handled by <Mono>DonationCampaignService.addCampaign</Mono> inside a single transaction.
        </Lead>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 40, alignItems: "start" }}>
          <div>
            <Label>Needed</Label>
            <Leaders rows={REQUIRED} />
          </div>
          <div>
            <Label>Optional</Label>
            <Leaders rows={OPTIONAL} />
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Label>Applied on save</Label>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CHECKS.map((c, i) => (
              <li key={i} style={{ display: "flex", gap: 14, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
                <span className="mono" style={{ flexShrink: 0, width: 16, fontSize: "10px", color: "#c9971f", paddingTop: 4 }}>{i + 1}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
          <p className="mono" style={{ fontSize: "10.5px", color: "var(--ink-30)", marginTop: 16 }}>
            writes · donation_campaign · donation_impact_level · one S3 object
          </p>
        </div>
      </div>

      {/* gate matrix */}
      <div>
        <Sub>What each status allows</Sub>
        <Lead>The gates the backend checks, status by status.</Lead>
        <div style={{ overflowX: "auto", border: "1px solid var(--rule)", borderRadius: 8 }}>
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--paper-raised)" }}>
                {["Status", "Public can open it", "Donors can give", "Owner can edit", "How it gets there"].map((h) => (
                  <th key={h} className="mono" style={{ textAlign: "left", fontWeight: 400, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)", padding: "12px 16px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GATES.map((g) => (
                <tr key={g.status} style={{ borderTop: "1px solid var(--rule)" }}>
                  <td className="mono" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink)", padding: "12px 16px" }}>{g.status}</td>
                  <td style={{ padding: "12px 16px" }}><Dot on={g.see} /></td>
                  <td style={{ padding: "12px 16px" }}><Dot on={g.give} /></td>
                  <td style={{ padding: "12px 16px" }}><Dot on={g.edit} /></td>
                  <td style={{ fontSize: "12.5px", color: "var(--ink-45)", padding: "12px 16px" }}>{g.via}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 12 }}>
          “Public can open it” means anyone without a session. The owning organisation can always read its own campaign in any status.
        </p>
      </div>

      {/* situations */}
      <div>
        <Sub>What happens if…</Sub>
        <Lead>Open a situation to see what the backend does and what changes for donors.</Lead>
        <div style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
          {SITUATIONS.map((s, i) => (
            <details key={s.q} className="cl-item" style={{ borderTop: i > 0 ? "1px solid var(--rule)" : "none" }}>
              <summary className="cl-q">
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>{s.q}</span>
              </summary>
              <div className="cl-body">
                <div>
                  <p className="mono" style={{ fontSize: "10px", color: "var(--ink-30)", marginBottom: 12, overflowWrap: "anywhere" }}>runs in · {s.runs}</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {s.backend.map((b, bi) => (
                      <li key={bi} style={{ display: "flex", gap: 12, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
                        <span style={{ flexShrink: 0, marginTop: 10, width: 4, height: 4, borderRadius: "50%", background: "var(--ink-30)" }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ borderLeft: "2px solid var(--ink)", paddingLeft: 18, alignSelf: "start" }}>
                  <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 8 }}>For donors</p>
                  <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink)" }}>{s.donors}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* suspension record */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32, alignItems: "start" }}>
        <div>
          <Sub>How a suspension is recorded</Sub>
          <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
            Every take-down and reinstatement appends one entry to a history kept on the campaign, so the record shows the
            whole story, not just the latest state. Events go through the same take-down and reinstate calls and work the same way.
          </p>
        </div>
        <div style={{ background: "#0a0a0a", borderRadius: 8, padding: "18px 20px" }}>
          <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6f6f6f", marginBottom: 12 }}>History entry</p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {RECORD.map(([k, v]) => (
              <li key={k} className="mono" style={{ display: "flex", gap: 14, fontSize: "11.5px" }}>
                <span style={{ flex: "0 0 130px", color: "#f2f2f2", fontWeight: 700 }}>{k}</span>
                <span style={{ color: "#8a8a8a" }}>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* support */}
      <div>
        <Sub>Supporting a campaign</Sub>
        <Lead>Supporters raise money for a campaign by creating fundraising pages under it.</Lead>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 40, alignItems: "start" }}>
          <ul className="cl-tree" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {TREE.map((t, i) => (
              <li key={i} style={{ paddingLeft: t.level * 28, display: "flex", gap: 12, alignItems: "baseline", padding: "8px 0 8px " + t.level * 28 + "px" }}>
                <span className="mono" style={{ color: "var(--ink-30)", fontSize: "11px", flexShrink: 0 }}>{t.level === 0 ? "◆" : "└"}</span>
                <span>
                  <span className="mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{t.name}</span>
                  <span style={{ display: "block", fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-45)" }}>{t.note}</span>
                </span>
              </li>
            ))}
          </ul>
          <ol style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SUPPORT_RULES.map((r, i) => (
              <li key={i} style={{ display: "flex", gap: 14, fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>
                <span className="mono" style={{ flexShrink: 0, width: 16, fontSize: "10px", color: "#c9971f", paddingTop: 4 }}>{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* widget */}
      <div>
        <Sub>Embedding a campaign</Sub>
        <Lead>
          A charity can put a campaign on its own website in two ways. The embed code is generated for a chosen campaign, and both kinds use only public routes, with no login.
        </Lead>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
          {WIDGETS.map((w) => (
            <div key={w.name} style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: "var(--paper-raised)", borderBottom: "1px solid var(--rule)" }}>{w.sketch}</div>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <p className="mono" style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{w.name}</p>
                  <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.08em", color: "var(--ink-30)" }}>{w.size}</p>
                </div>
                <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-30)", margin: "2px 0 10px" }}>{w.tag}</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" }}>{w.what}</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {w.calls.map((c, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: "12.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>
                      <span style={{ flexShrink: 0, marginTop: 9, width: 4, height: 4, borderRadius: "50%", background: "var(--ink-30)" }} />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 16 }}>
          Neither kind gets special treatment. A draft, paused or suspended campaign, or an organisation that cannot
          collect yet, is refused by the same gates as anywhere else.
        </p>
      </div>
    </div>
  );
}
