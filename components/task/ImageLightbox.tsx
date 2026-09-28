"use client";

import { useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "@/components/icons";

export function ImageLightbox({
  images,
  index,
  title,
  onClose,
  onNavigate,
}: {
  images: string[];
  index: number;
  title: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMultiple) goPrev();
      if (e.key === "ArrowRight" && hasMultiple) goNext();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, goPrev, goNext, hasMultiple]);

  const btnStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <button type="button" onClick={onClose} aria-label="Close" style={{ ...btnStyle, position: "absolute", top: 20, right: 20 }}>
        <X size={18} />
      </button>

      {hasMultiple && (
        <span style={{ position: "absolute", top: 24, left: 24, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
          {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
      )}

      {hasMultiple && (
        <button type="button" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous" style={{ ...btnStyle, position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)" }}>
          <ChevronLeft size={20} />
        </button>
      )}

      <div style={{ position: "relative", width: "92vw", height: "85vh" }} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${title} — image ${index + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {hasMultiple && (
        <button type="button" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next" style={{ ...btnStyle, position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)" }}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
