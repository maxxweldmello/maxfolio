"use client";
import { useState } from "react";

const TICKER = "Java · Spring Boot · Next.js · TypeScript · PostgreSQL · Redis · AWS · REST APIs · Docker · Git · ";

export default function ResumeHero({ pdfUrl, downloadUrl }: { pdfUrl: string; downloadUrl: string }) {
  const PDF = downloadUrl || pdfUrl;
  const [hovered, setHovered] = useState(false);
  return (
    <section
      className="resume-hero"
      style={{
        position: "relative",
        background: "var(--paper)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(28px, 4vw, 52px) clamp(60px, 12vw, 180px) 0",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .resume-hero { padding: 28px 20px 0 !important; }
          .resume-hero-headline-row { align-items: center !important; gap: 16px !important; }
          .resume-hero-headline-row h1 { font-size: clamp(1.5rem, 8.2vw, 2.4rem) !important; line-height: 1 !important; white-space: nowrap; }
          .resume-hero-desc-mobile { display: block !important; font-size: 14px !important; line-height: 1.4 !important; }
          .resume-hero-desc-desktop { display: none !important; }
          .resume-hero-headline-row { display: grid !important; grid-template-columns: 1fr auto; column-gap: 12px !important; align-items: center !important; }
          .resume-hero-headline-row > div:first-child { display: contents !important; }
          .resume-hero-headline-row h1 { grid-column: 1; grid-row: 1; }
          .resume-hero-desc-mobile { grid-column: 1 / -1; grid-row: 2; }
          .resume-hero-download { grid-column: 2; grid-row: 1; padding-bottom: 0 !important; }
          .resume-hero-download a { width: 56px !important; height: 56px !important; }
          .resume-hero-download > a > svg { width: 56px !important; height: 56px !important; }
          .resume-hero-ticker { margin-left: -20px !important; margin-right: -20px !important; }
        }
      `}</style>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--ink-30)",
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
        }}>
          <span style={{ display: "inline-block", width: "1.8em", height: "1px", background: "var(--ink-30)", verticalAlign: "middle" }} />
          Résumé
        </p>
      </div>

      {/* Headline */}
      <div style={{ marginTop: "clamp(32px, 5vw, 56px)" }}>
        <div className="resume-hero-headline-row" style={{ display: "flex", alignItems: "flex-end", gap: "clamp(24px, 4vw, 56px)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              className="display"
              style={{
                fontSize: "clamp(2.4rem, 5.5vw, 6rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              The Complete Résumé.<br />On Record.
            </h1>
            <p
              className="resume-hero-desc-mobile"
              style={{
                display: "none",
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                color: "var(--ink)",
                marginTop: 14,
              }}
            >
              Every role, every system, every line that shipped to production.
              Not a highlight reel — the full record, laid out without filter.
            </p>
          </div>

          {/* Download button — sits in gap to the right of headline */}
          <div className="resume-hero-download" style={{ flexShrink: 0, paddingBottom: 8 }}>
          <a
            href={PDF}
            download="Maxwel_DMello_Software_Engineer_Resume.pdf"
            aria-label="Download résumé PDF"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ position: "relative", display: "inline-block", width: 110, height: 110, textDecoration: "none" }}
          >
            <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <path id="dl-circle" d="M 55,55 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
              </defs>
              <g style={{ transformOrigin: "55px 55px", animation: "resume-spin 10s linear infinite", animationPlayState: hovered ? "paused" : "running" }}>
                <text style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase" }} fill="var(--ink-45)">
                  <textPath href="#dl-circle" startOffset="0%">DOWNLOAD RESUME ·</textPath>
                </text>
                <text style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase" }} fill="var(--ink-45)">
                  <textPath href="#dl-circle" startOffset="50%">DOWNLOAD RESUME ·</textPath>
                </text>
              </g>
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="3" x2="12" y2="16" />
                <polyline points="6 11 12 17 18 11" />
                <line x1="4" y1="20" x2="20" y2="20" />
              </svg>
            </span>
          </a>
          <style>{`
            @keyframes resume-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
          </div>
        </div>

        <p
          className="resume-hero-desc-desktop"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(1.1rem, 2.2vw, 1.9rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            color: "var(--ink)",
            marginTop: "clamp(20px, 2.5vw, 32px)",
          }}
        >
          Every role, every system, every line that shipped to production.
          Not a highlight reel — the full record, laid out without filter.
        </p>
      </div>

      {/* Scrolling ticker */}
      <div
        className="resume-hero-ticker"
        style={{
          marginTop: "clamp(8px, 1.5vw, 16px)",
          overflow: "hidden",
          borderTop: "1px solid var(--rule)",
          paddingTop: 14,
          paddingBottom: 14,
          marginLeft: "calc(-1 * clamp(60px, 12vw, 180px))",
          marginRight: "calc(-1 * clamp(60px, 12vw, 180px))",
        }}
      >
        <div style={{ display: "flex", gap: 0, animation: "resume-ticker 22s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: i === 1 ? "var(--ink-70)" : "var(--ink-30)",
                paddingRight: "4em",
              }}
            >
              {TICKER}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes resume-ticker {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}
