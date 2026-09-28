import type { CSSProperties, ReactNode } from "react";
import { SubLabel, Table } from "./BackendBlocks";

/* Authentication — two audiences, two Cognito pools, two security services, one verification path.
   Read from business-security-service, security-service and the two gateways. */

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };
const M = (t: string) => <span className="mono" style={{ fontSize: "13px", color: "var(--ink)" }}>{t}</span>;
const Req = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={{ fontSize: "11px", color: "var(--ink)", overflowWrap: "anywhere" }}>{children}</span>
);

const Cell = ({ text, req }: { text: string; req?: ReactNode }) => (
  <div>
    <p>{text}</p>
    {req && <p style={{ marginTop: 6 }}>{req}</p>}
  </div>
);

const FLOW_ROWS: ReactNode[][] = [
  [
    "Sign up",
    <Cell key="c" text="Password policy is checked, the user is created in the business Cognito pool and the charity user record is saved. If the save fails, the Cognito user is rolled back." req={<Req>POST /business/authentication/v2/signup</Req>} />,
    <Cell key="d" text="Email first, phone required. An existing unconfirmed account resumes at the OTP step. Web sign-up is reCAPTCHA-checked on a sampled basis." req={<Req>POST /authentication/signup</Req>} />,
  ],
  [
    "Confirm",
    <Cell key="c" text="An email code checked by Cognito, or our own SMS OTP followed by an admin-confirm. The account becomes ACTIVE." req={<Req>POST /business/authentication/confirm-signup</Req>} />,
    <Cell key="d" text="Our own email OTP, stored with an expiry, admin-confirms the user. Guest cart, orders and loyalty from the same device then move to the account, and welcome tasks run asynchronously." req={<Req>GET …/resend-otp-via-email/{"{username}"} · POST /authentication/confirm-signup</Req>} />,
  ],
  [
    "Sign in",
    <Cell key="c" text="Lockout (5 wrong passwords, 30 minutes), platform access and account status are checked before Cognito is called. Returns ID, access and refresh tokens plus the charity property." req={<Req>POST /business/authentication/signin</Req>} />,
    <Cell key="d" text="Email, or phone with dial code, resolved to the Cognito username. Returns ID, access and refresh tokens." req={<Req>POST /authentication/signin</Req>} />,
  ],
  [
    "Use the token",
    <Cell key="c" text="The access token goes to donation-service and the other charity services as a Bearer header. business-api-gateway has it verified by business-security-service first." req={<Req>Authorization: Bearer … on any /donation/… call</Req>} />,
    <Cell key="d" text="The access token goes to user-service as a Bearer header. The consumer gateway has it verified by security-service first." req={<Req>GET /profile/fetch-profile-details</Req>} />,
  ],
  [
    "Renew",
    <Cell key="c" text="The refresh token is exchanged for new tokens." req={<Req>GET /business/authentication/renew-token</Req>} />,
    <Cell key="d" text="The refresh token is exchanged for new tokens." req={<Req>GET /authentication/renew-token</Req>} />,
  ],
  [
    "Sign out, recover",
    <Cell key="c" text="Global sign-out, forgot-password, and a forced password change for invited staff on first login." req={<Req>POST …/signout · GET …/forgot-password/{"{email}"}</Req>} />,
    <Cell key="d" text="Sign-out, forgot-password and reset-password mirror the charity side." req={<Req>GET /authentication/forgot-password/{"{email}"}</Req>} />,
  ],
];

function VerticalFlow({ label, stages }: { label: string; stages: { name: string; sub: string }[] }) {
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        {stages.map((st, i) => (
          <div key={st.name} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper-raised)", padding: "10px 14px" }}>
              <p className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", overflowWrap: "anywhere" }}>{st.name}</p>
              <p className="mono" style={{ fontSize: "9.5px", color: "var(--ink-45)", marginTop: 3, lineHeight: 1.5 }}>{st.sub}</p>
            </div>
            {i < stages.length - 1 && <span className="mono" style={{ padding: "6px 0", color: "var(--ink-30)", fontSize: "12px", lineHeight: 1 }}>↓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthenticationSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Authentication
        </h3>
        <p style={P}>
          Kayana Aid has two kinds of user and keeps their logins completely separate. Charity admins and staff sign in
          through {M("business-security-service")} against a business Cognito user pool; donors and supporters through{" "}
          {M("security-service")} against a consumer pool. Cognito holds the passwords and issues the JWTs, and the
          security services handle sign-up, OTP, MFA and lockout around it.
        </p>
        <p style={P}>
          Tokens are not trusted on arrival. Each gateway passes every call to its own security service for
          verification before forwarding it, so a token from one pool can never satisfy a route on the other side.
        </p>
      </div>

      <style>{`
        /* phones and tablets: the three flows stay side by side and scroll sideways; desktop fills the width */
        .auth-scroll { overflow-x: auto; }
        .auth-flows { display: grid; grid-template-columns: repeat(3, 240px); width: max-content; gap: 0; }
        .auth-flows > div { min-width: 0; }
        .auth-flows > div + div { border-left: 1px solid var(--rule); padding-left: 20px; }
        .auth-flows > div:not(:last-child) { padding-right: 20px; }
        @media (min-width: 1024px) {
          .auth-flows { grid-template-columns: repeat(3, minmax(0, 1fr)); width: auto; }
          .auth-flows > div + div { padding-left: 32px; }
          .auth-flows > div:not(:last-child) { padding-right: 32px; }
        }
      `}</style>
      <div className="auth-scroll">
      <div className="auth-flows">
        <VerticalFlow
          label="Charity login"
          stages={[
            { name: "business-api-gateway", sub: "JWT filter" },
            { name: "business-security-service", sub: "sign-up · OTP · MFA · lockout" },
            { name: "AWS Cognito", sub: "business pool" },
            { name: "donation-service", sub: "campaigns · donations · Gift Aid" },
          ]}
        />
        <VerticalFlow
          label="Donor login"
          stages={[
            { name: "api-gateway", sub: "JWT filter · IP rate limit" },
            { name: "security-service", sub: "sign-up · OTP · guest merge" },
            { name: "AWS Cognito", sub: "consumer pool" },
            { name: "user-service", sub: "profile · orders · wallet" },
          ]}
        />
        <VerticalFlow
          label="Every request, both gateways"
          stages={[
            { name: "Bearer token", sub: "Authorization header" },
            { name: "verify-token", sub: "Cognito GetUser — signed-out tokens fail" },
            { name: "verify-id-token", sub: "same user · JWKS signature · role → path" },
            { name: "Route rules", sub: "internal denyAll · public list · else authenticated" },
            { name: "Service", sub: "request forwarded" },
          ]}
        />
      </div>
      </div>

      <div>
        <SubLabel>Charity admin and donor — step by step</SubLabel>
        <Table head={["Step", "Charity admin — Cognito business pool", "Donor — consumer pool, then user-service"]} cols="0.8fr 2fr 2fr" rows={FLOW_ROWS} />
      </div>

      <p style={P}>
        Two things sit alongside sign-in. The API proxy is split by audience, so charity calls can only reach the charity
        gateway and donor calls only the consumer one. And machine access is separate again: per-property API keys and
        Stream OAuth for integrations, and basic-auth super-admin for operations.
      </p>
    </div>
  );
}
