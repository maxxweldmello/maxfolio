import type { CSSProperties } from "react";
import OnboardingFlows from "./OnboardingFlows";

const P: CSSProperties = { fontSize: "15px", lineHeight: 1.8, color: "var(--ink-70)", width: "100%" };

export default function OnboardingSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h3 id="charity-onboarding" className="font-light tracking-tight" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.6rem)", color: "var(--ink)", scrollMarginTop: 140 }}>
          Charity Onboarding
        </h3>
        <p style={P}>
          A charity registers through a three-step stepper: Account, Verify and Organisation. Payment setup with Stripe
          then finishes inside the dashboard. Behind that sit four backend flows: user creation, email verification,
          business creation and payment setup.
        </p>
        <p style={P}>
          Pick a flow, then a step, to see how the backend runs it: the endpoint, the classes and methods it calls in
          order, the tables it writes to, and what happens at each point.
        </p>
      </div>
      <OnboardingFlows />

    </div>
  );
}
