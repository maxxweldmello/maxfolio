"use client";

import { useState, useEffect } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
};

export default function CareerHero() {
  const [hovered, setHovered] = useState(false);
  const [imgHovered, setImgHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="pt-32 md:pt-40 lg:!pt-[clamp(64px,8vw,100px)]"
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid var(--rule)",
        paddingLeft: "clamp(24px, 6vw, 80px)",
        paddingRight: "clamp(24px, 6vw, 80px)",
        paddingBottom: "clamp(48px, 6vw, 72px)",
        position: "relative",
        overflow: "hidden",
        minHeight: "100svh", // the hero fills the whole screen; its content is centred in the height below the label
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Background image ── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/career/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "grayscale(1) contrast(1.3) brightness(1.6) opacity(0.07)",
        }} />
      </div>

      {/* ── Top metadata bar ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "clamp(32px, 5vw, 56px)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <p style={{ ...MONO, display: "flex", alignItems: "center", gap: "0.5em", color: "var(--ink-70)" }}>
          <span style={{ display: "inline-block", width: "1.8em", height: "1px", background: "var(--ink-70)", verticalAlign: "middle" }} />
          My Story
        </p>
      </div>

      {/* ── Three-column grid ── */}
      <div className="career-hero-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr clamp(200px, 26vw, 360px) 1fr",
        gap: "clamp(24px, 4vw, 56px)",
        alignItems: "start",
        position: "relative",
        zIndex: 1,
        marginTop: "auto",
        marginBottom: "auto",
      }}>

        {/* LEFT */}
        <div className="career-hero-left" style={{
          display: "flex", flexDirection: "column", gap: "clamp(24px, 3vw, 40px)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
        }}>
          <h1 className="display" style={{
            fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
            color: "var(--ink)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
          }}>
            Software Engineer.<br />Systems Built<br />End to End.
          </h1>
          <div style={{ width: "100%", height: 1, background: "var(--rule)" }} />
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(13px, 1.1vw, 15px)",
            lineHeight: 1.82,
            color: "var(--ink-45)",
            maxWidth: "38ch",
          }}>
            Over 1.5+ years in production, I&apos;ve built payment pipelines,
            SaaS platforms, real-time systems, and the internal tooling
            that keeps platforms running — from database design and
            backend services to responsive frontends.
          </p>
        </div>

        {/* CENTER — treated portrait */}
        <div
          className="career-hero-center"
          style={{
            position: "relative", width: "100%", aspectRatio: "3 / 4",
            overflow: "hidden",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
            transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
          }}
          onMouseEnter={() => setImgHovered(true)}
          onMouseLeave={() => setImgHovered(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/career/hero.png"
            alt="Engineering work"
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              filter: "grayscale(1) contrast(1.15) brightness(0.6)",
              transform: imgHovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          />
          {/* Scan lines overlay */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)",
          }} />
          {/* Halftone dots */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.15,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            mixBlendMode: "overlay",
          }} />
          {/* Glitch hover flicker */}
          {imgHovered && (
            <div aria-hidden style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              animation: "img-flicker 0.15s step-end 2",
              background: "rgba(255,255,255,0.04)",
            }} />
          )}
          {/* Corner ticks on image */}
          <span aria-hidden style={{ position:"absolute", top:8, left:8,  width:10, height:10, borderTop:"1px solid rgba(255,255,255,0.5)", borderLeft:"1px solid rgba(255,255,255,0.5)" }} />
          <span aria-hidden style={{ position:"absolute", top:8, right:8, width:10, height:10, borderTop:"1px solid rgba(255,255,255,0.5)", borderRight:"1px solid rgba(255,255,255,0.5)" }} />
          <span aria-hidden style={{ position:"absolute", bottom:8, left:8,  width:10, height:10, borderBottom:"1px solid rgba(255,255,255,0.5)", borderLeft:"1px solid rgba(255,255,255,0.5)" }} />
          <span aria-hidden style={{ position:"absolute", bottom:8, right:8, width:10, height:10, borderBottom:"1px solid rgba(255,255,255,0.5)", borderRight:"1px solid rgba(255,255,255,0.5)" }} />
          <p aria-hidden style={{
            ...MONO, position:"absolute", bottom:20, left:14,
            color:"rgba(255,255,255,0.35)", fontSize:7, letterSpacing:"0.18em",
          }}>IMG · 001 / HERO</p>
          <p aria-hidden style={{
            ...MONO, position:"absolute", top:20, right:14,
            color:"rgba(255,255,255,0.3)", fontSize:7, letterSpacing:"0.18em",
            writingMode:"vertical-rl",
          }}>SCAN · PROCESSED</p>
        </div>

        {/* RIGHT */}
        <div className="career-hero-right" style={{
          paddingTop: "clamp(0px, 2vw, 24px)", display: "flex", flexDirection: "column", gap: 40,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
        }}>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(13px, 1.1vw, 15px)",
            lineHeight: 1.82,
            color: "var(--ink-45)",
          }}>
            What drives me is building things that are correct — systems
            where payments settle, data is consistent, and edge cases are
            handled before they reach production. I care about the quality
            of the code underneath, not just the surface it presents.
            The record below is every company, project, and task I&apos;ve
            shipped — unfiltered and in full detail.
          </p>

          <div style={{ width: "100%", height: 1, background: "var(--rule)" }} />

          <blockquote style={{ margin: 0, paddingLeft: 20, borderLeft: "1px solid var(--rule)" }}>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 1.3vw, 17px)",
              lineHeight: 1.65,
              color: "var(--ink-70)",
              letterSpacing: "-0.01em",
            }}>
              &ldquo;It works on my machine.&rdquo;<br />
              Still the strongest sentence in engineering.<br />
              Never lost an argument with it.
            </p>
          </blockquote>

          {/* Circular scroll button — desktop only */}
          <div className="hidden lg:flex" style={{ justifyContent: "flex-start" }}>
            <button
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
              aria-label="Scroll down to timeline"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{ position: "relative", width: 100, height: 100, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
            >
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
                <defs>
                  <path id="sd-circle" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
                </defs>
                <g style={{ transformOrigin: "50px 50px", animation: "career-spin 10s linear infinite", animationPlayState: hovered ? "paused" : "running" }}>
                  <text style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.22em", textTransform: "uppercase" }} fill="var(--ink-30)">
                    <textPath href="#sd-circle" startOffset="0%">SCROLL DOWN ·</textPath>
                  </text>
                  <text style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.22em", textTransform: "uppercase" }} fill="var(--ink-30)">
                    <textPath href="#sd-circle" startOffset="50%">SCROLL DOWN ·</textPath>
                  </text>
                </g>
              </svg>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-45)" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="9" y1="2" x2="9" y2="14" stroke="currentColor" strokeWidth="1.25" />
                  <polyline points="4,10 9,15 14,10" stroke="currentColor" strokeWidth="1.25" fill="none" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes career-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes img-flicker {
          0%, 100% { opacity: 0; }
          50%       { opacity: 1; }
        }
        @media (max-width: 1023px) {
          .career-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .career-hero-center {
            max-width: 420px;
            width: 100%;
            margin: 0 auto;
            aspect-ratio: 4 / 5 !important;
          }
          .career-hero-right { padding-top: 0 !important; gap: 28px !important; }
          .career-hero-left h1 { font-size: clamp(2.2rem, 8vw, 3rem) !important; }
        }
        @media (max-width: 640px) {
          .career-hero-center { aspect-ratio: 1 / 1 !important; max-width: 360px; }
          .career-hero-left h1 { font-size: clamp(2.6rem, 12vw, 3.4rem) !important; line-height: 1.02 !important; }
          .career-hero-left p { font-size: 15px !important; line-height: 1.7 !important; color: var(--ink-70) !important; max-width: none !important; }
          .career-hero-right { gap: 24px !important; }
        }
      `}</style>
    </section>
  );
}

