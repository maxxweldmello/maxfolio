"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "@/components/icons";
import { ImageLightbox } from "./ImageLightbox";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];

function isVideoSrc(src: string) {
  const path = src.split("?")[0].split("#")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export default function ScreenshotCarousel({ shots, title }: { shots: string[]; title: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const hasShots = shots && shots.length > 0;

  function scrollBy(direction: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first?.offsetWidth ?? el.clientWidth;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  }

  const imageShots = shots.filter((s) => !isVideoSrc(s));

  const arrowBtn: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2,
    transition: "all 0.15s",
  };

  return (
    <section style={{ marginTop: 64, paddingTop: 40, borderTop: "1px solid var(--rule)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-30)" }}>
          Screenshots
        </p>
        <span style={{ fontSize: 11, color: "var(--ink-15)", fontFamily: "var(--font-mono)" }}>
          {hasShots ? shots.length : "—"}
        </span>
      </div>

      {hasShots ? (
        <div style={{ position: "relative" }}>
          {/* Scroll-snap scroller */}
          <div
            ref={scrollerRef}
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              justifyContent: shots.length === 1 ? "center" : "flex-start",
            }}
          >
            {shots.map((src, i) => {
              const isVideo = isVideoSrc(src);
              const slideStyle: React.CSSProperties = {
                flexShrink: 0,
                width: "80%",
                aspectRatio: "16 / 9",
                scrollSnapAlign: "start",
                overflow: "hidden",
                border: "1px solid var(--rule)",
                background: "var(--paper-sunken)",
                position: "relative",
              };

              return isVideo ? (
                <div key={i} style={slideStyle}>
                  <video
                    src={src}
                    aria-label={`${title} — screenshot ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                  />
                  <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)", pointerEvents: "none" }}>
                    {String(i + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
                  </span>
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(imageShots.indexOf(src))}
                  aria-label={`View screenshot ${i + 1} full size`}
                  className="group"
                  style={{ ...slideStyle, cursor: "zoom-in" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} — screenshot ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                  <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
                    {String(i + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Expand size={22} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {shots.length > 1 && (
            <>
              <button type="button" onClick={() => scrollBy("left")} aria-label="Previous screenshot" style={{ ...arrowBtn, left: 8 }}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => scrollBy("right")} aria-label="Next screenshot" style={{ ...arrowBtn, right: 8 }}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ width: "100%", aspectRatio: "16 / 8", border: "1px solid var(--rule)", background: "var(--paper-sunken)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "var(--font-mono)", color: "var(--ink-15)" }}>
            screenshots coming soon
          </p>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={imageShots}
          index={lightboxIndex}
          title={title}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
