import type { Metadata } from "next";
import ContactLinkRow from "@/components/contact/ContactLinkRow";
import ContactHeroImage from "@/components/contact/ContactHeroImage";
import { getContactPage } from "@/lib/data";
import Tour from "@/components/tour/Tour";
import { siteTour } from "@/components/tour/flow";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Maxwel D'Mello — email, LinkedIn, or GitHub.",
};

export default async function ContactPage() {
  const { eyebrow, heading, statement, links, footer } = await getContactPage();

  return (
    <main
      className="contact-main"
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "clamp(56px, 7vh, 88px) clamp(24px, 5vw, 72px) clamp(20px, 3vh, 40px)",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <style>{`
        @media (max-width: 1023px) {
          .contact-main {
            height: auto !important;
            min-height: 100dvh;
            overflow: visible !important;
            padding: 72px 20px 120px !important;
          }
          .contact-top {
            padding-top: 0 !important;
          }
          .contact-hero-img {
            position: static !important;
            width: 78% !important;
            max-width: 360px !important;
            height: auto !important;
            margin: 24px auto !important;
            display: block !important;
            /* on mobile this sits after the heading + statement/location in DOM order already */
          }
          .contact-eyebrow { position: static !important; }
          .contact-heading { font-size: clamp(3rem, 15vw, 5rem) !important; padding-top: 12px !important; }
          .contact-rule { width: 100% !important; }
          .contact-links-grid { grid-template-columns: 1fr !important; }
          .contact-links-grid > div:first-child { display: none; }
        }
      `}</style>
      {/* Shared positioning context for the floating hero image — spans TOP +
          MIDDLE so on mobile (where the image drops into normal flow) it can
          sit in DOM order after both, while desktop still floats it up over
          the heading exactly as before (same top-left origin as before). */}
      <div style={{ position: "relative" }}>
        {/* ── TOP: eyebrow + big heading ── */}
        <div className="contact-top" style={{ paddingTop: "clamp(28px, 6vh, 72px)" }}>
          <div style={{ position: "relative" }}>
            <p
              className="contact-eyebrow"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--ink-30)",
              }}
            >
              <span style={{ display: "inline-block", width: "1.8em", height: "1px", background: "var(--ink-45)", verticalAlign: "middle", marginRight: "0.5em", marginBottom: "1px" }} />
              {eyebrow}
            </p>
            <h1
              className="display contact-heading"
              style={{
                fontSize: "clamp(3.2rem, 9vw, 9.5rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                paddingTop: "clamp(18px, 3vh, 32px)",
              }}
            >
              {heading}
            </h1>
          </div>
          <div className="contact-rule" style={{ height: 1, width: "60%", background: "var(--rule)", marginTop: "clamp(16px, 2.5vh, 28px)" }} />
        </div>

        {/* ── MIDDLE: statement ── */}
        <div style={{ marginTop: "clamp(20px, 4vh, 48px)" }}>
          <p
            data-tour="contact-statement"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1.1rem, 2.2vw, 1.9rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginBottom: 10,
              whiteSpace: "pre-line",
            }}
          >
            {statement}
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-30)",
              marginTop: 14,
            }}
          >
            {footer.location}
          </p>
        </div>

        {/* contact hero image — floats right of the heading on desktop
            (absolute, positioned from this wrapper's top-left); on mobile
            it's `position: static`, so it renders here in DOM order —
            after the heading AND the statement/location above. */}
        <ContactHeroImage className="contact-hero-img" />
      </div>

      {/* ── BOTTOM: links right-column ── */}
      <div
        className="contact-links-grid"
        style={{
          marginTop: "clamp(16px, 4vh, 48px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(24px, 4vw, 64px)",
        }}
      >
        <div />
        <div style={{ borderTop: "1px solid var(--rule)" }}>
          {links.map((link) => (
            <ContactLinkRow key={link.label} {...link} />
          ))}
        </div>
      </div>
      <Tour steps={siteTour} autoStartDelay={null} fabTone="dark" fabInNav />
    </main>
  );
}
