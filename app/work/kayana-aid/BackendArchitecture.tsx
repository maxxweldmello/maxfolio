import type { CSSProperties } from "react";

type ServiceInfo = {
  name: string;
  role: string;
  desc: string;
};

type Layer = { label: string; services: boolean; items: ServiceInfo[] };

/* One row per layer of the diagram below, in the same top-to-bottom order. */
const LAYERS: Layer[] = [
  {
    label: "Client layer",
    services: false,
    items: [
      {
        name: "Next.js client",
        role: "kayana-frontend-donation-project",
        desc: "The web application for charities, staff, donors and supporters. Every call enters through one of the two gateways below — charity and staff traffic through one, donor and supporter traffic through the other.",
      },
    ],
  },
  {
    label: "Platform services — Eureka-registered",
    services: true,
    items: [
      {
        name: "discovery-service",
        role: "Eureka registry",
        desc: "Every service registers here on start-up, and the gateways resolve services by name instead of by address.",
      },
      {
        name: "config-server",
        role: "Central configuration",
        desc: "Serves each service its configuration at boot, with secrets held in Vault and AWS Secrets Manager rather than in the images.",
      },
      {
        name: "admin-server",
        role: "Spring Boot Admin",
        desc: "One console over the Actuator endpoints of every registered service: health, metrics and log levels.",
      },
    ],
  },
  {
    label: "API gateway layer",
    services: true,
    items: [
      {
        name: "business-api-gateway",
        role: "Gateway, charity side",
        desc: "Front door for charity and staff traffic. A JWT filter checks every call before routing it to the service behind it.",
      },
      {
        name: "api-gateway",
        role: "Gateway, donor and supporter side",
        desc: "A second, separate front door with its own routes and an IP rate limiter, kept apart from the charity side.",
      },
    ],
  },
  {
    label: "Security layer — Cognito-backed identity",
    services: true,
    items: [
      {
        name: "business-security-service",
        role: "Identity, charity accounts",
        desc: "Sign-up, OTP verification, MFA, lockout and token verification for charity admins and staff, on the business Cognito pool.",
      },
      {
        name: "security-service",
        role: "Identity, donor and supporter accounts",
        desc: "The consumer counterpart: sign-up, OTP, sign-in and token verification on a separate Cognito pool, plus guest-to-account migration.",
      },
      {
        name: "AWS Cognito",
        role: "Identity provider",
        desc: "Holds the passwords and issues the JWTs, in two separate user pools: one for charities, one for donors.",
      },
    ],
  },
  {
    label: "Domain services — request path",
    services: true,
    items: [
      {
        name: "donation-service",
        role: "Core product",
        desc: "Onboarding, campaigns, events, fundraising pages, donations, Gift Aid, staff and roles, custom branding, and hardware checkout.",
      },
      {
        name: "user-service",
        role: "Donor and supporter domain",
        desc: "Everything donor- and supporter-facing: profiles, orders and wallet.",
      },
      {
        name: "webhook-service",
        role: "Event consumer",
        desc: "Consumes payment and onboarding events from Kafka and applies them: marks donations paid, updates campaign totals, sends receipts, activates charities.",
      },
    ],
  },
  {
    label: "Supporting services — OpenFeign",
    services: true,
    items: [
      {
        name: "async-notification-service",
        role: "Email and SMS",
        desc: "Delivers OTP codes, receipts and other notifications on behalf of the other services.",
      },
    ],
  },
  {
    label: "Stripe payments",
    services: false,
    items: [
      {
        name: "Stripe",
        role: "Connect · payments",
        desc: "Each charity has its own connected account. donation-service creates payments directly with Stripe, and Stripe reports the outcome back as events.",
      },
    ],
  },
  {
    label: "Kafka",
    services: false,
    items: [
      {
        name: "Kafka",
        role: "AWS MSK · event bridge",
        desc: "Carries payment and onboarding events to webhook-service, so a slow or failing webhook never blocks a donation.",
      },
    ],
  },
  {
    label: "Data, messaging & storage",
    services: false,
    items: [
      {
        name: "Postgres",
        role: "One database · 5 schemas",
        desc: "Shared by the services, with read and write traffic routed to separate data sources.",
      },
      {
        name: "AWS S3",
        role: "File storage",
        desc: "Campaign cover images, charity logos and banners, and profile pictures.",
      },
      {
        name: "SES / SNS / SQS",
        role: "Email · SMS · queues",
        desc: "AWS email, SMS and queue services.",
      },
    ],
  },
  {
    label: "CI/CD — per service",
    services: false,
    items: [
      { name: "Development", role: "GitHub / GitLab", desc: "Source and pull requests." },
      { name: "GitHub Actions", role: "OIDC auth", desc: "Pipeline per service, authenticating to AWS through OIDC." },
      { name: "Build", role: "GraalVM · Paketo", desc: "Container image built with GraalVM and Paketo buildpacks." },
      { name: "Amazon ECR", role: "Image registry", desc: "Stores each built image." },
      { name: "ECS Task Def", role: "Render & register", desc: "Rendered and registered for every deploy." },
      { name: "ECS Service", role: "Blue-green deploy", desc: "Runs the task with a blue-green rollout." },
    ],
  },
];

const SERVICE_COUNT = LAYERS.filter((l) => l.services).reduce((n, l) => n + l.items.length, 0);

/* ── architecture diagram — plain inline SVG, black card, white on black, no icons ── */

const INK   = "#fafafa";
const FAINT = "rgba(255,255,255,0.5)";
const DIM   = "rgba(255,255,255,0.32)";
const LINE  = "rgba(255,255,255,0.38)";
const NODE_BORDER = "rgba(255,255,255,0.55)";
const GROUP_BORDER = "rgba(255,255,255,0.22)";

type Box = { id: string; x: number; y: number; w: number; h: number; label: string; sub?: string };
type Group = { x: number; y: number; w: number; h: number; label: string };

/* the Kayana Aid request path, its supporting services and data layer */
const BACKBONE: Box[] = [
  { id: "client",   x: 400, y: 24,  w: 320, h: 60, label: "Next.js client", sub: "kayana-frontend-donation-project" },

  { id: "discovery", x: 70,  y: 150, w: 320, h: 66, label: "discovery-service", sub: "Eureka · service registry" },
  { id: "config",    x: 410, y: 150, w: 320, h: 66, label: "config-server", sub: "Vault + AWS Secrets Manager" },
  { id: "admin",     x: 750, y: 150, w: 320, h: 66, label: "admin-server", sub: "Spring Boot Admin · Actuator" },

  { id: "bgw", x: 110, y: 280, w: 300, h: 46, label: "business-api-gateway" },
  { id: "gw",  x: 650, y: 280, w: 300, h: 46, label: "api-gateway" },

  { id: "bsec", x: 110, y: 394, w: 300, h: 46, label: "business-security-service" },
  { id: "sec",  x: 650, y: 394, w: 300, h: 46, label: "security-service" },
  { id: "cognito", x: 990, y: 384, w: 110, h: 66, label: "AWS Cognito", sub: "identity & access" },

  { id: "donation", x: 70,  y: 524, w: 300, h: 46, label: "donation-service" },
  { id: "user",     x: 410, y: 524, w: 300, h: 46, label: "user-service" },
  { id: "webhook",  x: 750, y: 524, w: 300, h: 46, label: "webhook-service" },

  { id: "notif", x: 60,  y: 660, w: 205, h: 46, label: "async-notification-service" },
  { id: "stripe", x: 1005, y: 650, w: 110, h: 66, label: "Stripe", sub: "Connect · payments" },

  { id: "mail",     x: 60,  y: 800, w: 210, h: 70, label: "SES / SNS / SQS", sub: "email · sms · queues" },
  { id: "postgres", x: 290, y: 800, w: 220, h: 70, label: "Postgres", sub: "one database · 5 schemas" },
  { id: "s3",       x: 530, y: 800, w: 190, h: 70, label: "AWS S3", sub: "file storage" },
  { id: "kafka",    x: 800, y: 800, w: 280, h: 70, label: "Kafka", sub: "AWS MSK · payment & onboarding events" },

  { id: "dev",  x: 70,  y: 970, w: 150, h: 70, label: "Development", sub: "GitHub / GitLab" },
  { id: "gha",  x: 235, y: 970, w: 150, h: 70, label: "GitHub Actions", sub: "OIDC auth" },
  { id: "build", x: 400, y: 970, w: 150, h: 70, label: "Build", sub: "GraalVM · Paketo" },
  { id: "ecr",  x: 565, y: 970, w: 150, h: 70, label: "Amazon ECR", sub: "image registry" },
  { id: "task", x: 730, y: 970, w: 150, h: 70, label: "ECS Task Def", sub: "render & register" },
  { id: "ecs",  x: 895, y: 970, w: 150, h: 70, label: "ECS Service", sub: "blue-green deploy" },
];

const GROUPS: Group[] = [
  { x: 40, y: 120, w: 1060, h: 130, label: "Platform services — Eureka-registered" },
  { x: 40, y: 364, w: 950, h: 106, label: "Security layer — Cognito-backed identity" },
  { x: 40, y: 494, w: 1060, h: 106, label: "Domain services — request path" },
  { x: 40, y: 630, w: 250, h: 106, label: "Supporting services — OpenFeign" },
  { x: 40, y: 770, w: 1060, h: 140, label: "Data, messaging & storage" },
  { x: 40, y: 940, w: 1060, h: 140, label: "CI/CD — per service" },
];

const boxById = Object.fromEntries(BACKBONE.map((b) => [b.id, b]));

function pt(b: Box, side: Side, frac = 0.5) {
  if (side === "top")    return { x: b.x + b.w * frac, y: b.y };
  if (side === "bottom") return { x: b.x + b.w * frac, y: b.y + b.h };
  if (side === "left")   return { x: b.x, y: b.y + b.h * frac };
  return { x: b.x + b.w, y: b.y + b.h * frac };
}

type Side = "top" | "bottom" | "left" | "right";
type Arrow = { from: [number, number]; to: [number, number]; label?: string; dim?: boolean };

function arrow(fromId: string, side1: Side, toId: string, side2: Side, opts?: { fromFrac?: number; toFrac?: number; label?: string; dim?: boolean }): Arrow {
  const a = pt(boxById[fromId], side1, opts?.fromFrac);
  const b = pt(boxById[toId], side2, opts?.toFrac);
  return { from: [a.x, a.y], to: [b.x, b.y], label: opts?.label, dim: opts?.dim };
}

const ARROWS: Arrow[] = [
  arrow("client", "bottom", "bgw", "top"),
  arrow("client", "bottom", "gw", "top"),

  arrow("discovery", "bottom", "bgw", "top", { fromFrac: 0.6, toFrac: 0.25, dim: true }),
  arrow("discovery", "bottom", "gw", "top", { fromFrac: 0.6, toFrac: 0.25, dim: true }),
  arrow("config", "bottom", "bgw", "top", { fromFrac: 0.5, toFrac: 0.5, dim: true }),
  arrow("config", "bottom", "gw", "top", { fromFrac: 0.5, toFrac: 0.5, dim: true }),
  arrow("admin", "bottom", "bgw", "top", { fromFrac: 0.4, toFrac: 0.75, dim: true }),
  arrow("admin", "bottom", "gw", "top", { fromFrac: 0.4, toFrac: 0.75, dim: true }),

  arrow("bgw", "bottom", "bsec", "top"),
  arrow("gw", "bottom", "sec", "top"),

  arrow("bsec", "right", "cognito", "left", { toFrac: 0.3 }),
  arrow("sec", "right", "cognito", "left", { toFrac: 0.7 }),

  arrow("bsec", "bottom", "donation", "top"),
  arrow("sec", "bottom", "user", "top"),

  { from: [160, 602], to: [160, 630], label: "OpenFeign", dim: true },
  arrow("donation", "bottom", "stripe", "left", { fromFrac: 0.9, toFrac: 0.5, label: "payments" }),
  arrow("stripe", "bottom", "kafka", "top", { fromFrac: 0.5, toFrac: 0.93, label: "events", dim: true }),
  arrow("kafka", "top", "webhook", "bottom", { fromFrac: 0.5, toFrac: 0.5 }),

  arrow("notif", "bottom", "mail", "top", { fromFrac: 0.5, toFrac: 0.5 }),
  arrow("donation", "bottom", "postgres", "top", { fromFrac: 0.7, toFrac: 0.2, dim: true }),
  arrow("user", "bottom", "postgres", "top", { fromFrac: 0.2, toFrac: 0.7, dim: true }),
  arrow("user", "bottom", "s3", "top", { fromFrac: 0.8, toFrac: 0.4, dim: true }),

  arrow("dev", "right", "gha", "left"),
  arrow("gha", "right", "build", "left"),
  arrow("build", "right", "ecr", "left"),
  arrow("ecr", "right", "task", "left"),
  arrow("task", "right", "ecs", "left"),
];

/* ── the same topology reshaped as a narrow portrait diagram for phones and tablets (viewBox 300 wide,
      so it is drawn at about 1:1 instead of shrunk from the 1140-wide desktop one) ── */
type MBox = { x: number; y: number; w: number; h: number; label: string | string[]; sub?: string };
const MB: Record<string, MBox> = {
  client:    { x: 60,  y: 8,   w: 180, h: 50, label: "Next.js client", sub: "kayana-frontend-donation-project" },
  bgw:       { x: 10,  y: 92,  w: 135, h: 46, label: "business-api-gateway" },
  gw:        { x: 155, y: 92,  w: 135, h: 46, label: "api-gateway" },
  cognito:   { x: 90,  y: 182, w: 120, h: 40, label: "AWS Cognito", sub: "identity & access" },
  bsec:      { x: 10,  y: 242, w: 135, h: 46, label: ["business-security-", "service"] },
  sec:       { x: 155, y: 242, w: 135, h: 46, label: "security-service" },
  donation:  { x: 12,  y: 346, w: 86,  h: 50, label: ["donation-", "service"] },
  user:      { x: 107, y: 346, w: 86,  h: 50, label: ["user-", "service"] },
  webhook:   { x: 202, y: 346, w: 86,  h: 50, label: ["webhook-", "service"] },
  notif:     { x: 12,  y: 458, w: 135, h: 50, label: ["async-notification-", "service"] },
  stripe:    { x: 157, y: 458, w: 131, h: 50, label: "Stripe", sub: "Connect · payments" },
  mail:      { x: 12,  y: 570, w: 86,  h: 50, label: "SES/SNS/SQS", sub: "email · sms" },
  postgres:  { x: 107, y: 570, w: 86,  h: 50, label: "Postgres", sub: "5 schemas" },
  s3:        { x: 202, y: 570, w: 86,  h: 50, label: "AWS S3", sub: "files" },
  kafka:     { x: 12,  y: 634, w: 276, h: 46, label: "Kafka", sub: "AWS MSK · payment & onboarding events" },
  discovery: { x: 12,  y: 736, w: 276, h: 44, label: "discovery-service", sub: "Eureka · service registry" },
  config:    { x: 12,  y: 788, w: 276, h: 44, label: "config-server", sub: "Vault + AWS Secrets Manager" },
  admin:     { x: 12,  y: 840, w: 276, h: 44, label: "admin-server", sub: "Spring Boot Admin · Actuator" },
  dev:       { x: 10,  y: 940, w: 84,  h: 50, label: "Development", sub: "GitHub / GitLab" },
  gha:       { x: 106, y: 940, w: 84,  h: 50, label: "GitHub Actions", sub: "OIDC auth" },
  build:     { x: 202, y: 940, w: 84,  h: 50, label: "Build", sub: "GraalVM · Paketo" },
  ecr:       { x: 10,  y: 1008, w: 84, h: 50, label: "Amazon ECR", sub: "image registry" },
  task:      { x: 106, y: 1008, w: 84, h: 50, label: "ECS Task Def", sub: "render & register" },
  ecs:       { x: 202, y: 1008, w: 84, h: 50, label: "ECS Service", sub: "blue-green deploy" },
};
const MG: Group[] = [
  { x: 4, y: 156, w: 292, h: 146, label: "Security" },
  { x: 4, y: 318, w: 292, h: 96,  label: "Domain" },
  { x: 4, y: 430, w: 292, h: 96,  label: "Supporting" },
  { x: 4, y: 542, w: 292, h: 150, label: "Data" },
  { x: 4, y: 708, w: 292, h: 188, label: "Platform" },
  { x: 4, y: 912, w: 292, h: 158, label: "CI/CD" },
];
const mp = (id: string, side: Side, frac = 0.5): [number, number] => {
  const b = MB[id];
  if (side === "top")    return [b.x + b.w * frac, b.y];
  if (side === "bottom") return [b.x + b.w * frac, b.y + b.h];
  if (side === "left")   return [b.x, b.y + b.h * frac];
  return [b.x + b.w, b.y + b.h * frac];
};
const MA: Arrow[] = [
  { from: mp("client", "bottom", 0.5), to: mp("bgw", "top") },
  { from: mp("client", "bottom", 0.5), to: mp("gw", "top") },
  { from: mp("bgw", "bottom"), to: mp("bsec", "top") },
  { from: mp("gw", "bottom"), to: mp("sec", "top") },
  { from: mp("cognito", "bottom", 0.25), to: mp("bsec", "top", 0.7), dim: true },
  { from: mp("cognito", "bottom", 0.75), to: mp("sec", "top", 0.3), dim: true },
  { from: mp("bsec", "bottom"), to: mp("donation", "top") },
  { from: mp("sec", "bottom"), to: mp("user", "top") },
  { from: mp("donation", "bottom", 0.9), to: mp("notif", "top", 0.65), label: "OpenFeign", dim: true },
  { from: mp("donation", "bottom", 0.55), to: mp("stripe", "top", 0.3), label: "payments" },
  { from: mp("notif", "bottom", 0.4), to: mp("mail", "top", 0.5), dim: true },
  { from: mp("dev", "right"), to: mp("gha", "left") },
  { from: mp("gha", "right"), to: mp("build", "left") },
  { from: mp("build", "bottom"), to: mp("ecr", "top", 0.5) },
  { from: mp("ecr", "right"), to: mp("task", "left") },
  { from: mp("task", "right"), to: mp("ecs", "left") },
];

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };
const SVC = (n: string) => <span className="mono" style={{ fontSize: "13px", color: "var(--ink)" }}>{n}</span>;

export default function BackendArchitecture() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)" }}>
          Service Topology
        </h3>
        <p style={P}>
          Kayana Aid runs on a Spring Boot microservice backend that is part of a larger internal platform, and
          {" "}{SERVICE_COUNT} of the platform&apos;s services serve it. All of them are built on Spring WebFlux, register with
          Eureka for discovery and load their configuration from a central config server.
        </p>
        <p style={P}>
          Requests enter through two Spring Cloud Gateways: {SVC("business-api-gateway")} for charity and staff traffic
          and {SVC("api-gateway")} for donors and supporters. Each gateway is paired with its own Cognito-backed
          security service, so the two kinds of login never share an authentication path, and every call&apos;s token is
          verified before it is forwarded.
        </p>
        <p style={P}>
          Behind the gateways sit three domain services. {SVC("donation-service")} owns the product: onboarding,
          campaigns, events, fundraising pages, donations, Gift Aid and hardware checkout. {SVC("user-service")} owns
          everything donor- and supporter-facing. {SVC("webhook-service")} turns payment and onboarding events into state
          changes. {SVC("async-notification-service")} is called over OpenFeign to deliver email and SMS.
        </p>
        <p style={P}>
          Payments are kept off the request path. {SVC("donation-service")} creates the payment directly with Stripe
          and returns straight away. Stripe&apos;s outcome is published as events to Kafka on AWS MSK;
          {" "}{SVC("webhook-service")} consumes them and marks the donation paid, so a slow or failing webhook never
          blocks a donor.
        </p>
      </div>

      <div>
        <p className="mono mb-4" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)" }}>
          Layers and services — {SERVICE_COUNT} services
        </p>
        <style>{`
          .arch-items { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 1px; }
          .arch-row { display: grid; grid-template-columns: 200px minmax(0, 1fr); }
        `}</style>

        {/* desktop: one row per layer */}
        <div className="hidden lg:block" style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
          {LAYERS.map((l, li) => (
            <div key={l.label} className="arch-row" style={{ borderTop: li > 0 ? "1px solid var(--rule)" : "none" }}>
              <p
                className="mono"
                style={{ background: "var(--paper-raised)", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", lineHeight: 1.6, color: "var(--ink)", padding: "16px", borderRight: "1px solid var(--rule)" }}
              >
                {l.label}
              </p>
              <div className="arch-items" style={{ ["--n" as string]: l.items.length, background: "var(--rule)" }}>
                {l.items.map((it) => (
                  <div key={it.name} style={{ padding: "16px", background: "var(--paper)" }}>
                    <p className="mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", overflowWrap: "anywhere" }}>{it.name}</p>
                    <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-30)", margin: "4px 0 8px" }}>{it.role}</p>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>{it.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* mobile and tablet: inverted, one column per layer, scrolls sideways */}
        <div className="lg:hidden" style={{ border: "1px solid var(--rule)", borderRadius: 8, overflowX: "auto" }}>
          <div style={{ display: "flex", width: "max-content" }}>
            {LAYERS.map((l, li) => (
              <div key={l.label} style={{ flex: "0 0 240px", borderLeft: li > 0 ? "1px solid var(--rule)" : "none" }}>
                <p
                  className="mono"
                  style={{ background: "var(--paper-raised)", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", lineHeight: 1.6, color: "var(--ink)", padding: "14px 16px", borderBottom: "1px solid var(--rule)", minHeight: 76 }}
                >
                  {l.label}
                </p>
                {l.items.map((it, ii) => (
                  <div key={it.name} style={{ padding: "14px 16px", borderTop: ii > 0 ? "1px solid var(--rule)" : "none" }}>
                    <p className="mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", overflowWrap: "anywhere" }}>{it.name}</p>
                    <p className="mono" style={{ fontSize: "9.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-30)", margin: "4px 0 8px" }}>{it.role}</p>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>{it.desc}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#000", borderRadius: 14, padding: "32px 24px 28px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ marginBottom: 22, paddingLeft: 4 }}>
          <p className="mono" style={{ fontSize: "13px", color: INK, marginBottom: 4, letterSpacing: "0.01em" }}>kayana-aid · service topology</p>
          <p className="mono" style={{ fontSize: "10px", color: FAINT, letterSpacing: "0.04em" }}>
            {SERVICE_COUNT} services · Eureka + Config Server platform · Postgres / Kafka data layer · GitHub Actions → ECS
          </p>
        </div>

        <svg className="hidden lg:block" viewBox="0 0 1140 1100" style={{ width: "100%", height: "auto" }}>
          <defs>
            <marker id="arrow-w" markerWidth="6.5" markerHeight="6.5" refX="5" refY="3.25" orient="auto">
              <path d="M0,0 L6.5,3.25 L0,6.5 Z" fill={LINE} />
            </marker>
            <marker id="arrow-d" markerWidth="6.5" markerHeight="6.5" refX="5" refY="3.25" orient="auto">
              <path d="M0,0 L6.5,3.25 L0,6.5 Z" fill={DIM} />
            </marker>
          </defs>

          {GROUPS.map((g) => (
            <g key={g.label}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="8" fill="none" stroke={GROUP_BORDER} strokeWidth="1" strokeDasharray="2 5" />
              <text x={g.x + 16} y={g.y + 20} className="mono" fontSize="9.5" fill={DIM} letterSpacing="0.06em">
                {g.label.toUpperCase()}
              </text>
            </g>
          ))}

          {ARROWS.map((a, i) => (
            <g key={i}>
              <line
                x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]}
                stroke={a.dim ? DIM : LINE}
                strokeWidth="1"
                strokeDasharray="3 4"
                markerEnd={`url(#arrow-${a.dim ? "d" : "w"})`}
              />
              {a.label && (
                <text
                  x={(a.from[0] + a.to[0]) / 2 + 10}
                  y={(a.from[1] + a.to[1]) / 2 + 4}
                  className="mono"
                  fontSize="8.5"
                  fill={DIM}
                  letterSpacing="0.04em"
                >
                  {a.label}
                </text>
              )}
            </g>
          ))}

          {BACKBONE.map((b) => (
            <g key={b.id}>
              <rect
                x={b.x} y={b.y} width={b.w} height={b.h} rx="5"
                fill="rgba(255,255,255,0.02)"
                stroke={NODE_BORDER}
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <text
                x={b.x + b.w / 2}
                y={b.sub ? b.y + b.h / 2 - 4 : b.y + b.h / 2 + 4}
                textAnchor="middle"
                className="mono"
                fontSize="10.5"
                fill={INK}
                letterSpacing="0.01em"
              >
                {b.label}
              </text>
              {b.sub && (
                <text
                  x={b.x + b.w / 2}
                  y={b.y + b.h / 2 + 14}
                  textAnchor="middle"
                  className="mono"
                  fontSize="8.5"
                  fill={FAINT}
                >
                  {b.sub}
                </text>
              )}
            </g>
          ))}
        </svg>

        <svg className="block lg:hidden" viewBox="0 0 300 1082" style={{ width: "100%", maxWidth: 480, height: "auto", margin: "0 auto" }}>
          <defs>
            <marker id="m-arrow-w" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={LINE} />
            </marker>
            <marker id="m-arrow-d" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={DIM} />
            </marker>
          </defs>

          {MG.map((g) => (
            <g key={g.label}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="8" fill="none" stroke={GROUP_BORDER} strokeWidth="1" strokeDasharray="2 5" />
              <text x={g.x + 12} y={g.y + 17} className="mono" style={{ fontSize: 8 }} fill={DIM} letterSpacing="0.06em">{g.label.toUpperCase()}</text>
            </g>
          ))}

          {MA.map((a, i) => (
            <g key={i}>
              <line x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]} stroke={a.dim ? DIM : LINE} strokeWidth="1" strokeDasharray="3 3" markerEnd={`url(#m-arrow-${a.dim ? "d" : "w"})`} />
              {a.label && (
                <text x={(a.from[0] + a.to[0]) / 2 + 6} y={(a.from[1] + a.to[1]) / 2 + 3} className="mono" style={{ fontSize: 7.5 }} fill={DIM}>{a.label}</text>
              )}
            </g>
          ))}

          {Object.entries(MB).map(([id, b]) => {
            const lines = Array.isArray(b.label) ? b.label : [b.label];
            const two = lines.length > 1;
            const cy = b.y + b.h / 2;
            const first = b.sub ? cy - 4 : two ? cy - 3 : cy + 3.5;
            return (
              <g key={id}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="5" fill="rgba(255,255,255,0.02)" stroke={NODE_BORDER} strokeWidth="1" strokeDasharray="4 3" />
                {lines.map((ln, li) => (
                  <text key={li} x={b.x + b.w / 2} y={first + li * 11} textAnchor="middle" className="mono" style={{ fontSize: 9.5 }} fill={INK}>{ln}</text>
                ))}
                {b.sub && (
                  <text x={b.x + b.w / 2} y={first + lines.length * 11 + 2} textAnchor="middle" className="mono" style={{ fontSize: 7.5 }} fill={FAINT}>{b.sub}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
