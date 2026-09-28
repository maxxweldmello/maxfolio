"use client";

import { useState, useEffect, useRef } from "react";

const ITEMS = [
  {
    stepLabel: "Step 1 : Signup – Connect Payments",
    sub: "Signup & Onboarding",
    desc: "Account creation, OTP, org setup, dashboard, Stripe connect",
    src: "/work/kayana-aid/walkthroughs/signup-onboarding.mov",
    cover: "Steps 1–6",
    type: "video" as const,
  },
  {
    stepLabel: "Step 7 : Shop",
    sub: "Shop",
    desc: "Hardware marketplace — terminals, kiosks, accessories",
    src: "/work/kayana-aid/walkthroughs/shop.mov",
    cover: "Step 7",
    type: "video" as const,
  },
  {
    stepLabel: "Step 8 : Campaigns",
    sub: "Campaigns",
    desc: "Create & publish campaigns with impact levels",
    src: "/work/kayana-aid/walkthroughs/campaign.mov",
    cover: "Step 8",
    type: "video" as const,
  },
  {
    stepLabel: "Step 9 : Events",
    sub: "Events",
    desc: "In-person, virtual & hybrid event management",
    src: "/work/kayana-aid/walkthroughs/events.mov",
    cover: "Step 9",
    type: "video" as const,
  },
  {
    stepLabel: "Step 10 : Fundraisers",
    sub: "Fundraisers",
    desc: "Supporter fundraising pages — monitor, publish, manage",
    src: "/work/kayana-aid/walkthroughs/fundraise-dashboard.png",
    cover: "Step 10",
    type: "image" as const,
  },
  {
    stepLabel: "Step 11 : Donations",
    sub: "Donations",
    desc: "Full donation ledger — filter, export, drill into receipts",
    src: "/work/kayana-aid/walkthroughs/donation-dashboard.mov",
    cover: "Step 11",
    type: "video" as const,
  },
  {
    stepLabel: "Step 12 : Reports",
    sub: "Reports",
    desc: "Campaign reports & hardware invoices",
    src: "/work/kayana-aid/walkthroughs/reports-dashboard.mov",
    cover: "Step 12",
    type: "video" as const,
  },
  {
    stepLabel: "Step 18 : Custom Branding",
    sub: "Custom Branding",
    desc: "White-label subdomain, banners, hide Kayana links",
    src: "/work/kayana-aid/walkthroughs/custom-domain.mp4",
    cover: "Step 18",
    type: "video" as const,
  },
  {
    stepLabel: "Step 21 : Embedded Widget",
    sub: "Embedded Widget",
    desc: "Generate script-tag embed for charity's own website",
    src: "/work/kayana-aid/walkthroughs/embedded-widget.mov",
    cover: "Step 21",
    type: "video" as const,
  },
  {
    stepLabel: "Step 24 : Team",
    sub: "Team",
    desc: "Invite staff, assign roles, manage access",
    src: "/work/kayana-aid/walkthroughs/team.mp4",
    cover: "Step 24",
    type: "video" as const,
  },
  {
    stepLabel: "Step 13–14 : Support & Reported Issues",
    sub: "Support",
    desc: "Raise tickets, track status, log & monitor platform bugs",
    src: "/work/kayana-aid/walkthroughs/support.mov",
    cover: "Steps 13–14",
    type: "video" as const,
  },
];

function VideoModal({ item, onClose, onPrev, onNext, hasPrev, hasNext }: {
  item: typeof ITEMS[number];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) onNext();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  const navBtn = (onClick: () => void, disabled: boolean, dir: "left" | "right") => (
    <button
      onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
      disabled={disabled}
      aria-label={dir === "left" ? "Previous" : "Next"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir]: -52, zIndex: 10,
        width: 36, height: 36, borderRadius: "50%",
        background: disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: disabled ? "rgba(255,255,255,0.15)" : "#fff",
        cursor: disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d={dir === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.94)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 40px",
    }}>
      <button onClick={onClose} aria-label="Close" style={{
        position: "fixed", top: 14, right: 18, zIndex: 10000,
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff", borderRadius: 999, width: 34, height: 34,
        cursor: "pointer", fontSize: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 980,
        borderRadius: 14, overflow: "visible",
      }}>
        {navBtn(onPrev, !hasPrev, "left")}
        {navBtn(onNext, !hasNext, "right")}
        <div style={{ borderRadius: 14, overflow: "hidden", background: "#0a0a0a", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}>
          {/* title bar */}
          <div style={{
            padding: "10px 18px", background: "#111", borderBottom: "1px solid #1e1e1e",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#888" }}>
              {item.stepLabel}
            </span>
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 9, color: "#555", marginLeft: "auto" }}>
              {ITEMS.indexOf(item) + 1} / {ITEMS.length}
            </span>
          </div>
          {item.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.src} src={item.src} alt={item.sub} style={{ width: "100%", display: "block", maxHeight: "82vh", objectFit: "contain" }} />
          ) : (
            <video key={item.src} src={item.src} controls autoPlay playsInline style={{ width: "100%", display: "block", maxHeight: "82vh" }} />
          )}
        </div>
      </div>
    </div>
  );
}

function VideoThumb({ src, type, onClick }: { src: string; type: "video" | "image"; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (type !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0.5;
    const onSeeked = () => setReady(true);
    v.addEventListener("seeked", onSeeked);
    return () => v.removeEventListener("seeked", onSeeked);
  }, [type]);

  return (
    <div onClick={onClick} style={{
      position: "relative", width: "100%", aspectRatio: "16/9",
      background: "#0d0d0d", overflow: "hidden", cursor: "pointer", flexShrink: 0,
    }}>
      {type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <video ref={videoRef} src={src} muted playsInline preload="metadata" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: ready ? 1 : 0, transition: "opacity 0.3s",
        }} />
      )}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
      }} />
      {type === "video" && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}>
            <svg width="9" height="10" viewBox="0 0 9 10" fill="white">
              <path d="M1.5 1L8.5 5 1.5 9V1z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CharityWalkthroughs() {
  const [active, setActive] = useState<typeof ITEMS[number] | null>(null);
  const [visible, setVisible] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Show only while strictly inside #charity — between its heading and the next section
  useEffect(() => {
    const check = () => {
      const charity = document.getElementById("charity");
      const next = document.getElementById("supporter");
      if (!charity) return;
      const vh = window.innerHeight;
      const charityTop = charity.getBoundingClientRect().top;
      const nextTop = next ? next.getBoundingClientRect().top : Infinity;
      // Charity heading has scrolled past 70% AND next section hasn't reached 30%
      setVisible(charityTop < vh * 0.7 && nextTop > vh);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-cw-card]");
    const step = (card?.getBoundingClientRect().height ?? 160) + 8;
    el.scrollBy({ top: step * dir, behavior: "smooth" });
  };

  return (
    <>
      {active && (() => {
        const idx = ITEMS.indexOf(active);
        return (
          <VideoModal
            item={active}
            onClose={() => setActive(null)}
            onPrev={() => setActive(ITEMS[idx - 1])}
            onNext={() => setActive(ITEMS[idx + 1])}
            hasPrev={idx > 0}
            hasNext={idx < ITEMS.length - 1}
          />
        );
      })()}
      <style>{`
        .cw-vtrack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          max-height: 400px;
        }
        .cw-vtrack::-webkit-scrollbar { display: none; }
        .cw-vcard {
          scroll-snap-align: start;
          flex-shrink: 0;
          border: 1px solid var(--rule);
          border-radius: 8px;
          overflow: hidden;
          background: var(--paper);
          transition: border-color 0.15s;
        }
        .cw-vcard:hover { border-color: var(--ink-30); }
        .cw-panel {
          position: fixed;
          right: 12px;
          bottom: 80px;
          transform: none;
          width: 155px;
          height: auto;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 0;
          border: none;
          border-radius: 12px;
          background: transparent;
          box-shadow: none;
          padding: 6px;
          box-sizing: border-box;
          transition: opacity 0.25s, transform 0.25s;
          pointer-events: all;
        }
        .cw-panel.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(24px);
        }
        @media (max-width: 768px) {
          .cw-scroll-arrow {
            display: none !important;
          }
          .cw-panel {
            position: static !important;
            right: unset !important;
            bottom: unset !important;
            width: 100% !important;
            height: auto !important;
            transform: none !important;
            opacity: 1 !important;
            pointer-events: all !important;
            margin-top: 16px;
            padding: 0;
          }
          .cw-panel.hidden {
            opacity: 1 !important;
            transform: none !important;
            pointer-events: all !important;
          }
          .cw-vtrack {
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            max-height: none !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 4px;
          }
          .cw-vcard {
            min-width: 140px !important;
            width: 140px !important;
            scroll-snap-align: start !important;
          }
        }
      `}</style>

      <div className={`cw-panel${visible ? "" : " hidden"}`}>
        {/* Up arrow — circle */}
        {ITEMS.length > 3 && (
          <div className="cw-scroll-arrow" style={{ display: "flex", justifyContent: "center", marginBottom: 4, flexShrink: 0 }}>
            <button onClick={() => scroll(-1)} aria-label="Previous" style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--paper-raised)", border: "1px solid var(--rule)",
              cursor: "pointer", color: "var(--ink-45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        <div ref={trackRef} className="cw-vtrack">
          {ITEMS.map((item) => (
            <div key={item.src} data-cw-card className="cw-vcard" onClick={() => setActive(item)} style={{ cursor: "pointer" }}>
              <VideoThumb src={item.src} type={item.type} onClick={() => setActive(item)} />
              <div style={{ padding: "5px 7px 7px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink)", marginBottom: 2 }}>
                  {item.cover}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--ink)", marginBottom: 0 }}>
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Down arrow — circle */}
        {ITEMS.length > 3 && (
          <div className="cw-scroll-arrow" style={{ display: "flex", justifyContent: "center", marginTop: 4, flexShrink: 0 }}>
            <button onClick={() => scroll(1)} aria-label="Next" style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--paper-raised)", border: "1px solid var(--rule)",
              cursor: "pointer", color: "var(--ink-45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
