"use client";

import { useEffect, useRef, useState } from "react";

type PublicPage = { title: string; annotation?: string; desc: string; image: string | null; displayUrl?: string };

function Lightbox({ items, startIdx, onClose }: { items: PublicPage[]; startIdx: number; onClose: () => void }) {
  const [cur, setCur] = useState(startIdx);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to start slide on mount
  useEffect(() => {
    slideRefs.current[startIdx]?.scrollIntoView({ behavior: "instant" as ScrollBehavior, inline: "start", block: "nearest" });
  }, [startIdx]);

  // Track active slide via IntersectionObserver (same pattern as carousel)
  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setCur(Number(e.target.getAttribute("data-lb-index"))); }),
      { root, threshold: 0.6 }
    );
    slideRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") slideRefs.current[cur - 1]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      if (e.key === "ArrowRight") slideRefs.current[cur + 1]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, cur]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)" }}>
      {/* Horizontal scroll-snap track — same mechanism as the carousel */}
      <div
        ref={trackRef}
        style={{
          position: "absolute", inset: 0,
          display: "flex", overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x mandatory", scrollbarWidth: "none",
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.title}
            ref={el => { slideRefs.current[i] = el; }}
            data-lb-index={i}
            style={{
              flexShrink: 0, width: "100%", height: "100%",
              scrollSnapAlign: "start",
              overflowY: "auto",
              padding: "48px 16px 56px",
              boxSizing: "border-box",
            }}
            onClick={onClose}
          >
            {/* Full card */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 1100, margin: "0 auto",
                borderRadius: 10, overflow: "hidden",
                background: "var(--paper)", border: "1px solid var(--rule)",
                boxShadow: "0 32px 100px rgba(0,0,0,0.7)",
              }}
            >
              {/* Text meta */}
              <div style={{ padding: "28px 32px" }}>
                <span className="serif block" style={{ fontSize: "1.4rem", color: "var(--ink-15)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mono mt-2 mb-2" style={{ fontSize: "13px", color: "var(--ink)", letterSpacing: "0.02em" }}>
                  {item.title.toUpperCase()}
                </p>
                {item.annotation && (
                  <p className="mono mb-2.5" style={{ fontSize: "10.5px", color: "var(--accent)", lineHeight: 1.5 }}>
                    {item.annotation}
                  </p>
                )}
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-70)", maxWidth: 720 }}>
                  {item.desc}
                </p>
              </div>
              {/* Browser chrome + full screenshot */}
              <div style={{ borderTop: "1px solid #1a1a1a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#1e1e1e", borderBottom: "1px solid #2a2a2a" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                      <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, height: 20, borderRadius: 4, background: "#141414", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", paddingInline: 8 }}>
                    <span className="mono" style={{ fontSize: 9.5, color: "#ccc", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {item.displayUrl ?? "kayanaaid.com"}
                    </span>
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image!} alt={item.title} style={{ width: "100%", display: "block" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Close */}
      <button onClick={onClose} style={{ position: "fixed", top: 14, right: 18, zIndex: 10000, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

      {/* Dot indicators */}
      <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 10000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", display: "flex", gap: 6, alignItems: "center" }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })}
            style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 999, background: i === cur ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s, background 0.2s" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PublicCarousel({ items }: { items: PublicPage[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.getAttribute("data-index"));
            setActive(idx);
          }
        });
      },
      { root, threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    navButtonRefs.current[active]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const goTo = (i: number) =>
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });

  return (
    <>
      {lightbox !== null && <Lightbox items={items} startIdx={lightbox} onClose={() => setLightbox(null)} />}

      <div>
        <style>{`
          @media (max-width: 640px) {
            .pc-card { flex-direction: column !important; min-height: unset !important; }
            .pc-info { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--rule) !important; }
            .pc-preview { min-height: 280px; }
          }
        `}</style>
        {/* ── Tab nav ── */}
        <nav aria-label="Jump to page" className="flex gap-1.5 overflow-x-auto mb-4" style={{ scrollbarWidth: "none" }}>
          {items.map((it, i) => (
            <button
              key={it.title}
              ref={(el) => { navButtonRefs.current[i] = el; }}
              type="button"
              onClick={() => goTo(i)}
              className="mono flex-shrink-0 flex items-center gap-1.5"
              style={{
                padding: "5px 10px",
                fontSize: "10.5px",
                whiteSpace: "nowrap",
                color: i === active ? "var(--paper)" : "var(--ink-45)",
                background: i === active ? "var(--accent)" : "var(--paper-raised)",
                border: "1px solid var(--rule)",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              <span style={{ opacity: 0.7 }}>{String(i + 1).padStart(2, "0")}</span>
              <span>{it.title}</span>
            </button>
          ))}
        </nav>

        {/* ── Slides ── */}
        <div
          ref={trackRef}
          className="flex overflow-x-auto"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {items.map((it, i) => (
            <div
              key={it.title}
              ref={(el) => { slideRefs.current[i] = el; }}
              data-index={i}
              className="w-full flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* ── Split card: info left + browser preview right ── */}
              <div
                className="pc-card"
                style={{
                  position: "relative",
                  border: "1px solid var(--rule)",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--paper)",
                  display: "flex",
                }}
              >
                {/* Expand button — absolute top-right */}
                {it.image && (
                  <button
                    type="button"
                    onClick={() => setLightbox(i)}
                    style={{
                      position: "absolute", top: 12, right: 12, zIndex: 10,
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 12px",
                      fontFamily: "var(--font-mono, ui-monospace, monospace)",
                      fontSize: "9.5px", letterSpacing: "0.02em",
                      color: "var(--paper)",
                      background: "var(--ink)",
                      border: "1px solid var(--rule)",
                      borderRadius: 999,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M1 4V1h3M7 1h3v3M10 7v3H7M4 10H1V7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Expand
                  </button>
                )}

                {/* Left — info panel */}
                <div className="pc-info" style={{
                  width: "clamp(200px, 30%, 300px)",
                  flexShrink: 0,
                  padding: "22px 20px",
                  borderRight: "1px solid var(--rule)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  background: "var(--paper)",
                }}>
                  {/* Title */}
                  <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 10 }}>
                    {it.title}
                  </p>

                  {/* URL pill */}
                  {it.displayUrl && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 16,
                      background: "var(--paper-raised)", border: "1px solid var(--rule)",
                      borderRadius: 4, padding: "3px 8px", alignSelf: "flex-start",
                    }}>
                      <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="8" cy="8" r="7"/>
                        <path d="M8 1c-2 3-2 11 0 14M8 1c2 3 2 11 0 14M1 8h14"/>
                      </svg>
                      <span className="mono" style={{ fontSize: "9px", color: "var(--ink-45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                        {it.displayUrl}
                      </span>
                    </div>
                  )}

                  {/* Flow annotation — parsed into chips */}
                  {it.annotation && (() => {
                    const steps = it.annotation.split(" → ");
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <p className="mono" style={{ fontSize: "8.5px", color: "var(--ink-15)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                          User Flow
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                          {steps.map((step, si) => (
                            <span key={si} style={{ display: "contents" }}>
                              <span className="mono" style={{
                                fontSize: "9px", padding: "3px 7px",
                                background: "var(--paper-raised)", border: "1px solid var(--rule)",
                                borderRadius: 4, color: "var(--ink-45)", whiteSpace: "nowrap",
                              }}>{step}</span>
                              {si < steps.length - 1 && (
                                <span style={{ fontSize: "9px", color: "var(--ink-15)", flexShrink: 0 }}>›</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Description */}
                  <p style={{ fontSize: "11.5px", lineHeight: 1.65, color: "var(--ink-45)" }}>
                    {it.desc}
                  </p>
                </div>

                {/* Right — browser preview */}
                {it.image ? (
                  <div className="pc-preview" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    {/* Browser chrome */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 12px", flexShrink: 0,
                      background: "#1e1e1e", borderBottom: "1px solid #2a2a2a",
                    }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                          <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                        ))}
                      </div>
                      <div style={{
                        flex: 1, height: 20, borderRadius: 4,
                        background: "#141414", border: "1px solid #2a2a2a",
                        display: "flex", alignItems: "center", paddingInline: 8,
                      }}>
                        <span className="mono" style={{ fontSize: 9.5, color: "#ccc", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {it.displayUrl ?? "kayanaaid.com"}
                        </span>
                      </div>
                    </div>
                    {/* Screenshot — scrollable */}
                    <div style={{ height: 480, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "thin" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image} alt={it.title} style={{ width: "100%", display: "block" }} />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    flex: 1,
                    background: "var(--paper-raised)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="mono" style={{ fontSize: "10.5px", color: "var(--ink-15)" }}>no preview</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
