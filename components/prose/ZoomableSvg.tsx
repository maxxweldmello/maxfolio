"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* A diagram plate with a full-screen view. The button in the corner opens the diagram over the whole screen, fitted to it (and
   into true browser full screen where the browser allows it); there it can be zoomed in and out (buttons, keys, or a two-finger pinch) and dragged to pan; on a tall phone screen a clearly wide diagram starts turned a quarter to fill it, and the turn button flips it back.
   Escape or the close button brings the page back. */

const MIN = 1, MAX = 5;

export default function ZoomableSvg({ svg, caption }: { svg: string; caption?: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [turned, setTurned] = useState(false); // the diagram turned a quarter, so a wide diagram fills a tall phone screen
  const layer = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const zoomNow = useRef(1);
  zoomNow.current = zoom;

  /* the diagram's own proportions, so "fit" can size it to the screen */
  const ratio = useMemo(() => {
    const m = svg.match(/viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/);
    return m ? Number(m[1]) / Number(m[2]) : 1.2;
  }, [svg]);

  const close = useCallback(() => {
    setOpen(false);
    setZoom(1);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  const openFull = () => {
    setOpen(true);
    setZoom(1);
    /* a clearly wide diagram on a tall screen starts turned, which is far bigger than shrinking it to the screen's width */
    setTurned(ratio > 1.5 && window.innerWidth < window.innerHeight);
    /* real full screen too, where the browser lets us; the overlay works without it */
    requestAnimationFrame(() => layer.current?.requestFullscreen?.().catch(() => {}));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(MAX, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(MIN, +(z - 0.25).toFixed(2)));
      if (e.key === "0") setZoom(1);
    };
    /* leaving browser full screen with its own Escape also closes the view */
    const onFs = () => { if (!document.fullscreenElement) { setOpen(false); setZoom(1); } };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [open, close]);

  const pad = 32, bar = 64;
  /* the width that fits the whole diagram on screen, times the zoom */
  const fitWidth = turned
    ? `min(calc(100vh - ${bar + pad}px), calc((100vw - ${pad * 2}px) * ${ratio}))` // along the screen's height
    : `min(calc(100vw - ${pad * 2}px), calc((100vh - ${bar + pad}px) * ${ratio}))`;

  const btn: React.CSSProperties = {
    height: 36, minWidth: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(20,20,20,0.9)",
    color: "#fff", fontSize: 12, letterSpacing: "0.08em", cursor: "pointer", borderRadius: 2,
  };

  return (
    <figure className="my-12">
      <div style={{ position: "relative" }}>
        <div
          className="w-full overflow-x-auto border p-3 sm:p-4"
          style={{ borderColor: "var(--rule)", background: "#0a0a0a" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <button
          type="button"
          onClick={openFull}
          aria-label="View the diagram full screen"
          style={{ ...btn, position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Full screen
        </button>
      </div>
      {caption && (
        <figcaption className="mt-3 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-45)", maxWidth: "var(--measure)" }}>
          {caption}
        </figcaption>
      )}

      {open && (
        <div
          ref={layer}
          role="dialog"
          aria-modal="true"
          aria-label="Diagram, full screen"
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#0a0a0a", display: "flex", flexDirection: "column" }}
        >
          <style>{`.zs-spacer{display:none} @media (max-width: 640px){ .zs-hint{display:none !important} .zs-spacer{display:block} }`}</style>
          <div style={{ height: bar, flex: "none", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "0 16px" }}>
            <span className="zs-hint" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginRight: "auto", letterSpacing: "0.08em" }}>
              Drag to move · + / − to zoom · Esc to close
            </span>
            <span style={{ marginRight: "auto" }} className="zs-spacer" />
            <button type="button" style={btn} aria-label="Turn the diagram" onClick={() => { setTurned((t) => !t); setZoom(1); }}>⟳</button>
            <button type="button" style={btn} aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN, +(z - 0.25).toFixed(2)))}>−</button>
            <button type="button" style={{ ...btn, minWidth: 64 }} aria-label="Fit to screen" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
            <button type="button" style={btn} aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX, +(z + 0.25).toFixed(2)))}>+</button>
            <button type="button" style={{ ...btn, whiteSpace: "nowrap" }} aria-label="Close full screen" onClick={close}>✕<span className="zs-hint"> Close</span></button>
          </div>
          <div
            ref={scroller}
            onPointerDown={(e) => {
              const el = scroller.current;
              if (!el) return;
              touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              el.setPointerCapture(e.pointerId);
              if (touches.current.size === 2) {
                const [a, b] = [...touches.current.values()];
                pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: zoomNow.current };
                drag.current = null;
              } else {
                drag.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
              }
            }}
            onPointerMove={(e) => {
              const el = scroller.current;
              if (!el || !touches.current.has(e.pointerId)) return;
              touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              if (touches.current.size === 2 && pinch.current) {
                /* two fingers: pinch to zoom */
                const [a, b] = [...touches.current.values()];
                const z = pinch.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist);
                setZoom(Math.min(MAX, Math.max(MIN, +z.toFixed(2))));
                return;
              }
              const d = drag.current;
              if (!d) return;
              el.scrollLeft = d.sl - (e.clientX - d.x);
              el.scrollTop = d.st - (e.clientY - d.y);
            }}
            onPointerUp={(e) => {
              touches.current.delete(e.pointerId);
              pinch.current = null;
              const el = scroller.current, left = [...touches.current.values()][0];
              drag.current = el && left ? { x: left.x, y: left.y, sl: el.scrollLeft, st: el.scrollTop } : null;
            }}
            onPointerCancel={(e) => { touches.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}
            style={{ flex: 1, minHeight: 0, overflow: "auto", cursor: zoom > 1 ? "grab" : "default", touchAction: "none", padding: `0 ${pad}px ${pad}px` }}
          >
            {turned ? (
              /* the box has the turned diagram's size (its height across, its width down); the diagram sits inside, turned a quarter */
              <div style={{ ["--w" as string]: `calc(${fitWidth} * ${zoom})`, position: "relative", width: `calc(var(--w) / ${ratio})`, height: "var(--w)", margin: "0 auto" } as React.CSSProperties}>
                <div
                  style={{ position: "absolute", top: 0, left: 0, width: "var(--w)", transformOrigin: "0 0", transform: `translateX(calc(var(--w) / ${ratio})) rotate(90deg)` }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            ) : (
              <div style={{ width: `calc(${fitWidth} * ${zoom})`, margin: "0 auto" }} dangerouslySetInnerHTML={{ __html: svg }} />
            )}
          </div>
        </div>
      )}
    </figure>
  );
}
