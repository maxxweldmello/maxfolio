"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryItem = { label: string; src?: string; chrome?: boolean };

function GalleryLightbox({ items, startIdx, onClose }: { items: GalleryItem[]; startIdx: number; onClose: () => void }) {
  const [cur, setCur] = useState(startIdx);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    slideRefs.current[startIdx]?.scrollIntoView({ behavior: "instant" as ScrollBehavior, inline: "center", block: "nearest" });
  }, [startIdx]);

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setCur(Number(e.target.getAttribute("data-lb-index"))); }),
      { root, threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") slideRefs.current[cur - 1]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      if (e.key === "ArrowRight") slideRefs.current[cur + 1]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, cur]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)" }}>
      <div
        ref={trackRef}
        style={{
          position: "absolute", inset: 0,
          display: "flex", overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x mandatory", scrollbarWidth: "none",
          paddingInline: "6%", boxSizing: "border-box",
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.label + i}
            ref={(el) => { slideRefs.current[i] = el; }}
            data-lb-index={i}
            style={{
              flexShrink: 0, width: "100%", height: "100%",
              scrollSnapAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflowY: "auto",
              padding: "48px 10px 56px",
              boxSizing: "border-box",
            }}
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 1100, margin: "0 auto", borderRadius: 10, overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.7)" }}
            >
              {item.chrome === true && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#1e1e1e", borderBottom: "1px solid #2a2a2a" }}>
                  <div style={{ display: "flex", gap: 5 }}>{["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}</div>
                  <div style={{ flex: 1, height: 20, borderRadius: 4, background: "#141414", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", paddingInline: 8 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 9.5, color: "#ccc" }}>{item.label}</span>
                  </div>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.label} style={{ width: "100%", display: "block" }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={onClose} aria-label="Close" style={{ position: "fixed", top: 14, right: 18, zIndex: 10000, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

      {cur > 0 && (
        <button
          onClick={() => slideRefs.current[cur - 1]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })}
          aria-label="Previous"
          style={{ position: "fixed", left: 18, top: "50%", transform: "translateY(-50%)", zIndex: 10000, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 999, width: 38, height: 38, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
        >‹</button>
      )}
      {cur < items.length - 1 && (
        <button
          onClick={() => slideRefs.current[cur + 1]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })}
          aria-label="Next"
          style={{ position: "fixed", right: 18, top: "50%", transform: "translateY(-50%)", zIndex: 10000, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 999, width: 38, height: 38, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
        >›</button>
      )}

      <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 10000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", display: "flex", gap: 6, alignItems: "center" }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })}
            style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 999, background: i === cur ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s, background 0.2s" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CmsGallery({ items, thumbWidth = 200 }: { items: GalleryItem[]; thumbWidth?: number }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative", marginTop: 16, maxWidth: "100%", minWidth: 0 }}>
      {lightbox !== null && <GalleryLightbox items={items} startIdx={lightbox} onClose={() => setLightbox(null)} />}

      <div
        ref={trackRef}
        style={{
          display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x proximity",
          scrollbarWidth: "none", paddingBottom: 2,
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.label + i}
            onClick={item.src ? () => setLightbox(i) : undefined}
            style={{
              flex: "0 0 auto",
              width: thumbWidth,
              maxWidth: "100%",
              aspectRatio: "16/9",
              scrollSnapAlign: "start",
              background: "var(--paper-raised)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: item.src ? "pointer" : "default",
            }}
          >
            {item.src
              ? <img src={item.src} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span className="mono" style={{ fontSize: "8px", color: "var(--ink-15)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", textAlign: "center" }}>{item.label}</span>
            }
          </div>
        ))}
      </div>

      {items.length > 4 && (
        <>
          <button
            onClick={() => scrollByAmount(-1)}
            aria-label="Scroll left"
            style={{ position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 999, width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "var(--ink-45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >‹</button>
          <button
            onClick={() => scrollByAmount(1)}
            aria-label="Scroll right"
            style={{ position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 999, width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "var(--ink-45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >›</button>
        </>
      )}
    </div>
  );
}
