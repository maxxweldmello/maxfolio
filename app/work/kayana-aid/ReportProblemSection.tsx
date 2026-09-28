import type { CSSProperties, ReactNode } from "react";

/* Report a problem & support, in the order it happens: a report is filed, Claude triages it, tickets are opened,
   errors are also caught automatically, and the charity follows it on the support page. Read from the site's
   server routes (report-problem, bug-report), the donation service (bug-report and support endpoints) and the
   company helpdesk tables it reaches through the second database connection. */

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
const Chip = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid var(--ink-30)", borderRadius: 999, color: "var(--ink)", whiteSpace: "nowrap" }}>{children}</span>
);
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

/* 2. triage */
const CALL = `POST https://api.anthropic.com/v1/messages
x-api-key      <ANTHROPIC_API_KEY>          // server environment only
model          <ANTHROPIC_MODEL>            // default claude-sonnet-4-5
max_tokens     1024
system         platform context + triage rules
messages       screenshots (base64 images) · the report · page context · last 8 turns

→ { "verdict", "confidence", "user_reply", "title", "bug_summary", "bug_file_hint" }`;

const VERDICTS: { v: string; means: string; ticket: string; pri: string; tag: string }[] = [
  { v: "real_bug", means: "Something that exists is broken", ticket: "Yes", pri: "high", tag: "[Report a Problem][Bug]" },
  { v: "ops_access_config", means: "Access, permissions or setup, not a defect", ticket: "Yes", pri: "medium", tag: "[Report a Problem][Ops]" },
  { v: "feature_enhancement", means: "Wants something not built yet", ticket: "Yes", pri: "low", tag: "[Report a Problem][Feature]" },
  { v: "not_a_problem", means: "A how-to, or working as designed", ticket: "No", pri: "·", tag: "answered in the reply" },
  { v: "unclear", means: "One clarifying question is asked", ticket: "No", pri: "·", tag: "the chat continues" },
];

/* 3. tickets */
const STORES: { name: string; where: string; lines: string[] }[] = [
  {
    name: "Bug-report entry",
    where: "POST /donation/bug-report · admin schema",
    lines: [
      "One row per problem, keyed by a fingerprint of the report. Tier A for a confirmed bug, C otherwise.",
      "The caller's property comes from their token, never from the request.",
      "Its id becomes the bug-report number the charity sees.",
    ],
  },
  {
    name: "Helpdesk ticket",
    where: "POST /donation/support/tickets · company database",
    lines: [
      "A ticket the support team works in the company helpdesk, titled with the verdict tag and given the verdict's priority.",
      "It lands in the first active helpdesk team and starts as open.",
      "Screenshots are attached to it.",
    ],
  },
];

/* 5. support page */
const STATUSES: [string, string][] = [
  ["open", "Open"],
  ["pending", "Stuck"],
  ["in_progress", "In Progress"],
  ["waiting_for_dev", "Waiting Dev"],
  ["waiting_for_compliance", "Compliance Review"],
  ["waiting_for_release", "Pending Release"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];
const SUPPORT_OPS: [string, string][] = [
  ["GET /donation/support/tickets", "The charity's tickets, newest first, filterable by status and priority. Merged tickets are left out."],
  ["GET /donation/support/tickets/{id}", "One ticket, by id or ticket number, only if it belongs to this charity."],
  ["GET · POST /donation/support/tickets/{id}/messages", "The conversation, and a reply from the charity."],
  ["POST /donation/support/tickets", "A new ticket raised by hand, with an optional helpdesk team."],
  ["GET /donation/support/teams", "The active helpdesk teams to choose from."],
  ["GET /donation/support/agents/{userId}/name", "The display name of the agent who replied."],
  ["GET /donation/bug-report/my-list", "The charity's own bug reports, most recently seen first."],
  ["PATCH /donation/bug-report/{id}/reopen", "Puts a FIXED or DISMISSED report back to OPEN."],
];

export default function ReportProblemSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Report a Problem &amp; Support
        </h3>
        <p style={P}>
          A problem reaches the team two ways: a charity clicks Report a problem, or the site notices an error itself.
          The first is triaged by Claude before anything is opened. Real issues become a bug-report entry and a ticket in
          the company&apos;s helpdesk, and the charity follows the ticket on its support page.
        </p>
      </div>

      <Stage
        n={1}
        title="File the report"
        lead="The Report a problem action opens a form in the dashboard. Nothing is sent until the charity submits."
      >
        <Steps
          items={[
            <><B>Capture.</B> As the form opens, a screenshot of the page is taken in the browser, leaving the form itself out. The charity can add more images, up to four in all.</>,
            <><B>Fields.</B> What is not working is required. What was expected and an error code or message are optional. The page URL and viewport size travel with it.</>,
            <><B>Send.</B> The form posts to the site&apos;s own server route, <Mono>/api/report-problem</Mono>, with the sign-in cookie. Without the cookie the route answers 401, so only signed-in charities can report.</>,
          ]}
        />
      </Stage>

      <Stage
        n={2}
        title="Triage with Claude"
        lead="The server route asks Claude to classify the report before deciding whether to open anything. The Anthropic key lives only in the server's environment."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, alignItems: "start" }}>
          <div>
            <Cap>The call</Cap>
            <Code>{CALL}</Code>
          </div>
          <div>
            <Cap>How the key and the answer are handled</Cap>
            <Steps
              items={[
                <>The key is read from the server&apos;s environment on each call. It is never sent to the browser, and the browser only ever talks to the site&apos;s own route.</>,
                <>The system prompt describes the platform and the five verdicts. It tells Claude to prefer <Mono>unclear</Mono> over guessing a bug, and to keep technical words out of the reply.</>,
                <>The answer must be strict JSON. An unknown verdict becomes <Mono>unclear</Mono>, and a <Mono>real_bug</Mono> with confidence under 0.7 is downgraded to <Mono>unclear</Mono>.</>,
                <><Mono>user_reply</Mono> is what the charity reads. <Mono>bug_summary</Mono> and <Mono>bug_file_hint</Mono> are staff-only and go into the ticket.</>,
              ]}
            />
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Cap>What each verdict does</Cap>
          <div style={{ overflowX: "auto", border: "1px solid var(--rule)", borderRadius: 8 }}>
            <div style={{ minWidth: 640 }}>
              <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.3fr) minmax(0,2fr) minmax(0,0.6fr) minmax(0,0.7fr) minmax(0,1.8fr)", background: "var(--paper-raised)", borderBottom: "1px solid var(--rule)" }}>
                {["Verdict", "Meaning", "Ticket", "Priority", "Ticket title starts"].map((h) => (
                  <p key={h} className="mono" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)", padding: "12px 16px" }}>{h}</p>
                ))}
              </div>
              {VERDICTS.map((r, i) => (
                <div key={r.v} className="grid" style={{ gridTemplateColumns: "minmax(0,1.3fr) minmax(0,2fr) minmax(0,0.6fr) minmax(0,0.7fr) minmax(0,1.8fr)", borderBottom: i < VERDICTS.length - 1 ? "1px solid var(--rule)" : "none" }}>
                  <p className="mono" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink)", padding: "11px 16px" }}>{r.v}</p>
                  <p style={{ fontSize: "12.5px", color: "var(--ink-45)", padding: "11px 16px" }}>{r.means}</p>
                  <p style={{ fontSize: "12.5px", color: r.ticket === "Yes" ? "var(--ink)" : "var(--ink-30)", padding: "11px 16px" }}>{r.ticket}</p>
                  <p className="mono" style={{ fontSize: "11.5px", color: "var(--ink-45)", padding: "11px 16px" }}>{r.pri}</p>
                  <p className="mono" style={{ fontSize: "11px", color: "var(--ink-45)", padding: "11px 16px" }}>{r.tag}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, borderLeft: "2px solid #c9971f", background: "var(--paper-raised)", padding: "14px 18px", borderRadius: "0 6px 6px 0" }}>
          <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 8 }}>When Claude cannot be reached</p>
          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink-45)" }}>
            The triage fails open. With no key set, a network failure, an API error or an unreadable answer, the reply says
            the automatic review could not run and no ticket is opened for you. The charity can press{" "}
            <b style={{ color: "var(--ink)", fontWeight: 600 }}>Still need help</b>, which opens the ticket without Claude, as
            an ops request with medium priority.
          </p>
        </div>
      </Stage>

      <Stage
        n={3}
        title="Open the tickets"
        lead="When the verdict calls for a ticket, the route makes two calls to the donation service, once. A report either opens a ticket automatically here or through Still need help, never both."
      >
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          {STORES.map((s) => (
            <div key={s.name} style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "var(--ink)", color: "var(--paper)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700 }}>{s.name}</p>
                <p className="mono" style={{ fontSize: "9.5px", opacity: 0.6, marginTop: 2 }}>{s.where}</p>
              </div>
              <ul style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {s.lines.map((l) => <li key={l} style={{ fontSize: "12.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Steps
            items={[
              <><B>Same database as the shop.</B> The helpdesk is a separate application. Its tickets, replies and teams sit in the company database the donation service already reaches for the hardware shop, so a ticket written here is a ticket the support team sees at once.</>,
              <><B>Attachments.</B> Each screenshot is decoded and checked: only PNG, JPEG, WebP and GIF, at most 10 MB. It is stored in the helpdesk&apos;s own bucket under <Mono>helpdesk/attachments/</Mono>, and the ticket keeps the key, name, size and type. One bad image never blocks the ticket.</>,
              <><B>Staff copy.</B> Every report, ticket or not, is also emailed to a staff inbox with the classification, the page and the staff-only summary. If that email fails, it is only logged.</>,
            ]}
          />
        </div>
      </Stage>

      <Stage
        n={4}
        title="Errors caught automatically"
        lead="A second path needs no one to click anything. It reports only into the bug-report table, not the helpdesk."
      >
        <Steps
          items={[
            <><B>Listen.</B> The site listens for uncaught errors and unhandled promise rejections and sends each as a tier A report.</>,
            <><B>Fingerprint.</B> A SHA-1 of the app, platform, route, kind, message and top stack frame. Ids, UUIDs and timestamps are normalised first, so the same fault from different users gets the same fingerprint.</>,
            <><B>Scrub and limit.</B> Card-like numbers, email addresses and phone numbers are replaced with [redacted]. The same fingerprint is sent at most once a minute, and five reports a minute overall.</>,
            <><B>Identify.</B> The site&apos;s route forwards the session cookie as a bearer token. The donation service checks it with Cognito, finds the property through the staff mapping, and falls back to the charity record. It never accepts a property from the request.</>,
            <><B>Store.</B> One <Mono>INSERT … ON CONFLICT (fingerprint) DO UPDATE</Mono>: a new problem becomes an OPEN row, and a repeat adds one to its occurrence count. The reply carries the id, whether it is new and, when a screenshot was asked for, a presigned upload URL valid for 5 minutes.</>,
            <><B>Screenshot.</B> The browser uploads a JPEG of the visible page. Any element marked as sensitive is blacked out first.</>,
            <><B>If the service is down.</B> The route keeps the report in a small on-disk queue of the 50 most recent and answers 202. The queue is retried on the next report.</>,
          ]}
        />
      </Stage>

      <Stage
        n={5}
        title="The support page"
        lead="The support page is where a charity follows what it has reported. It reads the same helpdesk rows the support team works on, so a status change or reply appears without any sync."
      >
        <Cap>Ticket statuses</Cap>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {STATUSES.map(([code, label]) => (
            <span key={code} style={{ display: "inline-flex", alignItems: "baseline", gap: 8, border: "1px solid var(--rule)", borderRadius: 6, padding: "6px 10px" }}>
              <span className="mono" style={{ fontSize: "10px", color: "var(--ink-30)" }}>{code}</span>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)" }}>{label}</span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SUPPORT_OPS.map(([e, d], i) => (
            <div key={e} className="flex flex-col lg:flex-row lg:items-baseline" style={{ gap: "2px 22px", padding: "10px 0", borderTop: i === 0 ? "1px solid var(--rule)" : undefined, borderBottom: "1px solid var(--rule)" }}>
              <span className="lg:min-w-[340px]" style={{ overflowWrap: "anywhere" }}><Mono>{e}</Mono></span>
              <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-45)" }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          <Steps
            items={[
              <>A ticket belongs to a charity through the property id stored on it. Looking one up with another charity&apos;s property id answers &ldquo;Ticket not found&rdquo;.</>,
              <>The conversation is the ticket&apos;s log, oldest first. A reply from the charity is saved as a customer reply. Anything else is shown as an agent, and the agent&apos;s name is looked up from the platform&apos;s admin users.</>,
              <>Once a ticket is resolved or closed the page stops taking replies. A charity can also see its bug reports, and reopen a FIXED or DISMISSED one; a report that is missing or belongs to someone else gets the same answer, so nothing is disclosed.</>,
            ]}
          />
        </div>
      </Stage>
    </div>
  );
}
