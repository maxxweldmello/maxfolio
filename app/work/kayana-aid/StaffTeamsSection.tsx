import type { CSSProperties, ReactNode } from "react";

/* Staff & teams, in the order it happens: roles exist, a member is invited, they sign in, the team is managed,
   roles are managed, and every request is checked. Read from the donation service (team endpoints, default roles),
   the business security service (token and role check) and the business gateway (property scoping). */

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

/* 1. roles */
type Role = { name: string; note: string; tag: "Assignable" | "Protected" | "Per charity"; dashed?: boolean };
const ROLES: Role[] = [
  { name: "OWNER", note: "Given to the person who registered the charity. Never assignable, editable or deletable.", tag: "Protected" },
  { name: "CHARITY MANAGER", note: "Default role, created with every charity.", tag: "Assignable" },
  { name: "FINANCE OFFICER", note: "Default role, created with every charity.", tag: "Assignable" },
  { name: "TREASURER", note: "Default role, created with every charity.", tag: "Assignable" },
  { name: "PLATFORM", note: "Internal role. Never offered when picking a role, and cannot be changed or deleted.", tag: "Protected" },
  { name: "Custom", note: "Any name a charity adds, with a description and a colour. Unique within the charity, whatever the letter case.", tag: "Per charity", dashed: true },
];

/* 4. run the team */
const OPS: { verb: string; endpoint: string; lines: string[] }[] = [
  {
    verb: "List",
    endpoint: "GET /donation/team/staff/list",
    lines: [
      "Staff are found through the staff-to-charity mapping, paged, searched and sorted by name, email, username, phone, status, role or date.",
      "The owner has no mapping row, so the list adds them from the charity's own record and marks them as owner.",
    ],
  },
  {
    verb: "Change",
    endpoint: "PUT /donation/team/staff/update",
    lines: [
      "Name, dial code, phone and role can change. Email cannot.",
      "The role and phone rules are the same as for an invite, and a phone number only counts as a clash if it was actually changed.",
      "A new name is also written to the identity provider, on a best-effort basis.",
    ],
  },
  {
    verb: "Remove",
    endpoint: "DELETE /donation/team/staff/{username}",
    lines: [
      "Refused for the owner, who has no mapping row.",
      "The identity-provider user is deleted (already gone is fine), the user record is set to INACTIVE rather than erased, and the mapping row is removed.",
    ],
  },
];

/* 5. roles */
const ROLE_OPS: [string, string][] = [
  ["GET /donation/team/roles", "active roles for the charity, without OWNER and PLATFORM, by name"],
  ["POST /donation/team/role/add", "name is upper-cased; a duplicate within the charity is refused"],
  ["PUT /donation/team/role/update", "name, description and colour; OWNER and PLATFORM are refused"],
  ["DELETE /donation/team/role/{roleId}", "soft delete to DELETED, and the role's function mappings are removed"],
];

/* 6. request check */
const CHAIN: { t: string; s: string }[] = [
  { t: "User", s: "signed in through the business pool" },
  { t: "Staff ↔ charity", s: "which charity" },
  { t: "Role", s: "the user's role id" },
  { t: "Role ↔ function", s: "which functions" },
  { t: "Request path", s: "matched to a function" },
];

export default function StaffTeamsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Staff &amp; Teams
        </h3>
        <p style={P}>
          A charity has one owner and any number of staff. A member&apos;s role decides what they can do, and their link to
          the charity decides whose data they can see. Both are enforced on every request, not just when the team page is used.
        </p>
      </div>

      <Stage
        n={1}
        title="Roles"
        lead="When a charity is created, five default roles are created for it, each mapped to every active function with view, edit and delete allowed. The person who registered is given OWNER."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>
          {ROLES.map((r) => (
            <div key={r.name} style={{ border: r.dashed ? "1px dashed var(--ink-30)" : "1px solid var(--rule)", borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <p className="mono" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink)" }}>{r.name}</p>
                <span className="mono" style={{ fontSize: "9px", letterSpacing: "0.06em", padding: "2px 8px", border: "1px solid var(--ink-30)", borderRadius: 999, color: r.tag === "Protected" ? "#c9971f" : "var(--ink-45)", whiteSpace: "nowrap" }}>{r.tag}</span>
              </div>
              <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-45)" }}>{r.note}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 14 }}>
          Protecting OWNER and PLATFORM is what stops anyone from promoting themselves: the check is made once, in the same
          place, on the role list, on invite and on update.
        </p>
      </Stage>

      <Stage
        n={2}
        title="Invite a member"
        lead={<><Mono>POST /donation/team/staff/add</Mono> creates the person in the identity provider, then in the platform, then links them to the charity.</>}
      >
        <Steps
          items={[
            <><B>Checks.</B> The email must be new. A role, if sent, must exist and be assignable. A phone number needs a dial code and must not already belong to an active or inactive account.</>,
            <><B>Identity.</B> A user is created in the business Cognito pool with a generated username (the pool signs in by email, so the username cannot be the email itself). Cognito emails the temporary password.</>,
            <><B>Record.</B> The user record is saved as FORCE_PASSWORD_CHANGE with the chosen role and access to the donations platform only.</>,
            <><B>Link.</B> A staff-to-charity row ties the person to this one charity. The call runs in one transaction and returns the new username.</>,
          ]}
        />
        <Writes items={["Cognito · business pool", "business_user_master", "business_staff_property_mapping"]} />
      </Stage>

      <Stage
        n={3}
        title="First sign-in"
        lead="The temporary password cannot be used as a normal one."
      >
        <Steps
          items={[
            <>The member signs in through <Mono>POST /business/authentication/force-password-change-signin</Mono> with the temporary password.</>,
            <>Cognito answers with the NEW_PASSWORD_REQUIRED challenge, the new password is set, and the account becomes a normal one. Every later sign-in follows the usual charity path.</>,
          ]}
        />
      </Stage>

      <Stage
        n={4}
        title="Run the team"
        lead="Three operations on the team list, all scoped to the charity."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
          {OPS.map((o, i) => (
            <div key={o.verb} style={{ padding: "16px 18px", borderLeft: i > 0 ? "1px solid var(--rule)" : undefined, background: i === 1 ? "var(--paper-raised)" : undefined }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{o.verb}</p>
              <p className="mono" style={{ fontSize: "10px", color: "var(--ink-30)", marginTop: 2, overflowWrap: "anywhere" }}>{o.endpoint}</p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {o.lines.map((l) => <li key={l} style={{ fontSize: "12.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Stage>

      <Stage
        n={5}
        title="Manage roles"
        lead="Charities can add their own roles beside the defaults. These endpoints manage the role itself: its name, description and colour. What a role may do lives in the role-to-function mapping."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ROLE_OPS.map(([e, d], i) => (
            <div key={e} className="flex flex-col sm:flex-row sm:items-baseline" style={{ gap: "2px 18px", padding: "9px 0", borderTop: i === 0 ? "1px solid var(--rule)" : undefined, borderBottom: "1px solid var(--rule)" }}>
              <span className="sm:min-w-[300px]" style={{ overflowWrap: "anywhere" }}><Mono>{e}</Mono></span>
              <span style={{ fontSize: "12.5px", color: "var(--ink-45)" }}>{d}</span>
            </div>
          ))}
        </div>
      </Stage>

      <Stage
        n={6}
        title="How every request is checked"
        lead="Nothing here relies on the team page. The business gateway checks each call, whoever makes it."
      >
        <Cap>What a request is tied to</Cap>
        <div className="grid grid-cols-2 md:grid-cols-5" style={{ gap: 10, marginBottom: 26 }}>
          {CHAIN.map((c, i) => (
            <div key={c.t} style={{ position: "relative", border: "1px solid var(--rule)", background: "var(--paper-raised)", borderRadius: 6, padding: "10px 12px" }}>
              <p className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)" }}>{c.t}</p>
              <p className="mono" style={{ fontSize: "9.5px", color: "var(--ink-45)", marginTop: 3, lineHeight: 1.5 }}>{c.s}</p>
              {i < CHAIN.length - 1 && (
                <span className="mono hidden md:block" style={{ position: "absolute", right: -11, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--ink-30)", zIndex: 1 }}>›</span>
              )}
            </div>
          ))}
        </div>
        <Steps
          items={[
            <>The gateway&apos;s token filter passes the access token, the ID token and the request path to the business security service.</>,
            <>That service verifies the ID token against the identity provider&apos;s keys and checks that the user&apos;s platform access includes the platform being called.</>,
            <>It reads the user&apos;s role, then counts the role-to-function mappings whose function URL matches the path. One or more allows the call; none answers &ldquo;not authorised&rdquo;.</>,
            <>Separately, the gateway resolves which charity the token belongs to and sets it as the Property-Id header. A Property-Id sent by the caller that is outside the token&apos;s authorised set is rejected.</>,
          ]}
        />
      </Stage>
    </div>
  );
}
