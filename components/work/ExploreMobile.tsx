"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkCompany } from "@/lib/types";
import { buildCards, type CardDef } from "./cards";
import { desktopPack, Tile } from "./ExploreView";

/* The phone version of Explore. Same idea as the desktop one, a scatter of cards you drag around, but built for a small screen:
   the canvas is bigger than the screen (about two screens across), the cards are randomly sized and placed on it at their own
   pictures' shapes, Kayana Aid sits in the middle and biggest, and nothing overlaps. Drag in any direction (it repeats and
   glides), tap a card to open it, and "Re-centre" brings Kayana Aid back to the middle of the screen. */

/* The phone canvas is the desktop arrangement itself (same order, same spacing, Kayana Aid in the middle), laid out about a thousand
   pixels across and then scaled down to suit the screen, so the cards come out a comfortable medium size on a phone. The canvas
   width is chosen from a few so that no card ends up small. */
const WIDTHS = [1000, 1100, 1200];
const MIN_CARD = 190;

export default function ExploreMobile({ companies }: { companies: WorkCompany[] }) {
  const cards = useMemo(() => buildCards(companies), [companies]);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ w: number; h: number } | null>(null);
  const [aspects, setAspects] = useState<Record<string, number> | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const pos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const drag = useRef<{ sx: number; sy: number; lx: number; ly: number; lt: number; moved: boolean } | null>(null);
  const suppress = useRef(false);

  /* each picture's own proportions, so every card is drawn at its picture's shape */
  useEffect(() => {
    let live = true;
    const load = (c: CardDef) =>
      new Promise<[string, number]>((resolve) => {
        if (!c.image) return resolve([c.id, 1.3]);
        const img = new Image();
        img.onload = () => resolve([c.id, img.naturalWidth / img.naturalHeight || 1.3]);
        img.onerror = () => resolve([c.id, 1.3]);
        img.src = c.image;
      });
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), 3500));
    Promise.race([Promise.all(cards.map(load)), timeout]).then((res) => {
      if (live) setAspects(Object.fromEntries(res ?? []));
    });
    return () => { live = false; };
  }, [cards]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setView({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base = useMemo(() => {
    if (!aspects) return null;
    let best: { r: ReturnType<typeof desktopPack>; m: number } | null = null;
    for (const w of WIDTHS) {
      const r = desktopPack(cards, aspects, w, true);
      const m = Math.min(...r.items.map((p) => p.w));
      if (!best || m > best.m) best = { r, m };
      if (m >= MIN_CARD) break;
    }
    return best ? best.r : null;
  }, [cards, aspects]);
  /* a little over half the screen width for a typical card: 0.85 on a 375px phone, never bigger than the desktop size */
  const k = view ? Math.min(1, Math.max(0.7, view.w / 440)) : 0.75;
  const pack = useMemo(
    () => (base ? { W: base.W * k, H: base.H * k, items: base.items.map((p) => ({ ...p, x: p.x * k, y: p.y * k, w: p.w * k, h: p.h * k })) } : null),
    [base, k],
  );
  const items = pack?.items ?? null;
  const WORLD = pack ?? { W: 1000, H: 1000 };
  const heroBox = items?.find((p) => p.card.id === "kayana-aid");

  const apply = () => {
    const el = worldRef.current;
    if (!el) return;
    const mx = ((pos.current.x % WORLD.W) + WORLD.W) % WORLD.W;
    const my = ((pos.current.y % WORLD.H) + WORLD.H) % WORLD.H;
    el.style.transform = `translate3d(${mx - WORLD.W}px, ${my - WORLD.H}px, 0)`;
  };

  /* the spot that puts the middle of the canvas, where Kayana Aid is, in the middle of the screen */
  const home = () => (view && heroBox ? { x: view.w / 2 - (heroBox.x + heroBox.w / 2), y: view.h / 2 - (heroBox.y + heroBox.h / 2) } : { x: 0, y: 0 });
  useEffect(() => { if (view && items) { pos.current = home(); apply(); } }, [view?.w, view?.h, !!items, k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(apply); // eslint-disable-line react-hooks/exhaustive-deps

  const glide = () => {
    const step = () => {
      vel.current = { x: vel.current.x * 0.94, y: vel.current.y * 0.94 };
      if (Math.abs(vel.current.x) < 0.15 && Math.abs(vel.current.y) < 0.15) return;
      pos.current.x += vel.current.x; pos.current.y += vel.current.y;
      apply();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  /* ease to the nearest copy of the home spot */
  const recentre = () => {
    cancelAnimationFrame(raf.current);
    const h = home();
    const tx = h.x + Math.round((pos.current.x - h.x) / WORLD.W) * WORLD.W;
    const ty = h.y + Math.round((pos.current.y - h.y) / WORLD.H) * WORLD.H;
    const sx = pos.current.x, sy = pos.current.y, t0 = performance.now(), dur = 600;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      pos.current = { x: sx + (tx - sx) * e, y: sy + (ty - sy) * e };
      apply();
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
      const now = performance.now(), dt = Math.max(1, now - d.lt);
      pos.current.x += dx; pos.current.y += dy;
      vel.current = { x: (dx / dt) * 16 * 0.6 + vel.current.x * 0.4, y: (dy / dt) * 16 * 0.6 + vel.current.y * 0.4 };
      d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
      apply();
    };
    const up = () => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      setGrabbing(false);
      if (d.moved) {
        suppress.current = true;
        setTimeout(() => { suppress.current = false; }, 60);
        glide();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-explore-ui]")) return;
    cancelAnimationFrame(raf.current);
    vel.current = { x: 0, y: 0 };
    drag.current = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false };
    setGrabbing(true);
  };

  return (
    <div
      ref={stageRef}
      data-tour="work-board"
      role="region"
      aria-label="Work, drag to explore"
      onPointerDown={down}
      onClickCapture={(e) => { if (suppress.current) { e.preventDefault(); e.stopPropagation(); } }}
      style={{
        position: "relative", zIndex: 0, width: "100vw", marginLeft: "calc(50% - 50vw)",
        height: "min(78svh, 720px)", minHeight: 420, overflow: "hidden",
        background: "var(--paper-raised)", cursor: grabbing ? "grabbing" : "grab",
        touchAction: "none", userSelect: "none", WebkitUserSelect: "none", outline: "none",
      }}
    >
      <style>{`
        .explore-recentre-m {
          position: absolute; right: 14px; bottom: 14px; z-index: 100; display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 15px 9px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: #0a0a0a; color: #fff;
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer;
          box-shadow: 0 10px 26px -10px rgba(0,0,0,0.55);
        }
      `}</style>
      {items && (
        <div ref={worldRef} style={{ position: "absolute", left: 0, top: 0, width: WORLD.W * 3, height: WORLD.H * 3, willChange: "transform" }}>
          {[0, 1, 2].flatMap((ty) =>
            [0, 1, 2].map((tx) => (
              <div key={`${tx}-${ty}`} style={{ position: "absolute", left: tx * WORLD.W, top: ty * WORLD.H, width: WORLD.W, height: WORLD.H }}>
                {items.map((p) => <Tile key={p.card.id} p={p} focusable={tx === 1 && ty === 1} />)}
              </div>
            ))
          )}
        </div>
      )}
      <button type="button" data-explore-ui onClick={recentre} className="mono explore-recentre-m" aria-label="Re-centre the view">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="8.5" />
        </svg>
        Re-centre
      </button>
    </div>
  );
}
