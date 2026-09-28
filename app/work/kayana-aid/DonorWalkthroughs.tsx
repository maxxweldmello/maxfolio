"use client";

import { useState, useEffect, useRef } from "react";

const ITEMS = [
  {
    stepLabel: "Steps 1–6 : Donor Flow",
    sub: "Donor Flow",
    desc: "Discover, choose amount, fill details, Gift Aid & pay, receipt, donor account",
    src: "/work/kayana-aid/walkthroughs/donor-flow.mov",
    cover: "Steps 1–6",
    type: "video" as const,
  },
];

function VideoModal({ item, onClose }: { item: typeof ITEMS[number]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 40px" }}>
      <button onClick={onClose} aria-label="Close" style={{ position: "fixed", top: 14, right: 18, zIndex: 10000, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 980, borderRadius: 14, overflow: "visible" }}>
        <div style={{ borderRadius: 14, overflow: "hidden", background: "#0a0a0a", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}>
          <div style={{ padding: "10px 18px", background: "#111", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
            </div>
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#888" }}>{item.stepLabel}</span>
          </div>
          <video key={item.src} src={item.src} controls autoPlay playsInline style={{ width: "100%", display: "block", maxHeight: "82vh" }} />
        </div>
      </div>
    </div>
  );
}

function VideoThumb({ src, onClick }: { src: string; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0.5;
    const onSeeked = () => setReady(true);
    v.addEventListener("seeked", onSeeked);
    return () => v.removeEventListener("seeked", onSeeked);
  }, []);

  return (
    <div onClick={onClick} style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0d0d0d", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
      <video ref={videoRef} src={src} muted playsInline preload="metadata" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: ready ? 1 : 0, transition: "opacity 0.3s" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <svg width="9" height="10" viewBox="0 0 9 10" fill="white"><path d="M1.5 1L8.5 5 1.5 9V1z" /></svg>
        </div>
      </div>
    </div>
  );
}

export default function DonorWalkthroughs() {
  const [active, setActive] = useState<typeof ITEMS[number] | null>(null);
  const [visible, setVisible] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      const donor = document.getElementById("donor");
      const next = document.getElementById("backend");
      if (!donor) return;
      const vh = window.innerHeight;
      const donorTop = donor.getBoundingClientRect().top;
      const nextTop = next ? next.getBoundingClientRect().top : Infinity;
      setVisible(donorTop < vh * 0.7 && nextTop > vh);
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
      {active && <VideoModal item={active} onClose={() => setActive(null)} />}
      <style>{`
        .dw-vtrack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .dw-vtrack::-webkit-scrollbar { display: none; }
        .dw-vcard {
          scroll-snap-align: start;
          flex-shrink: 0;
          border: 1px solid var(--rule);
          border-radius: 8px;
          overflow: hidden;
          background: var(--paper);
          transition: border-color 0.15s;
        }
        .dw-vcard:hover { border-color: var(--ink-30); }
        .dw-panel {
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
        .dw-panel.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(24px);
        }
        @media (max-width: 768px) {
          .dw-panel {
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
          .dw-panel.hidden {
            opacity: 1 !important;
            transform: none !important;
            pointer-events: all !important;
          }
          .dw-vtrack {
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            max-height: none !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 4px;
            justify-content: center !important;
          }
          .dw-vcard {
            min-width: 140px !important;
            width: 140px !important;
            scroll-snap-align: start !important;
          }
        }
      `}</style>

      <div className={`dw-panel${visible ? "" : " hidden"}`}>
        {ITEMS.length > 3 && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, flexShrink: 0 }}>
            <button onClick={() => scroll(-1)} aria-label="Previous" style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--paper-raised)", border: "1px solid var(--rule)", cursor: "pointer", color: "var(--ink-45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}

        <div ref={trackRef} className="dw-vtrack">
          {ITEMS.map((item) => (
            <div key={item.src} data-cw-card className="dw-vcard" onClick={() => setActive(item)} style={{ cursor: "pointer" }}>
              <VideoThumb src={item.src} onClick={() => setActive(item)} />
              <div style={{ padding: "5px 7px 7px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink)", marginBottom: 2 }}>{item.cover}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--ink)", marginBottom: 0 }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {ITEMS.length > 3 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 4, flexShrink: 0 }}>
            <button onClick={() => scroll(1)} aria-label="Next" style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--paper-raised)", border: "1px solid var(--rule)", cursor: "pointer", color: "var(--ink-45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
